"""Attach TMDB / Open Library metadata to each of my items.

    uv run enrich
"""

import pandas as pd

from recs.paths import ITEMS, OVERRIDES, RAW_ITEMS, UNMATCHED
from recs.sources import (
    TMDB_EXTRAS,
    fill_from_google,
    names_overlap,
    open_library_get,
    open_library_record,
    same_title,
    tmdb_get,
    tmdb_movie_record,
    tmdb_show_record,
)

OPEN_LIBRARY_FIELDS = "key,title,author_name,first_publish_year"
SOURCE_COLUMNS = ["source", "source_id", "source_title", "source_year", "genres", "synopsis"]

Match = tuple[dict | None, str, str]


def is_tmdb_id(value: str) -> bool:
    return value.isdigit()


def is_work_key(value: str) -> bool:
    return value.startswith("/works/OL")


def movie_by_id(tmdb_id: str) -> dict | None:
    raw = tmdb_get(f"/movie/{tmdb_id}", append_to_response=TMDB_EXTRAS)
    return tmdb_movie_record(raw) if raw else None


def show_by_id(tmdb_id: str) -> dict | None:
    raw = tmdb_get(f"/tv/{tmdb_id}", append_to_response=TMDB_EXTRAS)
    return tmdb_show_record(raw) if raw else None


def book_by_key(key: str, creator: str | None, year: int) -> dict | None:
    work = open_library_get(f"{key}.json")
    if not work:
        return None
    record = open_library_record(work, creator=creator, year=year)
    return fill_from_google(record, work.get("title") or "", creator)


def search_movie(title: str, year: int) -> Match:
    data = tmdb_get("/search/movie", query=title, include_adult="false") or {}
    results = data.get("results", [])
    for raw in results:
        rec = tmdb_movie_record(raw)
        if same_title(title, raw.get("title"), raw.get("original_title")):
            if rec["year"] is not None and abs(rec["year"] - year) <= 1:
                return movie_by_id(rec["source_id"]), "exact", ""
            return movie_by_id(rec["source_id"]), "loose", f"year {rec['year']} vs {year}"
    if results:
        rec = movie_by_id(str(results[0]["id"]))
        return rec, "loose", f"title differs: {rec['title'] if rec else '?'}"
    return None, "none", "no results"


def search_show(title: str, year: int) -> Match:
    data = tmdb_get("/search/tv", query=title, include_adult="false") or {}
    results = data.get("results", [])
    for raw in results:
        rec = tmdb_show_record(raw)
        if same_title(title, raw.get("name"), raw.get("original_name")):
            # A season can't air before its show started
            if rec["year"] is not None and rec["year"] <= year + 1:
                return show_by_id(rec["source_id"]), "exact", ""
            return show_by_id(rec["source_id"]), "loose", f"first aired {rec['year']}"
    if results:
        rec = show_by_id(str(results[0]["id"]))
        return rec, "loose", f"title differs: {rec['title'] if rec else '?'}"
    return None, "none", "no results"


def search_books(**query: str) -> list[dict]:
    data = open_library_get("/search.json", fields=OPEN_LIBRARY_FIELDS, limit="10", **query) or {}
    return data.get("docs", [])


def search_book(title: str, creator: str | None, year: int) -> Match:
    # The fielded search misses translations filed under the original title
    docs = search_books(title=title, author=creator or "") or search_books(
        q=f"{title} {creator or ''}".strip()
    )
    by_author = [d for d in docs if names_overlap(creator, d.get("author_name", []))]
    for doc in by_author:
        if same_title(title, doc.get("title")):
            rec = book_by_key(doc["key"], creator, year)
            return rec, "exact", ""
    if by_author:
        doc = by_author[0]
        rec = book_by_key(doc["key"], creator, year)
        return rec, "loose", f"title differs: {doc.get('title')}"
    for doc in docs:
        if same_title(title, doc.get("title")):
            rec = book_by_key(doc["key"], creator, year)
            return rec, "loose", f"author differs: {doc.get('author_name')}"
    if docs:
        # Translations are filed under the original title and author, so the
        # top hit is left for me to confirm in overrides.csv rather than used
        doc = docs[0]
        return None, "none", f"maybe {doc['key']}: {doc.get('title')} by {doc.get('author_name')}"
    return None, "none", "no results"


