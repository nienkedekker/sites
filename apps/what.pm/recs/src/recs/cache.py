"""GET with every response cached in data/cache."""

import hashlib
import json
import time

import requests

from recs.paths import CACHE

SECRET_PARAMS = {"api_key", "key"}
RETRY_STATUSES = {429, 500, 502, 503, 504}

Json = dict | list | None


def _public(params: dict[str, str]) -> dict[str, str]:
    return {k: v for k, v in sorted(params.items()) if k not in SECRET_PARAMS}


def cache_key(url: str, params: dict[str, str]) -> str:
    raw = json.dumps([url, _public(params)], ensure_ascii=False)
    return hashlib.sha256(raw.encode()).hexdigest()


def cached_get(
    url: str,
    params: dict[str, str] | None = None,
    headers: dict[str, str] | None = None,
    pause: float = 0.25,
) -> Json:
    params = params or {}
    path = CACHE / f"{cache_key(url, params)}.json"
    if path.exists():
        return json.loads(path.read_text())["response"]

    response = _fetch(url, params, headers, pause)
    CACHE.mkdir(parents=True, exist_ok=True)
    entry = {"url": url, "params": _public(params), "response": response}
    path.write_text(json.dumps(entry, ensure_ascii=False))
    return response


def _fetch(
    url: str, params: dict[str, str], headers: dict[str, str] | None, pause: float
) -> Json:
    time.sleep(pause)
    try:
        res = requests.get(url, params=params, headers=headers, timeout=30)
        retry = res.status_code in RETRY_STATUSES
    except (requests.Timeout, requests.ConnectionError):
        retry = True
    if retry:
        time.sleep(10)
        res = requests.get(url, params=params, headers=headers, timeout=60)
    if res.status_code == 404:
        return None
    res.raise_for_status()
    return res.json()
