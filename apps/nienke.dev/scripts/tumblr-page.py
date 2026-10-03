#!/usr/bin/env python3
# Builds src/data/tumblr-posts.ts and public/tumblr/ from the Tumblr backup.
# Usage, from apps/nienke.dev: python3 scripts/tumblr-page.py
import json, re, shutil, subprocess
from collections import Counter
from pathlib import Path

SITE = Path(__file__).resolve().parents[1]
BACKUP = SITE.parents[1] / ".claude/tumblr-backup"
IMAGES = SITE / "public/tumblr"
BLOGS = ("vanderfield", "shinyhats")
FIRST_YEAR, LAST_YEAR = 2010, 2014
MIN_NOTES = 150
MIN_TAG_USES = 5

FANDOMS = [
    ("Lost", ["lost", "richard alpert", "team jacob", "team smokey", "omg my bff benry", "my bff benry", "benry", "my television boyfriend jack", "oh my god richard", "keamy = dreamy", "richard = my muse"]),
    ("Battlestar Galactica", ["battlestar galactica", "lee adama", "gaius baltar", "gaius/six", "lee/kara"]),
    ("Game of Thrones", ["game of thrones", "a song of ice and fire", "asoiaf", "jon snow", "roose bolton", "daenerys targaryen", "don't hate the flayer hate the game", "i pity those who don't appreciate stannis"]),
    ("Sherlock", ["sherlock", "unlocking sherlock", "mycroft holmes", "john watson", "a scandal in belgravia", "the blind banker"]),
    ("Luther", ["luther"]),
    ("True Detective", ["true detective", "rust cohle"]),
    ("Hannibal", ["hannibal"]),
    ("Marvel", ["marvel", "the avengers", "thor", "loki", "x-men", "x-men: first class", "magneto"]),
    ("Rome", ["rome"]),
    ("Inception", ["inception", "arthur/eames"]),
    ("The Office", ["the office", "the office uk", "tim canterbury appreciation blog '12"]),
    ("The Wire", ["the wire"]),
    ("30 Rock", ["30 rock"]),
    ("The Dark Tower", ["the dark tower"]),
    ("Sons of Anarchy", ["sons of anarchy"]),
]
META_TAGS = {"photo", "text", "quote", "link", "video", "reblog", "movie", "movies"}


def is_meta(tag):
    return tag in META_TAGS or tag == ".gif" or re.match(r"^(a|c|type):", tag)


def is_reblog(p):
    return bool(p.get("parent_post_url") or p.get("reblogged_from_name") or p.get("trail"))


def tags(p):
    return [t.strip() for t in p.get("tags", [])]


def quarter(p):
    year, month = int(p["date"][:4]), int(p["date"][5:7])
    return (year - FIRST_YEAR) * 4 + (month - 1) // 3


def text_of(p, limit=280):
    text = " ".join(b["text"] for b in p.get("content", []) if b["type"] == "text").strip()
    text = re.sub(r"\s+", " ", text)
    if len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0] + "…"
    return text


def size_of(path):
    out = subprocess.run(["sips", "-g", "pixelWidth", "-g", "pixelHeight", str(path)], capture_output=True, text=True).stdout
    w, h = re.findall(r"pixel(?:Width|Height): (\d+)", out)
    return int(w), int(h)


# GIFs get a first-frame still, so the page only loads a GIF when it's played.
def save_image(src, post_id):
    still = IMAGES / f"{post_id}.jpg"
    subprocess.run(["sips", "-Z", "800", "-s", "format", "jpeg", "-s", "formatOptions", "75", str(src), "--out", str(still)], capture_output=True, check=True)
    w, h = size_of(still)
    image = {"src": f"/tumblr/{still.name}", "width": w, "height": h}
    if src.suffix == ".gif":
        shutil.copy2(src, IMAGES / f"{post_id}.gif")
        image["gif"] = f"/tumblr/{post_id}.gif"
    return image


posts = []
for blog in BLOGS:
    media = json.loads((BACKUP / blog / "media.json").read_text())
    for p in json.loads((BACKUP / blog / "posts.json").read_text()):
        p["blog"], p["media_index"] = blog, media
        posts.append(p)

quarters = (LAST_YEAR - FIRST_YEAR + 1) * 4
fandoms = []
for name, fandom_tags in FANDOMS:
    counts = [0] * quarters
    for p in posts:
        q = quarter(p)
        if 0 <= q < quarters and {t.lower() for t in tags(p)} & set(fandom_tags):
            counts[q] += 1
    if sum(counts) >= 10:
        fandoms.append({"name": name, "counts": counts})
fandoms.sort(key=lambda f: next(i for i, c in enumerate(f["counts"]) if c))

tag_uses = Counter(t for p in posts for t in {t.lower() for t in tags(p)} if not is_meta(t))
tag_cloud = sorted(
    ({"name": t, "count": n} for t, n in tag_uses.items() if n >= MIN_TAG_USES),
    key=lambda t: t["name"],
)

if IMAGES.exists():
    shutil.rmtree(IMAGES)
IMAGES.mkdir(parents=True)

highlights = []
for p in posts:
    if is_reblog(p):
        continue
    mine = any(t.lower() == "a: my stuff" for t in tags(p))
    if not mine and p.get("note_count", 0) < MIN_NOTES:
        continue
    images = [b["media"][0]["url"] for b in p.get("content", []) if b["type"] == "image"]
    local = [p["media_index"][u] for u in images if u in p["media_index"]]
    highlights.append({
        "blog": p["blog"],
        "date": p["date"][:10],
        "url": p["post_url"],
        "notes": p.get("note_count", 0),
        "mine": mine,
        "image": save_image(BACKUP / p["blog"] / local[0], p["id_string"]) if local else None,
        "more": max(0, len(images) - 1),
        "text": text_of(p),
        "tags": [t for t in tags(p) if t.lower() not in META_TAGS and not re.match(r"^(a|c|type):", t.lower())],
    })

highlights.sort(key=lambda h: (not h["mine"], h["date"] if h["mine"] else -h["notes"]))

counts = Counter(p["blog"] for p in posts)
originals = Counter(p["blog"] for p in posts if not is_reblog(p))
data = f"""// Generated by scripts/tumblr-page.py from the Tumblr backup.

export interface TumblrPost {{
  blog: string;
  date: string;
  url: string;
  notes: number;
  mine: boolean;
  image: {{ src: string; width: number; height: number; gif?: string }} | null;
  more: number;
  text: string;
  tags: string[];
}}

export const tumblrFirstYear = {FIRST_YEAR};

export const fandoms: {{ name: string; counts: number[] }}[] = {json.dumps(fandoms, ensure_ascii=False)};

export const tumblrTags: {{ name: string; count: number }}[] = {json.dumps(tag_cloud, ensure_ascii=False)};

export const tumblrPosts: TumblrPost[] = {json.dumps(highlights, ensure_ascii=False, indent=2)};
"""
(SITE / "src/data/tumblr-posts.ts").write_text(data)
print(f"{len(highlights)} highlights ({sum(h['mine'] for h in highlights)} mine), {len(fandoms)} fandoms, {len(tag_cloud)} tags")
print("posts per blog", dict(counts), "originals", dict(originals))
for f in fandoms:
    print(f"  {f['name']}: {sum(f['counts'])}")
