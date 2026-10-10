"""Load the what.pm export and reduce it to one row per work.

    uv run fetch-whatpm            # uses data/raw/whatpm.json if it exists
    uv run fetch-whatpm --refresh  # runs the Next app's export first
"""

import argparse
import json
import re
import subprocess

import pandas as pd

from recs.paths import RAW_ITEMS, ROOT, WHATPM_JSON

APP_DIR = ROOT.parent
MEDIUM = {"Book": "book", "Movie": "movie", "Show": "show"}


def run_export() -> None:
    subprocess.run(
        ["node", "--env-file=.env.local", "scripts/export-items.ts"],
        cwd=APP_DIR,
        check=True,
    )


def clean_title(title: str) -> str:
    text = re.sub(r"\([^)]*\)", " ", title)
    text = re.sub(r"\b(IMAX|3D)\b", " ", text, flags=re.IGNORECASE)
    return re.sub(r"\s+", " ", text).strip()


def date_logged(created_at: str | None, year_logged: int) -> str:
    """Everything before 2019 was imported in bulk that year, so for those
    `created_at` is the import and only the log year is real."""
    created = (created_at or "")[:10]
    if not created or int(created[:4]) > year_logged + 1:
        return f"{year_logged}-01-01"
    return created


def work_key(row: pd.Series) -> str:
    ident = row["source_id"] or f"{row['title']}|{row['year']}"
    return f"{row['medium']}:{ident}"


def normalise(items: list[dict]) -> pd.DataFrame:
    df = pd.DataFrame(items)
    df["medium"] = df["itemtype"].map(MEDIUM)
    df["title"] = df["title"].map(clean_title)
    df["year"] = df["published_year"].astype(int)
    df["creator"] = df["author"].fillna(df["director"])
    df["year_logged"] = df["belongs_to_year"].astype(int)
    df["date_logged"] = [
        date_logged(c, y) for c, y in zip(df["created_at"], df["year_logged"])
    ]
    df["source_id"] = df["external_id"].fillna("")
    df["app_genres"] = df["genres"]
    df["in_progress"] = df["in_progress"].fillna(False).astype(bool)

    df = df[~df["did_not_finish"]]

    df = df.sort_values(["year_logged", "date_logged"], kind="stable")
    df["work"] = df.apply(work_key, axis=1)

    works = (
        df.groupby("work", sort=False)
        .agg(
            id=("id", "first"),
            medium=("medium", "first"),
            title=("title", "first"),
            year=("year", "min"),
            creator=("creator", "first"),
            year_logged=("year_logged", "first"),
            date_logged=("date_logged", "first"),
            source_id=("source_id", "first"),
            app_genres=("app_genres", "first"),
            seasons=("season", lambda s: sorted(int(x) for x in s.dropna())),
            times_logged=("id", "size"),
            in_progress=("in_progress", "last"),
        )
        .reset_index(drop=True)
    )
    return works.sort_values(["year_logged", "date_logged"], kind="stable").reset_index(
        drop=True
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--refresh", action="store_true", help="re-run the export")
    args = parser.parse_args()

    if args.refresh or not WHATPM_JSON.exists():
        run_export()

    items = json.loads(WHATPM_JSON.read_text())["items"]
    works = normalise(items)
    RAW_ITEMS.parent.mkdir(parents=True, exist_ok=True)
    works.to_parquet(RAW_ITEMS, index=False)

    print(f"{len(items)} rows -> {len(works)} works -> {RAW_ITEMS}")
    print(works["medium"].value_counts().to_string())


if __name__ == "__main__":
    main()
