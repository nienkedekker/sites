"""A positive-unlabeled classifier on top of the embeddings.

    uv run classify                      # default model, one split
    uv run classify --rolling            # five cut dates, like evaluate
    uv run classify --model qwen3-4b --negatives 10
    uv run classify --recommend          # train on everything, print picks

Positives are my history, presumed negatives a random sample of the catalog.
Features per item: its content vector, its recency-weighted similarity to my
history, and for films its MovieLens vector. Logistic regression, then a
small MLP, ranked on the same candidates and split as evaluate.
"""

import argparse

import numpy as np
import pandas as pd
import torch
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler

from recs.config import default_model_key, model_keys
from recs.evaluate import HOLDOUT, ROLLING, Split, is_complete, summarise, temporal_split
from recs.paths import FILE_NAMES, ITEMS, MEDIA, catalog_path, embedding_path
from recs.recommend import HALF_LIFE, K_NEIGHBOURS, blend_scores, recency_weights, score_candidates

MOVIELENS = "movielens"
NEGATIVES_PER_POSITIVE = 5
SEED = 0


def self_excluded_scores(history: np.ndarray, k: int, weights: np.ndarray | None) -> np.ndarray:
    """A history item's similarity to the rest of the history. It is nearest
    to itself, so that match is masked out before taking the top k."""
    sims = history @ history.T
    if weights is not None:
        sims = sims * weights
    np.fill_diagonal(sims, -np.inf)
    k = min(k, len(history) - 1)
    top = -np.partition(-sims, k - 1, axis=1)[:, :k]
    return top.mean(axis=1)


class Features:
    """Feature rows for the history (positives), the catalog, and the
    held-out items, all built the same way: the content vector and the
    recency-weighted similarity to the history.

    Only fully described items are used for training, positives and
    negatives alike. A fifth of my items have a bare title-and-author text
    and the catalog almost never does, so a classifier trained on the lot
    learns to spot my data source instead of my taste. MovieLens stays out
    of the features for the same reason (most of my films are in it, recent
    ones aren't) and is blended in afterwards."""

    def __init__(self, items: pd.DataFrame, split: Split, model_key: str, medium: str, k: int, half_life: float):
        of_medium = (items["medium"] == medium).to_numpy()
        self.medium = medium
        self.train_rows = split.train & of_medium
        self.heldout_rows = split.heldout & of_medium
        vectors = np.load(embedding_path(model_key, "items"))
        catalog_df = pd.read_parquet(catalog_path(medium))
        catalog = np.load(embedding_path(model_key, FILE_NAMES[medium]))
        history = vectors[self.train_rows]
        self.weights = recency_weights(items.loc[self.train_rows, "date_logged"], half_life, split.cut_date)

        complete_history = is_complete(items[self.train_rows])
        self.complete_catalog = is_complete(catalog_df)
        own = self_excluded_scores(history, k, self.weights)
        self.positive = np.hstack([history, own[:, None]])[complete_history].astype(np.float32)
        self.catalog = np.hstack([catalog, score_candidates(catalog, history, k, self.weights)[0][:, None]]).astype(np.float32)
        heldout = vectors[self.heldout_rows]
        self.heldout = np.hstack([heldout, score_candidates(heldout, history, k, self.weights)[0][:, None]]).astype(np.float32)
        self.train_weights = (self.weights if self.weights is not None else np.ones(len(history)))[complete_history]
        # The year of every candidate: ranking on it alone is the sanity row
        self.years = np.r_[catalog_df["year"].fillna(0).to_numpy(), items.loc[self.heldout_rows, "year"].to_numpy()].astype(float)

        # The MovieLens score for every candidate, blended in after scoring
        self.other = None
        if embedding_path(MOVIELENS, FILE_NAMES[medium]).exists():
            ml_items = np.load(embedding_path(MOVIELENS, "items"))
            ml_candidates = np.vstack([np.load(embedding_path(MOVIELENS, FILE_NAMES[medium])), ml_items[self.heldout_rows]])
            self.other = score_candidates(ml_candidates, ml_items[self.train_rows], k, self.weights)[0]
            self.known = np.abs(ml_candidates).sum(axis=1) > 0

    def training_set(self, negatives_per_positive: int, rng: np.random.Generator):
        pool = np.flatnonzero(self.complete_catalog)
        n_neg = min(len(pool), negatives_per_positive * len(self.positive))
        negatives = self.catalog[rng.choice(pool, n_neg, replace=False)]
        x = np.vstack([self.positive, negatives])
        y = np.r_[np.ones(len(self.positive)), np.zeros(n_neg)]
        # Recent positives count more, as in the similarity baseline
        weight = np.r_[self.train_weights, np.ones(n_neg)]
        return x, y, weight

    @property
    def candidates(self) -> np.ndarray:
        return np.vstack([self.catalog, self.heldout])

    def blended(self, scores: np.ndarray) -> np.ndarray:
        return scores if self.other is None else blend_scores(scores, self.other, self.known)


