"""
actions/self_coder.py
================================================================
Lets JARVIS modify its OWN codebase on request:
    "JARVIS, add a feature that does X" / "update your codebase to do Y"

SAFETY MODEL (read before changing any of this)
------------------------------------------------
- PREVIEW BY DEFAULT. Nothing is written to disk unless confirm=True.
  The LLM should call this once to preview, tell the user what will
  change, then only pass confirm=True after the user explicitly agrees.
- BACKUP ON WRITE. Every file touched is copied to
  memory/self_edits/backups/<timestamp>/<relative_path> before it's
  overwritten. self_code_undo() restores the most recent backup set.
- SYNTAX-CHECKED BEFORE COMMIT. Every .py file the model wants to write
  is parsed with ast.parse first. If ANY file in the batch fails to
  parse, NOTHING is written — all-or-nothing, no partially-applied edits.
- SANDBOXED TO THE PROJECT ROOT. Resolved paths are checked against
  BASE_DIR; anything that would land outside it is rejected outright.
- PROTECTED FILES. This module and the tool-registration block in
  main.py are excluded from self-editing — a bad edit there could
  disable the very mechanism you'd use to fix it.
- A restart is required to load changed code — this process cannot
  safely hot-swap its own already-imported modules (especially true
  for main.py itself).
"""

from __future__ import annotations

import ast
import json
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path


def get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent.parent


BASE_DIR        = get_base_dir()
API_CONFIG_PATH = BASE_DIR / "config" / "api_keys.json"
BACKUPS_DIR     = BASE_DIR / "memory" / "self_edits" / "backups"
CHANGELOG_PATH  = BASE_DIR / "memory" / "self_edits" / "changelog.txt"
MODEL_CODER     = "gemini-flash-latest"

# Never allow edits to these — self_coder.py can't disable its own
# safety rails, and main.py's tool registration can't be silently
# broken (that would strand every other action, not just this one).
PROTECTED_PATHS = {
    "actions/self_coder.py",
}
PROTECTED_MAIN_MARKERS = (
    "TOOL_DECLARATIONS = [",
    "def _execute_tool",
)

MAX_FILES_PER_EDIT = 6
MAX_FILE_BYTES     = 200_000  # refuse to touch anything absurdly large


def _get_api_key() -> str:
    with open(API_CONFIG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)["gemini_api_key"]


def _get_model(model_name: str):
    from google import genai
    client = genai.Client(api_key=_get_api_key())

    class _W:
        def generate_content(self, contents):
            return client.models.generate_content(model=model_name, contents=contents)

    return _W()


def _strip_fences(text: str) -> str:
    text = text.strip()
    text = re.sub(r"^```[a-zA-Z]*\r?\n?", "", text)
    text = re.sub(r"\r?\n?```\s*$", "", text)
    return text.strip()


def _resolve_safe(rel_path: str) -> Path | None:
    """Resolve a path and refuse anything that escapes BASE_DIR."""
    try:
        candidate = (BASE_DIR / rel_path).resolve()
        candidate.relative_to(BASE_DIR.resolve())
    except (ValueError, OSError):
        return None
    return candidate


def _is_protected(rel_path: str, new_content: str) -> str | None:
    norm = rel_path.replace("\\", "/").lstrip("/")
    if norm in PROTECTED_PATHS:
        return f"'{rel_path}' is protected and cannot be self-edited."
    if norm == "main.py":
        for marker in PROTECTED_MAIN_MARKERS:
            if marker not in new_content:
                return (
                    "Refusing to write main.py: the generated version is missing "
                    f"'{marker}', which would strand every registered tool. "
                    "Edit main.py manually for changes this large."
                )
    return None


def _existing_files_index() -> list[str]:
    """Relative paths of every .py file in the project, for the model's context."""
    out = []
    for p in BASE_DIR.rglob("*.py"):
        if any(part in ("__pycache__", ".git", "venv", ".venv") for part in p.parts):
            continue
        out.append(str(p.relative_to(BASE_DIR)).replace("\\", "/"))
    return sorted(out)


def _read_files(rel_paths: list[str]) -> dict[str, str]:
    contents = {}
    for rp in rel_paths:
        safe = _resolve_safe(rp)
        if not safe or not safe.exists():
            contents[rp] = ""
            continue
        try:
            contents[rp] = safe.read_text(encoding="utf-8")
        except Exception as e:
            contents[rp] = f"<<could not read: {e}>>"
    return contents


def _generate_change(instruction: str, target_files: list[str]) -> dict:
    """
    Ask the model for the FULL updated content of every touched file,
    as strict JSON. Full-file rewrites (not diffs) — diffs are too easy
    for a model to get subtly wrong in ways that silently corrupt a file.
    """
    existing = _read_files(target_files) if target_files else {}
    file_index = _existing_files_index()

    context_blocks = "\n\n".join(
        f"--- FILE: {path} ---\n{content}"
        for path, content in existing.items()
    ) or "(no existing files provided — this may be a new file)"

    prompt = f"""You are modifying the source code of a Python voice-assistant project called Mark-L.

PROJECT FILE INDEX (for context, do not invent files not listed unless creating something genuinely new):
{chr(10).join(file_index)}

USER REQUEST:
{instruction}

FILES TO MODIFY OR CREATE (use these paths, relative to project root):
{', '.join(target_files) if target_files else '(decide the most appropriate file path yourself, following existing project conventions)'}

CURRENT CONTENTS OF TARGET FILES:
{context_blocks}

Respond with ONLY valid JSON, no markdown fences, no commentary outside the JSON, in this exact shape:
{{
  "summary": "one sentence describing what changed",
  "files": {{
    "relative/path.py": "COMPLETE new file content, not a diff/snippet"
  }}
}}

Rules:
- Return the FULL content of each changed file, not just the changed lines.
- Preserve existing functionality you were not asked to change.
- Keep the project's existing code style and imports.
- Do not touch files you were not asked to modify.
- At most {MAX_FILES_PER_EDIT} files total.
"""
    model = _get_model(MODEL_CODER)
    resp = model.generate_content(prompt)
    raw = _strip_fences(getattr(resp, "text", "") or "")
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        return {"error": f"Model did not return valid JSON: {e}", "raw": raw[:1500]}
    if "files" not in data or not isinstance(data["files"], dict):
        return {"error": "Model response missing a 'files' object.", "raw": raw[:1500]}
    return data


