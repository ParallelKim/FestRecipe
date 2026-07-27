#!/usr/bin/env python3
"""
YouTube Data API v3 client helpers.

Requires YT_API_KEY in the environment.
Used by the MVP releases pipeline (search.list / videos.list / channels.list).
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


YT_API_BASE = "https://www.googleapis.com/youtube/v3"
MUSIC_CATEGORY_ID = "10"


class YouTubeApiError(RuntimeError):
    pass


def get_api_key() -> str:
    key = os.environ.get("YT_API_KEY", "").strip()
    if not key:
        raise YouTubeApiError(
            "YT_API_KEY 환경변수가 없습니다. "
            "Google Cloud Console에서 YouTube Data API v3 키를 발급해 export 하세요."
        )
    return key


def _request(path: str, params: dict[str, Any]) -> dict[str, Any]:
    params = {k: v for k, v in params.items() if v is not None and v != ""}
    params["key"] = get_api_key()
    url = f"{YT_API_BASE}/{path}?{urllib.parse.urlencode(params)}"
    req = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise YouTubeApiError(f"YouTube API {path} failed ({e.code}): {body[:400]}") from e
    except urllib.error.URLError as e:
        raise YouTubeApiError(f"YouTube API {path} network error: {e}") from e


def search(
    *,
    q: str = "",
    type_: str = "video",
    max_results: int = 25,
    page_token: str = "",
    channel_id: str = "",
    video_category_id: str = "",
    order: str = "relevance",
    region_code: str = "KR",
    relevance_language: str = "ko",
) -> dict[str, Any]:
    """search.list wrapper."""
    params: dict[str, Any] = {
        "part": "snippet",
        "type": type_,
        "maxResults": min(max(max_results, 1), 50),
        "order": order,
        "regionCode": region_code,
        "relevanceLanguage": relevance_language,
    }
    if q:
        params["q"] = q
    if page_token:
        params["pageToken"] = page_token
    if channel_id:
        params["channelId"] = channel_id
    if video_category_id and type_ == "video":
        params["videoCategoryId"] = video_category_id
    return _request("search", params)


def search_all(
    *,
    q: str = "",
    type_: str = "video",
    max_total: int = 50,
    channel_id: str = "",
    video_category_id: str = "",
    order: str = "relevance",
) -> list[dict[str, Any]]:
    """Paginated search.list until max_total items."""
    items: list[dict[str, Any]] = []
    page_token = ""
    while len(items) < max_total:
        batch_size = min(50, max_total - len(items))
        data = search(
            q=q,
            type_=type_,
            max_results=batch_size,
            page_token=page_token,
            channel_id=channel_id,
            video_category_id=video_category_id,
            order=order,
        )
        items.extend(data.get("items") or [])
        page_token = data.get("nextPageToken") or ""
        if not page_token:
            break
    return items[:max_total]


def videos_list(video_ids: list[str]) -> dict[str, dict[str, Any]]:
    """videos.list in batches of 50. Returns {videoId: item}."""
    results: dict[str, dict[str, Any]] = {}
    unique = [v for v in dict.fromkeys(video_ids) if v]
    for i in range(0, len(unique), 50):
        batch = unique[i : i + 50]
        data = _request(
            "videos",
            {
                "part": "snippet,contentDetails,statistics",
                "id": ",".join(batch),
            },
        )
        for item in data.get("items") or []:
            results[item["id"]] = item
    return results


def channels_list(channel_ids: list[str]) -> dict[str, dict[str, Any]]:
    results: dict[str, dict[str, Any]] = {}
    unique = [c for c in dict.fromkeys(channel_ids) if c]
    for i in range(0, len(unique), 50):
        batch = unique[i : i + 50]
        data = _request(
            "channels",
            {
                "part": "snippet,statistics",
                "id": ",".join(batch),
            },
        )
        for item in data.get("items") or []:
            results[item["id"]] = item
    return results