def fit_logistic(x: np.ndarray, y: np.ndarray, weight: np.ndarray):
    scaler = StandardScaler().fit(x)
    model = LogisticRegression(C=0.1, class_weight="balanced", max_iter=2000)
    model.fit(scaler.transform(x), y, sample_weight=weight)
    return lambda cand: model.decision_function(scaler.transform(cand))


def fit_mlp(x: np.ndarray, y: np.ndarray, weight: np.ndarray, epochs: int = 200):
    torch.manual_seed(SEED)
    scaler = StandardScaler().fit(x)
    xt = torch.tensor(scaler.transform(x), dtype=torch.float32)
    yt = torch.tensor(y, dtype=torch.float32)
    # The positives are outnumbered, so each class gets the same total weight
    wt = torch.tensor(weight, dtype=torch.float32)
    wt = torch.where(yt == 1, wt / wt[yt == 1].sum(), wt / wt[yt == 0].sum())
    net = torch.nn.Sequential(
        torch.nn.Linear(xt.shape[1], 256), torch.nn.ReLU(), torch.nn.Dropout(0.3),
        torch.nn.Linear(256, 64), torch.nn.ReLU(),
        torch.nn.Linear(64, 1),
    )
    optimiser = torch.optim.Adam(net.parameters(), lr=1e-3, weight_decay=1e-4)
    loss_fn = torch.nn.BCEWithLogitsLoss(reduction="none")
    net.train()
    for _ in range(epochs):
        optimiser.zero_grad()
        loss = (loss_fn(net(xt).squeeze(1), yt) * wt).sum()
        loss.backward()
        optimiser.step()
    net.eval()

    def predict(cand: np.ndarray) -> np.ndarray:
        with torch.no_grad():
            return net(torch.tensor(scaler.transform(cand), dtype=torch.float32)).squeeze(1).numpy()
    return predict


def ranks_of_heldout(scores: np.ndarray, n_heldout: int) -> np.ndarray:
    order = np.argsort(-scores)
    rank = np.empty(len(scores), dtype=int)
    rank[order] = np.arange(1, len(scores) + 1)
    return rank[len(scores) - n_heldout:]


def evaluate(model_key: str, windows, negatives_per_positive: int, k: int, half_life: float, complete_only: bool, methods) -> pd.DataFrame:
    items = pd.read_parquet(ITEMS)
    content_dims = np.load(embedding_path(model_key, "items")).shape[1]
    rng = np.random.default_rng(SEED)
    rows = []
    for medium in MEDIA:
        catalog_size = len(pd.read_parquet(catalog_path(medium)))
        per_method: dict[str, list[np.ndarray]] = {m: [] for m in methods}
        for holdout, end in windows:
            split = temporal_split(items, holdout, end)
            features = Features(items, split, model_key, medium, k, half_life)
            x, y, weight = features.training_set(negatives_per_positive, rng)
            keep = is_complete(items[split.heldout & (items["medium"] == medium)]) if complete_only else slice(None)
            for name in methods:
                if name == "newest":
                    scores = features.years
                elif name == "similarity":
                    scores = features.candidates[:, content_dims]
                else:
                    scores = (fit_logistic if name == "logistic" else fit_mlp)(x, y, weight)(features.candidates)
                per_method[name].append(ranks_of_heldout(features.blended(scores), len(features.heldout))[keep])
        for name, ranks in per_method.items():
            n_candidates = catalog_size + max(len(r) for r in ranks)
            per_window = pd.DataFrame([summarise(r, n_candidates) for r in ranks if len(r)])
            label = f"{name}+{MOVIELENS}" if features.other is not None else name
            rows.append({"medium": medium, "method": label, "held_out": sum(len(r) for r in ranks), **per_window.mean().to_dict()})
    return pd.DataFrame(rows)


