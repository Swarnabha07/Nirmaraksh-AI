"""One-off diagnostic: call Gemini directly and print the EXACT error, if any.

Run:
    python -m agents.diagnose_gemini
"""
import json
import sys
from pathlib import Path


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


cfg_path = _base_dir() / "config" / "api_keys.json"
key = json.loads(cfg_path.read_text(encoding="utf-8")).get("gemini_api_key")
if not key:
    print("No gemini_api_key found in config/api_keys.json")
    sys.exit(1)

from google import genai

client = genai.Client(api_key=key)

for model in ["gemini-3.8-flash", "gemini-3.1-flash-lite"]:
    print(f"\n--- Testing {model} ---")
    try:
        resp = client.models.generate_content(model=model, contents="Say OK")
        print("OK:", (resp.text or "").strip()[:80])
    except Exception as e:
        print("FAILED:", type(e).__name__, "-", e)