"""TMDB and Open Library requests, and turning their answers into one shape."""

import os
import re
import unicodedata

from recs.cache import cached_get

TMDB = "https://api.themoviedb.org/3"
OPEN_LIBRARY = "https://openlibrary.org"
GOOGLE_BOOKS = "https://www.googleapis.com/books/v1/volumes"
OPEN_LIBRARY_HEADERS = {"User-Agent": "what.pm recs (https://what.pm)"}

# TMDB allows about 50 requests a second; Open Library asks for about one
TMDB_PAUSE = 0.1
OPEN_LIBRARY_PAUSE = 1.0
GOOGLE_PAUSE = 0.5
MAX_KEYWORDS = 10

SUBJECT_NOISE = re.compile(
    r"accessible book|protected daisy|in library|large type|large print|"
    r"open library|overdrive|reading level|lending library|new york times|"
    r"bestseller|^fiction$|^literature$|^novel|general$|^english|translations|"
    r"^long now|staff picks|award|^nyt",
    re.IGNORECASE,
)
MAX_SUBJECTS = 8


def tmdb_get(path: str, **params: str) -> dict | None:
    key = os.environ.get("TMDB_API_KEY")
    if not key:
        raise SystemExit("TMDB_API_KEY is missing: put it in recs/.env")
    return cached_get(f"{TMDB}{path}", {"api_key": key, **params}, pause=TMDB_PAUSE)


def open_library_get(path: str, **params: str) -> dict | None:
    return cached_get(
        f"{OPEN_LIBRARY}{path}",
        params,
        headers=OPEN_LIBRARY_HEADERS,
        pause=OPEN_LIBRARY_PAUSE,
    )


def google_books_get(**params: str) -> dict | None:
    key = os.environ.get("GOOGLE_API_KEY")
    if not key:
        return None
    return cached_get(GOOGLE_BOOKS, {"key": key, **params}, pause=GOOGLE_PAUSE)


def year_of(date: str | None) -> int | None:
    match = re.match(r"\d{4}", date or "")
    return int(match.group()) if match else None


def normalize_title(title: str) -> str:
    text = unicodedata.normalize("NFKD", title.lower().replace("&", " and "))
    text = "".join(ch for ch in text if not unicodedata.combining(ch))
    text = re.sub(r"[^a-z0-9 ]+", " ", text)
    text = re.sub(r"^(the|a|an) ", "", text)
    return re.sub(r"\s+", " ", text).strip()


def split_names(value: str | None) -> list[str]:
    return [n.strip() for n in re.split(r",\s*|\s+(?:&|and)\s+", value or "") if n.strip()]


def names_overlap(mine: str | None, theirs: list[str]) -> bool:
    wanted = {normalize_title(n) for n in split_names(mine)}
    return any(normalize_title(n) in wanted for n in theirs)


def same_title(mine: str, *theirs: str | None) -> bool:
    wanted = normalize_title(mine)
    return any(
        normalize_title(t) == wanted or normalize_title(t.split(":")[0]) == wanted
        for t in theirs
        if t
    )


def tmdb_genres(kind: str) -> dict[int, str]:
    data = tmdb_get(f"/genre/{kind}/list") or {}
    return {g["id"]: g["name"] for g in data.get("genres", [])}


def _genre_names(raw: dict, by_id: dict[int, str]) -> list[str]:
    # Details responses carry {id, name} objects, search and discover only ids
    if "genres" in raw:
        return [g["name"] for g in raw["genres"]]
    return [by_id[i] for i in raw.get("genre_ids", []) if i in by_id]


# Details calls ask for these on top, so one request gives the director
# and keywords too; search and discover results don't have them
TMDB_EXTRAS = "credits,keywords"


def _keywords(raw: dict) -> list[str]:
    # Movies list keywords under "keywords", TV under "results"
    bag = raw.get("keywords") or {}
    found = bag.get("keywords") or bag.get("results") or []
    return [k["name"] for k in found[:MAX_KEYWORDS]]


def _directors(raw: dict) -> str | None:
    crew = (raw.get("credits") or {}).get("crew") or []
    names = list(dict.fromkeys(p["name"] for p in crew if p.get("job") == "Director"))
    return ", ".join(names) or None