def recommend(model_key: str, negatives_per_positive: int, k: int, half_life: float, top: int) -> None:
    """Train the MLP on the whole log and print the top candidates, with
    the two history items each is nearest to, for a sense of why."""
    items = pd.read_parquet(ITEMS)
    rng = np.random.default_rng(SEED)
    today = pd.Timestamp.today().date().isoformat()
    for medium in MEDIA:
        split = Split(train=np.ones(len(items), dtype=bool), heldout=np.zeros(len(items), dtype=bool), cut_date=today)
        features = Features(items, split, model_key, medium, k, half_life)
        x, y, weight = features.training_set(negatives_per_positive, rng)
        scores = features.blended(fit_mlp(x, y, weight)(features.candidates))
        catalog = pd.read_parquet(catalog_path(medium))
        history = items[features.train_rows].reset_index(drop=True)
        vectors = np.load(embedding_path(model_key, "items"))[features.train_rows]
        catalog_vectors = np.load(embedding_path(model_key, FILE_NAMES[medium]))
        _, nearest = score_candidates(catalog_vectors, vectors, 2, features.weights)
        print(f"\n== {medium}: top {top} of {len(catalog)} candidates ==")
        for rank, i in enumerate(np.argsort(-scores)[:top], start=1):
            row = catalog.iloc[i]
            by = f", {row['creator']}" if isinstance(row["creator"], str) and row["creator"] else ""
            near = ", ".join(f"{history.loc[j, 'title']} ({history.loc[j, 'year']})" for j in nearest[i])
            print(f"{rank:>2}. {row['title']} ({row['year']}{by})")
            print(f"      nearest of mine: {near}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--model", choices=model_keys(), help="embedding set for the content features")
    parser.add_argument("--rolling", action="store_true", help="average over five cut dates")
    parser.add_argument("--negatives", type=int, default=NEGATIVES_PER_POSITIVE, help="catalog items per positive")
    parser.add_argument("-k", type=int, default=K_NEIGHBOURS)
    parser.add_argument("--half-life", type=float, default=HALF_LIFE)
    parser.add_argument("--recommend", action="store_true", help="train on the whole log and print picks")
    parser.add_argument("--top", type=int, default=20)
    args = parser.parse_args()
    model_key = args.model or default_model_key()
    if args.recommend:
        recommend(model_key, args.negatives, args.k, args.half_life, args.top)
        return
    windows = ROLLING if args.rolling else [(HOLDOUT, 1.0)]
    # "newest" ranks on the year alone: if it comes close to the others, the
    # catalog is older than what I read and the rest is reading the year too
    methods = ("newest", "similarity", "logistic", "mlp")
    print(f"features from {model_key}, {args.negatives} presumed negatives per positive, "
          f"half-life {args.half_life}; films blended with movielens where it exists\n")
    for complete_only in (False, True):
        table = evaluate(model_key, windows, args.negatives, args.k, args.half_life, complete_only, methods)
        table = table.set_index(["medium", "method"])
        print("held-out items with a synopsis and genres only:" if complete_only else "all held-out items:")
        with pd.option_context("display.width", 140, "display.float_format", "{:.3f}".format):
            print(table.to_string(), "\n")


if __name__ == "__main__":
    main()
