"""Embeddings for films from who liked them, not what they're about.

    uv run movielens                 # needs data/external/movielens/ml-32m
    uv run movielens --dims 64

Factorises the MovieLens ratings (which users liked which films) into a few
dimensions per film and writes them as an embedding set, embeddings/movielens,
for films only. Films MovieLens doesn't have (2025 on) get a zero vector.
"""

import argparse
import json
from datetime import datetime, timezone

import numpy as np
import pandas as pd
from scipy.sparse import csr_matrix
from scipy.sparse.linalg import svds

from recs.paths import DATA, ITEMS, catalog_path, embedding_dir, embedding_path

MOVIELENS = DATA / "external" / "movielens" / "ml-32m"
KEY = "movielens"
LIKED = 4.0  # a rating of 4 or 5 counts as liking the film
MIN_LIKES = 20  # films liked by fewer users are too noisy to place


def liked_matrix() -> tuple[csr_matrix, pd.Series]:
    """Films x users, 1 where the user liked the film. Returns the matrix and
    the tmdb id of each row."""
    ratings = pd.read_csv(MOVIELENS / "ratings.csv", usecols=["userId", "movieId", "rating"])
    ratings = ratings[ratings["rating"] >= LIKED]
    links = pd.read_csv(MOVIELENS / "links.csv", dtype={"tmdbId": "Int64"}).dropna(subset=["tmdbId"])
    counts = ratings.groupby("movieId").size()
    keep = counts[counts >= MIN_LIKES].index
    links = links[links["movieId"].isin(keep)]
    # A few tmdb ids appear under two MovieLens ids; keep the better-known one
    links = links.assign(likes=links["movieId"].map(counts)).sort_values("likes", ascending=False)
    links = links.drop_duplicates("tmdbId").reset_index(drop=True)
    ratings = ratings[ratings["movieId"].isin(links["movieId"])]

    row_of = pd.Series(np.arange(len(links)), index=links["movieId"])
    users = ratings["userId"].astype("category").cat.codes.to_numpy()
    rows = row_of[ratings["movieId"]].to_numpy()
    matrix = csr_matrix((np.ones(len(rows), dtype=np.float32), (rows, users)))
    return matrix, links["tmdbId"].astype(str)


def factorise(matrix: csr_matrix, dims: int) -> np.ndarray:
    # Truncated SVD: the classic collaborative filter. Each film becomes a
    # point where films liked by the same people sit close together, which
    # is a different notion of "similar" from a shared synopsis.
    u, s, _ = svds(matrix.asfptype(), k=dims)
    vectors = (u * s).astype(np.float32)
    norms = np.linalg.norm(vectors, axis=1, keepdims=True)
    return np.divide(vectors, norms, out=np.zeros_like(vectors), where=norms > 0)


def align(vectors: np.ndarray, tmdb_ids: pd.Series, df: pd.DataFrame, dims: int) -> tuple[np.ndarray, int]:
    row_of = pd.Series(np.arange(len(tmdb_ids)), index=tmdb_ids.to_numpy())
    out = np.zeros((len(df), dims), dtype=np.float32)
    ids = df["source_id"].astype(str).where(df["medium"] == "movie", "")
    hit = ids.isin(row_of.index).to_numpy()
    out[hit] = vectors[row_of[ids[hit]].to_numpy()]
    return out, int(hit.sum())


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--dims", type=int, default=128)
    args = parser.parse_args()
    if not MOVIELENS.exists():
        raise SystemExit(f"{MOVIELENS} missing: unzip ml-32m.zip from grouplens.org there")

    matrix, tmdb_ids = liked_matrix()
    print(f"{matrix.shape[0]} films, {matrix.shape[1]} users, {matrix.nnz} likes")
    vectors = factorise(matrix, args.dims)

    embedding_dir(KEY).mkdir(parents=True, exist_ok=True)
    counts = {}
    for name, path in [("items", ITEMS), ("movies", catalog_path("movie"))]:
        df = pd.read_parquet(path)
        aligned, found = align(vectors, tmdb_ids, df, args.dims)
        np.save(embedding_path(KEY, name), aligned)
        counts[name] = {"rows": len(df), "in_movielens": found}
        print(f"{name}: {found} of {(df['medium'] == 'movie').sum()} films found")

    meta = {
        "key": KEY,
        "model": f"MovieLens 32M, liked = rating >= {LIKED}, truncated SVD",
        "revision": "ml-32m",
        "dimensions": args.dims,
        "rows": counts,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (embedding_dir(KEY) / "meta.json").write_text(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
