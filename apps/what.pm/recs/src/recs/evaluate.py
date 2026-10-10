"""Measure how well the baseline finds what I logged next.

    uv run evaluate                       # every set under embeddings/
    uv run evaluate baseline qwen3-4b     # just these, one table
    uv run evaluate --rolling             # average over five cut dates
    uv run evaluate --half-life 0         # every history item counts the same
    uv run evaluate --blend movielens     # films: average in the MovieLens score
"""

import argparse
from dataclasses import dataclass

import numpy as np
import pandas as pd

from recs.paths import EMBEDDINGS, FILE_NAMES, ITEMS, MEDIA, catalog_path, embedding_path
from recs.recommend import HALF_LIFE, K_NEIGHBOURS, blend_scores, recency_weights, score_candidates

HOLDOUT = 0.2
KS = (10, 50, 100)
# --rolling: five hold-out windows of 10%, ending at these points of the log
ROLLING = [(0.1, end) for end in (0.6, 0.7, 0.8, 0.9, 1.0)]


@dataclass
class Split:
    train: np.ndarray
    heldout: np.ndarray
    cut_date: str


def temporal_split(items: pd.DataFrame, holdout: float = HOLDOUT, end: float = 1.0) -> Split:
    """History is everything before the window, the window is held out, and
    anything after `end` is left out of both."""
    order = items.sort_values(["year_logged", "date_logged"], kind="stable").index
    hi = int(round(len(items) * end))
    lo = int(round(len(items) * (end - holdout)))
    train = np.zeros(len(items), dtype=bool)
    heldout = np.zeros(len(items), dtype=bool)
    train[order[:lo]] = True
    heldout[order[lo:hi]] = True
    cut_date = items.loc[order[lo], "date_logged"]
    return Split(train=train, heldout=heldout, cut_date=cut_date)


def ranks_for(
    items: pd.DataFrame,
    split: Split,
    model_key: str,
    medium: str,
    k: int,
    half_life: float | None = None,
    blend: str | None = None,
) -> np.ndarray:
    of_medium = (items["medium"] == medium).to_numpy()
    # Ages are taken at the cut date, not today: at the cut, that was "now"
    weights = recency_weights(items.loc[split.train & of_medium, "date_logged"], half_life, split.cut_date)

    def scores_from(key: str) -> tuple[np.ndarray, np.ndarray]:
        vectors = np.load(embedding_path(key, "items"))
        catalog = np.load(embedding_path(key, FILE_NAMES[medium]))
        # The catalog leaves out everything I've logged, held-out items too, so
        # without adding them here the baseline could never find them
        candidates = np.vstack([catalog, vectors[split.heldout & of_medium]])
        scored, _ = score_candidates(candidates, vectors[split.train & of_medium], k, weights)
        return scored, candidates

    scores, candidates = scores_from(model_key)
    if blend and embedding_path(blend, FILE_NAMES[medium]).exists():
        other, other_candidates = scores_from(blend)
        scores = blend_scores(scores, other, np.abs(other_candidates).sum(axis=1) > 0)
    catalog_rows = len(candidates) - int((split.heldout & of_medium).sum())
    order = np.argsort(-scores)
    rank_of = np.empty(len(candidates), dtype=int)
    rank_of[order] = np.arange(1, len(candidates) + 1)
    return rank_of[catalog_rows:]


def summarise(ranks: np.ndarray, n_candidates: int) -> dict[str, float]:
    out = {f"recall@{k}": float((ranks <= k).mean()) for k in KS}
    out["mrr"] = float((1 / ranks).mean())
    out["median_rank"] = float(np.median(ranks))
    out["chance"] = n_candidates / 2
    return out


def is_complete(items: pd.DataFrame) -> np.ndarray:
    return ((items["synopsis"] != "") & (items["genres"].map(len) > 0)).to_numpy()


def evaluate(
    model_key: str,
    k: int = K_NEIGHBOURS,
    complete_only: bool = False,
    windows: list[tuple[float, float]] | None = None,
    half_life: float | None = None,
    blend: str | None = None,
) -> pd.DataFrame:
    items = pd.read_parquet(ITEMS)
    splits = [temporal_split(items, h, e) for h, e in (windows or [(HOLDOUT, 1.0)])]
    rows = []
    for medium in MEDIA:
        if not embedding_path(model_key, FILE_NAMES[medium]).exists():
            continue
        catalog = pd.read_parquet(catalog_path(medium))
        ranks = []
        n_candidates = 0
        for split in splits:
            r = ranks_for(items, split, model_key, medium, k, half_life, blend)
            n_candidates = max(n_candidates, len(catalog) + len(r))
            if complete_only:
                # Open Library has no description or subjects for about half of
                # the recent books, and a text that is only a title and a year
                # ranks on the year, not on what the book is about
                r = r[is_complete(items[split.heldout & (items["medium"] == medium)])]
            ranks.append(r)
        # One summary per window, averaged, so each cut date counts the same
        per_window = pd.DataFrame([summarise(r, n_candidates) for r in ranks if len(r)])
        blended = blend and embedding_path(blend, FILE_NAMES[medium]).exists()
        name = f"{model_key}+{blend}" if blended else model_key
        rows.append({"model": name, "medium": medium, "held_out": sum(len(r) for r in ranks),
                     **per_window.mean().to_dict()})
    return pd.DataFrame(rows)


def available_sets() -> list[str]:
    return sorted(p.parent.name for p in EMBEDDINGS.glob("*/items.npy"))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("sets", nargs="*", help="embedding sets (folders under embeddings/)")
    parser.add_argument("-k", type=int, default=K_NEIGHBOURS, help="neighbours per score")
    parser.add_argument("--half-life", type=float, default=HALF_LIFE,
                        help="years; recent history counts more, 0 for no weighting")
    parser.add_argument("--rolling", action="store_true", help="average over five cut dates")
    parser.add_argument("--blend", help="a second set to average in, e.g. movielens")
    args = parser.parse_args()
    windows = ROLLING if args.rolling else None

    keys = args.sets or available_sets()
    if not keys:
        raise SystemExit("no embeddings yet: run `uv run embed` first")
    items = pd.read_parquet(ITEMS)
    for holdout, end in windows or [(HOLDOUT, 1.0)]:
        split = temporal_split(items, holdout, end)
        print(f"history: {split.train.sum()} items, held out: {split.heldout.sum()} "
              f"logged from {split.cut_date}")
    if args.half_life:
        print(f"half-life: {args.half_life} years")
    print()

    for complete_only in (False, True):
        table = pd.concat(
            [evaluate(key, args.k, complete_only, windows, args.half_life, args.blend) for key in keys],
            ignore_index=True,
        )
        table = table.set_index(["medium", "model"]).sort_index()
        print("held-out items with a synopsis and genres only:" if complete_only else "all held-out items:")
        with pd.option_context("display.width", 140, "display.float_format", "{:.3f}".format):
            print(table.to_string(), "\n")


if __name__ == "__main__":
    main()
