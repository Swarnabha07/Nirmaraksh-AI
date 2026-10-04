"""
LLM access for the sub-agents.

Uses the SAME keys you already have in config/api_keys.json:
    "gemini_api_key"  -> Gemini (Builder agent default)
    "groq_api_key"    -> Groq   (Research agent default)

Optionally add:
    "openai_api_key"  -> OpenAI (used if you set a provider to "openai" below,
                          or automatically as a third fallback if present)

Optional overrides in config/api_keys.json:
    "research_provider": "groq" | "gemini" | "openai"
    "builder_provider":  "groq" | "gemini" | "openai"
    "groq_model":   "llama-3.3-70b-versatile"   (default; avoids the gpt-oss
                                                  "Harmony" tool-format bug,
                                                  see note below)
    "gemini_model": "gemini-3.8-flash"
    "openai_model": "gpt-4o-mini"

If the primary provider fails (missing key, rate limit, outage) the call
automatically falls back to the next available one, in the order:
primary provider -> the other two, skipping any with no API key configured.

NOTE on the default Groq model: "openai/gpt-oss-20b" is trained with a
built-in "Harmony" tool-calling format. Even with no tools declared, it can
still emit a native tool-call in its own protocol, which Groq's API then
rejects with "Tool choice is none, but model called a tool". Our own JSON
step-by-step protocol (see agents/base.py) doesn't need Groq's native tool
calling at all, so we default to "llama-3.3-70b-versatile" instead, which
doesn't have this quirk. You can still opt back into gpt-oss via
"groq_model" in config/api_keys.json if you prefer it.
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


CONFIG_PATH = _base_dir() / "config" / "api_keys.json"

DEFAULT_MODELS = {
    # NOTE: which models exist on Groq varies per account/region. If this
    # model 404s for you, run `python -m agents.list_groq_models` to see
    # what your key can actually use, then set "groq_model" in
    # config/api_keys.json to one of those names.
    "groq": "qwen/qwen3.8-27b",
    "gemini": "gemini-3.8-flash",
    "openai": "gpt-4o-mini",
    "claude": "claude-sonnet-4-6",
}


class LLMError(Exception):
    pass


def load_config() -> dict:
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def get_provider_for(agent_name: str, default: str) -> str:
    cfg = load_config()
    p = str(cfg.get(f"{agent_name}_provider", default)).lower()
    return p if p in DEFAULT_MODELS else default


def _model_for(provider: str) -> str:
    return load_config().get(f"{provider}_model") or DEFAULT_MODELS[provider]


def _call_groq(system: str, messages: list[dict]) -> str:
    key = load_config().get("groq_api_key")
    if not key:
        raise LLMError("groq_api_key missing in config/api_keys.json")
    from groq import Groq

    resp = Groq(api_key=key).chat.completions.create(
        model=_model_for("groq"),
        messages=[{"role": "system", "content": system}, *messages],
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""


def _call_gemini(system: str, messages: list[dict]) -> str:
    key = load_config().get("gemini_api_key")
    if not key:
        raise LLMError("gemini_api_key missing in config/api_keys.json")
    from google import genai
    from google.genai import types

    contents = [
        types.Content(
            role="user" if m["role"] == "user" else "model",
            parts=[types.Part(text=m["content"])],
        )
        for m in messages
    ]
    resp = genai.Client(api_key=key).models.generate_content(
        model=_model_for("gemini"),
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.2,
            # Works around a google-genai SDK bug where AFC's internal client
            # gets closed mid-request ("Cannot send a request, as the client
            # has been closed"). We don't use client-side function calling
            # here (tool calls are handled by our own JSON protocol), so AFC
            # is unnecessary and safe to disable.
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
        ),
    )
    return resp.text or ""


def _call_openai(system: str, messages: list[dict]) -> str:
    key = load_config().get("openai_api_key")
    if not key:
        raise LLMError("openai_api_key missing in config/api_keys.json")
    from openai import OpenAI

    resp = OpenAI(api_key=key).chat.completions.create(
        model=_model_for("openai"),
        messages=[{"role": "system", "content": system}, *messages],
        temperature=0.2,
    )
    return resp.choices[0].message.content or ""


def _call_claude(system: str, messages: list[dict]) -> str:
    key = load_config().get("anthropic_api_key")
    if not key:
        raise LLMError("anthropic_api_key missing in config/api_keys.json")
    import anthropic

    resp = anthropic.Anthropic(api_key=key).messages.create(
        model=_model_for("claude"),
        max_tokens=2000,
        temperature=0.2,
        system=system,
        messages=messages,
    )
    return "".join(b.text for b in resp.content if b.type == "text")


_CALLERS = {
    "groq": _call_groq,
    "gemini": _call_gemini,
    "openai": _call_openai,
    "claude": _call_claude,
}


def _is_rate_limit(err: Exception) -> bool:
    s = str(err).lower()
    return "429" in s or "rate limit" in s or "quota" in s or "resource_exhausted" in s


def _has_key(provider: str) -> bool:
    return bool(load_config().get(f"{provider}_api_key"))


def chat(provider: str, system: str, messages: list[dict], fallback: bool = True) -> str:
    """Send a chat to `provider`; fall back to other configured providers on failure."""
    others = [p for p in _CALLERS if p != provider and _has_key(p)]
    order = [provider] + (others if fallback else [])
    errors: list[str] = []

    for prov in order:
        for attempt in range(2):
            try:
                return _CALLERS[prov](system, messages)
            except Exception as e:  # noqa: BLE001
                if attempt == 0 and _is_rate_limit(e):
                    time.sleep(2.5)  # brief backoff, then one retry
                    continue
                errors.append(f"{prov}: {e}")
                break
    raise LLMError("All providers failed. " + " | ".join(errors))