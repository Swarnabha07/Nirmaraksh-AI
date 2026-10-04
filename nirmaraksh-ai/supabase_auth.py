from __future__ import annotations

import hashlib
import base64
import json
import secrets
import sys
import threading
import time
import urllib.parse
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

import requests

# --------------------------------------------------------------------------
# config / paths
# --------------------------------------------------------------------------
def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent


API_KEYS_FILE = _base_dir() / "config" / "api_keys.json"
SESSION_FILE  = _base_dir() / "config" / "session.json"   # gitignored — holds only this device's refresh token

REDIRECT_PORT = 53682
REDIRECT_URI  = f"http://127.0.0.1:{REDIRECT_PORT}/callback"
REQUEST_TIMEOUT = 10


def _read_api_keys() -> dict:
    try:
        return json.loads(API_KEYS_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def _supabase_url() -> str:
    url = (_read_api_keys().get("supabase_url") or "").strip().rstrip("/")
    if not url:
        raise RuntimeError("supabase_url is not set in config/api_keys.json")
    return url


def _anon_key() -> str:
    key = (_read_api_keys().get("supabase_anon_key") or "").strip()
    if not key:
        raise RuntimeError("supabase_anon_key is not set in config/api_keys.json")
    return key


def _headers(access_token: str | None = None) -> dict:
    h = {"apikey": _anon_key(), "Content-Type": "application/json"}
    h["Authorization"] = f"Bearer {access_token or _anon_key()}"
    return h


# --------------------------------------------------------------------------
# session persistence (refresh token only — stay logged in across restarts)
# --------------------------------------------------------------------------
def save_session(session: dict) -> None:
    try:
        SESSION_FILE.parent.mkdir(parents=True, exist_ok=True)
        SESSION_FILE.write_text(json.dumps({
            "refresh_token": session.get("refresh_token", ""),
        }), encoding="utf-8")
    except Exception as e:
        print(f"[Auth] could not save session: {e}")


def load_saved_refresh_token() -> str | None:
    try:
        data = json.loads(SESSION_FILE.read_text(encoding="utf-8"))
        return data.get("refresh_token") or None
    except Exception:
        return None


def clear_session() -> None:
    try:
        if SESSION_FILE.exists():
            SESSION_FILE.unlink()
    except Exception as e:
        print(f"[Auth] could not clear session: {e}")


# --------------------------------------------------------------------------
# profile lookup
# --------------------------------------------------------------------------
def fetch_profile(user_id: str, access_token: str) -> dict | None:
    """profiles row for this user, or None if missing/unreachable."""
    try:
        r = requests.get(
            f"{_supabase_url()}/rest/v1/profiles",
            params={"id": f"eq.{user_id}", "select": "*"},
            headers=_headers(access_token),
            timeout=REQUEST_TIMEOUT,
        )
        if r.status_code == 200:
            rows = r.json()
            return rows[0] if rows else None
    except requests.RequestException as e:
        print(f"[Auth] profile lookup failed: {e}")
    return None


def display_name_for(user: dict, profile: dict | None) -> str:
    """profiles.display_name -> falls back to the part of the email before '@'."""
    if profile and profile.get("display_name"):
        return profile["display_name"]
    email = (user or {}).get("email") or ""
    return email.split("@")[0] if email else "User"


def mark_downloaded(user_id: str, access_token: str) -> None:
    """Best-effort: flips profiles.has_downloaded to true on first desktop login."""
    try:
        requests.patch(
            f"{_supabase_url()}/rest/v1/profiles",
            params={"id": f"eq.{user_id}"},
            headers=_headers(access_token),
            json={"has_downloaded": True},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException as e:
        print(f"[Auth] could not set has_downloaded: {e}")


# --------------------------------------------------------------------------
# email / password
# --------------------------------------------------------------------------
def sign_in_with_password(email: str, password: str):
    """-> (True, session_dict) | (False, error_message)."""
    try:
        r = requests.post(
            f"{_supabase_url()}/auth/v1/token",
            params={"grant_type": "password"},
            headers=_headers(),
            json={"email": email.strip(), "password": password},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        return False, "Can't reach the server. Check your internet connection."
    data = r.json() if r.content else {}
    if r.status_code == 200 and data.get("access_token"):
        return True, data
    msg = data.get("error_description") or data.get("msg") or data.get("error") or "Login failed."
    if "Invalid login credentials" in msg:
        msg = "Incorrect email or password."
    return False, msg


def refresh_with_token(refresh_token: str):
    """-> (True, session_dict) | (False, error_message). Used to restore a saved session."""
    try:
        r = requests.post(
            f"{_supabase_url()}/auth/v1/token",
            params={"grant_type": "refresh_token"},
            headers=_headers(),
            json={"refresh_token": refresh_token},
            timeout=REQUEST_TIMEOUT,
        )
    except requests.RequestException:
        return False, "Can't reach the server."
    data = r.json() if r.content else {}
    if r.status_code == 200 and data.get("access_token"):
        return True, data
    return False, data.get("error_description") or data.get("msg") or "Session expired."


def sign_out(access_token: str) -> None:
    try:
        requests.post(f"{_supabase_url()}/auth/v1/logout",
                      headers=_headers(access_token), timeout=REQUEST_TIMEOUT)
    except requests.RequestException:
        pass
    clear_session()

def _pkce_pair() -> tuple[str, str]:
    verifier = base64.urlsafe_b64encode(secrets.token_bytes(40)).rstrip(b"=").decode()
    challenge = base64.urlsafe_b64encode(
        hashlib.sha256(verifier.encode()).digest()
    ).rstrip(b"=").decode()
    return verifier, challenge


class _CallbackResult:
    code: str | None = None
    error: str | None = None


def _run_loopback_server(result: _CallbackResult, got_it: threading.Event):
    class Handler(BaseHTTPRequestHandler):
        def do_GET(self):
            qs = urllib.parse.urlparse(self.path).query
            params = urllib.parse.parse_qs(qs)
            if "code" in params:
                result.code = params["code"][0]
                body = ("<html><body style='font-family:sans-serif;background:#0a0a0f;"
                        "color:#e8e8ec;text-align:center;padding-top:80px'>"
                        "<h2>Signed in.</h2><p>You can close this tab and return to the app.</p>"
                        "</body></html>")
            else:
                result.error = params.get("error_description", params.get("error", ["Unknown error"]))[0]
                body = (f"<html><body style='font-family:sans-serif;background:#0a0a0f;"
                        f"color:#e8e8ec;text-align:center;padding-top:80px'>"
                        f"<h2>Sign-in failed.</h2><p>{result.error}</p></body></html>")
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(body.encode())
            got_it.set()

        def log_message(self, *a):   # silence default request logging
            pass

    httpd = HTTPServer(("127.0.0.1", REDIRECT_PORT), Handler)
    httpd.timeout = 120
    httpd.handle_request()          # serves exactly one request, then returns
    httpd.server_close()


def start_oauth_login(provider: str, on_done):
    """
    provider: "google" | "github"
    on_done(ok: bool, session_or_message): called from a background thread
    once the flow finishes (success, failure, or 2-minute timeout).
    """
    def worker():
        verifier, challenge = _pkce_pair()
        auth_url = (
            f"{_supabase_url()}/auth/v1/authorize?"
            + urllib.parse.urlencode({
                "provider": provider,
                "redirect_to": REDIRECT_URI,
                "code_challenge": challenge,
                "code_challenge_method": "s256",
            })
        )
        result = _CallbackResult()
        got_it = threading.Event()
        server_thread = threading.Thread(target=_run_loopback_server, args=(result, got_it), daemon=True)
        server_thread.start()
        time.sleep(0.2)             # let the server bind before we send the browser there
        webbrowser.open(auth_url)

        if not got_it.wait(timeout=120):
            on_done(False, "Timed out waiting for sign-in. Please try again.")
            return
        if result.error:
            on_done(False, result.error)
            return

        try:
            r = requests.post(
                f"{_supabase_url()}/auth/v1/token",
                params={"grant_type": "pkce"},
                headers=_headers(),
                json={"auth_code": result.code, "code_verifier": verifier},
                timeout=REQUEST_TIMEOUT,
            )
        except requests.RequestException:
            on_done(False, "Can't reach the server to finish sign-in.")
            return
        data = r.json() if r.content else {}
        if r.status_code == 200 and data.get("access_token"):
            on_done(True, data)
        else:
            print(f"[Auth] PKCE token exchange failed: HTTP {r.status_code} -> {r.text[:500]}")
            on_done(False, data.get("error_description") or data.get("msg") or "Sign-in failed.")

    threading.Thread(target=worker, daemon=True).start()