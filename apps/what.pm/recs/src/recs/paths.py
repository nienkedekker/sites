"""Where every step reads and writes."""

from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[2]
load_dotenv(ROOT / ".env")

DATA = ROOT / "data"
RAW = DATA / "raw"
ENRICHED = DATA / "enriched"
CATALOG = DATA / "catalog"
CACHE = DATA / "cache"
EMBEDDINGS = ROOT / "embeddings"

WHATPM_JSON = RAW / "whatpm.json"
RAW_ITEMS = RAW / "items.parquet"
ITEMS = ENRICHED / "items.parquet"
UNMATCHED = ENRICHED / "unmatched.csv"
OVERRIDES = ENRICHED / "overrides.csv"

MEDIA = ("book", "movie", "show")
FILE_NAMES = {"book": "books", "movie": "movies", "show": "tv"}


def catalog_path(medium: str) -> Path:
    return CATALOG / f"{FILE_NAMES[medium]}.parquet"


def embedding_dir(model_key: str) -> Path:
    return EMBEDDINGS / model_key


def embedding_path(model_key: str, name: str) -> Path:
    return embedding_dir(model_key) / f"{name}.npy"
