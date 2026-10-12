"""A positive-unlabeled classifier on top of the embeddings.

    uv run classify                      # default model, one split
    uv run classify --rolling            # five cut dates, like evaluate
    uv run classify --model qwen3-4b --negatives 10
    uv run classify --recommend          # train on everything, print picks

Positives are my history, presumed negatives a random sample of the catalog.
The picks I've acted on in the app join in when there are any: wanted as
positives, not for me as true negatives, and none of them are picked again.
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
from recs.paths import FILE_NAMES, ITEMS, LABELS, MEDIA, catalog_path, embedding_path
from recs.recommend import HALF_LIFE, K_NEIGHBOURS, blend_scores, load_vectors, recency_weights, score_candidates

MOVIELENS = "movielens"
NEGATIVES_PER_POSITIVE = 5
# A pick I said no to is worth more than a random catalog item, which is
# only presumed unwanted: this many of them. A guess until there are enough
# dismissals to tune it on.
DISMISSED_WEIGHT = 5.0
SEED = 0


def load_labels(model_key: str) -> tuple[pd.DataFrame, np.ndarray]:
    """What I did with the app's picks, with their vectors. Empty until the
    export has read them."""
    if not LABELS.exists():
        return pd.DataFrame(columns=["medium", "source_id", "label", "date", "synopsis", "genres"]), np.zeros((0, 0))
    labels = pd.read_parquet(LABELS)
    return labels, load_vectors(model_key, "labels", len(labels))


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
    ones aren't) and is blended in afterwards.

    The labels are rows of the same shape: wanted picks as extra positives,
    dismissed ones as true negatives. They're dated after every cut date,
    so the rolling evaluation uses them as if I'd always known; none of
    them is a held-out item, so nothing leaks."""

    def __init__(self, items: pd.DataFrame, split: Split, model_key: str, medium: str, k: int, half_life: float,
                 dismissed_weight: float = DISMISSED_WEIGHT):
        of_medium = (items["medium"] == medium).to_numpy()
        self.medium = medium
        self.train_rows = split.train & of_medium
        self.heldout_rows = split.heldout & of_medium
        vectors = load_vectors(model_key, "items", len(items))
        catalog_df = pd.read_parquet(catalog_path(medium))
        catalog = load_vectors(model_key, FILE_NAMES[medium], len(catalog_df))
        history = vectors[self.train_rows]
        self.weights = recency_weights(items.loc[self.train_rows, "date_logged"], half_life, split.cut_date)

        def with_similarity(rows: np.ndarray) -> np.ndarray:
            return np.hstack([rows, score_candidates(rows, history, k, self.weights)[0][:, None]]).astype(np.float32)

        complete_history = is_complete(items[self.train_rows])
        self.complete_catalog = is_complete(catalog_df)
        own = self_excluded_scores(history, k, self.weights)
        self.positive = np.hstack([history, own[:, None]])[complete_history].astype(np.float32)
        self.catalog = with_similarity(catalog)
        self.heldout = with_similarity(vectors[self.heldout_rows])
        self.train_weights = (self.weights if self.weights is not None else np.ones(len(history)))[complete_history]

        labels, label_vectors = load_labels(model_key)
        of_mine = ((labels["medium"] == medium) & is_complete(labels)).to_numpy() if len(labels) else np.zeros(0, dtype=bool)
        wanted = of_mine & (labels["label"] == "wanted").to_numpy()
        dismissed = of_mine & (labels["label"] == "not_for_me").to_numpy()
        self.wanted = with_similarity(label_vectors[wanted]) if wanted.any() else np.zeros((0, self.positive.shape[1]), dtype=np.float32)
        self.dismissed = with_similarity(label_vectors[dismissed]) if dismissed.any() else np.zeros((0, self.positive.shape[1]), dtype=np.float32)
        wanted_weights = recency_weights(labels.loc[wanted, "date"], half_life, split.cut_date)
        self.wanted_weights = wanted_weights if wanted_weights is not None else np.ones(len(self.wanted))
        self.dismissed_weights = np.full(len(self.dismissed), dismissed_weight)
        # Every labelled item stays out of the picks and the negative sample
        self.labelled = catalog_df["source_id"].isin(labels.loc[labels["medium"] == medium, "source_id"]).to_numpy()
        # The year of every candidate: ranking on it alone is the sanity row
        self.years = np.r_[catalog_df["year"].fillna(0).to_numpy(), items.loc[self.heldout_rows, "year"].to_numpy()].astype(float)

        # The MovieLens score for every candidate, blended in after scoring
        self.other = None
        if embedding_path(MOVIELENS, FILE_NAMES[medium]).exists():
            ml_items = load_vectors(MOVIELENS, "items", len(items))
            ml_candidates = np.vstack([load_vectors(MOVIELENS, FILE_NAMES[medium], len(catalog_df)), ml_items[self.heldout_rows]])
            self.other = score_candidates(ml_candidates, ml_items[self.train_rows], k, self.weights)[0]
            self.known = np.abs(ml_candidates).sum(axis=1) > 0

    def training_set(self, negatives_per_positive: int, rng: np.random.Generator):
        pool = np.flatnonzero(self.complete_catalog & ~self.labelled)
        n_neg = min(len(pool), negatives_per_positive * len(self.positive))
        negatives = self.catalog[rng.choice(pool, n_neg, replace=False)]
        x = np.vstack([self.positive, self.wanted, negatives, self.dismissed])
        y = np.r_[np.ones(len(self.positive) + len(self.wanted)), np.zeros(n_neg + len(self.dismissed))]
        # Recent positives count more, as in the similarity baseline
        weight = np.r_[self.train_weights, self.wanted_weights, np.ones(n_neg), self.dismissed_weights]
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