def resolve(row: pd.Series, source_id: str) -> Match:
    medium, title, creator, year = row["medium"], row["title"], row["creator"], int(row["year"])

    if medium == "movie" and is_tmdb_id(source_id):
        rec = movie_by_id(source_id)
        return (rec, "id", "") if rec else (None, "none", f"tmdb {source_id} not found")
    if medium == "show" and is_tmdb_id(source_id):
        rec = show_by_id(source_id)
        return (rec, "id", "") if rec else (None, "none", f"tmdb {source_id} not found")
    if medium == "book" and is_work_key(source_id):
        rec = book_by_key(source_id, creator, year)
        return (rec, "id", "") if rec else (None, "none", f"work {source_id} not found")

    if medium == "movie":
        return search_movie(title, year)
    if medium == "show":
        return search_show(title, year)
    return search_book(title, creator, year)


def load_overrides() -> dict[str, str]:
    if not OVERRIDES.exists():
        return {}
    df = pd.read_csv(OVERRIDES, dtype=str).fillna("")
    return dict(zip(df["my_id"], df["source_id"]))


def main() -> None:
    items = pd.read_parquet(RAW_ITEMS)
    overrides = load_overrides()
    found: list[dict] = []
    unmatched: list[dict] = []

    for i, row in items.iterrows():
        source_id = overrides.get(row["id"], row["source_id"])
        rec, confidence, note = resolve(row, source_id)
        found.append(
            {
                "source": rec["source"] if rec else "",
                "source_id": rec["source_id"] if rec else "",
                "source_title": rec["title"] if rec else "",
                "source_year": rec["year"] if rec else None,
                # Not the app's genres: catalog books only have Open Library
                # subjects, so my books get those too or the two wouldn't
                # embed alike
                "genres": rec["genres"] if rec else [],
                "keywords": rec["keywords"] if rec else [],
                "synopsis": rec["synopsis"] if rec else "",
                "match": confidence,
            }
        )
        # Shows have no creator in the app; TMDB's created_by stands in
        if rec and rec["creator"] and not isinstance(row["creator"], str):
            items.at[i, "creator"] = rec["creator"]
        if confidence in ("loose", "none"):
            unmatched.append(
                {
                    "my_id": row["id"],
                    "medium": row["medium"],
                    "title": row["title"],
                    "year": row["year"],
                    "creator": row["creator"],
                    "matched": rec["source_id"] if rec else "",
                    "matched_title": rec["title"] if rec else "",
                    "confidence": confidence,
                    "note": note,
                }
            )
        if (i + 1) % 100 == 0:
            print(f"{i + 1}/{len(items)}")

    enriched = pd.concat([items.drop(columns=["source_id"]), pd.DataFrame(found)], axis=1)
    ITEMS.parent.mkdir(parents=True, exist_ok=True)
    enriched.to_parquet(ITEMS, index=False)
    pd.DataFrame(unmatched).to_csv(UNMATCHED, index=False)

    print(f"\n{len(enriched)} items -> {ITEMS}")
    print(enriched["match"].value_counts().to_string())
    print(f"{len(unmatched)} to check in {UNMATCHED}")
    no_synopsis = (enriched["synopsis"] == "").groupby(enriched["medium"]).sum()
    no_genres = (enriched["genres"].map(len) == 0).groupby(enriched["medium"]).sum()
    print("without a synopsis:", no_synopsis.to_dict(), " without genres:", no_genres.to_dict())


if __name__ == "__main__":
    main()
