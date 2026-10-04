"""
Shared scratchpad that lets agents pass findings to each other.
Research saves facts -> Builder reads them before building.

Stored in  memory/agent_findings.json  (separate from long_term.json so it
never pollutes the user's personal memory).
"""
from __future__ import annotations

import json
import sys
import threading
import time
from pathlib import Path


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


PATH = _base_dir() / "memory" / "agent_findings.json"
_lock = threading.Lock()
_MAX_ENTRIES = 50
_MAX_VALUE = 2000


def _load() -> list[dict]:
    try:
        return json.loads(PATH.read_text(encoding="utf-8")).get("findings", [])
    except Exception:
        return []


def _save(findings: list[dict]) -> None:
    PATH.parent.mkdir(parents=True, exist_ok=True)
    PATH.write_text(json.dumps({"findings": findings}, indent=2, ensure_ascii=False), encoding="utf-8")


def save_finding(agent: str, key: str, value: str) -> str:
    key = (key or "").strip()[:80]
    value = (value or "").strip()[:_MAX_VALUE]
    if not key or not value:
        return "Nothing saved: both key and value are required."
    with _lock:
        findings = [f for f in _load() if not (f["agent"] == agent and f["key"] == key)]
        findings.append({"agent": agent, "key": key, "value": value, "ts": time.time()})
        _save(findings[-_MAX_ENTRIES:])
    return f"Saved finding '{key}'."


def get_findings(limit: int = 15) -> str:
    with _lock:
        findings = _load()[-limit:]
    if not findings:
        return "No findings saved yet."
    return "\n".join(f"- [{f['agent']}] {f['key']}: {f['value']}" for f in findings)


def clear() -> None:
    with _lock:
        _save([])