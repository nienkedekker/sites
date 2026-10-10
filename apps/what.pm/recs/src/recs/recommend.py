"""The baseline: rank candidates by how close they sit to my history.

    uv run recommend
    uv run recommend --model baseline --only book --top 30
"""

import argparse

import numpy as np
import pandas as pd

from recs.config import model_config, model_keys
from recs.paths import FILE_NAMES, ITEMS, MEDIA, catalog_path, embedding_path

K_NEIGHBOURS = 5
TOP_N = 20
# Years. My taste moves: a history where 2010 counts as much as last year
# keeps recommending 2010. Picked on the hold-out, so it's tuned, not learned.
HALF_LIFE = 3.0


def recency_weights(dates: pd.Series, half_life: float | None, now: str) -> np.ndarray | None:
    """Half-life in years; None weights every history item the same."""
    if not half_life:
        return None
    age = (pd.Timestamp(now) - pd.to_datetime(dates)).dt.days.to_numpy() / 365.25
    return 0.5 ** (np.clip(age, 0, None) / half_life)


def score_candidates(
    candidates: np.ndarray,
    history: np.ndarray,
    k: int = K_NEIGHBOURS,
    weights: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray]:
    sims = candidates @ history.T
    if weights is not None:
        sims = sims * weights
    k = min(k, history.shape[0])
    nearest = np.argpartition(-sims, k - 1, axis=1)[:, :k]
    nearest_sims = np.take_along_axis(sims, nearest, axis=1)
    order = np.argsort(-nearest_sims, axis=1)
    nearest = np.take_along_axis(nearest, order, axis=1)
    nearest_sims = np.take_along_axis(nearest_sims, order, axis=1)
    return nearest_sims.mean(axis=1), nearest


def load_history(model_key: str, medium: str) -> tuple[pd.DataFrame, np.ndarray]:
    items = pd.read_parquet(ITEMS)
    vectors = np.load(embedding_path(model_key, "items"))
    mask = (items["medium"] == medium).to_numpy()
    return items[mask].reset_index(drop=True), vectors[mask]


def load_catalog(model_key: str, medium: str) -> tuple[pd.DataFrame, np.ndarray]:
    catalog = pd.read_parquet(catalog_path(medium))
    return catalog, np.load(embedding_path(model_key, FILE_NAMES[medium]))


def label(row: pd.Series) -> str:
    creator = row.get("creator")
    by = f", {creator}" if isinstance(creator, str) and creator else ""
    return f"{row['title']} ({row['year']}{by})"


def recommend(model_key: str, medium: str, top: int, k: int, half_life: float | None) -> None:
    history, history_vectors = load_history(model_key, medium)
    catalog, catalog_vectors = load_catalog(model_key, medium)
    weights = recency_weights(history["date_logged"], half_life, pd.Timestamp.today().date().isoformat())
    scores, nearest = score_candidates(catalog_vectors, history_vectors, k, weights)

    print(f"\n== {medium}: top {top} of {len(catalog)} candidates, "
          f"against {len(history)} of mine ==")
    for rank, i in enumerate(np.argsort(-scores)[:top], start=1):
        because = ", ".join(label(history.iloc[j]) for j in nearest[i][:2])
        print(f"{rank:>2}. {scores[i]:.3f}  {label(catalog.iloc[i])}")
        print(f"      because: {because}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--model", choices=model_keys(), help="a key from config.toml")
    parser.add_argument("--only", choices=MEDIA, help="one medium")
    parser.add_argument("--top", type=int, default=TOP_N)
    parser.add_argument("-k", type=int, default=K_NEIGHBOURS, help="neighbours per score")
    parser.add_argument("--half-life", type=float, default=HALF_LIFE,
                        help="years; recent history counts more, 0 for no weighting")
    args = parser.parse_args()
    key = model_config(args.model).key
    print(f"embeddings: {key}")
    for medium in MEDIA:
        if args.only in (None, medium):
            recommend(key, medium, args.top, args.k, args.half_life)


if __name__ == "__main__":
    main()
