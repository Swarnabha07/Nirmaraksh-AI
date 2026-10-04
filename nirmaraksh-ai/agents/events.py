"""
Tiny event bus so the UI (old HUD or the new web UI) can show what every
agent is doing live.

    from agents import events
    events.subscribe(lambda e: print(e))

Each event is a dict:
    {"ts": float, "agent": "research", "kind": "tool", "message": "...", "data": {...}}

kinds: start | thought | tool | result | final | error
"""
from __future__ import annotations

import threading
import time
from typing import Callable

_subscribers: list[Callable[[dict], None]] = []
_history: list[dict] = []
_lock = threading.Lock()
_MAX_HISTORY = 500


def subscribe(fn: Callable[[dict], None]) -> None:
    with _lock:
        if fn not in _subscribers:
            _subscribers.append(fn)


def unsubscribe(fn: Callable[[dict], None]) -> None:
    with _lock:
        if fn in _subscribers:
            _subscribers.remove(fn)


def history() -> list[dict]:
    with _lock:
        return list(_history)


def emit(agent: str, kind: str, message: str, player=None, **data) -> dict:
    event = {
        "ts": time.time(),
        "agent": agent,
        "kind": kind,
        "message": message,
        "data": data,
    }
    with _lock:
        _history.append(event)
        del _history[:-_MAX_HISTORY]
        subs = list(_subscribers)

    print(f"[{agent}:{kind}] {message[:200]}")

    # Mirror into the existing on-screen activity log, if a UI object is given.
    if player is not None and hasattr(player, "write_log"):
        try:
            player.write_log(f"[{agent}] {message[:160]}")
        except Exception:
            pass

    for fn in subs:
        try:
            fn(event)
        except Exception:
            pass
    return event