def _validate_batch(files: dict[str, str]) -> list[str]:
    """Returns a list of problems. Empty list = all clear to write."""
    problems = []
    if len(files) > MAX_FILES_PER_EDIT:
        problems.append(f"Too many files in one edit ({len(files)} > {MAX_FILES_PER_EDIT}).")

    for rel_path, content in files.items():
        if len(content.encode("utf-8", errors="ignore")) > MAX_FILE_BYTES:
            problems.append(f"'{rel_path}' is unexpectedly large — refusing as a precaution.")
            continue
        safe = _resolve_safe(rel_path)
        if safe is None:
            problems.append(f"'{rel_path}' resolves outside the project directory — rejected.")
            continue
        prot = _is_protected(rel_path, content)
        if prot:
            problems.append(prot)
            continue
        if rel_path.endswith(".py"):
            try:
                ast.parse(content, filename=rel_path)
            except SyntaxError as e:
                problems.append(f"'{rel_path}' has a syntax error and will NOT be written: {e}")
    return problems


def _backup_and_write(files: dict[str, str], instruction: str) -> Path:
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_dir = BACKUPS_DIR / ts
    backup_dir.mkdir(parents=True, exist_ok=True)

    for rel_path, new_content in files.items():
        safe = _resolve_safe(rel_path)
        if safe.exists():
            backup_target = backup_dir / rel_path
            backup_target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(safe, backup_target)
        safe.parent.mkdir(parents=True, exist_ok=True)
        safe.write_text(new_content, encoding="utf-8")

    CHANGELOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(CHANGELOG_PATH, "a", encoding="utf-8") as f:
        f.write(
            f"{datetime.now().isoformat(timespec='seconds')} | backup={ts} | "
            f"files={list(files)} | instruction={instruction!r}\n"
        )
    return backup_dir


def self_code_undo(_parameters: dict = None, player=None, speak=None) -> str:
    """Restores the most recent backup set, reversing the last self-edit."""
    if not BACKUPS_DIR.exists():
        return "No self-edit backups exist yet — nothing to undo."
    sets = sorted((d for d in BACKUPS_DIR.iterdir() if d.is_dir()), reverse=True)
    if not sets:
        return "No self-edit backups exist yet — nothing to undo."
    latest = sets[0]
    restored = []
    for backed_up_file in latest.rglob("*"):
        if backed_up_file.is_file():
            rel = backed_up_file.relative_to(latest)
            target = BASE_DIR / rel
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(backed_up_file, target)
            restored.append(str(rel))
    return (
        f"Reverted {len(restored)} file(s) from backup {latest.name}: {', '.join(restored)}. "
        f"Restart JARVIS to run the reverted code."
    )


def self_code(parameters: dict, player=None, speak=None) -> str:
    """
    parameters:
      instruction   (str)  - what to add/change, in plain language
      target_files  (list) - optional relative paths this should touch;
                              if omitted, the model picks based on the
                              instruction and the project file index
      confirm       (bool) - MUST be True to actually write to disk.
                              False/omitted = preview only, no changes made.
    """
    instruction = (parameters.get("instruction") or "").strip()
    target_files = parameters.get("target_files") or []
    if isinstance(target_files, str):
        target_files = [target_files]
    confirm = bool(parameters.get("confirm", False))

    if not instruction:
        return "I need a description of what to build or change first."

    if speak:
        speak("Let me draft that change." if not confirm else "Applying that change now.")

    result = _generate_change(instruction, target_files)
    if "error" in result:
        return f"Couldn't generate a valid change: {result['error']}"

    files = result["files"]
    summary = result.get("summary", "(no summary provided)")
    problems = _validate_batch(files)

    if problems:
        return (
            "I drafted a change but it failed validation, so nothing was written:\n"
            + "\n".join(f"  - {p}" for p in problems)
        )

    file_list = ", ".join(files)
    line_counts = ", ".join(f"{p} ({len(c.splitlines())} lines)" for p, c in files.items())

    if not confirm:
        return (
            f"PREVIEW (nothing written yet) — {summary}\n"
            f"Files that would change: {file_list}\n"
            f"({line_counts})\n"
            f"Say 'confirm' / 'apply it' to actually write these changes."
        )

    backup_dir = _backup_and_write(files, instruction)
    return (
        f"Done — {summary}\n"
        f"Changed: {file_list}\n"
        f"Backup saved to {backup_dir} (say 'undo that change' to revert).\n"
        f"Restart me to load the new code."
    )


__all__ = ["self_code", "self_code_undo"]