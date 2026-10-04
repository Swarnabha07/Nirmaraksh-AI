"""
Test the sub-agents from a terminal without the voice/UI:

    python -m agents research "compare the top 3 open-source LLM frameworks"
    python -m agents builder  "a small CLI todo app"
"""
import sys

from agents.registry import AGENTS, delegate

if len(sys.argv) < 3 or sys.argv[1] not in AGENTS:
    print(f"usage: python -m agents <{'|'.join(AGENTS)}> \"task\"")
    sys.exit(1)

print("\n=== RESULT ===\n" + delegate({"agent": sys.argv[1], "task": " ".join(sys.argv[2:])}))