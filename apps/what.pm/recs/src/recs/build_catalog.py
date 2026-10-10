"""Pull a few thousand candidates per medium that I haven't logged.

    uv run build-catalog
    uv run build-catalog --pages 3 --per-subject 120
"""

import argparse
from collections import Counter
from datetime import date

import pandas as pd

from recs.enrich import movie_by_id, show_by_id
from recs.paths import ITEMS, catalog_path
from recs.sources import (
    fill_from_google,
    normalize_title,
    open_library_get,
    open_library_record,
    subject_slug,
    tmdb_genres,
    tmdb_get,
    tmdb_movie_record,
    tmdb_show_record,
)

FIRST_DECADE = 1960
MIN_VOTES = {"movie": "100", "tv": "50"}
DEFAULT_SUBJECTS = 25

# Popularity alone fills the catalog with franchise entries; a second pass
# by rating gets the well-liked films and shows that aren't blockbusters
SORTS = [("popularity.desc", MIN_VOTES), ("vote_average.desc", {"movie": "300", "tv": "100"})]

CATALOG_COLUMNS = [
    "medium", "source", "source_id", "title", "year", "creator",
    "genres", "keywords", "synopsis", "popularity", "vote_count",
]


def decades() -> list[tuple[str, str]]:
    this_year = date.today().year
    return [
        (f"{start}-01-01", f"{min(start + 9, this_year)}-12-31")
        for start in range(FIRST_DECADE, this_year + 1, 10)
    ]


def discover(kind: str, pages: int) -> list[dict]:
    date_field = "primary_release_date" if kind == "movie" else "first_air_date"
    to_record = tmdb_movie_record if kind == "movie" else tmdb_show_record
    by_id = tmdb_genres(kind)
    records: dict[str, dict] = {}
    for genre_id in by_id:
        for start, end in decades():
            for sort_by, min_votes in SORTS:
                for page in range(1, pages + 1):
                    data = tmdb_get(
                        f"/discover/{kind}",
                        with_genres=str(genre_id),
                        **{f"{date_field}.gte": start, f"{date_field}.lte": end},
                        sort_by=sort_by,
                        **{"vote_count.gte": min_votes[kind]},
                        include_adult="false",
                        page=str(page),
                    )
                    for raw in (data or {}).get("results", []):
                        rec = to_record(raw, by_id)
                        records.setdefault(rec["source_id"], rec)
    return list(records.values())


def with_details(records: list[dict], kind: str) -> list[dict]:
    by_id = movie_by_id if kind == "movie" else show_by_id
    out = []
    for i, rec in enumerate(records):
        details = by_id(rec["source_id"])
        out.append({**rec, **details} if details else rec)
        if (i + 1) % 500 == 0:
            print(f"  {i + 1}/{len(records)} {kind} details")
    return out


def my_subjects(items: pd.DataFrame, limit: int) -> list[str]:
    books = items[items["medium"] == "book"]
    counts = Counter(g for genres in books["genres"] for g in genres)
    return [subject for subject, _ in counts.most_common(limit)]


def subject_works(subjects: list[str], per_subject: int) -> list[dict]:
    works: dict[str, dict] = {}
    for subject in subjects:
        data = open_library_get(f"/subjects/{subject_slug(subject)}.json", limit=str(per_subject))
        for work in (data or {}).get("works", []):
            works.setdefault(work["key"], work)
    return list(works.values())


def book_records(works: list[dict]) -> list[dict]:
    records = []
    for i, listed in enumerate(works):
        details = open_library_get(f"{listed['key']}.json")
        if not details:
            continue
        creator = ", ".join(a["name"] for a in listed.get("authors", []) if a.get("name"))
        record = open_library_record(details, creator=creator or None, year=listed.get("first_publish_year"))
        records.append(fill_from_google(record, record["title"], record["creator"]))
        if (i + 1) % 100 == 0:
            print(f"  {i + 1}/{len(works)} books")
    return records


def not_mine(records: list[dict], items: pd.DataFrame, medium: str) -> list[dict]:
    mine = items[items["medium"] == medium]
    ids = set(mine["source_id"])
    titles = {(normalize_title(t), y) for t, y in zip(mine["title"], mine["year"])}
    return [
        r for r in records
        if r["source_id"] not in ids and (normalize_title(r["title"]), r["year"]) not in titles
    ]


def save(records: list[dict], medium: str) -> None:
    df = pd.DataFrame(records)
    df.insert(0, "medium", medium)
    df = df[CATALOG_COLUMNS]
    path = catalog_path(medium)
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_parquet(path, index=False)
    print(f"{len(df)} {medium} candidates -> {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--pages", type=int, default=2, help="TMDB pages per genre and decade")
    parser.add_argument("--subjects", type=int, default=DEFAULT_SUBJECTS, help="Open Library subjects")
    parser.add_argument("--per-subject", type=int, default=80, help="works per subject")
    parser.add_argument("--only", choices=["book", "movie", "show"], help="one medium")
    args = parser.parse_args()

    items = pd.read_parquet(ITEMS)

    if args.only in (None, "movie"):
        movies = not_mine(discover("movie", args.pages), items, "movie")
        save(with_details(movies, "movie"), "movie")
    if args.only in (None, "show"):
        shows = not_mine(discover("tv", args.pages), items, "show")
        save(with_details(shows, "tv"), "show")
    if args.only in (None, "book"):
        subjects = my_subjects(items, args.subjects)
        print("subjects:", ", ".join(subjects))
        works = subject_works(subjects, args.per_subject)
        listed = [{"source_id": w["key"], "title": w.get("title", ""), "year": w.get("first_publish_year")} for w in works]
        unseen_keys = {r["source_id"] for r in not_mine(listed, items, "book")}
        works = [w for w in works if w["key"] in unseen_keys]
        print(f"{len(works)} unseen works, fetching descriptions")
        save(book_records(works), "book")


if __name__ == "__main__":
    main()
