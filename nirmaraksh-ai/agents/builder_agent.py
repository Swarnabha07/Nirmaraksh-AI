"""
Builder agent: turns a goal (plus any research findings) into a precise spec,
builds the project with your existing dev_agent (which already plans, writes
files, installs deps, runs and self-fixes), then verifies the result.

Default provider: Gemini (dev_agent itself uses Gemini too).
"""
from __future__ import annotations

from pathlib import Path

from agents import shared_memory
from agents.base import BaseAgent, RunContext, Tool

_MAX_FILE_CHARS = 5000


def _projects_dir() -> Path:
    from actions.dev_agent import PROJECTS_DIR

    return Path(PROJECTS_DIR)


class BuilderAgent(BaseAgent):
    name = "builder"
    description = "Builds, runs and verifies software projects, using research findings when available."
    default_provider = "openai"
    strict_provider = True  # OpenAI only, no silent fallback to Groq/Gemini
    max_steps = 6

    role_prompt = (
        "You are the BUILDER sub-agent of an AI assistant.\n"
        "Goal: deliver a working project for the task.\n"
        "Method: (1) call get_findings to see facts gathered by the Research agent and use them; "
        "(2) write ONE precise, self-contained project description (features, data to include, "
        "language, how it runs) and call build_project ONCE - it already writes files, installs "
        "dependencies, runs the code and fixes errors on its own; (3) optionally call "
        "read_project_file to verify the entry file looks right; (4) finish.\n"
        "Do not call build_project twice for the same goal unless the first result reports failure.\n"
        "Final answer: project name, where it lives, how to run it, and any known limitation - "
        "under ~120 words."
    )

    def build_tools(self) -> list[Tool]:
        return [
            Tool("get_findings", "Read facts saved by other agents (e.g. Research).",
                 "", self._get_findings),
            Tool("build_project", "Plan, write, install, run and auto-fix a complete project.",
                 'description: str, language: str = "python", project_name: str = ""', self._build_project),
            Tool("list_projects", "List recently built projects.", "", self._list_projects),
            Tool("read_project_file", "Read a file from a built project (to verify it).",
                 "project: str, path: str", self._read_project_file),
        ]

    def _get_findings(self, ctx: RunContext) -> str:
        return shared_memory.get_findings()

    def _build_project(self, ctx: RunContext, description: str, language: str = "python", project_name: str = "") -> str:
        from actions.dev_agent import dev_agent

        result = dev_agent(
            parameters={"description": description, "language": language, "project_name": project_name},
            player=ctx.player,
            speak=None,  # the main agent announces the final result itself
        )
        shared_memory.save_finding(self.name, "last_build", f"{project_name or 'project'}: {description[:300]}")
        return str(result)

    def _list_projects(self, ctx: RunContext) -> str:
        root = _projects_dir()
        if not root.exists():
            return "No projects yet."
        dirs = sorted((d for d in root.iterdir() if d.is_dir()), key=lambda d: d.stat().st_mtime, reverse=True)[:10]
        return "\n".join(f"- {d.name}" for d in dirs) or "No projects yet."

    def _read_project_file(self, ctx: RunContext, project: str, path: str) -> str:
        root = _projects_dir().resolve()
        target = (root / project / path).resolve()
        if root not in target.parents:  # blocks ../ escapes
            return "Access denied: path is outside the projects folder."
        if not target.is_file():
            return f"File not found: {project}/{path}"
        return target.read_text(encoding="utf-8", errors="replace")[:_MAX_FILE_CHARS]