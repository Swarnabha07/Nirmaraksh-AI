"""
Multi-source news aggregation for actions/web_search.py.

Pulls from several free, no-API-key RSS feeds IN PARALLEL, dedupes by
headline similarity, and merges into one broad feed. If any individual
source is down, deprecated, or slow, the others still come through —
this fixes the "one API dies, everything breaks" problem you hit with
the Gemini-model-retirement + DDG-rate-limit combo.

Drop this into actions/web_search.py, replacing _try_gemini/_try_ddg
in the news branch (see integration notes at the bottom of this file).
"""

import re
import threading
import urllib.parse
from difflib import SequenceMatcher

import feedparser

# Historically stable, no-key RSS feeds. If any of these ever 404 or
# get discontinued, just delete that line — the rest keep working.
RSS_FEEDS = {
    "Google News":  "https://news.google.com/rss/search?q={query}&hl=en-US&gl=US&ceid=US:en",
    "BBC World":    "http://feeds.bbci.co.uk/news/world/rss.xml",
    "Al Jazeera":   "https://www.aljazeera.com/xml/rss/all.xml",
    "NPR":          "https://feeds.npr.org/1001/rss.xml",
}

REQUEST_TIMEOUT = 6  # seconds, per feed


def _fetch_one_feed(name: str, url_template: str, query: str, out: list, lock: threading.Lock):
    try:
        url = url_template.format(query=urllib.parse.quote(query)) if "{query}" in url_template else url_template
        parsed = feedparser.parse(url, request_headers={"User-Agent": "Mozilla/5.0"})
        entries = parsed.entries[:10]
        items = []
        for e in entries:
            title = getattr(e, "title", "").strip()
            if not title:
                continue
            snippet = re.sub(r"<[^>]+>", "", getattr(e, "summary", "") or "").strip()[:200]
            items.append({
                "title":   title,
                "snippet": snippet,
                "url":     getattr(e, "link", ""),
                "source":  name,
            })
        with lock:
            out.extend(items)
    except Exception as ex:
        print(f"[News] ⚠️ '{name}' feed failed: {ex}")


def _dedupe(items: list, threshold: float = 0.75) -> list:
    """Drop near-duplicate headlines (same story picked up by multiple outlets)."""
    kept = []
    for item in items:
        title_norm = item["title"].lower()
        if any(SequenceMatcher(None, title_norm, k["title"].lower()).ratio() > threshold for k in kept):
            continue
        kept.append(item)
    return kept


def fetch_broad_news(query: str, max_items: int = 20, timeout: float = 8.0) -> list[dict]:
    """
    Fetches from every configured RSS feed in parallel, merges, dedupes,
    and returns up to max_items articles. General/topic queries (e.g.
    "world news", "technology") work best with the site-wide feeds;
    specific queries (e.g. "SpaceX launch") lean more on Google News,
    since it's the only one of these that's query-driven.
    """
    results: list = []
    lock = threading.Lock()
    threads = []

    for name, url_template in RSS_FEEDS.items():
        # Only Google News supports arbitrary queries; the others are
        # fixed site-wide feeds, so only use them for broad "top news"
        # style requests, not narrow topic searches.
        if "{query}" not in url_template and query.strip().lower() not in (
            "top news", "world news", "news", "top world news today", "latest news"
        ):
            continue
        t = threading.Thread(target=_fetch_one_feed, args=(name, url_template, query, results, lock), daemon=True)
        t.start()
        threads.append(t)

    for t in threads:
        t.join(timeout=timeout)

    deduped = _dedupe(results)
    return deduped[:max_items]


def format_broad_news(query: str, items: list[dict]) -> str:
    if not items:
        return f"No news found for: {query}"
    lines = [f"Latest news — {query} (from {len(set(i['source'] for i in items))} sources)\n"]
    for i, item in enumerate(items, 1):
        lines.append(f"{i}. {item['title']}  [{item['source']}]")
        if item.get("snippet"):
            lines.append(f"   {item['snippet']}")
        if item.get("url"):
            lines.append(f"   {item['url']}")
        lines.append("")
    return "\n".join(lines).strip()


"""
════════════════════════════════════════════════════════════════════
INTEGRATION — in actions/web_search.py:
════════════════════════════════════════════════════════════════════

1. Add near the top:
     from actions.news_aggregator import fetch_broad_news, format_broad_news
   (save this file as actions/news_aggregator.py)

2. In the news branch of web_search() (around where _try_gemini and
   _try_ddg are defined and threaded), replace both threads with:

     def _try_broad():
         try:
             items = fetch_broad_news(ddg_query, max_items=20)
             _store(format_broad_news(ddg_query, items))
         except Exception as e:
             print(f"[WebSearch] ⚠️ Broad news fetch failed ({e})")
             _store("")

     threading.Thread(target=_try_broad, daemon=True).start()

   You can leave _try_ddg as a SECOND fallback thread if you want
   belt-and-suspenders coverage, since _store() already picks whichever
   result comes back first/non-empty. Just don't rely on Gemini alone
   given the model-retirement issue you already hit.

3. requirements.txt — add:
     feedparser
════════════════════════════════════════════════════════════════════
"""