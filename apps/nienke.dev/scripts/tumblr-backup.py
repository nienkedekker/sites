#!/usr/bin/env python3
# Backs up every public post (NPF JSON) and its media for each blog given.
# Usage, from apps/nienke.dev: TUMBLR_TOKEN=… python3 scripts/tumblr-backup.py shinyhats vanderfield
# The token is an OAuth2 bearer token for the Tumblr API.
import json, mimetypes, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

TOKEN = os.environ["TUMBLR_TOKEN"]
OUT = Path(__file__).resolve().parents[3] / "old-sites-handover/tumblr-backup"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


def get(url, headers=None, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, **(headers or {})})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read(), r.headers.get_content_type()
        except Exception as e:
            if i == tries - 1:
                raise
            print("  retry", url, e)
            time.sleep(5 * (i + 1))


# Neither offset nor timestamp paging returns every post on its own, so do both
# and merge by id.
def fetch_posts(blog):
    posts = {}
    for mode in ("offset", "before"):
        offset, before = 0, None
        while True:
            params = {"npf": "true", "reblog_info": "true", "limit": 20}
            if mode == "offset":
                params["offset"] = offset
            elif before:
                params["before"] = before
            body, _ = get(f"https://api.tumblr.com/v2/blog/{blog}.tumblr.com/posts?{urllib.parse.urlencode(params)}", {"Authorization": "Bearer " + TOKEN})
            r = json.loads(body)["response"]
            blog_info, total = r["blog"], r["total_posts"]
            if not r["posts"]:
                break
            for p in r["posts"]:
                posts[p["id_string"]] = p
            offset += len(r["posts"])
            before = min(p["timestamp"] for p in r["posts"])
            print(f"{blog} ({mode}): {len(posts)}/{total}")
            time.sleep(0.5)
    return blog_info, total, posts


# NPF lists each image at several sizes, largest first; only the largest is kept.
def media_urls(node, found):
    if isinstance(node, dict):
        m = node.get("media")
        if isinstance(m, list) and m and isinstance(m[0], dict) and "url" in m[0]:
            found.add(m[0]["url"])
        elif isinstance(m, dict) and "url" in m:
            found.add(m["url"])
        for k in ("poster", "avatar"):
            v = node.get(k)
            if isinstance(v, list) and v and isinstance(v[0], dict) and "url" in v[0]:
                found.add(v[0]["url"])
        for k, v in node.items():
            if k != "media":
                media_urls(v, found)
    elif isinstance(node, list):
        for v in node:
            media_urls(v, found)
    return found


def local_name(url):
    p = urllib.parse.urlparse(url)
    return (p.netloc.split(".")[0] + "_" + p.path.strip("/").replace("/", "_"))[:200]


def backup(blog):
    d = OUT / blog
    (d / "media").mkdir(parents=True, exist_ok=True)
    info, total, fetched = fetch_posts(blog)
    saved = d / "posts.json"
    merged = {p["id_string"]: p for p in json.loads(saved.read_text())} if saved.exists() else {}
    merged.update(fetched)
    posts = sorted(merged.values(), key=lambda p: -p["timestamp"])
    (d / "blog.json").write_text(json.dumps(info, indent=2, ensure_ascii=False))
    (d / "posts.json").write_text(json.dumps(posts, indent=2, ensure_ascii=False))
    print(f"{blog}: saved {len(posts)} of {total} posts")

    index_path = d / "media.json"
    index = json.loads(index_path.read_text()) if index_path.exists() else {}
    urls = sorted(u for u in media_urls(posts, set()) if u not in index)
    print(f"{blog}: {len(urls)} media files to fetch")
    for i, url in enumerate(urls, 1):
        try:
            # .pnj/.gifv URLs serve webp unless the original formats are asked for.
            data, ctype = get(url, {"Accept": "image/png,image/jpeg,image/gif,video/mp4,audio/*,*/*;q=0.1"})
        except Exception as e:
            print("  FAILED", url, e)
            continue
        name = local_name(url)
        ext = mimetypes.guess_extension(ctype) or ""
        if ext and not name.endswith(ext):
            name = name.rsplit(".", 1)[0] + ext
        (d / "media" / name).write_bytes(data)
        index[url] = "media/" + name
        if i % 50 == 0:
            print(f"  {i}/{len(urls)}")
            index_path.write_text(json.dumps(index, indent=2))
        time.sleep(0.2)
    index_path.write_text(json.dumps(index, indent=2))
    print(f"{blog}: done, {len(index)} media files")


if __name__ == "__main__":
    for b in sys.argv[1:]:
        backup(b)
