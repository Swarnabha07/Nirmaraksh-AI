"""
BaseAgent: a small, dependency-free tool-using agent loop (ReAct style).

The model must reply with ONE JSON object per step:
    {"thought": "...", "tool": "tool_name", "args": {...}}      -> run a tool
    {"thought": "...", "final": "answer for the main agent"}     -> finish

Works the same on Groq and Gemini because it doesn't rely on native
function-calling.
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field
from typing import Callable

from agents import events
from agents.llm import LLMError, chat

OBSERVATION_LIMIT = 4000


@dataclass
class Tool:
    name: str
    description: str
    args_help: str
    fn: Callable  # fn(ctx, **args) -> str


@dataclass
class RunContext:
    agent: str
    player: object = None
    speak: Callable | None = None


@dataclass
class AgentResult:
    agent: str
    ok: bool
    output: str
    steps: int = 0
    elapsed: float = 0.0
    trace: list[str] = field(default_factory=list)

    def __str__(self) -> str:
        return self.output


def _extract_json(text: str) -> dict | None:
    text = (text or "").strip()
    text = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", text).strip()
    try:
        data = json.loads(text)
        return data if isinstance(data, dict) else None
    except Exception:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end > start:
        try:
            data = json.loads(text[start:end + 1])
            return data if isinstance(data, dict) else None
        except Exception:
            return None
    return None


def _clip(text: str, limit: int = OBSERVATION_LIMIT) -> str:
    text = str(text)
    return text if len(text) <= limit else text[:limit] + f"\n...[truncated {len(text) - limit} chars]"


class BaseAgent:
    name: str = "agent"
    description: str = ""
    default_provider: str = "gemini"
    strict_provider: bool = False  # True = never fall back to another provider
    max_steps: int = 8
    role_prompt: str = ""

    def __init__(self, provider: str | None = None):
        from agents.llm import get_provider_for

        self.provider = provider or get_provider_for(self.name, self.default_provider)
        self._tools: dict[str, Tool] = {t.name: t for t in self.build_tools()}

    # ---- to override -------------------------------------------------
    def build_tools(self) -> list[Tool]:
        return []

    # ---- internals ---------------------------------------------------
    def _system_prompt(self) -> str:
        tool_lines = "\n".join(
            f"- {t.name}({t.args_help}): {t.description}" for t in self._tools.values()
        )
        return (
            f"{self.role_prompt}\n\n"
            f"TOOLS:\n{tool_lines}\n\n"
            "PROTOCOL: reply with exactly ONE JSON object and nothing else.\n"
            'To use a tool: {"thought": "why", "tool": "tool_name", "args": {"arg": "value"}}\n'
            'To finish:     {"thought": "why", "final": "your complete answer"}\n'
            f"You have at most {self.max_steps} steps. Do not repeat a tool call with identical arguments. "
            "Be efficient: finish as soon as you have a good answer."
        )

    def run(self, task: str, context: str = "", player=None, speak=None) -> AgentResult:
        ctx = RunContext(agent=self.name, player=player, speak=speak)
        started = time.time()
        emit = lambda kind, msg, **d: events.emit(self.name, kind, msg, player=player, **d)  # noqa: E731

        emit("start", f"Task: {task}", provider=self.provider)

        first = f"TASK: {task}"
        if context:
            first += f"\n\nCONTEXT FROM MAIN AGENT:\n{context}"
        messages: list[dict] = [{"role": "user", "content": first}]
        system = self._system_prompt()
        trace: list[str] = []
        bad_replies = 0

        for step in range(1, self.max_steps + 1):
            try:
                raw = chat(self.provider, system, messages, fallback=not self.strict_provider)
            except LLMError as e:
                emit("error", str(e))
                return AgentResult(self.name, False, f"{self.name} agent failed: {e}", step, time.time() - started, trace)

            data = _extract_json(raw)
            if data is None:
                bad_replies += 1
                if bad_replies >= 3:
                    emit("error", "Model kept returning invalid JSON.")
                    return AgentResult(self.name, False, raw.strip() or "No usable answer.", step, time.time() - started, trace)
                messages += [
                    {"role": "assistant", "content": raw},
                    {"role": "user", "content": "Invalid reply. Respond with a single JSON object exactly as in the PROTOCOL."},
                ]
                continue

            if data.get("thought"):
                emit("thought", str(data["thought"]))

            if "final" in data:
                answer = str(data["final"]).strip()
                emit("final", answer[:300])
                return AgentResult(self.name, True, answer, step, time.time() - started, trace)

            tool_name = data.get("tool")
            args = data.get("args") or {}
            tool = self._tools.get(tool_name)

            if tool is None or not isinstance(args, dict):
                observation = f"Unknown tool or bad args. Available tools: {', '.join(self._tools)}"
            else:
                emit("tool", f"{tool.name}({json.dumps(args, ensure_ascii=False)[:150]})", tool=tool.name, args=args)
                try:
                    observation = tool.fn(ctx, **args)
                except TypeError as e:
                    observation = f"Bad arguments for {tool.name}: {e}. Expected: {tool.args_help}"
                except Exception as e:  # noqa: BLE001
                    observation = f"Tool {tool.name} failed: {e}"
                emit("result", _clip(observation, 200), tool=tool.name)

            trace.append(f"{tool_name}: {_clip(observation, 120)}")
            messages += [
                {"role": "assistant", "content": raw},
                {"role": "user", "content": f"OBSERVATION from {tool_name}:\n{_clip(observation)}"},
            ]

        # Out of steps: force a wrap-up from whatever has been gathered.
        messages.append({
            "role": "user",
            "content": 'Step limit reached. Reply now with {"final": "..."} summarising what you have.',
        })
        try:
            data = _extract_json(chat(self.provider, system, messages, fallback=not self.strict_provider)) or {}
            answer = str(data.get("final") or "I ran out of steps before finishing.")
        except LLMError as e:
            answer = f"Ran out of steps and the final summary failed: {e}"
        emit("final", answer[:300])
        return AgentResult(self.name, True, answer, self.max_steps, time.time() - started, trace)