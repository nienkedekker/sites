"""The embedding model settings, read from config.toml."""

import tomllib
from dataclasses import dataclass

from recs.paths import ROOT

CONFIG_FILE = ROOT / "config.toml"


@dataclass(frozen=True)
class ModelConfig:
    key: str
    name: str
    prefix: str
    max_seq_length: int
    batch_size: int
    device: str
    dtype: str


def _load() -> dict:
    with CONFIG_FILE.open("rb") as f:
        return tomllib.load(f)


def model_keys() -> list[str]:
    return list(_load()["models"])


def default_model_key() -> str:
    return _load()["default"]


def model_config(key: str | None = None) -> ModelConfig:
    data = _load()
    key = key or data["default"]
    if key not in data["models"]:
        raise SystemExit(f"no model {key!r} in {CONFIG_FILE}; have {', '.join(data['models'])}")
    return ModelConfig(key=key, **data["models"][key])
