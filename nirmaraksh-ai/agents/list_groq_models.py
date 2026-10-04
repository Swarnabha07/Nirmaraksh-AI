"""One-off diagnostic: list the Groq models YOUR api key can actually access.

Run:
    python -m agents.list_groq_models
"""
import json
from pathlib import Path
import sys


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


cfg_path = _base_dir() / "config" / "api_keys.json"
key = json.loads(cfg_path.read_text(encoding="utf-8")).get("groq_api_key")
if not key:
    print("No groq_api_key found in config/api_keys.json")
    sys.exit(1)

from groq import Groq

models = Groq(api_key=key).models.list()
print("Models available to your Groq key:\n")
for m in models.data:
    print(" -", m.id)