"""Turn every item and candidate into a vector.

    uv run embed                    # the default model in config.toml
    uv run embed --model baseline   # any other key in config.toml
"""

import argparse
import json
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import torch
from huggingface_hub import constants, model_info, try_to_load_from_cache
from sentence_transformers import SentenceTransformer

from recs.config import ModelConfig, model_config, model_keys
from recs.paths import FILE_NAMES, ITEMS, MEDIA, catalog_path, embedding_dir, embedding_path

SLOW_SECONDS = 600


def item_text(
    title: str,
    year: int | None,
    genres: list[str],
    synopsis: str,
    creator: str | None = None,
    keywords: list[str] = (),
) -> str:
    head = f"{title} ({year})." if year else f"{title}."
    parts = [head]
    if creator:
        parts.append(f"By {creator}.")
    if len(genres):
        parts.append(", ".join(genres) + ".")
    if len(keywords):
        parts.append(", ".join(keywords) + ".")
    if synopsis:
        parts.append(synopsis)
    return " ".join(parts)


def texts(df: pd.DataFrame, prefix: str) -> list[str]:
    return [
        prefix
        + item_text(
            row.title,
            row.year,
            list(row.genres),
            row.synopsis,
            row.creator if isinstance(row.creator, str) else None,
            list(getattr(row, "keywords", ())),
        )
        for row in df.itertuples()
    ]


def pick_device(wanted: str) -> str:
    if wanted != "auto":
        return wanted
    return "mps" if torch.backends.mps.is_available() else "cpu"


def is_cached(name: str) -> bool:
    return isinstance(try_to_load_from_cache(name, "config.json"), str)


def announce_download(name: str) -> None:
    info = model_info(name, files_metadata=True)
    size = sum(s.size or 0 for s in info.siblings or [])
    print(f"downloading {name}: about {size / 1e9:.1f} GB into {constants.HF_HUB_CACHE}")


def revision_of(name: str) -> str | None:
    path = try_to_load_from_cache(name, "config.json")
    return Path(path).parent.name if isinstance(path, str) else None


def load_model(cfg: ModelConfig) -> SentenceTransformer:
    if not is_cached(cfg.name):
        announce_download(cfg.name)
    device = pick_device(cfg.device)
    model = SentenceTransformer(
        cfg.name, device=device, model_kwargs={"dtype": cfg.dtype}
    )
    model.max_seq_length = cfg.max_seq_length
    print(f"{cfg.key}: {cfg.name} on {device}, {model.get_embedding_dimension()} dims, "
          f"reads up to {model.max_seq_length} tokens")
    return model


def embed(model: SentenceTransformer, cfg: ModelConfig, df: pd.DataFrame) -> np.ndarray:
    return model.encode(
        texts(df, cfg.prefix),
        batch_size=cfg.batch_size,
        normalize_embeddings=True,
        show_progress_bar=True,
    ).astype(np.float32)


def write_meta(cfg: ModelConfig, model: SentenceTransformer, counts: dict[str, int], seconds: float) -> None:
    meta = {
        "key": cfg.key,
        "model": cfg.name,
        "revision": revision_of(cfg.name),
        "dimensions": model.get_embedding_dimension(),
        "prefix": cfg.prefix,
        "max_seq_length": model.max_seq_length,
        "device": str(model.device),
        "rows": counts,
        "seconds": round(seconds, 1),
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    (embedding_dir(cfg.key) / "meta.json").write_text(json.dumps(meta, indent=2))


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--model", choices=model_keys(), help="a key from config.toml")
    args = parser.parse_args()

    cfg = model_config(args.model)
    model = load_model(cfg)
    embedding_dir(cfg.key).mkdir(parents=True, exist_ok=True)

    started = time.perf_counter()
    counts: dict[str, int] = {}
    targets = [("items", ITEMS)] + [(FILE_NAMES[m], catalog_path(m)) for m in MEDIA]
    for name, path in targets:
        if not path.exists():
            print(f"skip {name}: {path} missing")
            continue
        df = pd.read_parquet(path)
        vectors = embed(model, cfg, df)
        np.save(embedding_path(cfg.key, name), vectors)
        counts[name] = len(df)
        print(f"{name}: {vectors.shape} -> {embedding_path(cfg.key, name)}")

    seconds = time.perf_counter() - started
    write_meta(cfg, model, counts, seconds)
    print(f"done in {seconds / 60:.1f} min")
    if seconds > SLOW_SECONDS and str(model.device).startswith("mps"):
        print("That's slow for a rerun; the 0.6B models in config.toml take about "
              "a fifth of the time.")


if __name__ == "__main__":
    main()