def evaluate(model_key: str, windows, negatives_per_positive: int, k: int, half_life: float, complete_only: bool, methods,
             dismissed_weight: float = DISMISSED_WEIGHT) -> pd.DataFrame:
    items = pd.read_parquet(ITEMS)
    content_dims = np.load(embedding_path(model_key, "items")).shape[1]
    rng = np.random.default_rng(SEED)
    rows = []
    for medium in MEDIA:
        catalog_size = len(pd.read_parquet(catalog_path(medium)))
        per_method: dict[str, list[np.ndarray]] = {m: [] for m in methods}
        for holdout, end in windows:
            split = temporal_split(items, holdout, end)
            features = Features(items, split, model_key, medium, k, half_life, dismissed_weight)
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


def recommend(model_key: str, negatives_per_positive: int, k: int, half_life: float, top: int,
              dismissed_weight: float = DISMISSED_WEIGHT) -> None:
    """Train the MLP on the whole log and print the top candidates, with
    the two history items each is nearest to, for a sense of why."""
    items = pd.read_parquet(ITEMS)
    rng = np.random.default_rng(SEED)
    today = pd.Timestamp.today().date().isoformat()
    for medium in MEDIA:
        split = Split(train=np.ones(len(items), dtype=bool), heldout=np.zeros(len(items), dtype=bool), cut_date=today)
        features = Features(items, split, model_key, medium, k, half_life, dismissed_weight)
        x, y, weight = features.training_set(negatives_per_positive, rng)
        scores = features.blended(fit_mlp(x, y, weight)(features.candidates))
        scores[features.labelled] = -np.inf
        catalog = pd.read_parquet(catalog_path(medium))
        history = items[features.train_rows].reset_index(drop=True)
        vectors = load_vectors(model_key, "items", len(items))[features.train_rows]
        catalog_vectors = load_vectors(model_key, FILE_NAMES[medium], len(catalog))
        _, nearest = score_candidates(catalog_vectors, vectors, 2, features.weights)
        print(f"\n== {medium}: top {top} of {len(catalog)} candidates, "
              f"{len(features.wanted)} wanted and {len(features.dismissed)} dismissed picks in the training set ==")
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
    parser.add_argument("--dismissed-weight", type=float, default=DISMISSED_WEIGHT,
                        help="how many presumed negatives one dismissed pick is worth, 0 to leave them out")
    args = parser.parse_args()
    model_key = args.model or default_model_key()
    if args.recommend:
        recommend(model_key, args.negatives, args.k, args.half_life, args.top, args.dismissed_weight)
        return
    windows = ROLLING if args.rolling else [(HOLDOUT, 1.0)]
    # "newest" ranks on the year alone: if it comes close to the others, the
    # catalog is older than what I read and the rest is reading the year too
    methods = ("newest", "similarity", "logistic", "mlp")
    labels, _ = load_labels(model_key)
    counts = labels["label"].value_counts().to_dict()
    print(f"features from {model_key}, {args.negatives} presumed negatives per positive, "
          f"half-life {args.half_life}; films blended with movielens where it exists")
    print(f"labels: {counts.get('wanted', 0)} wanted as positives, {counts.get('not_for_me', 0)} not for me "
          f"as negatives at weight {args.dismissed_weight:g}\n")
    for complete_only in (False, True):
        table = evaluate(model_key, windows, args.negatives, args.k, args.half_life, complete_only, methods,
                         args.dismissed_weight)
        table = table.set_index(["medium", "method"])
        print("held-out items with a synopsis and genres only:" if complete_only else "all held-out items:")
        with pd.option_context("display.width", 140, "display.float_format", "{:.3f}".format):
            print(table.to_string(), "\n")


if __name__ == "__main__":
    main()
