"""
Research agent: searches the web, reads pages, cross-checks, saves findings
to shared memory, and returns a concise sourced summary.

Default provider: Groq (fast, cheap for many small reasoning steps).
"""
from __future__ import annotations

from agents import shared_memory
from agents.base import BaseAgent, RunContext, Tool

_MAX_PAGE_CHARS = 6000


class ResearchAgent(BaseAgent):
    name = "research"
    description = "Finds, reads and cross-checks information on the web and saves key findings."
    default_provider = "openai"
    strict_provider = True  # OpenAI only, no silent fallback to Groq/Gemini
    max_steps = 8

    role_prompt = (
        "You are the RESEARCH sub-agent of an AI assistant.\n"
        "Goal: answer the task with accurate, current, well-sourced information.\n"
        "Method: run 2-5 focused searches (different angles), open a page with read_page only when a "
        "snippet is not enough, cross-check claims, then save the 2-6 most important facts with "
        "save_finding so other agents can use them. "
        "Never invent facts or URLs. If sources disagree or you are unsure, say so.\n"
        "Final answer format: a tight summary (under ~250 words), key facts as short lines, and a "
        "'Sources:' line with URLs you actually saw."
    )

    def build_tools(self) -> list[Tool]:
        return [
            Tool("web_search", "Search the web. mode: search | news | research | price.",
                 'query: str, mode: str = "search"', self._web_search),
            Tool("read_page", "Fetch and read the text of a web page (http/https only).",
                 "url: str", self._read_page),
            Tool("save_finding", "Save an important fact to shared memory for other agents.",
                 "key: str, value: str", self._save_finding),
            Tool("get_findings", "Show findings already saved by any agent.",
                 "", self._get_findings),
        ]

    def _web_search(self, ctx: RunContext, query: str, mode: str = "search") -> str:
        from actions.web_search import web_search

        mode = mode if mode in ("search", "news", "research", "price") else "search"
        return web_search(parameters={"query": query, "mode": mode}, player=ctx.player)

    def _read_page(self, ctx: RunContext, url: str) -> str:
        if not str(url).lower().startswith(("http://", "https://")):
            return "Only http/https URLs are allowed."
        import requests
        from bs4 import BeautifulSoup

        r = requests.get(url, timeout=12, headers={"User-Agent": "Mozilla/5.0 (compatible; ResearchAgent/1.0)"})
        r.raise_for_status()
        soup = BeautifulSoup(r.text, "html.parser")
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "noscript"]):
            tag.decompose()
        text = " ".join(soup.get_text(" ", strip=True).split())
        return text[:_MAX_PAGE_CHARS] or "Page had no readable text."

    def _save_finding(self, ctx: RunContext, key: str, value: str) -> str:
        return shared_memory.save_finding(self.name, key, value)

    def _get_findings(self, ctx: RunContext) -> str:
        return shared_memory.get_findings()