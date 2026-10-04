"""
Registry + the single `delegate` tool the MAIN agent uses.

Add a new sub-agent later by adding one line to AGENTS.
"""
from __future__ import annotations

from agents.base import BaseAgent
from agents.builder_agent import BuilderAgent
from agents.research_agent import ResearchAgent

AGENTS: dict[str, type[BaseAgent]] = {
    "research": ResearchAgent,
    "builder": BuilderAgent,
}


def delegate(parameters: dict, player=None, speak=None) -> str:
    """Entry point called by main.py when Gemini Live calls the `delegate` tool."""
    p = parameters or {}
    agent_name = str(p.get("agent", "")).lower().strip()
    task = str(p.get("task", "")).strip()
    context = str(p.get("context", "")).strip()

    if agent_name not in AGENTS:
        return f"Unknown agent '{agent_name}'. Available: {', '.join(AGENTS)}."
    if not task:
        return "Please give the sub-agent a task."

    result = AGENTS[agent_name]().run(task=task, context=context, player=player, speak=speak)
    prefix = "" if result.ok else "[FAILED] "
    return f"{prefix}{result.output}"


# Gemini Live tool declaration (same format as the others in main.py's TOOL list).
DELEGATE_TOOL_DECLARATION = {
    "name": "delegate",
    "description": (
        "Hand a complex job to a specialist sub-agent and get back its result. "
        "agent='research': web research, comparisons, fact-finding (saves findings to shared memory). "
        "agent='builder': builds a working project/app (uses research findings automatically). "
        "For 'research X then build Y', call research first, then builder."
    ),
    "parameters": {
        "type": "OBJECT",
        "properties": {
            "agent":   {"type": "STRING", "description": "research | builder"},
            "task":    {"type": "STRING", "description": "Clear, self-contained description of what the sub-agent must do"},
            "context": {"type": "STRING", "description": "Optional extra context from the conversation"},
        },
        "required": ["agent", "task"],
    },
}