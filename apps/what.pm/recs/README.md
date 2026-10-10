# recs

Recommendations from the what.pm log, mostly so I can learn some machine
learning on data I know. It all runs locally; the only network calls are to
TMDB and Open Library for metadata and to Hugging Face for model weights.

Each book, film and show becomes a vector from a pretrained text-embedding
model, and the catalog items whose vectors sit closest to the ones I've
logged are the picks. what.pm has no ratings and everything on it is
something I liked, so there are no negatives to learn from, only "more like
these".

Needs [uv](https://docs.astral.sh/uv/), and Node for the export. From this
directory:

    uv sync --all-groups
    cp .env.example .env     # and put the TMDB key in it

`src/recs/` is a package; `uv sync` installs it and the commands below are
its entry points. Each step can be re-run, and every API response is cached
in `data/cache/`, so a second run makes no network calls.

| step | command | reads | writes |
|---|---|---|---|
| 1 | `uv run fetch-whatpm` | `data/raw/whatpm.json` | `data/raw/items.parquet` |
| 2 | `uv run enrich` | step 1, `data/enriched/overrides.csv` | `data/enriched/items.parquet`, `unmatched.csv` |
| 3 | `uv run build-catalog` | step 2 | `data/catalog/{books,movies,tv}.parquet` |
| 4 | `uv run embed [--model KEY]` | steps 2 and 3 | `embeddings/KEY/*.npy`, `meta.json` |
| 5 | `uv run recommend [--model KEY]` | step 4 | prints the top 20 per medium |

`uv run evaluate` then scores it, and `notebooks/01_baseline.ipynb` does the
same step by step.

fetch-whatpm doesn't touch the database. `scripts/export-items.ts` in the
Next app dumps every row to `data/raw/whatpm.json` (`--refresh` runs it),
and re-reads and later seasons are collapsed into one row per work, dated
when I first logged it.

enrich looks items up by the TMDB id or Open Library work key the app
already has, and searches on title and year for the rest. TMDB details come
with the director (or a show's creators) and keywords. Open Library has no
description or subjects for about half of the recent books, so those are
filled in from Google Books when `GOOGLE_API_KEY` is set. Loose or missing
matches end up in `data/enriched/unmatched.csv`. To fix one, add it to
`data/enriched/overrides.csv` and run enrich again; an override wins over
the app's id:

    my_id,source_id
    8d2c...-uuid,/works/OL27448W
    1f0a...-uuid,603

build-catalog pulls candidates I haven't logged: TMDB discover per genre and
decade for films and TV, once by popularity and once by rating so it isn't
all franchises, then a details call each for the director and keywords. Books
come from Open Library subject listings, using the subjects my own books have
most, with the same Google Books fallback. The first run is slow, one request
per candidate, about an hour in all. `--pages`, `--subjects` and
`--per-subject` set how many.

embed is the ML part. `item_text()` in `embed.py` builds the text that gets
embedded, `"{title} ({year}). By {creator}. {genres}. {keywords}. {synopsis}"`,
for my items and the candidates alike.

recommend scores a candidate by its mean cosine similarity to the five of my
items it's closest to, per medium, and prints the two behind each pick.
Recent history counts more: an item I logged three years ago weighs half as
much as one from today (`--half-life`, 0 turns it off). My taste has moved,
and this is the single biggest improvement so far, see below.

## Models

They're in `config.toml`. Each one embeds into its own folder under
`embeddings/`, with a `meta.json` saying which model, revision and
dimensions made it, so sets from different models can be compared.

| key | model | why |
|---|---|---|
| `qwen3-4b` | Qwen/Qwen3-Embedding-4B | best open model between 0.5B and 4B on both MTEB boards |
| `qwen3-0.6b` | Qwen/Qwen3-Embedding-0.6B | same family, a tenth of the size |
| `harrier-0.6b` (default) | microsoft/harrier-oss-v1-0.6b | top 10 on the multilingual board at 0.6B |
| `bge-m3` | BAAI/bge-m3 | the usual multilingual reference |
| `baseline` | all-MiniLM-L6-v2 | tiny, 256 tokens, English only, the floor |

To add one, copy a block in `config.toml` with a new key and the Hugging
Face id, set `prefix` to its instruction if it wants one (`texts()` in
`embed.py` puts it in front of every text), and `max_seq_length` to what it
supports. The first `embed` prints the download size and where the weights
go.

To compare models, embed with each and evaluate them together:

    uv run embed --model baseline && uv run embed --model qwen3-4b && uv run evaluate baseline qwen3-4b

That prints recall@10/50/100, MRR and median rank per medium and model. The
split, candidates and scoring are the same for every row, only the
embeddings differ. The 4B takes about half an hour to embed everything on
the GPU; the 0.6B models take five to seven minutes.

## MovieLens

Content similarity can't see that my film taste moved; other people's logs
can. `uv run movielens` reads the MovieLens 32M ratings (unzip
[ml-32m.zip](https://files.grouplens.org/datasets/movielens/) into
`data/external/movielens/`), keeps the ratings of 4 and up, and factorises
the films-by-users matrix into 128 numbers per film. That's an embedding too,
from who liked a film rather than what it's about, and it's written to
`embeddings/movielens/` for films only. MovieLens covers 556 of my 609 films
and stops in 2023, so anything newer gets a zero vector.

`--blend movielens` on recommend and evaluate averages that score with the
content score, standardised first, and falls back to content alone for
films MovieLens doesn't know. The Goodreads dump (UCSD, 2017) was checked
too: it has my books up to 2015 and almost none since, so it stays unused.

## Evaluation

The newest 20% of the log is held out and the rest is the history. Each
held-out item goes into its medium's catalog, and recall@K is the share of
them the baseline ranks in the top K. The split is by time, not random, so
the history can't contain anything logged after what it's tested on.

`--rolling` averages over five cut dates instead of one, which matters when
a single window holds 23 shows. `--half-life` works here too, with ages taken
at the cut date rather than today. evaluate prints the table twice: once for
every held-out item, once for only the ones with a synopsis and genres.

Where it stands (2026-10-10, `--rolling`, items with a full text, median
rank of a held-out item among the candidates, lower is better):

| medium | chance | baseline | qwen3-0.6b | harrier-0.6b | qwen3-4b |
|---|---|---|---|---|---|
| books | 610 | 205 | 136 | 97 | 99 |
| movies | 1962 | 920 | 1308 | 1134 | 897 |
| movies, `--blend movielens` | 1962 | 351 | | 529 | 404 |
| shows | 1060 | 433 | 459 | 287 | 375 |

Books work: more than half of the held-out books land in the top 100 for
the two best models. Shows are close behind on fewer items. Movies are near
chance for every model: what I log now (Anora, Conclave) reads nothing like
the franchise-heavy history, and no synopsis says otherwise. Blending in
MovieLens closes much of that gap: it knows which films are liked by the
people who liked mine, which is a different kind of similar. The classifier
is next. Open Library has no description
for about half of the recent books, and a text that is just a title and a
year ranks on the year, so the first table flatters whichever model likes
short texts. The second is the one to compare models on. Notebook 01 has
the rest, including what the catalog skews.

## Layout

    config.toml           embedding models
    data/raw/             the what.pm export, and one row per work
    data/enriched/        items with metadata, unmatched.csv, overrides.csv
    data/catalog/         candidates I haven't logged, per medium
    data/cache/           every API response, keyed by request
    embeddings/<model>/   one .npy per parquet file, same row order, and meta.json
    src/recs/             the steps, plus cache.py, sources.py, config.py, paths.py
    notebooks/            01 the baseline measured, 02 the classifier (plan only)

`data/` (apart from `overrides.csv`), `embeddings/`, `.env` and `.venv/` are
git-ignored.

Next is the plan in `notebooks/02_pu_classifier.ipynb`: a positive-unlabeled
classifier on the embeddings, logistic regression first and then a small
torch MLP, scored against notebook 01's table.
