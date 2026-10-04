"""
auth.py — Login gate for the desktop app, backed by Supabase.

Sign-up happens on the website. Any account created there (email/password,
Google, or GitHub) logs in here automatically, since both apps share one
Supabase project. This file has no local account storage and no offline
fallback — if Supabase is unreachable, login fails with a clear message
rather than silently falling back to a local account.

See supabase_auth.py for the API calls and the one-time Supabase dashboard
setup checklist.
"""
from __future__ import annotations

from PyQt6.QtCore import Qt, pyqtSignal, QRectF, QThread
from PyQt6.QtGui import QColor, QFont, QPainter, QPen
from PyQt6.QtWidgets import (
    QFrame,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

import supabase_auth as sb


# --------------------------------------------------------------------------
# UI
# --------------------------------------------------------------------------
class _BracketCard(QFrame):
    """Card with HUD-style corner brackets (used when hud=True)."""

    def __init__(self, color: str, parent=None):
        super().__init__(parent)
        self._color = color

    def paintEvent(self, ev):
        super().paintEvent(ev)
        p = QPainter(self)
        p.setPen(QPen(QColor(self._color), 2))
        w, h, L = self.width() - 1, self.height() - 1, 16
        for (x, y, dx, dy) in ((0, 0, 1, 1), (w, 0, -1, 1), (0, h, 1, -1), (w, h, -1, -1)):
            p.drawLine(x, y, x + dx * L, y)
            p.drawLine(x, y, x, y + dy * L)
        p.end()


class _OAuthWorker(QThread):
    """Runs the browser + local-callback OAuth flow off the UI thread."""
    finished_ok = pyqtSignal(dict)
    finished_err = pyqtSignal(str)

    def __init__(self, provider: str, parent=None):
        super().__init__(parent)
        self.provider = provider

    def run(self):
        import threading
        done = {}
        ev = threading.Event()

        def on_done(ok, info):
            done["ok"], done["info"] = ok, info
            ev.set()

        sb.start_oauth_login(self.provider, on_done)
        ev.wait(130)
        if not done:
            self.finished_err.emit("Timed out waiting for sign-in.")
        elif done["ok"]:
            self.finished_ok.emit(done["info"])
        else:
            self.finished_err.emit(str(done["info"]))


class AuthGate(QWidget):
    """Full-window login card. Emits `authenticated(display_name)` on success.

    After a successful login, `self.user` and `self.session` hold the
    Supabase user record and session (access/refresh tokens) for the rest
    of the app to use, e.g. to call other Supabase tables as this user.
    """

    authenticated = pyqtSignal(str)

    def __init__(self, palette: dict, app_name: str = "Zeno", parent=None, hud: bool = False):
        super().__init__(parent)
        self.P = palette
        self._hud = hud
        self._font = "Courier New" if hud else "Segoe UI"
        r_card, r_field = (3, 3) if hud else (16, 8)
        on_primary = self.P.get("on_primary", "#ffffff")
        self.user: dict | None = None
        self.session: dict | None = None
        self._oauth_thread: _OAuthWorker | None = None
        self.setStyleSheet(f"background: {self.P['bg']};")

        outer = QVBoxLayout(self)
        outer.addStretch()

        card = _BracketCard(self.P['primary']) if hud else QFrame()
        card.setFixedWidth(380)
        card.setStyleSheet(f"""
            QFrame {{
                background: {self.P['panel']};
                border: 1px solid {self.P['border']};
                border-radius: {r_card}px;
            }}
        """)
        card_lay = QVBoxLayout(card)
        card_lay.setContentsMargins(32, 32, 32, 28)
        card_lay.setSpacing(6)

        title = QLabel(app_name)
        title.setFont(QFont(self._font, 22, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {self.P['text']}; background: transparent; border: none;")
        title.setAlignment(Qt.AlignmentFlag.AlignCenter)
        card_lay.addWidget(title)

        self._subtitle = QLabel("Log in to continue")
        self._subtitle.setFont(QFont(self._font, 10))
        self._subtitle.setStyleSheet(f"color: {self.P['text_dim']}; background: transparent; border: none;")
        self._subtitle.setAlignment(Qt.AlignmentFlag.AlignCenter)
        card_lay.addWidget(self._subtitle)
        card_lay.addSpacing(18)

        # ── Google / GitHub ──────────────────────────────────────────────
        def _oauth_btn(label: str) -> QPushButton:
            b = QPushButton(label)
            b.setFixedHeight(40)
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.setStyleSheet(f"""
                QPushButton {{
                    background: {self.P['bg']};
                    color: {self.P['text']};
                    border: 1px solid {self.P['border']};
                    border-radius: {r_field}px;
                    font-size: 12px; font-family: '{self._font}'; font-weight: 600;
                }}
                QPushButton:hover {{ border-color: {self.P['primary']}; color: {self.P['primary']}; }}
                QPushButton:disabled {{ color: {self.P['text_dim']}; }}
            """)
            return b

        self._google_btn = _oauth_btn("Continue with Google")
        self._github_btn = _oauth_btn("Continue with GitHub")
        self._google_btn.clicked.connect(lambda: self._start_oauth("google"))
        self._github_btn.clicked.connect(lambda: self._start_oauth("github"))
        card_lay.addWidget(self._google_btn)
        card_lay.addSpacing(8)
        card_lay.addWidget(self._github_btn)
        card_lay.addSpacing(16)

        divider_row = QHBoxLayout()
        for _ in range(2):
            ln = QFrame(); ln.setFrameShape(QFrame.Shape.HLine)
            ln.setStyleSheet(f"color: {self.P['border']};")
            divider_row.addWidget(ln, 1)
        or_lbl = QLabel("or")
        or_lbl.setStyleSheet(f"color: {self.P['text_dim']}; background: transparent; border: none; font-size: 10px;")
        divider_row.insertWidget(1, or_lbl)
        card_lay.addLayout(divider_row)
        card_lay.addSpacing(14)

        # ── email / password ────────────────────────────────────────────
        def _field(placeholder: str, password: bool = False) -> QLineEdit:
            f = QLineEdit()
            f.setPlaceholderText(placeholder)
            f.setFixedHeight(40)
            if password:
                f.setEchoMode(QLineEdit.EchoMode.Password)
            f.setStyleSheet(f"""
                QLineEdit {{
                    background: {self.P['bg']};
                    color: {self.P['text']};
                    border: 1px solid {self.P['border']};
                    border-radius: {r_field}px;
                    padding: 0 12px;
                    font-size: 13px; font-family: '{self._font}';
                }}
                QLineEdit:focus {{ border-color: {self.P['primary']}; }}
            """)
            return f

        self._email_field = _field("Email")
        self._pass_field = _field("Password", password=True)
        card_lay.addWidget(self._email_field)
        card_lay.addWidget(self._pass_field)

        self._error_lbl = QLabel("")
        self._error_lbl.setWordWrap(True)
        self._error_lbl.setStyleSheet(f"color: {self.P['danger']}; background: transparent; border: none; font-size: 11px;")
        card_lay.addWidget(self._error_lbl)

        card_lay.addSpacing(8)
        self._submit_btn = QPushButton("Log In")
        self._submit_btn.setFixedHeight(42)
        self._submit_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._submit_btn.setStyleSheet(f"""
            QPushButton {{
                background: {self.P['primary']};
                color: {on_primary};
                border: none;
                border-radius: {r_field}px;
                font-size: 13px;
                font-weight: 600;
            }}
            QPushButton:hover {{ background: {self.P['primary_hover']}; }}
            QPushButton:disabled {{ background: {self.P['border']}; color: {self.P['text_dim']}; }}
        """)
        self._submit_btn.clicked.connect(self._submit_password)
        card_lay.addWidget(self._submit_btn)

        card_lay.addSpacing(14)
        note = QLabel("Don't have an account?  Sign up on the website.")
        note.setStyleSheet(f"color: {self.P['text_dim']}; background: transparent; border: none; font-size: 10px;")
        note.setAlignment(Qt.AlignmentFlag.AlignCenter)
        card_lay.addWidget(note)

        center_row = QHBoxLayout()
        center_row.addStretch()
        center_row.addWidget(card)
        center_row.addStretch()
        outer.addLayout(center_row)
        outer.addStretch()

        self._pass_field.returnPressed.connect(self._submit_password)

        # NOTE: restoring a saved session is NOT started here. It fires the
        # `authenticated` signal, and the caller (ui.py) only connects to
        # that signal *after* this constructor returns — so emitting from
        # inside __init__ would fire into the void. Call
        # try_restore_session() explicitly once the caller has connected.

    # ── shared post-login handling ──────────────────────────────────────
    def _buttons_enabled(self, enabled: bool):
        for b in (self._submit_btn, self._google_btn, self._github_btn):
            b.setEnabled(enabled)

    def _on_session(self, session: dict, *, is_new_login: bool):
        """Common path for password / OAuth / restored-session success."""
        self.session = session
        self.user = session.get("user") or {}
        sb.save_session(session)

        access_token = session.get("access_token", "")
        user_id = self.user.get("id", "")
        profile = sb.fetch_profile(user_id, access_token) if user_id else None
        name = sb.display_name_for(self.user, profile)

        if is_new_login and profile is not None and not profile.get("has_downloaded"):
            sb.mark_downloaded(user_id, access_token)

        self._error_lbl.setText("")
        self._buttons_enabled(True)
        self.authenticated.emit(name)

    def try_restore_session(self):
        """Call once after connecting `authenticated` — attempts to log back
        in using a refresh token saved on this device, if one exists."""
        token = sb.load_saved_refresh_token()
        if not token:
            return
        ok, result = sb.refresh_with_token(token)
        if ok:
            self._on_session(result, is_new_login=False)
        else:
            sb.clear_session()   # saved session is stale/expired -> fall through to the login form

    # ── email / password ────────────────────────────────────────────────
    def _submit_password(self):
        email = self._email_field.text().strip()
        password = self._pass_field.text()
        if not email or not password:
            self._error_lbl.setText("Enter your email and password.")
            return
        self._error_lbl.setText("Signing in…")
        self._buttons_enabled(False)
        self._submit_btn.setText("Signing in…")

        ok, result = sb.sign_in_with_password(email, password)

        self._submit_btn.setText("Log In")
        if not ok:
            self._buttons_enabled(True)
            self._error_lbl.setText(str(result))
            return
        self._on_session(result, is_new_login=True)

    # ── Google / GitHub ──────────────────────────────────────────────────
    def _start_oauth(self, provider: str):
        self._error_lbl.setText(f"Opening your browser to continue with {provider.title()}…")
        self._buttons_enabled(False)
        self._oauth_thread = _OAuthWorker(provider, self)
        self._oauth_thread.finished_ok.connect(lambda session: self._on_session(session, is_new_login=True))
        self._oauth_thread.finished_err.connect(self._on_oauth_error)
        self._oauth_thread.start()

    def _on_oauth_error(self, message: str):
        self._buttons_enabled(True)
        self._error_lbl.setText(message)