def _creators(raw: dict) -> str | None:
    names = [p["name"] for p in raw.get("created_by") or [] if p.get("name")]
    return ", ".join(names) or None


def tmdb_movie_record(raw: dict, by_id: dict[int, str] | None = None) -> dict:
    return {
        "source": "tmdb",
        "source_id": str(raw["id"]),
        "title": raw.get("title") or raw.get("original_title") or "",
        "year": year_of(raw.get("release_date")),
        "creator": _directors(raw),
        "genres": _genre_names(raw, by_id or {}),
        "keywords": _keywords(raw),
        "synopsis": (raw.get("overview") or "").strip(),
        "popularity": raw.get("popularity"),
        "vote_count": raw.get("vote_count"),
    }


def tmdb_show_record(raw: dict, by_id: dict[int, str] | None = None) -> dict:
    return {
        "source": "tmdb",
        "source_id": str(raw["id"]),
        "title": raw.get("name") or raw.get("original_name") or "",
        "year": year_of(raw.get("first_air_date")),
        "creator": _creators(raw),
        "genres": _genre_names(raw, by_id or {}),
        "keywords": _keywords(raw),
        "synopsis": (raw.get("overview") or "").strip(),
        "popularity": raw.get("popularity"),
        "vote_count": raw.get("vote_count"),
    }


def clean_subjects(subjects: list[str] | None) -> list[str]:
    seen: set[str] = set()
    kept: list[str] = []
    for subject in subjects or []:
        key = subject.strip().lower()
        if not key or key in seen or SUBJECT_NOISE.search(key):
            continue
        seen.add(key)
        kept.append(subject.strip())
        if len(kept) == MAX_SUBJECTS:
            break
    return kept


def work_description(work: dict) -> str:
    raw = work.get("description") or ""
    text = raw.get("value", "") if isinstance(raw, dict) else raw
    # Descriptions often end in source links after a rule or "([source][1])"
    text = re.split(r"\n-{3,}|\(\[source\]", text)[0]
    text = re.sub(r"\[([^\]]+)\]\([^)]*\)", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def open_library_record(
    work: dict,
    *,
    creator: str | None = None,
    year: int | None = None,
) -> dict:
    return {
        "source": "openlibrary",
        "source_id": work["key"],
        "title": work.get("title", ""),
        "year": year if year is not None else year_of(work.get("first_publish_date")),
        "creator": creator,
        "genres": clean_subjects(work.get("subjects")),
        "keywords": [],
        "synopsis": work_description(work),
        "popularity": None,
        "vote_count": None,
    }


def google_categories(categories: list[str] | None) -> list[str]:
    # "Fiction / Literary" is two, and "General" says nothing
    found = [part.strip() for c in categories or [] for part in c.split("/")]
    return [c for c in dict.fromkeys(found) if c and c.lower() != "general"]


def google_book(title: str, creator: str | None) -> dict | None:
    """Description and categories for a book, from the best-matching volume."""
    data = google_books_get(
        q=f"{title.split(':')[0]} {creator or ''}".strip(), printType="books", maxResults="10"
    )
    volumes = [v.get("volumeInfo", {}) for v in (data or {}).get("items", [])]
    matches = [
        v for v in volumes
        if same_title(title, v.get("title"))
        and (not creator or names_overlap(creator, v.get("authors", [])))
    ]
    with_text = [v for v in matches if v.get("description")] or matches
    if not with_text:
        return None
    best = with_text[0]
    description = re.sub(r"<[^>]+>", " ", best.get("description") or "")
    return {
        "synopsis": re.sub(r"\s+", " ", description).strip(),
        "genres": google_categories(best.get("categories")),
    }


def fill_from_google(record: dict, title: str, creator: str | None) -> dict:
    """Open Library has no description or subjects for about half the recent
    books; Google Books usually does."""
    if record["synopsis"] and record["genres"]:
        return record
    extra = google_book(title, creator)
    if not extra:
        return record
    filled = dict(record)
    if not filled["synopsis"]:
        filled["synopsis"] = extra["synopsis"]
    if not filled["genres"]:
        filled["genres"] = extra["genres"]
    return filled


def subject_slug(subject: str) -> str:
    return re.sub(r"\s+", "_", subject.strip().lower())
