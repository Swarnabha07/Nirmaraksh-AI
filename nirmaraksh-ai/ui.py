from __future__ import annotations

import json
import math
import os
import platform
import random
import subprocess
import sys
import threading
import time
from pathlib import Path
from collections import deque as _deque

import psutil

if platform.system() == "Windows":
    _WIN_HIDE: dict = {"creationflags": subprocess.CREATE_NO_WINDOW}
else:
    _WIN_HIDE: dict = {}

from auth import AuthGate

# ── brand ────────────────────────────────────────────────────────────────────
APP_NAME     = "NIRMARAKSH"            # nirmā (build) + rakṣ (protect)
APP_TAGLINE  = "Build  ·  Protect"
APP_TEAM     = "NEURAL FORGE"
_LEGACY_NAMES = {"Nirmaraksh"}


def _norm_name(n) -> str:
    """Saved configs from the old build still say Nirmaraksh -> show the new name."""
    n = (n or "").strip()
    return APP_NAME if (not n or n.upper() in _LEGACY_NAMES) else n
from PyQt6.QtCore import (
    QEasingCurve, QMimeData, QObject, QPointF, QRectF, QSize, Qt,
    QTimer, QUrl, pyqtSignal,
)
from PyQt6.QtGui import (
    QBrush, QColor, QConicalGradient, QDragEnterEvent, QDropEvent, QFont,
    QFontDatabase, QKeySequence, QLinearGradient, QPainter, QPainterPath,
    QPen, QPixmap, QRadialGradient, QShortcut,
)
from datetime import datetime
from PyQt6.QtWidgets import (
    QDialog, QListWidget, QListWidgetItem, QMenu, QStyle, QStyledItemDelegate,
    QApplication, QFileDialog, QFrame, QHBoxLayout, QLabel, QLineEdit,
    QMainWindow, QPushButton, QScrollArea, QSizePolicy, QSplitter,
    QStackedWidget, QTextEdit, QVBoxLayout, QWidget, QProgressBar,
)

def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).resolve().parent

BASE_DIR   = _base_dir()
CONFIG_DIR = BASE_DIR / "config"
API_FILE   = CONFIG_DIR / "api_keys.json"


def _read_full_config() -> dict:
    """Read api_keys.json config dict. Returns {} on any error."""
    try:
        return json.loads(API_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


_DEFAULT_W, _DEFAULT_H = 980, 700
_MIN_W,     _MIN_H     = 820, 580
_LEFT_W  = 220
_RIGHT_W = 300

_OS = platform.system()  # "Windows" | "Darwin" | "Linux"


class C:
    BG        = "#00060a"
    PANEL     = "#010d14"
    PANEL2    = "#010f18"
    BORDER    = "#0d3347"
    BORDER_B  = "#1a5c7a"
    BORDER_A  = "#0f4060"
    PRI       = "#00d4ff"
    PRI_DIM   = "#007a99"
    PRI_GHO   = "#001f2e"
    ACC       = "#ff6b00"
    ACC2      = "#ffcc00"
    GREEN     = "#00ff88"
    GREEN_D   = "#00aa55"
    RED       = "#ff3355"
    MUTED_C   = "#ff3366"
    TEXT      = "#8ffcff"
    TEXT_DIM  = "#3a8a9a"
    TEXT_MED  = "#5ab8cc"
    WHITE     = "#d8f8ff"
    DARK      = "#000d14"
    BAR_BG    = "#011520"


# Ana renge (accent) bağlı anahtarlar — durum renkleri (ACC, GREEN, RED…) sabit kalır
_HUE_LINKED = (
    "BG", "PANEL", "PANEL2", "BORDER", "BORDER_B", "BORDER_A",
    "PRI", "PRI_DIM", "PRI_GHO", "TEXT", "TEXT_DIM", "TEXT_MED",
    "WHITE", "DARK", "BAR_BG",
)
_PALETTE_DEFAULTS: dict[str, str] = {k: getattr(C, k) for k in _HUE_LINKED}

DEFAULT_UI_COLOR = _PALETTE_DEFAULTS["PRI"]


def apply_ui_accent(accent_hex: str) -> bool:
    """
    Seçilen accent rengine göre tüm turkuaz-ailesi paleti yeniden türetir
    (hue kaydırma — parlaklık/doygunluk oranları korunur, tasarım bozulmaz).
    Boyanan öğeler (HUD, dalga formu, metrikler) bir sonraki karede yeni
    rengi alır; stylesheet tabanlı paneller yeniden kurulduklarında alır.
    """
    import colorsys

    accent_hex = (accent_hex or "").strip().lower()
    if not (accent_hex.startswith("#") and len(accent_hex) == 7):
        return False
    try:
        int(accent_hex[1:], 16)
    except ValueError:
        return False

    def _hsv(h: str) -> tuple[float, float, float]:
        r = int(h[1:3], 16) / 255
        g = int(h[3:5], 16) / 255
        b = int(h[5:7], 16) / 255
        return colorsys.rgb_to_hsv(r, g, b)

    base_h            = _hsv(_PALETTE_DEFAULTS["PRI"])[0]
    acc_h, acc_s, _av = _hsv(accent_hex)
    dh   = acc_h - base_h
    grey = acc_s < 0.08   # griye yakın accent → tüm tema desaturize edilir

    for key, hex0 in _PALETTE_DEFAULTS.items():
        h, s, v = _hsv(hex0)
        if grey:
            s *= 0.15
        r, g, b = colorsys.hsv_to_rgb((h + dh) % 1.0, s, v)
        setattr(C, key, "#{:02x}{:02x}{:02x}".format(
            int(r * 255 + 0.5), int(g * 255 + 0.5), int(b * 255 + 0.5)))
    return True


def current_palette() -> dict[str, str]:
    """C sınıfındaki accent'e bağlı renklerin anlık kopyası."""
    return {k: getattr(C, k) for k in _HUE_LINKED}


def retheme_all_widgets(old: dict[str, str], new: dict[str, str]) -> None:
    """
    CANLI tam tema değişimi. Uygulamadaki HER widget'ın stylesheet'inde eski
    palet renklerini yenileriyle değiştirir ve yeniden çizdirir. Böylece renk
    değişimi yalnızca boyanan öğelerde değil, panel/buton/kenarlık dahil tüm
    arayüzde ANINDA uygulanır — yeniden başlatma gerekmez.
    """
    mapping = {old[k].lower(): new[k].lower()
               for k in old if old[k].lower() != new.get(k, old[k]).lower()}
    if not mapping:
        return
    app = QApplication.instance()
    if app is None:
        return
    for w in app.allWidgets():
        try:
            ss = w.styleSheet()
            if ss:
                s2 = ss
                for o, n in mapping.items():
                    if o in s2:
                        s2 = s2.replace(o, n)
                if s2 != ss:
                    w.setStyleSheet(s2)
            w.update()
        except Exception:
            pass


def qcol(h: str, a: int = 255) -> QColor:
    c = QColor(h); c.setAlpha(a); return c


# ── Windows GPU via NVML DLL (no subprocess, no console window) ──────────────
_nvml_lib: object = None   # cached ctypes DLL
_nvml_ok:  object = None   # None=untested, True=works, False=unavailable


def _nvml_gpu_windows() -> float:
    """Return NVIDIA GPU utilisation % using nvml.dll directly — zero subprocess."""
    global _nvml_lib, _nvml_ok
    if _nvml_ok is False:
        return -1.0
    try:
        import ctypes

        class _Util(ctypes.Structure):
            _fields_ = [("gpu", ctypes.c_uint), ("memory", ctypes.c_uint)]

        if _nvml_lib is None:
            for dll_name in ("nvml", r"C:\Windows\System32\nvml.dll"):
                try:
                    lib = ctypes.WinDLL(dll_name)
                    lib.nvmlInit_v2()
                    _nvml_lib = lib
                    break
                except Exception:
                    continue

        if _nvml_lib is None:
            import pynvml  # type: ignore
            pynvml.nvmlInit()
            h = pynvml.nvmlDeviceGetHandleByIndex(0)
            _nvml_ok = True
            return float(pynvml.nvmlDeviceGetUtilizationRates(h).gpu)

        dev = ctypes.c_void_p()
        _nvml_lib.nvmlDeviceGetHandleByIndex_v2(0, ctypes.byref(dev))
        util = _Util()
        _nvml_lib.nvmlDeviceGetUtilizationRates(dev, ctypes.byref(util))
        _nvml_ok = True
        return float(util.gpu)
    except Exception:
        _nvml_ok = False
        return -1.0


class _SysMetrics:
    def __init__(self):
        self.cpu  = 0.0
        self.mem  = 0.0
        self.net  = 0.0   
        self.gpu  = -1.0  
        self.tmp  = -1.0  
        self._lock = threading.Lock()
        self._last_net = psutil.net_io_counters()
        self._last_net_t = time.time()
        self._running = True
        t = threading.Thread(target=self._loop, daemon=True)
        t.start()

    def _loop(self):
        while self._running:
            try:
                self._update()
            except Exception:
                pass
            time.sleep(1.5)

    def _update(self):
        cpu = psutil.cpu_percent(interval=None)
        mem = psutil.virtual_memory().percent

        nc  = psutil.net_io_counters()
        now = time.time()
        dt  = now - self._last_net_t
        if dt > 0:
            sent = (nc.bytes_sent - self._last_net.bytes_sent) / dt
            recv = (nc.bytes_recv - self._last_net.bytes_recv) / dt
            net  = (sent + recv) / (1024 * 1024)
        else:
            net = 0.0
        self._last_net   = nc
        self._last_net_t = now

        gpu = self._get_gpu()

        tmp = self._get_temp()

        with self._lock:
            self.cpu = cpu
            self.mem = mem
            self.net = net
            self.gpu = gpu
            self.tmp = tmp

    def _get_gpu(self) -> float:
        # pynvml — subprocess-free, works on all platforms if installed
        try:
            import pynvml  # type: ignore
            pynvml.nvmlInit()
            h = pynvml.nvmlDeviceGetHandleByIndex(0)
            return float(pynvml.nvmlDeviceGetUtilizationRates(h).gpu)
        except Exception:
            pass

        # Windows: nvml.dll via ctypes (already cached in _nvml_gpu_windows)
        if _OS == "Windows":
            return _nvml_gpu_windows()

        # Linux / macOS: libnvidia-ml shared lib via ctypes
        try:
            import ctypes
            _lib = "libnvidia-ml.so.1" if _OS == "Linux" else "libnvidia-ml.dylib"

            class _Util(ctypes.Structure):
                _fields_ = [("gpu", ctypes.c_uint), ("memory", ctypes.c_uint)]

            nv = ctypes.CDLL(_lib)
            nv.nvmlInit_v2()
            dev = ctypes.c_void_p()
            nv.nvmlDeviceGetHandleByIndex_v2(0, ctypes.byref(dev))
            u = _Util()
            nv.nvmlDeviceGetUtilizationRates(dev, ctypes.byref(u))
            return float(u.gpu)
        except Exception:
            pass

        return -1.0   # N/A — zero subprocess on all platforms

    def _get_temp(self) -> float:
        # psutil — works on Linux; occasionally Windows with driver support
        try:
            temps = psutil.sensors_temperatures()
            for name in ["coretemp", "k10temp", "cpu_thermal", "acpitz",
                         "cpu-thermal", "zenpower", "it8688"]:
                if name in temps and temps[name]:
                    return temps[name][0].current
            for entries in temps.values():
                if entries:
                    return entries[0].current
        except Exception:
            pass

        # Windows: wmi module (pure Python COM, zero subprocess)
        if _OS == "Windows":
            try:
                import wmi  # type: ignore
                w = wmi.WMI(namespace="root/wmi")
                tz = w.MSAcpi_ThermalZoneTemperature()
                if tz:
                    return (tz[0].CurrentTemperature / 10.0) - 273.15
            except Exception:
                pass

        return -1.0   # N/A — zero subprocess on all platforms

    def snapshot(self) -> dict:
        with self._lock:
            return {
                "cpu": self.cpu,
                "mem": self.mem,
                "net": self.net,
                "gpu": self.gpu,
                "tmp": self.tmp,
            }


_metrics = _SysMetrics()

class HudCanvas(QWidget):
    def __init__(self, face_path: str, assistant_name: str = APP_NAME, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_OpaquePaintEvent)
        self.setMinimumSize(300, 300)
        self.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)

        self.muted    = False
        self.speaking = False
        self.state    = "INITIALISING"
        self._assistant_name = assistant_name

        self._tick       = 0
        self._scale      = 1.0
        self._tgt_scale  = 1.0
        self._halo       = 55.0
        self._tgt_halo   = 55.0
        self._last_t     = time.time()
        self._scan       = 0.0
        self._scan2      = 180.0
        self._rings      = [0.0, 120.0, 240.0]
        self._pulses: list[float] = [0.0, 50.0, 100.0]
        self._blink      = True
        self._blink_tick = 0
        self._particles: list[list[float]] = []
        self._face_px: QPixmap | None = None
        self._load_face(face_path)

        # character stage (optional): assets/character.png replaces the orb
        self._char_px: QPixmap | None = None      # full-size RGBA pixmap
        self._char_pil = None                      # PIL RGBA (for the glow)
        self._char_bbox = (0, 0, 1, 1)
        self._char_mode = "cutout"                 # "cutout" (transparent figure) | "portrait" (art with own backdrop)
        self._char_cache: dict = {}                # (w, h) -> scaled pixmap
        self._glow_cache: dict = {}                # (w, h, colour) -> glow pixmap
        self._load_character()

        self._tmr = QTimer(self)
        self._tmr.timeout.connect(self._step)
        self._tmr.start(16)

    def _load_face(self, path: str):
        try:
            from PIL import Image, ImageDraw
            import io
            img = Image.open(path).convert("RGBA")
            sz  = min(img.size)
            img = img.resize((sz, sz), Image.LANCZOS)
            mk  = Image.new("L", (sz, sz), 0)
            ImageDraw.Draw(mk).ellipse((2, 2, sz - 2, sz - 2), fill=255)
            img.putalpha(mk)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
            px = QPixmap(); px.loadFromData(buf.getvalue())
            self._face_px = px
        except Exception:
            self._face_px = None


    # ── character stage ────────────────────────────────────────────────────
    @staticmethod
    def _find_character() -> "Path | None":
        """Look for assets/character.* next to ui.py, the exe, or the working dir.
        Tolerates Windows' hidden double extensions (character.png.png) and any case."""
        dirs = []
        for d in (_base_dir() / "assets", Path(__file__).resolve().parent / "assets",
                  Path.cwd() / "assets"):
            if d not in dirs:
                dirs.append(d)
        exts = (".png", ".webp", ".jpg", ".jpeg")
        for d in dirs:
            if not d.is_dir():
                continue
            for f in sorted(d.iterdir()):
                n = f.name.lower()
                if n.startswith("character") and n.endswith(exts):
                    return f
        print("[HUD] No character image found. Looked for assets/character.png in:")
        for d in dirs:
            print(f"        {d}  ({'exists' if d.is_dir() else 'folder missing'})")
        return None

    def _load_character(self):
        """Load assets/character.*. A flat-background image (jpg, or png without
        transparency) is cut out automatically. Any failure -> keep the orb."""
        try:
            from PIL import Image, ImageDraw, ImageFilter
            import io
            import numpy as np
            path = self._find_character()
            if path is None:
                return
            img = Image.open(path)
            has_alpha = img.mode in ("RGBA", "LA") and img.getchannel("A").getextrema()[0] < 250
            self._char_mode = "cutout"
            rgb0 = img.convert("RGB")
            ea = np.array(rgb0).astype("float32")
            edge = np.concatenate([ea[0], ea[-1], ea[:, 0], ea[:, -1]])
            edge_lum = float((0.299 * edge[:, 0] + 0.587 * edge[:, 1] + 0.114 * edge[:, 2]).mean())
            if has_alpha:
                img = img.convert("RGBA")
            elif edge_lum < 70:
                # Dark illustrated backdrop (can't be keyed cleanly, and blends into the
                # HUD anyway): keep the art whole and feather its outer edges instead.
                self._char_mode = "portrait"
                w, h = rgb0.size
                xs = np.linspace(0.0, 1.0, w, dtype="float32")
                ys = np.linspace(0.0, 1.0, h, dtype="float32")

                def _ss(t, e0, e1):
                    t = np.clip((t - e0) / (e1 - e0), 0.0, 1.0)
                    return t * t * (3 - 2 * t)
                fx = _ss(xs, 0.0, 0.17) * _ss(1.0 - xs, 0.0, 0.17)
                fy = _ss(ys, 0.0, 0.06)
                alpha_np = (fx[None, :] * fy[:, None] * 255).astype("uint8")
                img = rgb0.convert("RGBA")
                img.putalpha(Image.fromarray(alpha_np, "L"))
            else:                                             # auto cut-out from corner colour
                rgb = rgb0
                w, h = rgb.size
                bgc = rgb.getpixel((3, 3))
                tmp = rgb.copy(); MAG = (255, 0, 255)
                seeds = ([(x, 2) for x in range(0, w, 50)] + [(2, y) for y in range(0, h, 50)] +
                         [(w - 3, y) for y in range(0, h, 50)] + [(x, h - 3) for x in range(0, w, 40)])
                for sd in seeds:
                    px = tmp.getpixel(sd)
                    if sum(abs(px[i] - bgc[i]) for i in range(3)) < 60:
                        ImageDraw.floodfill(tmp, sd, MAG, thresh=34)
                arr = np.array(tmp)
                bgm = (arr[..., 0] == 255) & (arr[..., 1] == 0) & (arr[..., 2] == 255)
                a = Image.fromarray(np.where(bgm, 0, 255).astype("uint8"), "L")
                a = a.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.1))
                img = rgb.convert("RGBA"); img.putalpha(a)
            bb = (0, 0, img.width, img.height) if self._char_mode == "portrait" else \
                 img.getchannel("A").point(lambda v: 255 if v > 24 else 0).getbbox()
            if not bb:
                return
            self._char_bbox = bb
            self._char_pil = img
            buf = io.BytesIO(); img.save(buf, format="PNG")
            px = QPixmap(); px.loadFromData(buf.getvalue())
            self._char_px = px if not px.isNull() else None
            if self._char_px is not None:
                print(f"[HUD] Character loaded ({self._char_mode}): {path}")
        except Exception as e:
            print(f"[HUD] character image not used ({e}); falling back to orb")
            self._char_px = None

    def _char_layout(self, W: int, H: int):
        """scale + top-left offset so head-to-chest fills the stage."""
        x0, y0, x1, y1 = self._char_bbox
        bw, bh = x1 - x0, y1 - y0
        if self._char_mode == "portrait":
            sc = (H / bh) * 1.12                      # slightly oversize: halo + face + collar
            return sc, W / 2 - bw * sc / 2, -0.02 * H
        visible = min(bh, bw * 0.92)
        s = (H - 18) / visible
        s = min(s, (W * 0.92) / bw)
        ox = W / 2 - (x0 + bw / 2) * s
        oy = 10 - y0 * s
        return s, ox, oy

    def _char_scaled(self, s: float) -> QPixmap:
        key = (int(self._char_px.width() * s), int(self._char_px.height() * s))
        if key not in self._char_cache:
            if len(self._char_cache) > 4:
                self._char_cache.clear()
            self._char_cache[key] = self._char_px.scaled(
                key[0], key[1], Qt.AspectRatioMode.IgnoreAspectRatio,
                Qt.TransformationMode.SmoothTransformation)
        return self._char_cache[key]

    def _glow_for(self, s: float, colour: str) -> QPixmap | None:
        """Blurred, tinted silhouette drawn behind the character (cached)."""
        try:
            from PIL import Image, ImageFilter
            import io
            cw, ch = int(self._char_pil.width * s), int(self._char_pil.height * s)
            key = (cw, ch, colour)
            if key in self._glow_cache:
                return self._glow_cache[key]
            if len(self._glow_cache) > 3:
                self._glow_cache.clear()
            pad = 40
            a = self._char_pil.getchannel("A").resize((cw, ch), Image.BILINEAR)
            canvas = Image.new("L", (cw + pad * 2, ch + pad * 2), 0)
            canvas.paste(a, (pad, pad))
            canvas = canvas.filter(ImageFilter.GaussianBlur(max(6, 16 * s)))
            r, g, b = (int(colour[i:i + 2], 16) for i in (1, 3, 5))
            layer = Image.new("RGBA", canvas.size, (r, g, b, 0)); layer.putalpha(canvas)
            buf = io.BytesIO(); layer.save(buf, format="PNG")
            px = QPixmap(); px.loadFromData(buf.getvalue())
            self._glow_cache[key] = px
            return px
        except Exception:
            return None

    # focus = centre of the halo in the supplied artwork (fractions of the image)
    _PORTRAIT_FOCUS = (0.507, 0.35)
    _PORTRAIT_HALO_R = 0.233                              # halo radius / image width

    def _paint_portrait(self, p: QPainter, W: int, H: int, s: float, ox: float, oy: float, accent: str):
        halo = max(0.0, min(255.0, self._halo))
        iw, ih = self._char_px.width(), self._char_px.height()
        fx = ox + self._PORTRAIT_FOCUS[0] * iw * s
        fy = oy + self._PORTRAIT_FOCUS[1] * ih * s + 2.5 * math.sin(self._tick * 0.035)
        halo_r = self._PORTRAIT_HALO_R * iw * s
        k = 1.0 + 0.004 * math.sin(self._tick * 0.035) + (self._scale - 1.0) * 0.06

        # soft backdrop glow so the feathered art melts into the HUD
        rg = QRadialGradient(fx, fy, H * 0.95)
        c0 = qcol(accent)
        rg.setColorAt(0.0, QColor(int(c0.red() * .35), int(c0.green() * .35), int(c0.blue() * .35), 70))
        rg.setColorAt(1.0, QColor(0, 0, 0, 0))
        p.fillRect(self.rect(), QBrush(rg))

        # the artwork, breathing gently about the halo centre
        p.save()
        p.translate(fx, fy); p.scale(k, k); p.translate(-fx, -fy)
        p.drawPixmap(int(ox), int(oy + 2.5 * math.sin(self._tick * 0.035)), self._char_scaled(s))
        p.restore()

        # pulse rings leave the halo while speaking
        for pr in self._pulses:
            a = max(0, int(120 * (1.0 - pr / (min(W, H) * 0.74))))
            r = halo_r * 0.92 + pr * 0.55
            p.setPen(QPen(qcol(accent, a), 1.4)); p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QRectF(fx - r, fy - r, r * 2, r * 2))

        # speaking bloom (tinted by the theme colour, so the hue wheel still matters)
        bloom = max(0.0, (halo - 55.0) / 200.0)
        if bloom > 0.01:
            bg = QRadialGradient(fx, fy, halo_r * 1.25)
            bg.setColorAt(0.0, qcol(accent, int(70 * bloom)))
            bg.setColorAt(0.75, qcol(accent, int(40 * bloom)))
            bg.setColorAt(1.0, qcol(accent, 0))
            p.fillRect(self.rect(), QBrush(bg))

        if self.muted:
            p.fillRect(self.rect(), qcol(C.BG, 120))
            p.fillRect(self.rect(), qcol(C.MUTED_C, 22))

        fade = QLinearGradient(0, H * 0.76, 0, H)
        fade.setColorAt(0.0, qcol(C.BG, 0)); fade.setColorAt(1.0, qcol(C.BG, 230))
        p.fillRect(QRectF(0, H * 0.76, W, H * 0.24), QBrush(fade))

        bl = 24; p.setPen(QPen(qcol(C.PRI, 210), 2))
        for bx, by, dx, dy in [(4, 4, 1, 1), (W - 5, 4, -1, 1), (4, H - 5, 1, -1), (W - 5, H - 5, -1, -1)]:
            p.drawLine(QPointF(bx, by), QPointF(bx + dx * bl, by))
            p.drawLine(QPointF(bx, by), QPointF(bx, by + dy * bl))

    def _paint_character(self, p: QPainter, W: int, H: int):
        p.setRenderHint(QPainter.RenderHint.SmoothPixmapTransform)
        accent = C.MUTED_C if self.muted else C.PRI
        s, ox, oy = self._char_layout(W, H)
        if self._char_mode == "portrait":
            self._paint_portrait(p, W, H, s, ox, oy, accent)
            return
        oy += 3.0 * math.sin(self._tick * 0.035)                  # slow breathing float
        k = 1.0 + (self._scale - 1.0) * 0.10                      # tiny speaking pulse
        halo = max(0.0, min(255.0, self._halo))

        # spotlight
        lx, ly = W / 2, H * 0.42
        rg = QRadialGradient(lx, ly, H * 0.95)
        base = qcol(accent)
        a0 = int(40 + halo * 0.75)
        rg.setColorAt(0.0, QColor(int(base.red() * .55), int(base.green() * .55), int(base.blue() * .55), a0))
        rg.setColorAt(1.0, QColor(0, 0, 0, 0))
        p.fillRect(self.rect(), QBrush(rg))

        # pulse rings (from the spotlight)
        for pr in self._pulses:
            a = max(0, int(110 * (1.0 - pr / (min(W, H) * 0.74))))
            p.setPen(QPen(qcol(accent, a), 1.2)); p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QRectF(lx - pr, ly - pr, pr * 2, pr * 2))

        p.save()
        p.translate(W / 2, H * 0.30); p.scale(k, k); p.translate(-W / 2, -H * 0.30)
        glow = self._glow_for(s, accent)
        if glow is not None:
            p.setOpacity(min(1.0, 0.30 + halo / 230.0))
            p.drawPixmap(int(ox - 40), int(oy - 40), glow)
            p.setOpacity(1.0)
        p.drawPixmap(int(ox), int(oy), self._char_scaled(s))
        p.restore()

        if self.muted:                                             # dim when muted
            p.fillRect(self.rect(), qcol(C.BG, 110))

        # fade into the chat below
        fade = QLinearGradient(0, H * 0.74, 0, H)
        fade.setColorAt(0.0, qcol(C.BG, 0)); fade.setColorAt(1.0, qcol(C.BG, 225))
        p.fillRect(QRectF(0, H * 0.74, W, H * 0.26), QBrush(fade))

        # HUD corner brackets
        bl = 24; p.setPen(QPen(qcol(C.PRI, 210), 2))
        for bx, by, dx, dy in [(4, 4, 1, 1), (W - 5, 4, -1, 1), (4, H - 5, 1, -1), (W - 5, H - 5, -1, -1)]:
            p.drawLine(QPointF(bx, by), QPointF(bx + dx * bl, by))
            p.drawLine(QPointF(bx, by), QPointF(bx, by + dy * bl))

    def _step(self):
        self._tick += 1
        now = time.time()
        if now - self._last_t > (0.12 if self.speaking else 0.5):
            if self.speaking:
                self._tgt_scale = random.uniform(1.06, 1.14)
                self._tgt_halo  = random.uniform(145, 190)
            elif self.muted:
                self._tgt_scale = random.uniform(0.998, 1.002)
                self._tgt_halo  = random.uniform(15, 28)
            else:
                self._tgt_scale = random.uniform(1.001, 1.008)
                self._tgt_halo  = random.uniform(48, 68)
            self._last_t = now

        sp = 0.38 if self.speaking else 0.15
        self._scale += (self._tgt_scale - self._scale) * sp
        self._halo  += (self._tgt_halo  - self._halo)  * sp

        speeds = [1.3, -0.9, 2.0] if self.speaking else [0.55, -0.35, 0.9]
        for i, spd in enumerate(speeds):
            self._rings[i] = (self._rings[i] + spd) % 360

        self._scan  = (self._scan  + (3.0 if self.speaking else 1.3)) % 360
        self._scan2 = (self._scan2 + (-2.0 if self.speaking else -0.75)) % 360

        fw  = min(self.width(), self.height())
        lim = fw * 0.74
        spd = 4.2 if self.speaking else 2.0
        self._pulses = [r + spd for r in self._pulses if r + spd < lim]
        if len(self._pulses) < 3 and random.random() < (0.07 if self.speaking else 0.025):
            self._pulses.append(0.0)

        if self.speaking and self._char_px is None and random.random() < 0.28:
            cx, cy = self.width() / 2, self.height() / 2
            ang = random.uniform(0, 2 * math.pi)
            r_s = fw * 0.28
            self._particles.append([
                cx + math.cos(ang) * r_s, cy + math.sin(ang) * r_s,
                math.cos(ang) * random.uniform(0.9, 2.4),
                math.sin(ang) * random.uniform(0.9, 2.4) - 0.4, 1.0,
            ])
        self._particles = [
            [p[0]+p[2], p[1]+p[3], p[2]*0.97, p[3]*0.97, p[4]-0.028]
            for p in self._particles if p[4] > 0
        ]

        self._blink_tick += 1
        if self._blink_tick >= 38:
            self._blink = not self._blink
            self._blink_tick = 0
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        p.fillRect(self.rect(), qcol(C.BG))

        W, H = self.width(), self.height()
        cx, cy = W / 2, H / 2
        fw = min(W, H)

        # grid dots
        p.setPen(QPen(qcol(C.PRI_GHO), 1))
        for x in range(0, W, 48):
            for y in range(0, H, 48):
                p.drawPoint(x, y)

        if self._char_px is not None:
            self._paint_character(p, W, H)
        else:
            self._paint_orb_layer(p, W, H, cx, cy, fw)

        # particles
        for pt in self._particles:
            a = max(0, min(255, int(pt[4] * 255)))
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(QBrush(qcol(C.PRI, a)))
            p.drawEllipse(QPointF(pt[0], pt[1]), 2.5, 2.5)

        # status text
        sy = cy + fw * 0.40
        if self.muted:
            txt, col = "⊘  MUTED",     qcol(C.MUTED_C)
        elif self.speaking:
            txt, col = "●  SPEAKING",  qcol(C.ACC)
        elif self.state == "THINKING":
            sym = "◈" if self._blink else "◇"
            txt, col = f"{sym}  THINKING",   qcol(C.ACC2)
        elif self.state == "PROCESSING":
            sym = "▷" if self._blink else "▶"
            txt, col = f"{sym}  PROCESSING", qcol(C.ACC2)
        elif self.state == "LISTENING":
            sym = "●" if self._blink else "○"
            txt, col = f"{sym}  LISTENING",  qcol(C.GREEN)
        else:
            sym = "●" if self._blink else "○"
            txt, col = f"{sym}  {self.state}", qcol(C.PRI)

        p.setPen(QPen(col, 1))
        p.setFont(QFont("Courier New", 13, QFont.Weight.Bold))
        p.drawText(QRectF(0, sy, W, 26), Qt.AlignmentFlag.AlignCenter, txt)

        # waveform
        wy = sy + 30
        N, bw = 36, 8
        wx0 = (W - N * bw) / 2
        for i in range(N):
            if self.muted:
                hgt, cl = 2, qcol(C.MUTED_C)
            elif self.speaking:
                hgt = random.randint(3, 20)
                cl  = qcol(C.PRI) if hgt > 12 else qcol(C.PRI_DIM)
            else:
                hgt = int(3 + 2 * math.sin(self._tick * 0.09 + i * 0.6))
                cl  = qcol(C.BORDER_B)
            p.fillRect(QRectF(wx0 + i * bw, wy + 20 - hgt, bw - 1, hgt), cl)

    def _paint_orb_layer(self, p, W, H, cx, cy, fw):
        r_face = fw * 0.31

        # halo glow
        for i in range(10):
            r   = r_face * (1.8 - i * 0.08)
            frc = 1.0 - i / 10
            a   = max(0, min(255, int(self._halo * 0.085 * frc)))
            col = qcol(C.MUTED_C if self.muted else C.PRI, a)
            p.setPen(QPen(col, 1.5)); p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QRectF(cx - r, cy - r, r * 2, r * 2))

        # pulse rings
        for pr in self._pulses:
            a   = max(0, int(230 * (1.0 - pr / (fw * 0.74))))
            col = qcol(C.MUTED_C if self.muted else C.PRI, a)
            p.setPen(QPen(col, 1.5)); p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawEllipse(QRectF(cx - pr, cy - pr, pr * 2, pr * 2))

        # spinning arc rings
        for idx, (r_frac, w_r, arc_l, gap) in enumerate(
            [(0.48, 3, 115, 78), (0.40, 2, 78, 55), (0.32, 1, 56, 40)]
        ):
            ring_r = fw * r_frac
            base   = self._rings[idx]
            a_val  = max(0, min(255, int(self._halo * (1.0 - idx * 0.18))))
            col    = qcol(C.MUTED_C if self.muted else C.PRI, a_val)
            p.setPen(QPen(col, w_r)); p.setBrush(Qt.BrushStyle.NoBrush)
            angle = base
            rect  = QRectF(cx - ring_r, cy - ring_r, ring_r * 2, ring_r * 2)
            while angle < base + 360:
                p.drawArc(rect, int(angle * 16), int(arc_l * 16))
                angle += arc_l + gap

        # scanners
        sr = fw * 0.50
        sa = min(255, int(self._halo * 1.5))
        ex = 75 if self.speaking else 44
        p.setPen(QPen(qcol(C.MUTED_C if self.muted else C.PRI, sa), 2.5))
        p.setBrush(Qt.BrushStyle.NoBrush)
        srect = QRectF(cx - sr, cy - sr, sr * 2, sr * 2)
        p.drawArc(srect, int(self._scan * 16), int(ex * 16))
        p.setPen(QPen(qcol(C.ACC, sa // 2), 1.5))
        p.drawArc(srect, int(self._scan2 * 16), int(ex * 16))

        # tick marks
        t_out, t_in = fw * 0.497, fw * 0.474
        p.setPen(QPen(qcol(C.PRI, 140), 1))
        for deg in range(0, 360, 10):
            rad = math.radians(deg)
            inn = t_in if deg % 30 == 0 else t_in + 6
            p.drawLine(
                QPointF(cx + t_out * math.cos(rad), cy - t_out * math.sin(rad)),
                QPointF(cx + inn  * math.cos(rad), cy - inn  * math.sin(rad)),
            )

        # crosshair
        ch_r, gap_h = fw * 0.51, fw * 0.16
        p.setPen(QPen(qcol(C.PRI, int(self._halo * 0.5)), 1))
        p.drawLine(QPointF(cx - ch_r, cy), QPointF(cx - gap_h, cy))
        p.drawLine(QPointF(cx + gap_h, cy), QPointF(cx + ch_r, cy))
        p.drawLine(QPointF(cx, cy - ch_r), QPointF(cx, cy - gap_h))
        p.drawLine(QPointF(cx, cy + gap_h), QPointF(cx, cy + ch_r))

        # corner brackets
        bl = 24
        bc = qcol(C.PRI, 210)
        hl, hr = cx - fw // 2, cx + fw // 2
        ht, hb = cy - fw // 2, cy + fw // 2
        p.setPen(QPen(bc, 2))
        for bx, by, dx, dy in [(hl,ht,1,1),(hr,ht,-1,1),(hl,hb,1,-1),(hr,hb,-1,-1)]:
            p.drawLine(QPointF(bx, by), QPointF(bx + dx * bl, by))
            p.drawLine(QPointF(bx, by), QPointF(bx, by + dy * bl))

        # face
        if self._face_px:
            fsz    = int(fw * 0.62 * self._scale)
            scaled = self._face_px.scaled(
                fsz, fsz,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            p.drawPixmap(int(cx - fsz / 2), int(cy - fsz / 2), scaled)
        else:
            orb_r = int(fw * 0.27 * self._scale)
            oc    = (200, 0, 50) if self.muted else (0, 60, 110)
            for i in range(8, 0, -1):
                r2  = int(orb_r * i / 8)
                frc = i / 8
                a   = max(0, min(255, int(self._halo * 1.1 * frc)))
                p.setBrush(QBrush(QColor(int(oc[0]*frc), int(oc[1]*frc), int(oc[2]*frc), a)))
                p.setPen(Qt.PenStyle.NoPen)
                p.drawEllipse(QRectF(cx - r2, cy - r2, r2 * 2, r2 * 2))
            p.setPen(QPen(qcol(C.PRI, min(255, int(self._halo * 2))), 1))
            p.setFont(QFont("Courier New", 15, QFont.Weight.Bold))
            p.drawText(QRectF(cx - 80, cy - 14, 160, 28),
                       Qt.AlignmentFlag.AlignCenter, self._assistant_name)


class MetricBar(QWidget):

    def __init__(self, label: str, color: str = C.PRI, parent=None):
        super().__init__(parent)
        self._label = label
        self._color = color
        self._value = 0.0       # 0–100
        self._text  = "--"
        self.setFixedHeight(38)
        self.setMinimumWidth(80)

    def set_value(self, pct: float, text: str):
        self._value = max(0.0, min(100.0, pct))
        self._text  = text
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        W, H = self.width(), self.height()

        p.setBrush(QBrush(qcol(C.PANEL2)))
        p.setPen(QPen(qcol(C.BORDER_A), 1))
        p.drawRoundedRect(QRectF(1, 1, W - 2, H - 2), 4, 4)

        bar_h   = 4
        bar_y   = H - bar_h - 5
        bar_w   = W - 12
        bar_x   = 6
        fill_w  = int(bar_w * self._value / 100)

        p.setBrush(QBrush(qcol(C.BAR_BG)))
        p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(QRectF(bar_x, bar_y, bar_w, bar_h), 2, 2)

        if self._value > 85:
            bar_col = qcol(C.RED)
        elif self._value > 65:
            bar_col = qcol(C.ACC)
        else:
            bar_col = qcol(self._color)

        if fill_w > 0:
            p.setBrush(QBrush(bar_col))
            p.drawRoundedRect(QRectF(bar_x, bar_y, fill_w, bar_h), 2, 2)

        p.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        p.setPen(QPen(qcol(C.TEXT_DIM), 1))
        p.drawText(QRectF(8, 5, 50, 14), Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, self._label)

        p.setFont(QFont("Courier New", 11, QFont.Weight.Bold))
        p.setPen(QPen(bar_col if self._text != "--" else qcol(C.TEXT_DIM), 1))
        p.drawText(QRectF(0, 4, W - 6, 16), Qt.AlignmentFlag.AlignRight | Qt.AlignmentFlag.AlignVCenter, self._text)

class ChatThread(QScrollArea):
    """Conversation view. Drop-in replacement for the old activity log:
    same `append_log(text)` API, but renders messages as chat.

        "You: hi"        -> right-aligned bubble
        "Nirmaraksh: hello"  -> assistant text with accent bar
        "SYS:/FILE:/ERR" -> small status lines
    """
    _sig = pyqtSignal(str)
    message_added = pyqtSignal(str, str)      # (kind, raw text) for you / ai / file
    _MAX = 250

    def __init__(self, parent=None):
        super().__init__(parent)
        self._ai_name_lc = APP_NAME.lower()      # updated when assistant name changes
        self._fit_list: list[tuple[QWidget, float]] = []
        self._stick = True
        self.setWidgetResizable(True)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.setStyleSheet(f"""
            QScrollArea {{ background: {C.BG}; border: none; }}
            QScrollBar:vertical {{ background: {C.BG}; width: 8px; border: none; }}
            QScrollBar::handle:vertical {{
                background: {C.BORDER_B}; border-radius: 4px; min-height: 20px; }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
        """)
        self._body = QWidget()
        self._body.setMaximumWidth(836)          # line up with the input bar
        self.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        self._body.setStyleSheet("background: transparent;")
        self._v = QVBoxLayout(self._body)
        self._v.setContentsMargins(28, 10, 28, 10)
        self._v.setSpacing(9)
        self._v.addStretch(1)
        self.setWidget(self._body)
        bar = self.verticalScrollBar()
        bar.rangeChanged.connect(lambda _a, mx: self._stick and bar.setValue(mx))
        bar.valueChanged.connect(lambda v: setattr(self, "_stick", v >= bar.maximum() - 6))
        self._sig.connect(self._add)

    # thread-safe entry point (same name as before)
    def append_log(self, text: str):
        self._sig.emit(text)

    # ── parsing ─────────────────────────────────────────────────────────
    def _classify(self, text: str) -> tuple[str, str, str]:
        tl = text.lower()
        ai = f"{self._ai_name_lc}:"
        if tl.startswith("you:"):
            return "you", "", text[4:].strip()
        if tl.startswith("[web]:"):
            return "you", "", text[6:].strip()
        if tl.startswith(ai) or tl.startswith("Nirmaraksh:") or tl.startswith("nirmaraksh:"):
            name, _, body = text.partition(":")
            return "ai", name.strip(), body.strip()
        if tl.startswith("file:"):
            return "file", "", text[5:].strip()
        if tl.startswith("err"):
            return "err", "", text.partition(":")[2].strip() or text
        if tl.startswith("sys:"):
            return "sys", "", text[4:].strip()
        return "sys", "", text.strip()

    def _label(self, text: str, css: str, font: QFont) -> QLabel:
        l = QLabel(text)
        l.setWordWrap(True)
        l.setFont(font)
        l.setTextInteractionFlags(Qt.TextInteractionFlag.TextSelectableByMouse)
        l.setStyleSheet(css)
        return l

    def _add(self, text: str):
        kind, name, body = self._classify(text)
        if not body:
            return
        row = QWidget()
        row.setStyleSheet("background: transparent;")
        h = QHBoxLayout(row)
        h.setContentsMargins(0, 0, 0, 0)
        h.setSpacing(0)
        if kind == "you":
            bub = self._label(
                body,
                f"background: {C.PRI_GHO}; color: {C.WHITE}; border: 1px solid {C.BORDER_B};"
                f"border-radius: 12px; padding: 8px 13px;",
                QFont("Segoe UI", 10))
            h.addStretch(1)
            h.addWidget(bub)
            self._fit_list.append((bub, 0.78, bub.fontMetrics().horizontalAdvance(body) + 34))
        elif kind == "ai":
            bar = QFrame(); bar.setFixedWidth(2)
            bar.setStyleSheet(f"background: {C.PRI}; border: none;")
            col = QVBoxLayout(); col.setSpacing(2); col.setContentsMargins(10, 0, 0, 0)
            nm = self._label(name.upper(), f"color: {C.PRI}; background: transparent;",
                             QFont("Courier New", 8, QFont.Weight.Bold))
            msg = self._label(body, f"color: {C.WHITE}; background: transparent;",
                              QFont("Segoe UI", 10))
            col.addWidget(nm); col.addWidget(msg)
            h.addWidget(bar)
            h.addLayout(col, 1)
            h.addSpacing(40)
        else:
            colr = {"file": C.GREEN, "err": C.RED}.get(kind, C.TEXT_DIM)
            glyph = {"file": "▣", "err": "⚠"}.get(kind, "◈")
            st = self._label(f"{glyph}  {body}", f"color: {colr}; background: transparent;",
                             QFont("Courier New", 8))
            h.addWidget(st, 1)
        self._v.addWidget(row)
        if kind in ("you", "ai", "file"):
            self.message_added.emit(kind, text)
        while self._v.count() - 1 > self._MAX:
            it = self._v.takeAt(1)
            wd = it.widget() if it else None
            if wd is not None:
                wd.hide(); wd.setParent(None); wd.deleteLater()
        self._fit()
        QTimer.singleShot(30, self._to_bottom)

    def clear(self):
        """Remove every message from the view (history on disk is untouched)."""
        while self._v.count() > 1:
            it = self._v.takeAt(1)
            wd = it.widget() if it else None
            if wd is not None:
                wd.hide()
                wd.setParent(None)          # vanish immediately, don't wait for deleteLater
                wd.deleteLater()
        self._fit_list = []
        self._stick = True

    def _to_bottom(self):
        if self._stick:
            self.verticalScrollBar().setValue(self.verticalScrollBar().maximum())

    def _fit(self):
        avail = max(160, min(self.viewport().width(), 836) - 56)
        alive = []
        for w, frac, nat in self._fit_list:
            try:
                w.setFixedWidth(max(40, min(nat, int(avail * frac))))
                alive.append((w, frac, nat))
            except RuntimeError:            # widget already deleted
                pass
        self._fit_list = alive

    def resizeEvent(self, e):
        super().resizeEvent(e)
        self._fit()


_FILE_ICONS = {
    "image":   ("🖼", "#00d4ff"), "video":   ("🎬", "#ff6b00"),
    "audio":   ("🎵", "#cc44ff"), "pdf":     ("📄", "#ff4444"),
    "word":    ("📝", "#4488ff"), "excel":   ("📊", "#44bb44"),
    "code":    ("💻", "#ffcc00"), "archive": ("📦", "#ff8844"),
    "pptx":    ("📊", "#ff6622"), "text":    ("📃", "#aaaaaa"),
    "data":    ("🔧", "#88ddff"), "unknown": ("📎", "#888888"),
}
_EXT_TO_CAT = {
    **dict.fromkeys(["jpg","jpeg","png","gif","webp","bmp","tiff","svg","ico"], "image"),
    **dict.fromkeys(["mp4","avi","mov","mkv","wmv","flv","webm","m4v"],         "video"),
    **dict.fromkeys(["mp3","wav","ogg","m4a","aac","flac","wma","opus"],        "audio"),
    **dict.fromkeys(["pdf"],                                                     "pdf"),
    **dict.fromkeys(["doc","docx"],                                              "word"),
    **dict.fromkeys(["xls","xlsx","ods"],                                        "excel"),
    **dict.fromkeys(["ppt","pptx"],                                              "pptx"),
    **dict.fromkeys(["py","js","ts","jsx","tsx","html","css","java","c","cpp",
                     "cs","go","rs","rb","php","swift","kt","sh","sql","lua"],   "code"),
    **dict.fromkeys(["zip","rar","tar","gz","7z","bz2","xz"],                   "archive"),
    **dict.fromkeys(["txt","md","rst","log"],                                    "text"),
    **dict.fromkeys(["csv","tsv","json","xml"],                                  "data"),
}

def _file_category(path: Path) -> str:
    return _EXT_TO_CAT.get(path.suffix.lower().lstrip("."), "unknown")

def _fmt_size(size: int) -> str:
    if   size < 1024:    return f"{size} B"
    elif size < 1024**2: return f"{size/1024:.1f} KB"
    elif size < 1024**3: return f"{size/1024**2:.1f} MB"
    else:                return f"{size/1024**3:.1f} GB"


class FileDropZone(QWidget):
    file_selected = pyqtSignal(str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAcceptDrops(True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(100)
        self._current_file: str | None = None
        self._hovering  = False
        self._drag_over = False
        self._dash_offset = 0.0
        self._anim_tmr = QTimer(self)
        self._anim_tmr.timeout.connect(self._animate)
        self._anim_tmr.start(40)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)
        self._canvas = _DropCanvas(self)
        layout.addWidget(self._canvas)

    def _animate(self):
        self._dash_offset = (self._dash_offset + 0.8) % 20
        self._canvas.update()

    def dragEnterEvent(self, e: QDragEnterEvent):
        if e.mimeData().hasUrls():
            e.acceptProposedAction()
            self._drag_over = True; self._canvas.update()

    def dragLeaveEvent(self, e):
        self._drag_over = False; self._canvas.update()

    def dropEvent(self, e: QDropEvent):
        self._drag_over = False
        urls = e.mimeData().urls()
        if urls:
            path = urls[0].toLocalFile()
            if Path(path).is_file():
                self._set_file(path)
        self._canvas.update()

    def mousePressEvent(self, e):
        if e.button() == Qt.MouseButton.LeftButton:
            self._browse()

    def enterEvent(self, e):
        self._hovering = True; self._canvas.update()

    def leaveEvent(self, e):
        self._hovering = False; self._canvas.update()

    def current_file(self) -> str | None:
        return self._current_file

    def clear_file(self):
        self._current_file = None; self._canvas.update()

    def _browse(self):
        path, _ = QFileDialog.getOpenFileName(
            self, "Select a file", str(Path.home()),
            "All Files (*.*);;"
            "Images (*.jpg *.jpeg *.png *.gif *.webp *.bmp *.svg);;"
            "Documents (*.pdf *.docx *.txt *.md *.pptx);;"
            "Data (*.csv *.xlsx *.json *.xml);;"
            "Code (*.py *.js *.ts *.html *.css *.java *.cpp *.go);;"
            "Audio (*.mp3 *.wav *.ogg *.m4a *.aac *.flac);;"
            "Video (*.mp4 *.avi *.mov *.mkv *.wmv *.webm);;"
            "Archives (*.zip *.rar *.tar *.gz *.7z)",
        )
        if path:
            self._set_file(path)

    def _set_file(self, path: str):
        self._current_file = path
        self._canvas.update()
        self.file_selected.emit(path)


class _DropCanvas(QWidget):
    def __init__(self, zone: FileDropZone):
        super().__init__(zone)
        self._z = zone

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        z    = self._z
        W, H = self.width(), self.height()
        pad  = 6
        rect = QRectF(pad, pad, W - pad * 2, H - pad * 2)

        bg_col = qcol("#001a24" if z._drag_over else ("#001218" if z._hovering else C.PANEL))
        p.setBrush(QBrush(bg_col)); p.setPen(Qt.PenStyle.NoPen)
        p.drawRoundedRect(rect, 6, 6)

        if z._current_file:   border_col = qcol(C.GREEN, 200)
        elif z._drag_over:    border_col = qcol(C.PRI, 230)
        elif z._hovering:     border_col = qcol(C.BORDER_B, 200)
        else:                 border_col = qcol(C.BORDER, 160)

        pen = QPen(border_col, 1.5, Qt.PenStyle.DashLine)
        pen.setDashOffset(z._dash_offset)
        p.setPen(pen); p.setBrush(Qt.BrushStyle.NoBrush)
        p.drawRoundedRect(rect, 6, 6)

        if z._current_file:   self._paint_file(p, W, H)
        elif z._drag_over:    self._paint_drag_over(p, W, H)
        else:                 self._paint_idle(p, W, H, z._hovering)

    def _paint_idle(self, p, W, H, hover):
        cx, cy = W / 2, H / 2
        col = qcol(C.PRI_DIM if not hover else C.PRI)
        p.setPen(QPen(col, 2)); p.setBrush(Qt.BrushStyle.NoBrush)
        p.drawLine(QPointF(cx, cy - 14), QPointF(cx, cy + 4))
        p.drawLine(QPointF(cx - 8, cy - 6), QPointF(cx, cy - 14))
        p.drawLine(QPointF(cx + 8, cy - 6), QPointF(cx, cy - 14))
        p.drawLine(QPointF(cx - 14, cy + 4), QPointF(cx + 14, cy + 4))
        p.setFont(QFont("Courier New", 9))
        p.setPen(QPen(qcol(C.PRI_DIM if not hover else C.TEXT), 1))
        p.drawText(QRectF(0, cy + 8, W, 16), Qt.AlignmentFlag.AlignCenter,
                   "Drop file here  or  Click to Browse")
        p.setFont(QFont("Courier New", 8))
        p.setPen(QPen(qcol("#1a4a5a"), 1))
        p.drawText(QRectF(0, cy + 24, W, 14), Qt.AlignmentFlag.AlignCenter,
                   "Images · Video · PDF · Docs · Code")

    def _paint_drag_over(self, p, W, H):
        cx, cy = W / 2, H / 2
        p.setFont(QFont("Courier New", 23))
        p.setPen(QPen(qcol(C.PRI), 1))
        p.drawText(QRectF(0, cy - 24, W, 32), Qt.AlignmentFlag.AlignCenter, "⬇")
        p.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        p.setPen(QPen(qcol(C.PRI), 1))
        p.drawText(QRectF(0, cy + 12, W, 16), Qt.AlignmentFlag.AlignCenter, "Release to load")

    def _paint_file(self, p, W, H):
        path = Path(self._z._current_file)
        cat  = _file_category(path)
        icon, icon_col = _FILE_ICONS.get(cat, _FILE_ICONS["unknown"])
        size_str = _fmt_size(path.stat().st_size)
        ext_str  = path.suffix.upper().lstrip(".") or "FILE"

        block_x, block_w = 10, 60
        p.setFont(QFont("Segoe UI Emoji", 22) if _OS == "Windows" else QFont("Arial", 22))
        p.setPen(QPen(qcol(icon_col), 1))
        p.drawText(QRectF(block_x, 0, block_w, H), Qt.AlignmentFlag.AlignCenter, icon)

        tx = block_x + block_w + 6
        tw = W - tx - 38

        p.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        p.setPen(QPen(qcol(C.WHITE), 1))
        name = path.name if len(path.name) <= 34 else path.name[:31] + "..."
        p.drawText(QRectF(tx, H * 0.18, tw, 16),
                   Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, name)

        p.setFont(QFont("Courier New", 8))
        p.setPen(QPen(qcol(C.TEXT_DIM), 1))
        p.drawText(QRectF(tx, H * 0.18 + 18, tw, 14),
                   Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter,
                   f"{ext_str}  ·  {size_str}")

        p.setFont(QFont("Courier New", 7))
        p.setPen(QPen(qcol("#1e5c6a"), 1))
        par = str(path.parent)
        if len(par) > 42: par = "…" + par[-41:]
        p.drawText(QRectF(tx, H * 0.18 + 34, tw, 12),
                   Qt.AlignmentFlag.AlignLeft | Qt.AlignmentFlag.AlignVCenter, par)

        p.setFont(QFont("Courier New", 11, QFont.Weight.Bold))
        p.setPen(QPen(qcol(C.RED, 180), 1))
        p.drawText(QRectF(W - 34, 0, 28, H), Qt.AlignmentFlag.AlignCenter, "✕")

    def mousePressEvent(self, e):
        z = self._z
        if z._current_file and e.pos().x() > self.width() - 34:
            z.clear_file()
        else:
            z.mousePressEvent(e)


class _CameraPreview(QWidget):
    """Floating overlay that briefly shows what the camera captured."""

    _W, _H = 244, 188

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setStyleSheet(f"""
            _CameraPreview {{
                background: rgba(0, 6, 10, 242);
                border: 1px solid {C.PRI};
                border-radius: 6px;
            }}
        """)
        self.setFixedWidth(self._W)

        lay = QVBoxLayout(self)
        lay.setContentsMargins(6, 5, 6, 6)
        lay.setSpacing(4)

        hdr = QHBoxLayout()
        title = QLabel("◈  VISUAL INPUT")
        title.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {C.PRI}; background: transparent;")
        hdr.addWidget(title)
        hdr.addStretch()
        close_btn = QPushButton("✕")
        close_btn.setFixedSize(16, 16)
        close_btn.setFont(QFont("Courier New", 9))
        close_btn.setStyleSheet(
            f"color: {C.TEXT_DIM}; background: transparent; border: none;"
        )
        close_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        close_btn.clicked.connect(self.hide)
        hdr.addWidget(close_btn)
        lay.addLayout(hdr)

        self._img_lbl = QLabel()
        self._img_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._img_lbl.setStyleSheet("background: transparent;")
        lay.addWidget(self._img_lbl)

        self._timer = QTimer(self)
        self._timer.setSingleShot(True)
        self._timer.timeout.connect(self.hide)

        self.hide()

    def show_frame(self, img_bytes: bytes) -> None:
        px = QPixmap()
        px.loadFromData(img_bytes)
        if not px.isNull():
            max_w = self._W - 12
            scaled = px.scaled(
                max_w, 160,
                Qt.AspectRatioMode.KeepAspectRatio,
                Qt.TransformationMode.SmoothTransformation,
            )
            self._img_lbl.setPixmap(scaled)
            self._img_lbl.setFixedSize(scaled.width(), scaled.height())
            self.adjustSize()
        self.show()
        self.raise_()
        self._timer.start(6_000)   # auto-dismiss after 6 s


class SetupOverlay(QWidget):
    done = pyqtSignal(str, str)

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setStyleSheet(f"""
            SetupOverlay {{
                background: rgba(0, 6, 10, 245);
                border: 1px solid {C.BORDER_B};
                border-radius: 6px;
            }}
        """)

        detected = {"darwin": "mac", "windows": "windows"}.get(
            _OS.lower(), "linux"
        )
        self._sel_os = detected

        layout = QVBoxLayout(self)
        layout.setContentsMargins(30, 22, 30, 22)
        layout.setSpacing(8)

        def _lbl(txt, font_size=9, bold=False, color=C.PRI,
                 align=Qt.AlignmentFlag.AlignCenter):
            w = QLabel(txt)
            w.setAlignment(align)
            w.setFont(QFont("Courier New", font_size,
                            QFont.Weight.Bold if bold else QFont.Weight.Normal))
            w.setStyleSheet(f"color: {color}; background: transparent;")
            return w

        layout.addWidget(_lbl("◈  INITIALISATION REQUIRED", 13, True))
        layout.addWidget(_lbl("Configure Nirmaraksh. before first boot.", 9, color=C.PRI_DIM))
        layout.addSpacing(6)

        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(f"color: {C.BORDER};"); layout.addWidget(sep)
        layout.addSpacing(4)

        layout.addWidget(_lbl("GEMINI API KEY", 8, color=C.TEXT_DIM,
                               align=Qt.AlignmentFlag.AlignLeft))
        self._key_input = QLineEdit()
        self._key_input.setEchoMode(QLineEdit.EchoMode.Password)
        self._key_input.setPlaceholderText("AIza…")
        self._key_input.setFont(QFont("Courier New", 12))
        self._key_input.setFixedHeight(32)
        self._key_input.setStyleSheet(f"""
            QLineEdit {{
                background: #000d12; color: {C.TEXT};
                border: 1px solid {C.BORDER}; border-radius: 3px; padding: 4px 8px;
            }}
            QLineEdit:focus {{ border: 1px solid {C.PRI}; }}
        """)
        layout.addWidget(self._key_input)
        layout.addSpacing(12)

        sep2 = QFrame(); sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setStyleSheet(f"color: {C.BORDER};"); layout.addWidget(sep2)
        layout.addSpacing(4)

        layout.addWidget(_lbl("OPERATING SYSTEM", 8, color=C.TEXT_DIM,
                               align=Qt.AlignmentFlag.AlignLeft))
        det_name = {"windows": "Windows", "mac": "macOS", "linux": "Linux"}[detected]
        layout.addWidget(_lbl(f"Auto-detected: {det_name}", 8, color=C.ACC2,
                               align=Qt.AlignmentFlag.AlignLeft))

        os_row = QHBoxLayout(); os_row.setSpacing(6)
        self._os_btns: dict[str, QPushButton] = {}
        for key, label in [("windows","⊞  Windows"),("mac","  macOS"),("linux","🐧  Linux")]:
            btn = QPushButton(label)
            btn.setFont(QFont("Courier New", 11, QFont.Weight.Bold))
            btn.setFixedHeight(32)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.clicked.connect(lambda _, k=key: self._sel(k))
            os_row.addWidget(btn)
            self._os_btns[key] = btn
        layout.addLayout(os_row)
        self._sel(detected)
        layout.addSpacing(12)

        init_btn = QPushButton("▸  INITIALISE SYSTEMS")
        init_btn.setFont(QFont("Courier New", 12, QFont.Weight.Bold))
        init_btn.setFixedHeight(36)
        init_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        init_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.PRI};
                border: 1px solid {C.PRI_DIM}; border-radius: 3px;
            }}
            QPushButton:hover {{
                background: {C.PRI_GHO}; border: 1px solid {C.PRI};
            }}
        """)
        init_btn.clicked.connect(self._submit)
        layout.addWidget(init_btn)

    def _sel(self, key: str):
        self._sel_os = key
        pal = {"windows":(C.PRI,"#001a22"),"mac":(C.ACC2,"#1a1400"),"linux":(C.GREEN,"#001a0d")}
        for k, btn in self._os_btns.items():
            if k == key:
                fg, bg = pal[k]
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background: {fg}; color: {bg};
                        border: none; border-radius: 3px; font-weight: bold;
                    }}
                """)
            else:
                btn.setStyleSheet(f"""
                    QPushButton {{
                        background: #000d12; color: {C.TEXT_DIM};
                        border: 1px solid {C.BORDER}; border-radius: 3px;
                    }}
                    QPushButton:hover {{ color: {C.TEXT}; border: 1px solid {C.BORDER_B}; }}
                """)

    def _submit(self):
        key = self._key_input.text().strip()
        if not key:
            self._key_input.setStyleSheet(
                self._key_input.styleSheet() +
                f" QLineEdit {{ border: 1px solid {C.RED}; }}"
            )
            return
        self.done.emit(key, self._sel_os)


class HueWheel(QWidget):
    """
    Dairesel renk seçici. Kullanıcı tutamacı (küçük beyaz daire) çarkın
    çevresinde sürükleyerek TÜM renk tonları arasından seçim yapar.
    Merkezdeki dolu daire seçilen rengin canlı önizlemesidir.
    """

    hue_picked    = pyqtSignal(str)   # sürükleme sırasında (canlı)
    hue_committed = pyqtSignal(str)   # tutamaç bırakıldığında

    _RING = 16   # halka kalınlığı (px)

    def __init__(self, initial_hex: str = DEFAULT_UI_COLOR, parent=None):
        super().__init__(parent)
        self.setFixedSize(148, 148)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._hue  = 0.53
        self._drag = False
        self.set_color(initial_hex)

    # ── API ──────────────────────────────────────────────────────────────────
    def color(self) -> str:
        return QColor.fromHsvF(self._hue, 1.0, 1.0).name()

    def set_color(self, hex_str: str):
        c = QColor((hex_str or "").strip())
        if c.isValid() and c.hsvHueF() >= 0:
            self._hue = c.hsvHueF()
            self.update()

    # ── geometri yardımcıları ────────────────────────────────────────────────
    def _ring_rect(self) -> QRectF:
        m = self._RING / 2 + 3
        return QRectF(self.rect()).adjusted(m, m, -m, -m)

    def _hue_from_pos(self, pos: QPointF) -> float:
        c  = QRectF(self.rect()).center()
        dx = pos.x() - c.x()
        dy = c.y() - pos.y()          # ekran y'si aşağı — matematiksel eksene çevir
        ang = math.atan2(dy, dx)      # [-π, π], saat yönünün tersi
        return (ang / (2 * math.pi)) % 1.0

    # ── çizim ────────────────────────────────────────────────────────────────
    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        rect   = self._ring_rect()
        center = rect.center()

        grad = QConicalGradient(center, 0)
        for i in range(0, 361, 20):
            grad.setColorAt(i / 360.0, QColor.fromHsvF((i % 360) / 360.0, 1.0, 1.0))
        p.setPen(QPen(QBrush(grad), self._RING))
        p.setBrush(Qt.BrushStyle.NoBrush)
        p.drawEllipse(rect)

        # merkez önizleme dairesi
        preview = QColor.fromHsvF(self._hue, 1.0, 1.0)
        inner   = rect.adjusted(30, 30, -30, -30)
        p.setPen(QPen(qcol(C.BORDER_B), 1))
        p.setBrush(QBrush(preview))
        p.drawEllipse(inner)

        # sürüklenen tutamaç
        r   = rect.width() / 2
        ang = self._hue * 2 * math.pi
        hx  = center.x() + r * math.cos(ang)
        hy  = center.y() - r * math.sin(ang)
        p.setPen(QPen(QColor("#00060a"), 2))
        p.setBrush(QBrush(QColor("#ffffff")))
        p.drawEllipse(QPointF(hx, hy), 7.5, 7.5)

    # ── fare ─────────────────────────────────────────────────────────────────
    def mousePressEvent(self, e):
        self._drag = True
        self._hue  = self._hue_from_pos(e.position())
        self.update()
        self.hue_picked.emit(self.color())

    def mouseMoveEvent(self, e):
        if self._drag:
            self._hue = self._hue_from_pos(e.position())
            self.update()
            self.hue_picked.emit(self.color())

    def mouseReleaseEvent(self, e):
        if self._drag:
            self._drag = False
            self.hue_committed.emit(self.color())


class CustomizeOverlay(QWidget):
    """Floating overlay — change assistant name, user name and UI colour."""

    saved = pyqtSignal(str, str, str)   # assistant_name, user_name, ui_color
    _OW, _OH = 400, 500

    def __init__(self, assistant_name=APP_NAME, user_name="",
                 ui_color=DEFAULT_UI_COLOR, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setStyleSheet(f"""
            CustomizeOverlay {{
                background: rgba(0, 6, 10, 245);
                border: 1px solid {C.BORDER_B};
                border-radius: 6px;
            }}
        """)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(24, 18, 24, 18)
        lay.setSpacing(8)

        def _lbl(txt, fs=9, bold=False, color=C.PRI, align=Qt.AlignmentFlag.AlignCenter):
            w = QLabel(txt); w.setAlignment(align)
            w.setFont(QFont("Courier New", fs,
                            QFont.Weight.Bold if bold else QFont.Weight.Normal))
            w.setStyleSheet(f"color: {color}; background: transparent;")
            return w

        _fs = (f"QLineEdit {{ background: #000d12; color: {C.TEXT}; "
               f"border: 1px solid {C.BORDER}; border-radius: 3px; padding: 4px 8px; }}"
               f"QLineEdit:focus {{ border: 1px solid {C.PRI}; }}")

        lay.addWidget(_lbl("⚙  CUSTOMISE ASSISTANT", 12, True))
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(f"color: {C.BORDER}; margin: 2px 0;")
        lay.addWidget(sep)

        lay.addWidget(_lbl("ASSISTANT NAME", 8, color=C.TEXT_DIM,
                            align=Qt.AlignmentFlag.AlignLeft))
        self._name_input = QLineEdit(assistant_name)
        self._name_input.setFont(QFont("Courier New", 12))
        self._name_input.setFixedHeight(32)
        self._name_input.setStyleSheet(_fs)
        lay.addWidget(self._name_input)

        lay.addSpacing(4)
        lay.addWidget(_lbl("YOUR NAME  (leave blank for default sir / efendim)", 8,
                            color=C.TEXT_DIM, align=Qt.AlignmentFlag.AlignLeft))
        self._user_input = QLineEdit(user_name)
        self._user_input.setPlaceholderText("e.g.  Tony   (leave blank for auto)")
        self._user_input.setFont(QFont("Courier New", 12))
        self._user_input.setFixedHeight(32)
        self._user_input.setStyleSheet(_fs)
        lay.addWidget(self._user_input)

        # ── UI colour — renk çarkı ───────────────────────────────────────────
        lay.addSpacing(4)
        clr_hdr = QHBoxLayout()
        clr_hdr.addWidget(_lbl("UI COLOUR  —  drag the handle", 8,
                               color=C.TEXT_DIM, align=Qt.AlignmentFlag.AlignLeft))
        clr_hdr.addStretch()
        df_btn = QPushButton("DEFAULT")
        df_btn.setFixedSize(64, 20)
        df_btn.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        df_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        df_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.TEXT_MED};
                border: 1px solid {C.BORDER}; border-radius: 3px;
            }}
            QPushButton:hover {{ color: {C.TEXT}; border-color: {C.BORDER_B}; }}
        """)
        df_btn.clicked.connect(lambda: self._set_color(DEFAULT_UI_COLOR))
        clr_hdr.addWidget(df_btn)
        lay.addLayout(clr_hdr)

        self._initial_color = (ui_color or DEFAULT_UI_COLOR).strip().lower()
        self._sel_color     = self._initial_color
        self.on_preview     = None   # callable(hex) — canlı önizleme; MainWindow bağlar

        self._wheel = HueWheel(self._sel_color)
        wheel_row = QHBoxLayout()
        wheel_row.addStretch(); wheel_row.addWidget(self._wheel); wheel_row.addStretch()
        lay.addLayout(wheel_row)
        self._wheel.hue_picked.connect(self._on_wheel_pick)
        self._wheel.hue_committed.connect(self._on_wheel_commit)

        self._hex_input = QLineEdit(self._sel_color)
        self._hex_input.setPlaceholderText("#00d4ff   (custom hex colour)")
        self._hex_input.setFont(QFont("Courier New", 12))
        self._hex_input.setFixedHeight(28)
        self._hex_input.setStyleSheet(_fs)
        self._hex_input.textEdited.connect(self._on_hex_edited)
        lay.addWidget(self._hex_input)

        lay.addSpacing(6)
        btn_row = QHBoxLayout(); btn_row.setSpacing(8)

        save_btn = QPushButton("▸  APPLY CHANGES")
        save_btn.setFixedHeight(34)
        save_btn.setFont(QFont("Courier New", 11, QFont.Weight.Bold))
        save_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        save_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.PRI};
                border: 1px solid {C.PRI_DIM}; border-radius: 3px;
            }}
            QPushButton:hover {{ background: {C.PRI_GHO}; border: 1px solid {C.PRI}; }}
        """)
        save_btn.clicked.connect(self._save)
        btn_row.addWidget(save_btn)

        cancel_btn = QPushButton("CANCEL")
        cancel_btn.setFixedHeight(34)
        cancel_btn.setFont(QFont("Courier New", 11))
        cancel_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        cancel_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.TEXT_MED};
                border: 1px solid {C.BORDER}; border-radius: 3px;
            }}
            QPushButton:hover {{ color: {C.TEXT}; border-color: {C.BORDER_B}; }}
        """)
        cancel_btn.clicked.connect(self._cancel)
        btn_row.addWidget(cancel_btn)
        lay.addLayout(btn_row)

    # ── renk akışı ───────────────────────────────────────────────────────────
    def _set_color(self, hx: str, update_wheel: bool = True, preview: bool = True):
        """Seçili rengi günceller; hex kutusu + çark senkron kalır, tema canlı önizlenir."""
        self._sel_color = hx.strip().lower()
        self._hex_input.blockSignals(True)
        self._hex_input.setText(self._sel_color)
        self._hex_input.blockSignals(False)
        if update_wheel:
            self._wheel.set_color(self._sel_color)
        if preview and self.on_preview:
            self.on_preview(self._sel_color)

    def _on_wheel_pick(self, hx: str):
        # Sürükleme sırasında: hex kutusunu güncelle, temayı henüz uygulama
        self._sel_color = hx
        self._hex_input.blockSignals(True)
        self._hex_input.setText(hx)
        self._hex_input.blockSignals(False)

    def _on_wheel_commit(self, hx: str):
        # Tutamaç bırakıldı → tüm arayüzü canlı önizle
        self._set_color(hx, update_wheel=False)

    def _on_hex_edited(self, text: str):
        t = text.strip().lower()
        if t.startswith("#") and len(t) == 7:
            try:
                int(t[1:], 16)
            except ValueError:
                return
            self._set_color(t, update_wheel=True, preview=True)

    def _cancel(self):
        # Önizleme uygulandıysa açılıştaki renge geri dön
        if self.on_preview and self._sel_color != self._initial_color:
            self.on_preview(self._initial_color)
        self.hide()

    def _save(self):
        name = self._name_input.text().strip() or APP_NAME
        user = self._user_input.text().strip()
        self.saved.emit(name, user, self._sel_color or DEFAULT_UI_COLOR)
        self.hide()


class ClipboardPanel(QWidget):
    """Floating panel shown when text is copied — offers quick assistant actions."""

    action_requested = pyqtSignal(str)
    _W, _H = 326, 112

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        self.setStyleSheet(f"""
            ClipboardPanel {{
                background: rgba(0, 8, 14, 248);
                border: 1px solid {C.BORDER_B};
                border-radius: 6px;
            }}
        """)
        self.setFixedWidth(self._W)
        self._clip_text = ""

        lay = QVBoxLayout(self)
        lay.setContentsMargins(8, 6, 8, 7)
        lay.setSpacing(4)

        hdr = QHBoxLayout(); hdr.setSpacing(4)
        icon_lbl = QLabel("◈  CLIPBOARD DETECTED")
        icon_lbl.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        icon_lbl.setStyleSheet(f"color: {C.ACC2}; background: transparent;")
        hdr.addWidget(icon_lbl); hdr.addStretch()
        x_btn = QPushButton("✕")
        x_btn.setFixedSize(16, 16)
        x_btn.setFont(QFont("Courier New", 9))
        x_btn.setStyleSheet(f"color: {C.TEXT_DIM}; background: transparent; border: none;")
        x_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        x_btn.clicked.connect(self.hide)
        hdr.addWidget(x_btn)
        lay.addLayout(hdr)

        self._preview = QLabel()
        self._preview.setFont(QFont("Courier New", 9))
        self._preview.setStyleSheet(f"""
            color: {C.TEXT}; background: {C.PANEL2};
            border: 1px solid {C.BORDER}; border-radius: 3px; padding: 4px 6px;
        """)
        self._preview.setWordWrap(False)
        self._preview.setFixedHeight(28)
        lay.addWidget(self._preview)

        btn_row = QHBoxLayout(); btn_row.setSpacing(4)
        _bs = (f"QPushButton {{ background: {C.PANEL2}; color: {C.TEXT_MED}; "
               f"border: 1px solid {C.BORDER}; border-radius: 2px; }}"
               f"QPushButton:hover {{ color: {C.PRI}; border-color: {C.BORDER_B}; }}")
        for label, cmd_fmt in [
            ("TRANSLATE", "Translate this text to English: {text}"),
            ("SUMMARISE", "Summarise this: {text}"),
            ("EXPLAIN",   "Explain this: {text}"),
            ("FIX",       "Fix grammar and spelling: {text}"),
        ]:
            b = QPushButton(label)
            b.setFixedHeight(22)
            b.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.setStyleSheet(_bs)
            b.clicked.connect(lambda _, c=cmd_fmt: self._trigger(c))
            btn_row.addWidget(b)
        lay.addLayout(btn_row)

        self._dismiss_timer = QTimer(self)
        self._dismiss_timer.setSingleShot(True)
        self._dismiss_timer.timeout.connect(self.hide)
        self.hide()

    def _trigger(self, cmd_fmt: str):
        if self._clip_text:
            self.action_requested.emit(cmd_fmt.format(text=self._clip_text[:800]))
        self.hide()

    def show_clipboard(self, text: str):
        self._clip_text = text
        preview = text[:58].replace('\n', ' ')
        if len(text) > 58:
            preview += "…"
        self._preview.setText(f'"{preview}"')
        self.show(); self.raise_()
        self._dismiss_timer.start(8000)


class AgentRelay(QWidget):
    """Three agents on a vertical spine. A packet travels the spine on hand-off.
    Click a node to expand its last few events."""

    _evt = pyqtSignal(dict)

    _ORDER = ("main", "research", "builder")
    _LABEL = {"main": "MAIN", "research": "RESEARCH", "builder": "BUILDER"}
    _ROW_H = 50
    _LINE_H = 13

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setMouseTracking(True)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._st   = {k: "idle" for k in self._ORDER}     # idle|thinking|working|done|error
        self._txt  = {k: "standing by" for k in self._ORDER}
        self._hist = {k: _deque(maxlen=4) for k in self._ORDER}
        self._open = {k: False for k in self._ORDER}
        self._main_hud = "idle"
        self._last_active = "main"
        self._packet = None            # (src_idx, dst_idx, t0)
        self._phase = 0.0
        self._tmr = QTimer(self)
        self._tmr.timeout.connect(self._tick)
        self._tmr.start(40)
        self._evt.connect(self._on_event)
        try:
            from agents import events as _ev
            _ev.subscribe(self._evt.emit)
        except Exception as e:                      # agents package optional
            print(f"[AgentRelay] events bus unavailable: {e}")
        self._resize_to_rows()

    # ── public ──────────────────────────────────────────────────────────
    def set_main_state(self, hud_state: str):
        s = (hud_state or "").upper()
        self._main_hud = {"SPEAKING": "working", "THINKING": "thinking",
                          "PROCESSING": "thinking"}.get(s, "idle")
        if not any(self._st[k] in ("thinking", "working") for k in ("research", "builder")):
            self._st["main"] = self._main_hud
            self._txt["main"] = {"SPEAKING": "speaking", "THINKING": "thinking",
                                 "MUTED": "muted"}.get(s, "listening")
        self.update()

    # ── events (any thread → GUI thread via signal) ─────────────────────
    def _on_event(self, e: dict):
        a = str(e.get("agent", "")).lower()
        if a not in self._ORDER:
            return
        kind = str(e.get("kind", ""))
        msg = " ".join(str(e.get("message", "")).split())[:120] or kind
        self._hist[a].append(f"{kind}: {msg}")
        if kind == "start":
            src = self._last_active if self._last_active != a else "main"
            if a != "main":
                self._packet = (self._ORDER.index(src), self._ORDER.index(a), time.time())
                self._st["main"] = "working"
                self._txt["main"] = f"delegating → {self._LABEL[a].lower()}"
            self._st[a], self._txt[a] = "working", msg
            self._last_active = a
        elif kind in ("thought",):
            self._st[a], self._txt[a] = "thinking", msg
        elif kind in ("tool", "result"):
            self._st[a], self._txt[a] = "working", msg
        elif kind == "final":
            self._st[a], self._txt[a] = "done", msg
            QTimer.singleShot(4000, lambda a=a: self._settle(a, "done"))
            if a != "main" and not any(self._st[k] in ("thinking", "working")
                                       for k in ("research", "builder") if k != a):
                self._st["main"] = self._main_hud
                self._txt["main"] = "listening"
        elif kind == "error":
            self._st[a], self._txt[a] = "error", msg
            QTimer.singleShot(6000, lambda a=a: self._settle(a, "error"))
        self.update()

    def _settle(self, a: str, expect: str):
        if self._st[a] == expect:
            self._st[a], self._txt[a] = "idle", "standing by"
            self.update()

    # ── geometry / interaction ──────────────────────────────────────────
    def _row_h(self, k: str) -> int:
        return self._ROW_H + (len(self._hist[k]) * self._LINE_H + 4 if self._open[k] else 0)

    def _resize_to_rows(self):
        self.setFixedHeight(sum(self._row_h(k) for k in self._ORDER) + 4)

    def mousePressEvent(self, ev):
        y = ev.position().y()
        acc = 0
        for k in self._ORDER:
            acc += self._row_h(k)
            if y < acc:
                self._open[k] = not self._open[k]
                break
        self._resize_to_rows()
        self.update()

    def _centers(self):
        ys, acc = [], 0
        for k in self._ORDER:
            ys.append(acc + 24)
            acc += self._row_h(k)
        return ys

    def _tick(self):
        self._phase = (self._phase + 0.06) % (2 * math.pi)
        busy = self._packet or any(v in ("thinking", "working") for v in self._st.values())
        if self._packet and time.time() - self._packet[2] > 0.55:
            self._packet = None
        if busy:
            self.update()

    # ── paint ───────────────────────────────────────────────────────────
    @staticmethod
    def _hex(cx, cy, r):
        p = QPainterPath()
        for i in range(6):
            a = math.radians(60 * i - 90)
            pt = QPointF(cx + r * math.cos(a), cy + r * math.sin(a))
            p.moveTo(pt) if i == 0 else p.lineTo(pt)
        p.closeSubpath()
        return p

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        ys = self._centers()
        sx = 14
        col = {"idle": C.TEXT_DIM, "thinking": C.PRI, "working": C.ACC,
               "done": C.GREEN, "error": C.RED}

        # spine
        p.setPen(QPen(qcol(C.BORDER_B), 1))
        p.drawLine(sx, ys[0], sx, ys[-1])
        for i in range(2):                      # lit segment when the lower node is busy
            if self._st[self._ORDER[i + 1]] in ("thinking", "working", "done"):
                p.setPen(QPen(qcol(col[self._st[self._ORDER[i + 1]]], 200), 2))
                p.drawLine(sx, ys[i], sx, ys[i + 1])

        # packet
        if self._packet:
            s, d, t0 = self._packet
            t = min(1.0, (time.time() - t0) / 0.5)
            t = t * t * (3 - 2 * t)
            y = ys[s] + (ys[d] - ys[s]) * t
            for j in range(5):
                tt = max(0.0, t - j * 0.04)
                yy = ys[s] + (ys[d] - ys[s]) * tt
                p.setPen(Qt.PenStyle.NoPen)
                p.setBrush(qcol(C.PRI, 200 - j * 40))
                p.drawEllipse(QPointF(sx, yy), 3.2 - j * 0.4, 3.2 - j * 0.4)

        for i, k in enumerate(self._ORDER):
            cy, st = ys[i], self._st[k]
            c = col[st]
            live = st in ("thinking", "working")
            if live:                                   # breathing halo
                r = 9 + 3 * (0.5 + 0.5 * math.sin(self._phase * 2 + i))
                p.setPen(QPen(qcol(c, 90), 1))
                p.setBrush(Qt.BrushStyle.NoBrush)
                p.drawPath(self._hex(sx, cy, r + 3))
            p.setPen(QPen(qcol(c), 1.6))
            p.setBrush(qcol(c, 255 if st in ("done", "error") else (70 if live else 0)))
            p.drawPath(self._hex(sx, cy, 8))
            if st == "idle":
                p.setPen(Qt.PenStyle.NoPen); p.setBrush(qcol(C.TEXT_DIM, 120))
                p.drawEllipse(QPointF(sx, cy), 1.8, 1.8)

            # text
            x0 = 32
            f = QFont("Courier New", 9, QFont.Weight.Bold)
            p.setFont(f); p.setPen(qcol(C.WHITE if st != "idle" else C.TEXT_MED))
            p.drawText(QRectF(x0, cy - 17, 100, 16), Qt.AlignmentFlag.AlignVCenter, self._LABEL[k])
            f2 = QFont("Courier New", 7); p.setFont(f2)
            p.setPen(qcol(c if st != "idle" else C.TEXT_DIM))
            p.drawText(QRectF(self.width() - 66, cy - 17, 62, 16),
                       Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignRight, st)
            p.setPen(qcol(C.TEXT_DIM if st == "idle" else C.TEXT_MED))
            fm = p.fontMetrics()
            p.drawText(QRectF(x0, cy - 1, self.width() - x0 - 4, 14), Qt.AlignmentFlag.AlignVCenter,
                       fm.elidedText(self._txt[k], Qt.TextElideMode.ElideRight, self.width() - x0 - 4))

            if self._open[k]:                              # expanded event trail
                p.setPen(qcol(C.TEXT_DIM))
                for j, line in enumerate(self._hist[k]):
                    yy = cy + 16 + j * self._LINE_H
                    p.drawText(QRectF(x0 + 6, yy, self.width() - x0 - 10, self._LINE_H),
                               Qt.AlignmentFlag.AlignVCenter,
                               fm.elidedText(line, Qt.TextElideMode.ElideRight, self.width() - x0 - 10))
        p.end()


class _Glyph(QPushButton):
    """Flat painted icon button (plus / mic / wave / send) — colours read from C."""

    def __init__(self, kind: str, size: int = 32, parent=None):
        super().__init__(parent)
        self.kind = kind
        self.active = False           # mic muted / wave animating
        self._t = 0.0
        self.setFixedSize(size, size)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFlat(True)

    def tick(self):
        self._t += 0.35
        self.update()

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        w, h = self.width(), self.height()
        cx, cy = w / 2, h / 2
        hov = self.underMouse()
        if self.kind == "send":
            p.setPen(Qt.PenStyle.NoPen)
            p.setBrush(qcol(C.WHITE if hov else C.PRI))
            p.drawEllipse(QPointF(cx, cy), w / 2 - 2, w / 2 - 2)
            pen = QPen(qcol(C.DARK), 2.0); pen.setCapStyle(Qt.PenCapStyle.RoundCap)
            pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin); p.setPen(pen)
            p.drawLine(QPointF(cx, cy + 5), QPointF(cx, cy - 5))
            p.drawLine(QPointF(cx, cy - 5), QPointF(cx - 4.5, cy - 0.5))
            p.drawLine(QPointF(cx, cy - 5), QPointF(cx + 4.5, cy - 0.5))
            p.end(); return
        col = qcol(C.PRI if hov else C.TEXT_MED)
        pen = QPen(col, 1.8); pen.setCapStyle(Qt.PenCapStyle.RoundCap)
        pen.setJoinStyle(Qt.PenJoinStyle.RoundJoin); p.setPen(pen)
        if self.kind == "plus":
            p.drawLine(QPointF(cx - 7, cy), QPointF(cx + 7, cy))
            p.drawLine(QPointF(cx, cy - 7), QPointF(cx, cy + 7))
        elif self.kind == "mic":
            if self.active:
                p.setPen(QPen(qcol(C.MUTED_C), 1.8, Qt.PenStyle.SolidLine, Qt.PenCapStyle.RoundCap))
            p.setBrush(Qt.BrushStyle.NoBrush)
            p.drawRoundedRect(QRectF(cx - 3.5, cy - 8, 7, 11), 3.5, 3.5)
            p.drawArc(QRectF(cx - 7, cy - 6, 14, 12), 180 * 16, 180 * 16)
            p.drawLine(QPointF(cx, cy + 6), QPointF(cx, cy + 9))
            if self.active:                                   # muted → slash
                p.drawLine(QPointF(cx - 7, cy + 8), QPointF(cx + 7, cy - 8))
        elif self.kind == "wave":
            base = [3, 7, 11, 6, 9, 4, 7]
            for i, hh in enumerate(base):
                amp = hh * (0.55 + 0.45 * math.sin(self._t + i * 0.9)) if self.active else hh * 0.8
                x = cx - 9 + i * 3
                p.drawLine(QPointF(x, cy - amp / 2), QPointF(x, cy + amp / 2))
        p.end()

    def enterEvent(self, e): self.update(); super().enterEvent(e)
    def leaveEvent(self, e): self.update(); super().leaveEvent(e)


class PillInput(QFrame):
    """Rounded message bar:  (+)  Write a message…            (mic)  (wave | send)"""

    def __init__(self, placeholder: str, parent=None):
        super().__init__(parent)
        self.setFixedHeight(46)
        self.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, False)
        lay = QHBoxLayout(self)
        lay.setContentsMargins(8, 0, 8, 0)
        lay.setSpacing(2)
        self.attach = _Glyph("plus")
        self.attach.setToolTip("Attach a file")
        lay.addWidget(self.attach)
        self.line = QLineEdit()
        self.line.setPlaceholderText(placeholder)
        self.line.setFont(QFont("Segoe UI", 10))
        self.line.setStyleSheet(
            f"QLineEdit {{ background: transparent; border: none; color: {C.WHITE}; "
            f"selection-background-color: {C.PRI_DIM}; }}")
        self.line.installEventFilter(self)
        self.line.textChanged.connect(self._sync)
        lay.addWidget(self.line, 1)
        self.mic = _Glyph("mic")
        self.mic.setToolTip("Mute / unmute microphone")
        lay.addWidget(self.mic)
        self.wave = _Glyph("wave")
        self.wave.setToolTip("Voice mode is on — just speak")
        self.wave.setEnabled(False)
        lay.addWidget(self.wave)
        self.send = _Glyph("send")
        self.send.setToolTip("Send")
        lay.addWidget(self.send)
        self.send.hide()
        self._anim = QTimer(self)
        self._anim.timeout.connect(self.wave.tick)

    def _sync(self, txt: str):
        has = bool(txt.strip())
        self.send.setVisible(has)
        self.wave.setVisible(not has)

    def set_muted(self, muted: bool):
        self.mic.active = muted
        self.mic.setToolTip("Unmute microphone" if muted else "Mute microphone")
        self.mic.update()

    def set_speaking(self, on: bool):
        self.wave.active = on
        (self._anim.start(60) if on else self._anim.stop())
        self.wave.update()

    def eventFilter(self, obj, ev):
        if obj is self.line and ev.type() in (ev.Type.FocusIn, ev.Type.FocusOut):
            self.update()
        return super().eventFilter(obj, ev)

    def paintEvent(self, _):
        p = QPainter(self)
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        r = QRectF(self.rect()).adjusted(1, 1, -1, -1)
        p.setBrush(qcol(C.BAR_BG))
        p.setPen(QPen(qcol(C.PRI if self.line.hasFocus() else C.BORDER_B), 1.2))
        p.drawRoundedRect(r, 15, 15)
        p.end()



# ════════════════════════════════════════════════════════════════════════════
#  CHAT HISTORY — persistent sessions + sidebar list + read-only viewer
# ════════════════════════════════════════════════════════════════════════════
def _fmt_when(ts: float) -> str:
    d = datetime.fromtimestamp(ts)
    days = (datetime.now().date() - d.date()).days
    if days == 0:
        return f"Today {d:%H:%M}"
    if days == 1:
        return f"Yesterday {d:%H:%M}"
    return f"{d:%d %b}"


class ChatStore:
    """Saves conversations to memory/chat_history.json (one session per chat)."""
    MAX_SESSIONS = 60
    MAX_MSGS = 600
    DEFAULT_PATH = None

    def __init__(self, path=None):
        self.path = Path(path or self.DEFAULT_PATH or (_base_dir() / "memory" / "chat_history.json"))
        self.sessions: list[dict] = []
        self.cur: dict | None = None
        try:
            if self.path.exists():
                data = json.loads(self.path.read_text(encoding="utf-8"))
                self.sessions = [x for x in data.get("sessions", [])
                                 if isinstance(x, dict) and x.get("msgs")]
        except Exception as e:
            print(f"[History] could not read {self.path.name}: {e}")

    def _save(self):
        try:
            self.path.parent.mkdir(parents=True, exist_ok=True)
            tmp = self.path.with_suffix(".tmp")
            tmp.write_text(json.dumps({"sessions": self.sessions}, ensure_ascii=False),
                           encoding="utf-8")
            os.replace(tmp, self.path)
        except Exception as e:
            print(f"[History] could not save: {e}")

    def new_session(self):
        self.cur = None

    def add(self, user: str, kind: str, text: str):
        now = time.time()
        if self.cur is None:
            self.cur = {"id": str(int(now * 1000)), "user": user, "started": now,
                        "title": "", "msgs": []}
            self.sessions.append(self.cur)
            if len(self.sessions) > self.MAX_SESSIONS:
                self.sessions = self.sessions[-self.MAX_SESSIONS:]
        if not self.cur["title"] and kind == "you":
            self.cur["title"] = (text.split(":", 1)[1] if ":" in text else text).strip()[:60]
        self.cur["msgs"].append([now, kind, text])
        if len(self.cur["msgs"]) > self.MAX_MSGS:
            self.cur["msgs"] = self.cur["msgs"][-self.MAX_MSGS:]
        self._save()

    def list(self, user: str) -> list[dict]:
        return sorted((x for x in self.sessions if x.get("user", "") == user),
                      key=lambda x: x["started"], reverse=True)

    def get(self, sid: str) -> dict | None:
        return next((x for x in self.sessions if x["id"] == sid), None)

    def delete(self, sid: str):
        self.sessions = [x for x in self.sessions if x["id"] != sid]
        if self.cur and self.cur["id"] == sid:
            self.cur = None
        self._save()


class _HistDelegate(QStyledItemDelegate):
    def sizeHint(self, opt, idx):
        return QSize(opt.rect.width(), 46)

    def paint(self, p, opt, idx):
        p.save()
        p.setRenderHint(QPainter.RenderHint.Antialiasing)
        r = QRectF(opt.rect).adjusted(0, 2, 0, -2)
        hov = bool(opt.state & QStyle.StateFlag.State_MouseOver)
        sel = bool(opt.state & QStyle.StateFlag.State_Selected)
        if hov or sel:
            p.setPen(QPen(qcol(C.PRI if sel else C.BORDER_B), 1))
            p.setBrush(qcol(C.PRI_GHO))
            p.drawRoundedRect(r, 6, 6)
        w = int(r.width() - 20)
        p.setFont(QFont("Segoe UI", 9)); p.setPen(qcol(C.WHITE))
        title = p.fontMetrics().elidedText(str(idx.data(Qt.ItemDataRole.DisplayRole)),
                                           Qt.TextElideMode.ElideRight, w)
        p.drawText(QRectF(r.x() + 10, r.y() + 5, w, 18), Qt.AlignmentFlag.AlignVCenter, title)
        p.setFont(QFont("Courier New", 7)); p.setPen(qcol(C.TEXT_DIM))
        p.drawText(QRectF(r.x() + 10, r.y() + 24, w, 14), Qt.AlignmentFlag.AlignVCenter,
                   str(idx.data(Qt.ItemDataRole.UserRole + 1)))
        p.restore()


class HistoryList(QWidget):
    """Sidebar panel: header + ＋NEW + list of past chats."""
    open_requested   = pyqtSignal(str)
    delete_requested = pyqtSignal(str)
    new_requested    = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("background: transparent; border: none;")
        lay = QVBoxLayout(self)
        lay.setContentsMargins(0, 4, 0, 0)
        lay.setSpacing(6)
        head = QHBoxLayout(); head.setContentsMargins(0, 0, 0, 0)
        t = QLabel("▸ CHAT HISTORY")
        t.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        t.setStyleSheet(f"color: {C.TEXT_MED}; background: transparent;")
        head.addWidget(t); head.addStretch(1)
        self._new = QPushButton("＋ NEW")
        self._new.setFixedHeight(20)
        self._new.setFont(QFont("Courier New", 7, QFont.Weight.Bold))
        self._new.setCursor(Qt.CursorShape.PointingHandCursor)
        self._new.setToolTip("Start a fresh chat (the current one stays saved)")
        self._new.setStyleSheet(f"""
            QPushButton {{ color: {C.PRI}; background: transparent; border: 1px solid {C.BORDER_B};
                           border-radius: 3px; padding: 0 8px; }}
            QPushButton:hover {{ background: {C.PRI_GHO}; border-color: {C.PRI}; }}
        """)
        self._new.clicked.connect(self.new_requested.emit)
        head.addWidget(self._new)
        lay.addLayout(head)

        self._list = QListWidget()
        self._list.setFrameShape(QFrame.Shape.NoFrame)
        self._list.setItemDelegate(_HistDelegate(self._list))
        self._list.setMouseTracking(True)
        self._list.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self._list.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self._list.setCursor(Qt.CursorShape.PointingHandCursor)
        self._list.setStyleSheet(f"""
            QListWidget {{ background: transparent; border: none; outline: none; }}
            QScrollBar:vertical {{ background: transparent; width: 6px; border: none; }}
            QScrollBar::handle:vertical {{ background: {C.BORDER_B}; border-radius: 3px; min-height: 20px; }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{ height: 0; }}
        """)
        self._list.itemClicked.connect(lambda it: self.open_requested.emit(it.data(Qt.ItemDataRole.UserRole)))
        self._list.customContextMenuRequested.connect(self._menu)
        lay.addWidget(self._list, 1)

        self._empty = QLabel("No past chats yet.\nYour conversations are saved here.")
        self._empty.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._empty.setWordWrap(True)
        self._empty.setFont(QFont("Courier New", 8))
        self._empty.setStyleSheet(f"color: {C.TEXT_DIM}; background: transparent;")
        lay.addWidget(self._empty, 1)

    def _menu(self, pos):
        it = self._list.itemAt(pos)
        if not it:
            return
        m = QMenu(self)
        m.setStyleSheet(f"""
            QMenu {{ background: {C.PANEL}; color: {C.WHITE}; border: 1px solid {C.BORDER_B}; padding: 4px; }}
            QMenu::item {{ padding: 6px 18px; border-radius: 3px; }}
            QMenu::item:selected {{ background: {C.PRI_GHO}; color: {C.PRI}; }}
        """)
        a_open = m.addAction("Open")
        a_del = m.addAction("Delete this chat")
        act = m.exec(self._list.viewport().mapToGlobal(pos))
        sid = it.data(Qt.ItemDataRole.UserRole)
        if act is a_open:
            self.open_requested.emit(sid)
        elif act is a_del:
            self.delete_requested.emit(sid)

    def refresh(self, sessions: list[dict]):
        self._list.clear()
        for x in sessions:
            n = sum(1 for m in x["msgs"] if m[1] in ("you", "ai"))
            it = QListWidgetItem(x.get("title") or "(untitled chat)")
            it.setData(Qt.ItemDataRole.UserRole, x["id"])
            it.setData(Qt.ItemDataRole.UserRole + 1, f"{_fmt_when(x['started'])}  ·  {n} msgs")
            self._list.addItem(it)
        self._list.setVisible(bool(sessions))
        self._empty.setVisible(not sessions)


class HistoryViewer(QDialog):
    """Read-only transcript of a saved chat."""
    delete_clicked = pyqtSignal(str)

    def __init__(self, session: dict, ai_name: str, parent=None):
        super().__init__(parent)
        self._sid = session["id"]
        self.setWindowTitle("Chat history")
        self.resize(700, 580)
        self.setStyleSheet(f"QDialog {{ background: {C.BG}; }}")
        lay = QVBoxLayout(self)
        lay.setContentsMargins(18, 16, 18, 14)
        lay.setSpacing(10)
        t = QLabel(session.get("title") or "(untitled chat)")
        t.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        t.setStyleSheet(f"color: {C.WHITE}; background: transparent;")
        t.setWordWrap(True)
        n = sum(1 for m in session["msgs"] if m[1] in ("you", "ai"))
        sub = QLabel(f"{datetime.fromtimestamp(session['started']):%d %b %Y, %H:%M}   ·   {n} messages")
        sub.setFont(QFont("Courier New", 8))
        sub.setStyleSheet(f"color: {C.TEXT_MED}; background: transparent;")
        lay.addWidget(t); lay.addWidget(sub)

        self.thread = ChatThread()
        self.thread._ai_name_lc = ai_name.lower()
        self.thread._stick = False
        for _ts, _kind, text in session["msgs"]:
            self.thread.append_log(text)
        lay.addWidget(self.thread, 1)
        QTimer.singleShot(60, lambda: self.thread.verticalScrollBar().setValue(0))

        row = QHBoxLayout()
        d = QPushButton("Delete this chat")
        c = QPushButton("Close")
        for b, col in ((d, C.MUTED_C), (c, C.PRI)):
            b.setFixedHeight(30); b.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
            b.setCursor(Qt.CursorShape.PointingHandCursor)
            b.setStyleSheet(f"""
                QPushButton {{ color: {col}; background: transparent; border: 1px solid {col};
                               border-radius: 4px; padding: 0 16px; }}
                QPushButton:hover {{ background: {C.PRI_GHO}; }}
            """)
        d.clicked.connect(lambda: (self.delete_clicked.emit(self._sid), self.accept()))
        c.clicked.connect(self.accept)
        row.addWidget(d); row.addStretch(1); row.addWidget(c)
        lay.addLayout(row)


class MainWindow(QMainWindow):
    _log_sig        = pyqtSignal(str)
    _state_sig      = pyqtSignal(str)
    _content_sig    = pyqtSignal(str, str)   # (title, text) — thread-safe content display
    _reconfig_sig   = pyqtSignal()           # trigger setup overlay from any thread
    _camera_sig     = pyqtSignal(bytes)      # show camera frame preview (small overlay)
    _cam_stream_sig = pyqtSignal(bool)       # True=start live stream, False=stop
    _cam_frame_sig  = pyqtSignal(bytes)      # live camera frame → HUD area
    _clipboard_sig  = pyqtSignal(str)        # clipboard text changed (thread-safe)

    def __init__(self, face_path: str):
        super().__init__()
        self._face_path = face_path

        # Load customization from config
        _cfg = _read_full_config()
        self._assistant_name: str = _norm_name(_cfg.get("assistant_name"))
        _display = self._assistant_name.upper()

        # Kayıtlı UI rengini panel/stylesheet'ler kurulmadan ÖNCE uygula
        _ui_color = (_cfg.get("ui_color") or "").strip()
        if _ui_color and _ui_color.lower() != DEFAULT_UI_COLOR:
            apply_ui_accent(_ui_color)

        self.setWindowTitle(f"{_display} — {APP_TEAM.title()}")
        self.setMinimumSize(_MIN_W, _MIN_H)
        self.resize(_DEFAULT_W, _DEFAULT_H)

        screen = QApplication.primaryScreen().availableGeometry()
        self.move(
            (screen.width()  - _DEFAULT_W) // 2,
            (screen.height() - _DEFAULT_H) // 2,
        )

        self.on_text_command   = None
        self.on_interrupt      = None   # callable: () -> None — stop Nirmaraksh mid-speech
        self._muted            = False
        self._current_file: str | None = None
        self._customize_overlay: CustomizeOverlay | None = None

        central = QWidget()
        central.setStyleSheet(f"background: {C.BG};")
        self.setCentralWidget(central)

        root = QVBoxLayout(central)
        root.setContentsMargins(0, 0, 0, 0)
        root.setSpacing(0)
        root.addWidget(self._build_header())

        body = QHBoxLayout()
        body.setContentsMargins(0, 0, 0, 0)
        body.setSpacing(0)

        self._left_panel = self._build_left_panel()
        body.addWidget(self._left_panel, stretch=0)

        # Center column: HUD + resizable content panel via QSplitter
        self.hud = HudCanvas(face_path, _display)
        self.hud.setSizePolicy(QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding)
        self._content_panel = self._build_content_panel()

        # Live camera container — replaces HUD when camera stream is active
        _cam_cont = QWidget()
        _cam_cont.setStyleSheet("background: #000308;")
        _cam_v = QVBoxLayout(_cam_cont)
        _cam_v.setContentsMargins(0, 0, 0, 0)
        _cam_v.setSpacing(0)
        _cam_hdr = QHBoxLayout()
        _cam_hdr.setContentsMargins(8, 5, 8, 5)
        _cam_title = QLabel("◈  CAMERA FEED")
        _cam_title.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        _cam_title.setStyleSheet(f"color: {C.PRI}; background: transparent;")
        _cam_hdr.addWidget(_cam_title)
        _cam_hdr.addStretch()
        _cam_x = QPushButton("✕  CLOSE")
        _cam_x.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        _cam_x.setCursor(Qt.CursorShape.PointingHandCursor)
        _cam_x.setStyleSheet(f"""
            QPushButton {{
                color: {C.TEXT_DIM}; background: transparent;
                border: none; padding: 2px 6px;
            }}
            QPushButton:hover {{ color: {C.PRI}; }}
        """)
        _cam_x.clicked.connect(self.stop_camera_stream)
        _cam_hdr.addWidget(_cam_x)
        _cam_v.addLayout(_cam_hdr)
        self._cam_live_lbl = QLabel()
        self._cam_live_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._cam_live_lbl.setStyleSheet("background: transparent;")
        self._cam_live_lbl.setSizePolicy(
            QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding
        )
        _cam_v.addWidget(self._cam_live_lbl, stretch=1)

        # Stack: 0 = animated HUD, 1 = live camera
        self._hud_cam_stack = QStackedWidget()
        self._hud_cam_stack.addWidget(self.hud)
        self._hud_cam_stack.addWidget(_cam_cont)

        self._center_split = QSplitter(Qt.Orientation.Vertical)
        self._center_split.setStyleSheet(f"""
            QSplitter::handle {{
                background: {C.BORDER};
                height: 4px;
            }}
            QSplitter::handle:hover {{
                background: {C.PRI_DIM};
            }}
        """)
        self._log = ChatThread()
        self._log.setMinimumHeight(120)
        self._center_split.addWidget(self._hud_cam_stack)
        self._center_split.addWidget(self._log)
        self._center_split.addWidget(self._content_panel)
        self._center_split.setStretchFactor(0, 5)
        self._center_split.setStretchFactor(1, 4)
        self._center_split.setStretchFactor(2, 1)
        self._center_split.setCollapsible(0, False)
        self._center_split.setCollapsible(1, False)

        center = QWidget()
        cv = QVBoxLayout(center)
        cv.setContentsMargins(0, 0, 0, 0)
        cv.setSpacing(0)
        cv.addWidget(self._center_split, stretch=1)

        dock = QWidget()
        dh = QHBoxLayout(dock)
        dh.setContentsMargins(24, 6, 24, 14)
        holder = QWidget()
        holder.setMaximumWidth(780)
        holder.setStyleSheet("background: transparent;")
        holder.setLayout(self._build_input_row())
        dh.addStretch(1)
        dh.addWidget(holder, 100)
        dh.addStretch(1)
        cv.addWidget(dock)
        body.addWidget(center, stretch=5)

        self._right_panel = self._build_right_panel()
        body.addWidget(self._right_panel, stretch=0)

        root.addLayout(body, stretch=1)
        root.addWidget(self._build_footer())

        # Quick-access drawer (floating overlay, built after central widget layout is done)
        self._quick_drawer = self._build_quick_drawer()
        self._update_autostart_btn(self._check_autostart())
        from memory.config_manager import get_brief_enabled as _gbe
        self._update_brief_btn(_gbe())

        self._clock_tmr = QTimer(self)
        self._clock_tmr.timeout.connect(self._tick_clock)
        self._clock_tmr.start(1000)
        self._tick_clock()

        # Metrik güncelleme timer'ı
        self._metric_tmr = QTimer(self)
        self._metric_tmr.timeout.connect(self._update_metrics)
        self._metric_tmr.start(2000)
        self._update_metrics()

        self._log_sig.connect(self._log.append_log)
        self._state_sig.connect(self._apply_state)
        self._content_sig.connect(self._show_content)
        self._reconfig_sig.connect(self._show_setup)
        self._camera_sig.connect(self._show_camera_frame)
        self._cam_stream_sig.connect(self._on_cam_stream)
        self._cam_frame_sig.connect(self._on_cam_frame)
        self._clipboard_sig.connect(self._show_clipboard_panel)
        self._cam_stop = threading.Event()

        # Camera preview overlay (child of central widget, positioned in resizeEvent)
        self._cam_preview = _CameraPreview(self.centralWidget())

        # Clipboard panel (child of central widget, bottom-center)
        self._clipboard_panel = ClipboardPanel(self.centralWidget())
        self._clipboard_panel.action_requested.connect(self._on_clipboard_action)
        QApplication.clipboard().dataChanged.connect(self._on_clipboard_changed)

        self._overlay: SetupOverlay | None = None
        self._ready = self._check_config()
        if not self._ready:
            self._show_setup()

        sc_mute = QShortcut(QKeySequence("F4"), self)
        sc_mute.activated.connect(self._toggle_mute)
        sc_full = QShortcut(QKeySequence("F11"), self)
        sc_full.activated.connect(self._toggle_fullscreen)
        sc_intr = QShortcut(QKeySequence("Escape"), self)
        sc_intr.activated.connect(self._do_interrupt)

        # ── Login / sign-up gate (covers the whole HUD until authenticated) ──
        self._authed = False
        self._user_name = ""
        self._auth_page: AuthGate | None = None

        # ── chat history ──
        self._store = ChatStore()
        self._log.message_added.connect(self._on_chat_message)
        self._history.new_requested.connect(self._new_chat)
        self._history.open_requested.connect(self._open_history)
        self._history.delete_requested.connect(self._delete_history)
        self._refresh_history()

        self._show_auth()

    def _show_camera_frame(self, img_bytes: bytes):
        """Slot — display camera preview overlay (main thread)."""
        self._cam_preview.show_frame(img_bytes)
        cw = self.centralWidget()
        pw = _CameraPreview._W
        ph = self._cam_preview.height()
        self._cam_preview.setGeometry(
            cw.width() - _RIGHT_W - pw - 12,
            cw.height() - ph - 28,
            pw, ph,
        )

    # --- Live camera stream in HUD area ------------------------------------
    def _on_cam_stream(self, start: bool) -> None:
        if start:
            self._hud_cam_stack.setCurrentIndex(1)
        else:
            self._hud_cam_stack.setCurrentIndex(0)
            self._cam_live_lbl.clear()

    def _on_cam_frame(self, data: bytes) -> None:
        px = QPixmap()
        px.loadFromData(data)
        if not px.isNull():
            w, h = self._cam_live_lbl.width(), self._cam_live_lbl.height()
            if w > 1 and h > 1:
                self._cam_live_lbl.setPixmap(
                    px.scaled(w, h,
                              Qt.AspectRatioMode.KeepAspectRatio,
                              Qt.TransformationMode.SmoothTransformation)
                )

    def start_camera_stream(self) -> None:
        self._cam_stop.clear()
        self._cam_stream_sig.emit(True)
        t = threading.Thread(target=self._cam_loop, daemon=True, name="cam-stream")
        t.start()

    def _cam_loop(self) -> None:
        try:
            import cv2
            # Reuse camera index detected by screen_processor (cached in api_keys.json)
            cam_idx = 0
            try:
                import json as _j
                cfg = _j.loads((CONFIG_DIR / "api_keys.json").read_text())
                cam_idx = int(cfg.get("camera_index", 0))
            except Exception:
                pass
            try:
                backend = cv2.CAP_DSHOW if _OS == "Windows" else cv2.CAP_ANY
            except AttributeError:
                backend = 0
            cap = cv2.VideoCapture(cam_idx, backend)
            if not cap.isOpened():
                cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                return
            # warm-up frames
            for _ in range(5):
                cap.read()
            while not self._cam_stop.wait(0.033) and cap.isOpened():
                ret, frame = cap.read()
                if ret and frame is not None:
                    _, buf = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 65])
                    self._cam_frame_sig.emit(buf.tobytes())
            cap.release()
        except Exception as e:
            print(f"[Camera] Stream error: {e}")
        finally:
            self._cam_stream_sig.emit(False)

    def stop_camera_stream(self) -> None:
        self._cam_stop.set()

    # ------------------------------------------------------------------
    # Icon generation — arc-reactor style, rendered with Pillow
    # ------------------------------------------------------------------
    @staticmethod
    def _build_Nirmaraksh_icon(out_path: Path) -> bool:
        """
        Render a Nirmaraksh arc-reactor icon at 4× resolution and downsample
        for crisp results at all sizes. Saves a multi-res .ico to out_path.
        Returns True on success.
        """
        try:
            import math
            import PIL.Image
            import PIL.ImageDraw
            import PIL.ImageFilter
        except ImportError:
            return False

        CYAN   = (0, 212, 255)
        DIM    = (0, 100, 140)
        DARK   = (0, 6, 10)
        GLOW   = (0, 160, 200)
        WHITE  = (220, 240, 255)

        def _render(sz: int) -> PIL.Image.Image:
            S  = sz * 4                     # draw at 4× then downscale
            img = PIL.Image.new("RGBA", (S, S), (0, 0, 0, 0))
            d   = PIL.ImageDraw.Draw(img)
            cx = cy = S // 2

            # ── filled background circle ──────────────────────────────────
            R = S // 2 - 2
            d.ellipse([cx-R, cy-R, cx+R, cy+R], fill=(*DARK, 255))

            # ── outer border ring ─────────────────────────────────────────
            lw = max(2, S // 40)
            d.ellipse([cx-R, cy-R, cx+R, cy+R],
                      outline=(*CYAN, 220), width=lw)

            # ── mid decorative ring ───────────────────────────────────────
            R2 = int(R * 0.72)
            d.ellipse([cx-R2, cy-R2, cx+R2, cy+R2],
                      outline=(*DIM, 180), width=max(1, lw // 2))

            # ── 6 radial spokes (hex bolt) ────────────────────────────────
            R_inner = int(R * 0.30)
            R_outer = int(R * 0.62)
            spoke_w = max(1, S // 80)
            for i in range(6):
                angle = math.radians(i * 60 - 30)
                x1 = cx + int(R_inner * math.cos(angle))
                y1 = cy + int(R_inner * math.sin(angle))
                x2 = cx + int(R_outer * math.cos(angle))
                y2 = cy + int(R_outer * math.sin(angle))
                d.line([x1, y1, x2, y2], fill=(*GLOW, 200), width=spoke_w)

            # ── 6 tick marks on outer ring ────────────────────────────────
            for i in range(6):
                angle = math.radians(i * 60)
                for dr in range(lw * 2):
                    rx = (R - lw - dr)
                    d.point(
                        [cx + int(rx * math.cos(angle)),
                         cy + int(rx * math.sin(angle))],
                        fill=(*WHITE, 220),
                    )

            # ── inner glowing ring ────────────────────────────────────────
            Ri = int(R * 0.26)
            d.ellipse([cx-Ri, cy-Ri, cx+Ri, cy+Ri],
                      outline=(*CYAN, 255), width=max(2, lw))

            # ── bright glow soft blur applied before core ─────────────────
            # (draw a slightly larger cyan circle on a separate layer)
            glow_layer = PIL.Image.new("RGBA", (S, S), (0, 0, 0, 0))
            gd = PIL.ImageDraw.Draw(glow_layer)
            Rc = int(R * 0.13)
            gd.ellipse([cx-Rc*2, cy-Rc*2, cx+Rc*2, cy+Rc*2],
                       fill=(*CYAN, 110))
            glow_layer = glow_layer.filter(PIL.ImageFilter.GaussianBlur(S // 14))
            img = PIL.Image.alpha_composite(img, glow_layer)
            d   = PIL.ImageDraw.Draw(img)

            # ── core dot ──────────────────────────────────────────────────
            d.ellipse([cx-Rc, cy-Rc, cx+Rc, cy+Rc], fill=(*WHITE, 255))

            # ── downscale to target size ──────────────────────────────────
            return img.resize((sz, sz), PIL.Image.LANCZOS)

        try:
            sizes  = [256, 128, 64, 48, 32, 16]
            frames = [_render(s) for s in sizes]
            frames[0].save(
                out_path,
                format="ICO",
                append_images=frames[1:],
                sizes=[(s, s) for s in sizes],
            )
            return True
        except Exception as e:
            print(f"[Shortcut] ⚠️  Icon generation failed: {e}")
            return False

    @staticmethod
    def _create_lnk_windows(lnk: str, target: str, args: str,
                             work_dir: str, icon_loc: str) -> None:
        """
        Create a Windows .lnk shortcut WITHOUT launching PowerShell or cmd.
        Tries win32com (pywin32) first; falls back to wscript.exe + VBScript.
        wscript.exe is a GUI-mode host — it never opens a console window.
        """
        # ── Option 1: pywin32 (pure Python COM, zero subprocess) ──────────
        try:
            from win32com.client import Dispatch   # type: ignore
            sh = Dispatch("WScript.Shell")
            sc = sh.CreateShortCut(lnk)
            sc.TargetPath       = target
            sc.Arguments        = f'"{args}"'
            sc.WorkingDirectory = work_dir
            sc.Description      = "Nirmaraksh AI Assistant"
            sc.IconLocation     = icon_loc
            sc.save()
            return
        except ImportError:
            pass

        # ── Option 2: wscript.exe + VBScript (always available on Windows,
        #    GUI-mode executable — never opens a console window) ────────────
        vbs = "\n".join([
            'Set ws = CreateObject("WScript.Shell")',
            f'Set sc = ws.CreateShortcut("{lnk}")',
            f'sc.TargetPath = "{target}"',
            f'sc.Arguments = Chr(34) & "{args}" & Chr(34)',
            f'sc.WorkingDirectory = "{work_dir}"',
            'sc.Description = "Nirmaraksh AI Assistant"',
            f'sc.IconLocation = "{icon_loc}"',
            'sc.Save',
        ])
        import tempfile
        fd, tmp = tempfile.mkstemp(suffix=".vbs")
        try:
            with os.fdopen(fd, "w", encoding="utf-8") as f:
                f.write(vbs)
            proc = subprocess.Popen(
                ["wscript.exe", "/nologo", tmp],
                creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NO_WINDOW,
            )
            proc.wait(timeout=10)
        finally:
            try:
                os.unlink(tmp)
            except Exception:
                pass

    @staticmethod
    def _get_desktop_dir() -> Path:
        """
        Resolve the user's REAL desktop directory instead of assuming
        ~/Desktop, which breaks when:
          • OneDrive "Known Folder Move" relocates the desktop
            (C:/Users/x/OneDrive/Desktop) — very common on Win 10/11;
          • the XDG desktop is localized on Linux (~/Masaüstü,
            ~/Schreibtisch, ~/Bureau, …).
        Falls back to ~/Desktop only as a last resort.
        """
        home = Path.home()
        _os = platform.system()

        if _os == "Windows":
            # ── 1) SHGetKnownFolderPath(FOLDERID_Desktop) — the canonical
            #       answer; follows OneDrive redirection. No dependencies. ──
            try:
                import ctypes
                from ctypes import wintypes

                class _GUID(ctypes.Structure):
                    _fields_ = [("Data1", wintypes.DWORD),
                                ("Data2", wintypes.WORD),
                                ("Data3", wintypes.WORD),
                                ("Data4", ctypes.c_ubyte * 8)]

                # FOLDERID_Desktop {B4BFCC3A-DB2C-424C-B029-7FE99A87C641}
                fid = _GUID(0xB4BFCC3A, 0xDB2C, 0x424C,
                            (ctypes.c_ubyte * 8)(0xB0, 0x29, 0x7F, 0xE9,
                                                 0x9A, 0x87, 0xC6, 0x41))
                buf = ctypes.c_wchar_p()
                if ctypes.windll.shell32.SHGetKnownFolderPath(
                        ctypes.byref(fid), 0, None, ctypes.byref(buf)) == 0:
                    p = Path(buf.value)
                    ctypes.windll.ole32.CoTaskMemFree(buf)
                    if p.is_dir():
                        return p
            except Exception:
                pass

            # ── 2) Registry: User Shell Folders (may contain %VARS%) ──────
            try:
                import winreg
                with winreg.OpenKey(
                        winreg.HKEY_CURRENT_USER,
                        r"Software\Microsoft\Windows\CurrentVersion"
                        r"\Explorer\User Shell Folders") as key:
                    val, _t = winreg.QueryValueEx(key, "Desktop")
                p = Path(os.path.expandvars(val))
                if p.is_dir():
                    return p
            except Exception:
                pass

        elif _os == "Linux":
            # ── xdg-user-dir honours localized names (~/Masaüstü, …) ──────
            try:
                out = subprocess.run(["xdg-user-dir", "DESKTOP"],
                                     capture_output=True, text=True, timeout=5)
                p = Path(out.stdout.strip())
                if out.stdout.strip() and p != home and p.is_dir():
                    return p
            except Exception:
                pass
            try:
                cfg = home / ".config" / "user-dirs.dirs"
                for line in cfg.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line.startswith("XDG_DESKTOP_DIR"):
                        val = line.split("=", 1)[1].strip().strip('"')
                        p = Path(val.replace("$HOME", str(home)))
                        if p != home and p.is_dir():
                            return p
            except Exception:
                pass

        # macOS: ~/Desktop is always the real path (localization is
        # display-only). Everything else lands here as a last resort.
        return home / "Desktop"

    def _create_desktop_shortcut(self):
        """
        Create a desktop shortcut on Windows / macOS / Linux.
        Never opens a terminal, console, or PowerShell window on any platform.
        """
        import stat as _stat
        script  = Path(__file__).resolve().parent / "main.py"
        python  = Path(sys.executable)
        desktop = self._get_desktop_dir()

        # Arc-reactor icon (.ico — also exported as .png for Linux/macOS)
        ico_path = Path(__file__).resolve().parent / "config" / "Nirmaraksh.ico"
        if not ico_path.exists():
            self._build_Nirmaraksh_icon(ico_path)

        try:
            _os = platform.system()

            # ── Windows ───────────────────────────────────────────────────────
            if _os == "Windows":
                pythonw  = python.parent / "pythonw.exe"
                target   = str(pythonw if pythonw.exists() else python)
                lnk      = str(desktop / "Nirmaraksh.lnk")
                icon_loc = str(ico_path) if ico_path.exists() else f"{target},0"
                self._create_lnk_windows(lnk, target, str(script),
                                         str(script.parent), icon_loc)

            # ── macOS — proper .app bundle (no Terminal window) ───────────────
            elif _os == "Darwin":
                app     = desktop / "Nirmaraksh.app"
                mac_dir = app / "Contents" / "MacOS"
                res_dir = app / "Contents" / "Resources"
                mac_dir.mkdir(parents=True, exist_ok=True)
                res_dir.mkdir(exist_ok=True)

                # Launcher executable (bash — runs as background process,
                # macOS does NOT open Terminal for executables inside .app bundles)
                launcher = mac_dir / "Nirmaraksh"
                launcher.write_text(
                    "#!/usr/bin/env bash\n"
                    f'cd "{script.parent}"\n'
                    f'exec "{python}" "{script}"\n'
                )
                launcher.chmod(launcher.stat().st_mode
                               | _stat.S_IEXEC | _stat.S_IXGRP | _stat.S_IXOTH)

                # Minimal Info.plist (required for .app recognition)
                (app / "Contents" / "Info.plist").write_text(
                    '<?xml version="1.0" encoding="UTF-8"?>\n'
                    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" '
                    '"http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
                    '<plist version="1.0"><dict>\n'
                    '  <key>CFBundleExecutable</key><string>Nirmaraksh</string>\n'
                    '  <key>CFBundleIdentifier</key>'
                    '<string>com.Nirmaraksh.assistant</string>\n'
                    '  <key>CFBundleName</key><string>Nirmaraksh</string>\n'
                    '  <key>CFBundlePackageType</key><string>APPL</string>\n'
                    '  <key>CFBundleVersion</key><string>1.0</string>\n'
                    '</dict></plist>\n'
                )

                # Optional: copy icon as .icns (skip silently if Pillow is missing)
                try:
                    import PIL.Image
                    icns = res_dir / "AppIcon.icns"
                    PIL.Image.open(ico_path).save(icns, format="ICNS")
                    # Inject icon reference into plist
                    plist = app / "Contents" / "Info.plist"
                    txt = plist.read_text()
                    plist.write_text(
                        txt.replace(
                            '</dict></plist>',
                            '  <key>CFBundleIconFile</key>'
                            '<string>AppIcon</string>\n</dict></plist>\n',
                        )
                    )
                except Exception:
                    pass  # icon is optional

            # ── Linux — .desktop file (Terminal=false, no console) ────────────
            else:
                # Export .ico → .png for better desktop integration
                png_path = ico_path.with_suffix(".png")
                if not png_path.exists() and ico_path.exists():
                    try:
                        import PIL.Image
                        PIL.Image.open(ico_path).resize(
                            (256, 256), PIL.Image.LANCZOS
                        ).save(png_path, format="PNG")
                    except Exception:
                        png_path = ico_path  # fallback to .ico

                icon_line = f"Icon={png_path}\n" if png_path.exists() else ""
                desk = desktop / "Nirmaraksh.desktop"
                desk.write_text(
                    "[Desktop Entry]\n"
                    "Name=Nirmaraksh\n"
                    f"Exec={python} {script}\n"
                    f"Path={script.parent}\n"
                    "Type=Application\n"
                    "Terminal=false\n"
                    "Categories=Utility;\n"
                    + icon_line
                )
                desk.chmod(desk.stat().st_mode | 0o755)

            self._log.append_log("SYS: Desktop shortcut created.")
        except Exception as e:
            self._log.append_log(f"ERR: Shortcut failed — {e}")

    def _toggle_fullscreen(self):
        if self.isFullScreen():
            self.showNormal()
        else:
            self.showFullScreen()

    # ── authentication gate ────────────────────────────────────────────────
    def _auth_palette(self) -> dict:
        return {"bg": C.BG, "panel": C.PANEL, "border": C.BORDER_B,
                "text": C.WHITE, "text_dim": C.TEXT_DIM,
                "primary": C.PRI, "primary_hover": C.WHITE,
                "on_primary": C.DARK, "danger": C.RED}

    def _show_auth(self):
        if self._auth_page is not None:
            self._auth_page.deleteLater()
        cw = self.centralWidget()
        gate = AuthGate(self._auth_palette(), app_name=self._assistant_name.upper(),
                        parent=cw, hud=True)
        gate.setAttribute(Qt.WidgetAttribute.WA_StyledBackground, True)
        gate.setGeometry(cw.rect())
        gate.authenticated.connect(self._on_authenticated)
        gate.show()
        gate.raise_()
        self._auth_page = gate
        self._authed = False
        self._quick_drawer.hide()
        self._drawer_btn.setChecked(False)
        # signal is connected now -> safe to try a saved session (stay
        # logged in across restarts). A brief, synchronous network call;
        # if it fails or there's nothing saved, the login form just sits
        # there as normal.
        gate.try_restore_session()

    # ── chat history helpers ───────────────────────────────────────────────
    def _refresh_history(self):
        self._history.refresh(self._store.list(self._user_name))

    def _on_chat_message(self, kind: str, text: str):
        self._store.add(self._user_name, kind, text)
        self._refresh_history()

    def _new_chat(self):
        self._store.new_session()
        self._log.clear()
        self._refresh_history()

    def _open_history(self, sid: str):
        sess = self._store.get(sid)
        if not sess:
            return
        dlg = HistoryViewer(sess, self._assistant_name, self)
        dlg.delete_clicked.connect(self._delete_history)
        dlg.exec()

    def _delete_history(self, sid: str):
        self._store.delete(sid)
        self._refresh_history()

    def _on_authenticated(self, display_name: str):
        self._user_name = display_name
        self._store.new_session()
        self._refresh_history()
        self._authed = True
        if self._auth_page is not None:
            self._auth_page.hide()
        self._log.append_log(f"SYS: Signed in as {display_name}.")
        self._logout_btn.setText(f"⎋  LOG OUT  ({display_name[:14]})")

    def _logout(self):
        if self._auth_page is not None and self._auth_page.session is not None:
            import supabase_auth as _sb
            try:
                _sb.sign_out(self._auth_page.session.get("access_token", ""))
            except Exception as e:
                print(f"[Auth] sign out failed (clearing local session anyway): {e}")
        self._user_name = ""
        self._store.new_session()
        self._log.clear()
        self._refresh_history()
        self._show_auth()

    def resizeEvent(self, event):
        super().resizeEvent(event)
        cw = self.centralWidget()
        if getattr(self, "_auth_page", None) is not None and self._auth_page.isVisible():
            self._auth_page.setGeometry(cw.rect())
        if self._overlay and self._overlay.isVisible():
            ow, oh = 460, 390
            self._overlay.setGeometry(
                (cw.width()  - ow) // 2,
                (cw.height() - oh) // 2,
                ow, oh,
            )
        if self._customize_overlay and self._customize_overlay.isVisible():
            ow, oh = CustomizeOverlay._OW, CustomizeOverlay._OH
            self._customize_overlay.setGeometry(
                (cw.width()  - ow) // 2,
                (cw.height() - oh) // 2,
                ow, oh,
            )
        # Camera preview — bottom-right corner of the center/HUD area
        pw = _CameraPreview._W
        ph = self._cam_preview.height() or _CameraPreview._H
        self._cam_preview.setGeometry(
            cw.width() - _RIGHT_W - pw - 12,
            cw.height() - ph - 28,
            pw, ph,
        )
        # Clipboard panel — bottom-center
        if hasattr(self, '_clipboard_panel') and self._clipboard_panel.isVisible():
            self._position_clipboard_panel()
        # Quick drawer — reposition if open
        if hasattr(self, '_quick_drawer') and self._quick_drawer.isVisible():
            self._position_quick_drawer()

    def _update_metrics(self):
        snap = _metrics.snapshot()

        # CPU
        cpu = snap["cpu"]
        self._bar_cpu.set_value(cpu, f"{cpu:.0f}%")

        # MEM
        mem = snap["mem"]
        self._bar_mem.set_value(mem, f"{mem:.0f}%")

        # NET
        net = snap["net"]
        if net < 1.0:
            net_str = f"{net*1024:.0f}KB/s"
        else:
            net_str = f"{net:.1f}MB/s"
        net_pct = min(100, net * 10)  # 10 MB/s = %100
        self._bar_net.set_value(net_pct, net_str)

        # GPU
        gpu = snap["gpu"]
        if gpu >= 0:
            self._bar_gpu.set_value(gpu, f"{gpu:.0f}%")
        else:
            self._bar_gpu.set_value(0, "N/A")

        # TMP
        tmp = snap["tmp"]
        if tmp >= 0:
            tmp_pct = min(100, (tmp / 100) * 100)
            self._bar_tmp.set_value(tmp_pct, f"{tmp:.0f}°C")
        else:
            self._bar_tmp.set_value(0, "N/A")

        try:
            boot_t  = psutil.boot_time()
            elapsed = time.time() - boot_t
            h = int(elapsed // 3600)
            m = int((elapsed % 3600) // 60)
            self._uptime_lbl.setText(f"UP  {h:02d}:{m:02d}")
        except Exception:
            self._uptime_lbl.setText("UP  --:--")

        try:
            proc_count = len(psutil.pids())
            self._proc_lbl.setText(f"PROC  {proc_count}")
        except Exception:
            self._proc_lbl.setText("PROC  --")


    def _build_header(self) -> QWidget:
        w = QWidget()
        w.setFixedHeight(54)
        w.setStyleSheet(f"background: {C.DARK}; border-bottom: 1px solid {C.BORDER_B};")
        lay = QHBoxLayout(w)
        lay.setContentsMargins(16, 0, 16, 0)

        def _badge(txt, color=C.TEXT_MED):
            l = QLabel(txt)
            l.setFont(QFont("Courier New", 9))
            l.setStyleSheet(f"color: {color}; background: transparent;")
            return l

        lay.addWidget(_badge(APP_TEAM, C.PRI_DIM))
        lay.addSpacing(8)
        self._drawer_btn = QPushButton("⚙")
        self._drawer_btn.setFixedSize(26, 26)
        self._drawer_btn.setFont(QFont("Courier New", 13))
        self._drawer_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._drawer_btn.setToolTip("Settings & Controls")
        self._drawer_btn.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.TEXT_DIM};
                border: 1px solid {C.BORDER}; border-radius: 4px;
            }}
            QPushButton:hover {{ color: {C.PRI}; border-color: {C.PRI_DIM}; }}
            QPushButton:checked {{ color: {C.PRI}; border-color: {C.PRI}; background: {C.PRI_GHO}; }}
        """)
        self._drawer_btn.setCheckable(True)
        self._drawer_btn.clicked.connect(self._toggle_drawer)
        lay.addWidget(self._drawer_btn)
        lay.addStretch()

        mid = QVBoxLayout(); mid.setSpacing(1)
        _disp = self._assistant_name.upper()
        self._title_lbl = QLabel(_disp)
        self._title_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._title_lbl.setFont(QFont("Courier New", 20, QFont.Weight.Bold))
        self._title_lbl.setStyleSheet(f"color: {C.PRI}; background: transparent;")
        mid.addWidget(self._title_lbl)
        _sub_text = APP_TAGLINE if _disp == APP_NAME else "Personal AI Assistant"
        self._sub_lbl = QLabel(_sub_text)
        self._sub_lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self._sub_lbl.setFont(QFont("Courier New", 8))
        self._sub_lbl.setStyleSheet(f"color: {C.PRI_DIM}; background: transparent;")
        mid.addWidget(self._sub_lbl)
        lay.addLayout(mid)
        lay.addStretch()

        right_col = QVBoxLayout(); right_col.setSpacing(2)
        self._clock_lbl = QLabel("00:00:00")
        self._clock_lbl.setFont(QFont("Courier New", 16, QFont.Weight.Bold))
        self._clock_lbl.setStyleSheet(f"color: {C.PRI}; background: transparent;")
        self._clock_lbl.setAlignment(Qt.AlignmentFlag.AlignRight)
        right_col.addWidget(self._clock_lbl)
        self._date_lbl = QLabel("")
        self._date_lbl.setFont(QFont("Courier New", 8))
        self._date_lbl.setStyleSheet(f"color: {C.TEXT_DIM}; background: transparent;")
        self._date_lbl.setAlignment(Qt.AlignmentFlag.AlignRight)
        right_col.addWidget(self._date_lbl)
        lay.addLayout(right_col)
        return w

    def _tick_clock(self):
        self._clock_lbl.setText(time.strftime("%H:%M:%S"))
        self._date_lbl.setText(time.strftime("%a %d %b %Y"))

    def _build_left_panel(self) -> QWidget:
        w = QWidget()
        w.setFixedWidth(_LEFT_W)
        w.setStyleSheet(f"background: {C.DARK}; border-right: 1px solid {C.BORDER};")
        lay = QVBoxLayout(w)
        lay.setContentsMargins(8, 10, 8, 10)
        lay.setSpacing(6)

        hdr = QLabel("◈ SYS MONITOR")
        hdr.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        hdr.setStyleSheet(f"color: {C.PRI}; background: transparent; "
                          f"border-bottom: 1px solid {C.BORDER}; padding-bottom: 4px;")
        lay.addWidget(hdr)
        lay.addSpacing(2)

        self._bar_cpu = MetricBar("CPU", C.PRI)
        self._bar_mem = MetricBar("MEM", C.ACC2)
        self._bar_net = MetricBar("NET", C.GREEN)
        self._bar_gpu = MetricBar("GPU", C.ACC)
        self._bar_tmp = MetricBar("TMP", "#ff6688")

        for bar in [self._bar_cpu, self._bar_mem, self._bar_net,
                    self._bar_gpu, self._bar_tmp]:
            lay.addWidget(bar)

        lay.addSpacing(4)

        info_panel = QWidget()
        info_panel.setStyleSheet(
            f"background: {C.PANEL2}; border: 1px solid {C.BORDER}; border-radius: 4px;"
        )
        ip_lay = QVBoxLayout(info_panel)
        ip_lay.setContentsMargins(6, 5, 6, 5)
        ip_lay.setSpacing(3)

        self._uptime_lbl = QLabel("UP  --:--")
        self._uptime_lbl.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        self._uptime_lbl.setStyleSheet(f"color: {C.GREEN}; background: transparent; border: none;")
        ip_lay.addWidget(self._uptime_lbl)

        self._proc_lbl = QLabel("PROC  --")
        self._proc_lbl.setFont(QFont("Courier New", 9))
        self._proc_lbl.setStyleSheet(f"color: {C.TEXT_MED}; background: transparent; border: none;")
        ip_lay.addWidget(self._proc_lbl)

        os_name = {"Windows": "WIN", "Darwin": "macOS", "Linux": "LINUX"}.get(_OS, _OS.upper())
        os_lbl = QLabel(f"OS  {os_name}")
        os_lbl.setFont(QFont("Courier New", 9))
        os_lbl.setStyleSheet(f"color: {C.ACC2}; background: transparent; border: none;")
        ip_lay.addWidget(os_lbl)

        lay.addWidget(info_panel)
        lay.addSpacing(4)

        lay.addStretch()

        sec = QLabel("◈ AGENTS")
        sec.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        sec.setStyleSheet(f"color: {C.PRI}; background: transparent; "
                          f"border-bottom: 1px solid {C.BORDER}; padding-bottom: 4px;")
        lay.addWidget(sec)
        self._agents = AgentRelay()
        lay.addWidget(self._agents)
        hint = QLabel("click an agent for its trail")
        hint.setFont(QFont("Courier New", 7))
        hint.setStyleSheet(f"color: {C.TEXT_DIM}; background: transparent;")
        lay.addWidget(hint)
        lay.addStretch()

        return w
    def _build_right_panel(self) -> QWidget:
        w = QWidget()
        w.setFixedWidth(_RIGHT_W)
        w.setStyleSheet(f"background: {C.DARK}; border-left: 1px solid {C.BORDER};")
        lay = QVBoxLayout(w)
        lay.setContentsMargins(8, 8, 8, 8)
        lay.setSpacing(6)

        def _sec(txt):
            l = QLabel(f"▸ {txt}")
            l.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
            l.setStyleSheet(f"color: {C.TEXT_MED}; background: transparent;")
            return l

        lay.addWidget(_sec("FILE UPLOAD"))
        self._drop_zone = FileDropZone()
        self._drop_zone.file_selected.connect(self._on_file_selected)
        lay.addWidget(self._drop_zone)

        self._file_hint = QLabel("No file loaded — drop or click above to upload")
        self._file_hint.setFont(QFont("Courier New", 8))
        self._file_hint.setStyleSheet(f"color: {C.TEXT_MED}; background: transparent;")
        self._file_hint.setWordWrap(True)
        lay.addWidget(self._file_hint)

        self._history = HistoryList()
        lay.addWidget(self._history, stretch=1)

        self._interrupt_btn = QPushButton("✋  INTERRUPT  [ESC]")
        self._interrupt_btn.setFixedHeight(34)
        self._interrupt_btn.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        self._interrupt_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._interrupt_btn.setStyleSheet(f"""
            QPushButton {{
                background: #140008; color: {C.MUTED_C};
                border: 1px solid {C.MUTED_C}; border-radius: 3px;
            }}
            QPushButton:hover {{
                background: #200010; border: 1px solid #ff6688;
            }}
            QPushButton:pressed {{
                background: #300018;
            }}
        """)
        self._interrupt_btn.clicked.connect(self._do_interrupt)
        lay.addWidget(self._interrupt_btn)

        self._mute_btn = QPushButton("🎙  MICROPHONE ACTIVE")
        self._mute_btn.setFixedHeight(30)
        self._mute_btn.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        self._mute_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._mute_btn.clicked.connect(self._toggle_mute)
        self._style_mute_btn()
        lay.addWidget(self._mute_btn)

        return w

    def _build_quick_drawer(self) -> QWidget:
        """Floating overlay panel shown when the ⚙ header button is toggled."""
        _BTN_STYLE_PRI = f"""
            QPushButton {{
                background: #00091a; color: {C.PRI};
                border: 1px solid {C.PRI_DIM}; border-radius: 3px;
                text-align: left; padding: 0 8px;
            }}
            QPushButton:hover {{ background: {C.PRI_GHO}; border-color: {C.PRI}; }}
        """
        _BTN_STYLE_DIM = f"""
            QPushButton {{
                background: transparent; color: {C.TEXT_MED};
                border: 1px solid {C.BORDER}; border-radius: 3px;
                text-align: left; padding: 0 8px;
            }}
            QPushButton:hover {{ color: {C.PRI}; border-color: {C.BORDER_B}; }}
        """

        w = QWidget(self.centralWidget())
        w.setObjectName("QuickDrawer")
        w.setStyleSheet(f"""
            QWidget#QuickDrawer {{
                background: {C.DARK};
                border: 1px solid {C.BORDER_B};
                border-top: none;
                border-radius: 0 0 6px 6px;
            }}
        """)
        w.hide()

        lay = QVBoxLayout(w)
        lay.setContentsMargins(10, 8, 10, 10)
        lay.setSpacing(5)

        hdr = QLabel("◈ CONTROLS")
        hdr.setFont(QFont("Courier New", 8, QFont.Weight.Bold))
        hdr.setStyleSheet(f"color: {C.PRI_DIM}; background: transparent; "
                          f"border-bottom: 1px solid {C.BORDER}; padding-bottom: 4px;")
        lay.addWidget(hdr)

        fs_btn = QPushButton("⛶  FULLSCREEN  [F11]")
        fs_btn.setFixedHeight(26)
        fs_btn.setFont(QFont("Courier New", 8))
        fs_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        fs_btn.setStyleSheet(_BTN_STYLE_DIM)
        fs_btn.clicked.connect(self._toggle_fullscreen)
        lay.addWidget(fs_btn)

        sc_btn = QPushButton("⊞  CREATE DESKTOP SHORTCUT")
        sc_btn.setFixedHeight(26)
        sc_btn.setFont(QFont("Courier New", 8))
        sc_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        sc_btn.setStyleSheet(_BTN_STYLE_DIM)
        sc_btn.clicked.connect(self._create_desktop_shortcut)
        lay.addWidget(sc_btn)

        self._autostart_btn = QPushButton("◉  AUTO-START: OFF")
        self._autostart_btn.setFixedHeight(26)
        self._autostart_btn.setFont(QFont("Courier New", 8))
        self._autostart_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._autostart_btn.clicked.connect(self._toggle_autostart)
        lay.addWidget(self._autostart_btn)

        cust_btn = QPushButton("⚙  CUSTOMISE ASSISTANT")
        cust_btn.setFixedHeight(26)
        cust_btn.setFont(QFont("Courier New", 8))
        cust_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        cust_btn.setStyleSheet(_BTN_STYLE_DIM)
        cust_btn.clicked.connect(self._open_customize)
        lay.addWidget(cust_btn)

        self._logout_btn = QPushButton("⎋  LOG OUT")
        self._logout_btn.setFixedHeight(26)
        self._logout_btn.setFont(QFont("Courier New", 8))
        self._logout_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._logout_btn.setStyleSheet(_BTN_STYLE_DIM)
        self._logout_btn.clicked.connect(self._logout)
        lay.addWidget(self._logout_btn)

        self._brief_btn = QPushButton()
        self._brief_btn.setFixedHeight(26)
        self._brief_btn.setFont(QFont("Courier New", 8))
        self._brief_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._brief_btn.clicked.connect(self._toggle_brief)
        lay.addWidget(self._brief_btn)

        w.adjustSize()
        return w

    def _toggle_drawer(self, checked: bool):
        if checked:
            self._position_quick_drawer()
            self._quick_drawer.show()
            self._quick_drawer.raise_()
        else:
            self._quick_drawer.hide()

    def _position_quick_drawer(self):
        if not hasattr(self, '_quick_drawer'):
            return
        _W = 220
        self._quick_drawer.setFixedWidth(_W)
        self._quick_drawer.adjustSize()
        self._quick_drawer.setGeometry(12, 54, _W, self._quick_drawer.sizeHint().height())

    def _build_input_row(self) -> QHBoxLayout:
        row = QHBoxLayout(); row.setContentsMargins(0, 0, 0, 0)
        pill = PillInput("Write a message…")
        self._pill = pill
        self._input = pill.line
        self._input.returnPressed.connect(self._send)
        pill.send.clicked.connect(self._send)
        pill.attach.clicked.connect(lambda: self._drop_zone._browse())
        pill.mic.clicked.connect(self._toggle_mute)
        row.addWidget(pill)
        return row

    def _build_content_panel(self) -> QWidget:
        """
        Collapsible panel below the HUD — shows search results, news, briefings.
        Hidden by default; appears when show_content() is called.
        """
        w = QWidget()
        w.setObjectName("ContentPanel")
        w.setStyleSheet(f"""
            QWidget#ContentPanel {{
                background: {C.PANEL};
                border-top: 1px solid {C.BORDER_B};
            }}
        """)
        w.hide()

        lay = QVBoxLayout(w)
        lay.setContentsMargins(12, 7, 12, 8)
        lay.setSpacing(5)

        # ── header row ───────────────────────────────────────────────────────
        hdr = QHBoxLayout(); hdr.setSpacing(6)

        dot = QLabel("◈")
        dot.setFont(QFont("Courier New", 11, QFont.Weight.Bold))
        dot.setStyleSheet(f"color: {C.PRI}; background: transparent;")
        hdr.addWidget(dot)

        self._content_title_lbl = QLabel("BRIEFING")
        self._content_title_lbl.setFont(QFont("Courier New", 9, QFont.Weight.Bold))
        self._content_title_lbl.setStyleSheet(
            f"color: {C.PRI}; background: transparent; letter-spacing: 1px;"
        )
        hdr.addWidget(self._content_title_lbl)
        hdr.addStretch()

        self._content_ts_lbl = QLabel("")
        self._content_ts_lbl.setFont(QFont("Courier New", 8))
        self._content_ts_lbl.setStyleSheet(f"color: {C.TEXT_DIM}; background: transparent;")
        hdr.addWidget(self._content_ts_lbl)

        dismiss = QPushButton("DISMISS  ✕")
        dismiss.setFont(QFont("Courier New", 8))
        dismiss.setFixedHeight(18)
        dismiss.setCursor(Qt.CursorShape.PointingHandCursor)
        dismiss.setStyleSheet(f"""
            QPushButton {{
                background: transparent; color: {C.TEXT_DIM};
                border: 1px solid {C.BORDER}; border-radius: 2px; padding: 0 5px;
            }}
            QPushButton:hover {{ color: {C.TEXT}; border-color: {C.BORDER_B}; }}
        """)
        dismiss.clicked.connect(w.hide)
        hdr.addWidget(dismiss)
        lay.addLayout(hdr)

        # ── separator ─────────────────────────────────────────────────────────
        sep = QFrame(); sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet(f"color: {C.BORDER};"); lay.addWidget(sep)

        # ── text display ──────────────────────────────────────────────────────
        self._content_display = QTextEdit()
        self._content_display.setReadOnly(True)
        self._content_display.setFont(QFont("Courier New", 9))
        self._content_display.setMinimumHeight(60)
        self._content_display.setSizePolicy(
            QSizePolicy.Policy.Expanding, QSizePolicy.Policy.Expanding
        )
        self._content_display.setStyleSheet(f"""
            QTextEdit {{
                background: {C.DARK};
                color: {C.TEXT};
                border: 1px solid {C.BORDER};
                border-radius: 3px;
                padding: 6px 8px;
                selection-background-color: {C.PRI_GHO};
            }}
            QScrollBar:vertical {{
                background: {C.BG}; width: 6px; border: none;
            }}
            QScrollBar::handle:vertical {{
                background: {C.BORDER_B}; border-radius: 3px; min-height: 16px;
            }}
            QScrollBar::add-line:vertical, QScrollBar::sub-line:vertical {{
                height: 0; border: none;
            }}
        """)
        lay.addWidget(self._content_display)

        return w

    def _show_content(self, title: str, text: str):
        """Slot — runs on Qt main thread. Updates and shows the content panel."""
        import time as _time
        self._content_title_lbl.setText(title.upper()[:48])
        self._content_ts_lbl.setText(_time.strftime("%H:%M:%S"))
        self._content_display.setPlainText(text)
        self._content_display.moveCursor(
            self._content_display.textCursor().MoveOperation.Start
        )
        first_show = not self._content_panel.isVisible()
        self._content_panel.show()
        if first_show:
            sz = self._center_split.sizes()
            total = self._center_split.height()
            chat_h = max(sz[1], 120)
            self._center_split.setSizes([max(total - chat_h - 220, 120), chat_h, 220])

    def _build_footer(self) -> QWidget:
        w = QWidget()
        w.setFixedHeight(22)
        w.setStyleSheet(f"background: {C.DARK}; border-top: 1px solid {C.BORDER};")
        lay = QHBoxLayout(w); lay.setContentsMargins(14, 0, 14, 0)

        def _fl(txt, color=C.TEXT_MED):
            l = QLabel(txt); l.setFont(QFont("Courier New", 8))
            l.setStyleSheet(f"color: {color}; background: transparent;")
            return l

        lay.addWidget(_fl("[F4] Mute  ·  [F11] Fullscreen"))
        lay.addStretch()
        lay.addWidget(_fl("By Neural Forge", C.PRI_DIM))
        return w

    def _on_file_selected(self, path: str):
        self._current_file = path
        p    = Path(path)
        cat  = _file_category(p)
        icon, _ = _FILE_ICONS.get(cat, _FILE_ICONS["unknown"])
        size = _fmt_size(p.stat().st_size)
        self._file_hint.setText(f"{icon}  {p.name}  ·  {size}  ·  Tell {self._assistant_name} what to do with it")
        self._log.append_log(f"FILE: {p.name} ({size}) loaded")
        if self.on_text_command:
            msg = (
                f"[FILE_UPLOADED] path={path} | name={p.name} | "
                f"type={p.suffix.lstrip('.')} | size={size} | "
                f"Briefly tell the user you can see the file '{p.name}' "
                f"({size}) has been uploaded and ask what they'd like to do with it."
            )
            threading.Thread(target=self.on_text_command, args=(msg,), daemon=True).start()

    # ── Auto-start ──────────────────────────────────────────────────────────────

    def _check_autostart(self) -> bool:
        """Returns True if auto-start is currently registered on this OS."""
        try:
            if _OS == "Windows":
                import winreg
                key = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_READ)
                try:
                    winreg.QueryValueEx(key, "Nirmaraksh_AI")
                    return True
                except FileNotFoundError:
                    return False
                finally:
                    winreg.CloseKey(key)
            elif _OS == "Darwin":
                return (Path.home() / "Library" / "LaunchAgents"
                        / "com.Nirmaraksh.assistant.plist").exists()
            else:
                return (Path.home() / ".config" / "autostart" / "Nirmaraksh.desktop").exists()
        except Exception:
            return False

    def _toggle_autostart(self):
        currently_on = self._check_autostart()
        try:
            script = str(Path(__file__).resolve().parent / "main.py")
            if _OS == "Windows":
                import winreg
                reg = winreg.OpenKey(winreg.HKEY_CURRENT_USER,
                    r"Software\Microsoft\Windows\CurrentVersion\Run", 0, winreg.KEY_ALL_ACCESS)
                if currently_on:
                    winreg.DeleteValue(reg, "Nirmaraksh_AI")
                else:
                    pythonw = Path(sys.executable).parent / "pythonw.exe"
                    exe = str(pythonw if pythonw.exists() else sys.executable)
                    winreg.SetValueEx(reg, "Nirmaraksh_AI", 0, winreg.REG_SZ,
                                      f'"{exe}" "{script}"')
                winreg.CloseKey(reg)
            elif _OS == "Darwin":
                plist_dir = Path.home() / "Library" / "LaunchAgents"
                plist_dir.mkdir(parents=True, exist_ok=True)
                plist = plist_dir / "com.Nirmaraksh.assistant.plist"
                if currently_on:
                    plist.unlink(missing_ok=True)
                else:
                    plist.write_text(
                        '<?xml version="1.0" encoding="UTF-8"?>\n'
                        '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" '
                        '"http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n'
                        '<plist version="1.0"><dict>\n'
                        '  <key>Label</key><string>com.Nirmaraksh.assistant</string>\n'
                        '  <key>ProgramArguments</key><array>\n'
                        f'    <string>{sys.executable}</string>\n'
                        f'    <string>{script}</string>\n'
                        '  </array>\n'
                        '  <key>RunAtLoad</key><true/>\n'
                        '</dict></plist>\n'
                    )
            else:
                desk_dir = Path.home() / ".config" / "autostart"
                desk_dir.mkdir(parents=True, exist_ok=True)
                desk = desk_dir / "Nirmaraksh.desktop"
                if currently_on:
                    desk.unlink(missing_ok=True)
                else:
                    desk.write_text(
                        "[Desktop Entry]\n"
                        f"Name={self._assistant_name}\n"
                        f"Exec={sys.executable} {script}\n"
                        "Type=Application\nTerminal=false\n"
                        "X-GNOME-Autostart-enabled=true\n"
                    )
            enabled = not currently_on
            self._update_autostart_btn(enabled)
            self._log.append_log(
                f"SYS: Auto-start {'enabled' if enabled else 'disabled'}.")
        except Exception as e:
            self._log.append_log(f"ERR: Auto-start failed — {e}")

    def _update_autostart_btn(self, enabled: bool):
        if not hasattr(self, '_autostart_btn'):
            return
        if enabled:
            self._autostart_btn.setText("◉  AUTO-START: ON")
            self._autostart_btn.setStyleSheet(f"""
                QPushButton {{
                    background: #001a08; color: {C.GREEN};
                    border: 1px solid {C.GREEN_D}; border-radius: 3px;
                }}
                QPushButton:hover {{ background: #002010; }}
            """)
        else:
            self._autostart_btn.setText("◉  AUTO-START: OFF")
            self._autostart_btn.setStyleSheet(f"""
                QPushButton {{
                    background: transparent; color: {C.TEXT_DIM};
                    border: 1px solid {C.BORDER}; border-radius: 3px;
                }}
                QPushButton:hover {{ color: {C.TEXT}; border: 1px solid {C.BORDER_B}; }}
            """)

    def _toggle_brief(self):
        from memory.config_manager import get_brief_enabled, save_brief_enabled
        new_val = not get_brief_enabled()
        save_brief_enabled(new_val)
        self._update_brief_btn(new_val)

    def _update_brief_btn(self, enabled: bool):
        if not hasattr(self, '_brief_btn'):
            return
        if enabled:
            self._brief_btn.setText("☀  MORNING BRIEF: ON")
            self._brief_btn.setStyleSheet(f"""
                QPushButton {{
                    background: #001a08; color: {C.GREEN};
                    border: 1px solid {C.GREEN_D}; border-radius: 3px;
                    text-align: left; padding: 0 8px;
                }}
                QPushButton:hover {{ background: #002010; }}
            """)
        else:
            self._brief_btn.setText("☀  MORNING BRIEF: OFF")
            self._brief_btn.setStyleSheet(f"""
                QPushButton {{
                    background: transparent; color: {C.TEXT_DIM};
                    border: 1px solid {C.BORDER}; border-radius: 3px;
                    text-align: left; padding: 0 8px;
                }}
                QPushButton:hover {{ color: {C.TEXT}; border: 1px solid {C.BORDER_B}; }}
            """)

    # ── Customization ────────────────────────────────────────────────────────────

    def _open_customize(self):
        cfg = _read_full_config()
        if self._customize_overlay:
            self._customize_overlay.hide()
        cw = self.centralWidget()
        ov = CustomizeOverlay(
            _norm_name(cfg.get("assistant_name")),
            cfg.get("user_name", ""),
            cfg.get("ui_color", "") or DEFAULT_UI_COLOR,
            parent=cw,
        )
        ow, oh = CustomizeOverlay._OW, CustomizeOverlay._OH
        oh = min(oh, cw.height() - 16)
        ov.setGeometry(
            (cw.width()  - ow) // 2,
            (cw.height() - oh) // 2,
            ow, oh,
        )
        ov.on_preview = self._preview_ui_color
        ov.saved.connect(self._apply_name_update)
        ov.show()
        self._customize_overlay = ov

    def _preview_ui_color(self, hex_color: str):
        """Canlı önizleme — tüm arayüzü yeni renge boyar (config'e YAZMAZ)."""
        old = current_palette()
        if apply_ui_accent(hex_color):
            retheme_all_widgets(old, current_palette())

    def _apply_name_update(self, name: str, user_name: str, ui_color: str = ""):
        """Update all name/theme-dependent UI elements and persist to config."""
        self._assistant_name = _norm_name(name)
        display = self._assistant_name.upper()
        self.setWindowTitle(f"{display} — {APP_TEAM.title()}")
        self._title_lbl.setText(display)
        if display == APP_NAME:
            self._sub_lbl.setText(APP_TAGLINE)
        else:
            self._sub_lbl.setText("Personal AI Assistant")
        self._log._ai_name_lc = self._assistant_name.lower()
        self.hud._assistant_name = display

        color_changed = False
        if ui_color:
            old = current_palette()
            if apply_ui_accent(ui_color):
                # Tüm arayüzü (paneller, butonlar, kenarlıklar, HUD) canlı boya
                retheme_all_widgets(old, current_palette())
                color_changed = old["PRI"] != C.PRI

        try:
            data = _read_full_config()
            data["assistant_name"] = self._assistant_name
            data["user_name"] = user_name.strip()
            if ui_color:
                data["ui_color"] = ui_color.strip().lower()
            API_FILE.write_text(json.dumps(data, indent=4), encoding="utf-8")
            self._log.append_log(f"SYS: Identity updated — {display}")
            if color_changed:
                self._log.append_log(f"SYS: UI colour applied — {ui_color}")
        except Exception as e:
            self._log.append_log(f"ERR: Config save failed — {e}")

    # ── Clipboard intelligence ───────────────────────────────────────────────────

    def _on_clipboard_changed(self):
        try:
            text = QApplication.clipboard().text().strip()
            if len(text) >= 10:
                self._clipboard_sig.emit(text)
        except Exception:
            pass

    def _show_clipboard_panel(self, text: str):
        self._clipboard_panel.show_clipboard(text)
        self._position_clipboard_panel()

    def _position_clipboard_panel(self):
        cw = self.centralWidget()
        pw = ClipboardPanel._W
        ph = self._clipboard_panel.sizeHint().height() or ClipboardPanel._H
        x = (cw.width() - pw) // 2
        y = cw.height() - ph - 6
        self._clipboard_panel.setGeometry(x, y, pw, ph)
        self._clipboard_panel.raise_()

    def _on_clipboard_action(self, cmd: str):
        if self.on_text_command:
            threading.Thread(target=self.on_text_command, args=(cmd,), daemon=True).start()

    # ────────────────────────────────────────────────────────────────────────────

    def _do_interrupt(self):
        if self.on_interrupt:
            self.on_interrupt()

    def _toggle_mute(self):
        self._muted = not self._muted
        self.hud.muted = self._muted
        self._style_mute_btn()
        if self._muted:
            self._apply_state("MUTED")
            self._log.append_log("SYS: Microphone muted.")
        else:
            self._apply_state("LISTENING")
            self._log.append_log("SYS: Microphone active.")

    def _style_mute_btn(self):
        if getattr(self, '_pill', None) is not None:
            self._pill.set_muted(self._muted)
        if self._muted:
            self._mute_btn.setText("🔇  MICROPHONE MUTED")
            self._mute_btn.setStyleSheet(f"""
                QPushButton {{
                    background: #140006; color: {C.MUTED_C};
                    border: 1px solid {C.MUTED_C}; border-radius: 3px;
                }}
            """)
        else:
            self._mute_btn.setText("🎙  MICROPHONE ACTIVE")
            self._mute_btn.setStyleSheet(f"""
                QPushButton {{
                    background: #00140a; color: {C.GREEN};
                    border: 1px solid {C.GREEN}; border-radius: 3px;
                }}
                QPushButton:hover {{ background: #001f10; }}
            """)

    def _send(self):
        txt = self._input.text().strip()
        if not txt: return
        self._input.clear()
        self._log.append_log(f"You: {txt}")
        if self.on_text_command:
            threading.Thread(target=self.on_text_command, args=(txt,), daemon=True).start()

    def _apply_state(self, state: str):
        self.hud.state    = state
        self.hud.speaking = (state == "SPEAKING")
        if getattr(self, '_agents', None) is not None:
            self._agents.set_main_state(state)
        if getattr(self, '_pill', None) is not None:
            self._pill.set_speaking(state == "SPEAKING")

    def _check_config(self) -> bool:
        if not API_FILE.exists(): return False
        try:
            d = json.loads(API_FILE.read_text(encoding="utf-8"))
            return bool(d.get("gemini_api_key")) and bool(d.get("os_system"))
        except Exception:
            return False

    def _show_setup(self):
        ov = SetupOverlay(self.centralWidget())
        cw = self.centralWidget()
        ow, oh = 460, 390
        ov.setGeometry(
            (cw.width()  - ow) // 2,
            (cw.height() - oh) // 2,
            ow, oh,
        )
        ov.done.connect(self._on_setup_done)
        ov.show()
        self._overlay = ov

    def _on_setup_done(self, key: str, os_name: str):
        os.makedirs(CONFIG_DIR, exist_ok=True)
        API_FILE.write_text(
            json.dumps({"gemini_api_key": key, "os_system": os_name}, indent=4),
            encoding="utf-8",
        )
        self._ready = True
        if self._overlay:
            self._overlay.hide()
            self._overlay = None
        self._apply_state("LISTENING")
        self._assistant_name = _norm_name(_read_full_config().get("assistant_name"))
        self._log.append_log(f"SYS: Initialised. OS={os_name.upper()}. {self._assistant_name} online.")

class _RootShim:
    def __init__(self, app: QApplication):
        self._app = app
    def mainloop(self):
        self._app.exec()
    def protocol(self, *_):
        pass


class nirmarakshUI:
    def __init__(self, face_path: str, size=None):
        self._app = QApplication.instance() or QApplication(sys.argv)
        self._app.setStyle("Fusion")
        self._win = MainWindow(face_path)
        self._win.show()
        self.root = _RootShim(self._app)

    @property
    def muted(self) -> bool:
        return self._win._muted

    @muted.setter
    def muted(self, v: bool):
        if v != self._win._muted:
            self._win._toggle_mute()

    @property
    def current_file(self) -> str | None:
        return self._win._drop_zone.current_file()

    @property
    def on_text_command(self):
        return self._win.on_text_command

    @on_text_command.setter
    def on_text_command(self, cb):
        self._win.on_text_command = cb

    @property
    def on_interrupt(self):
        return self._win.on_interrupt

    @on_interrupt.setter
    def on_interrupt(self, cb):
        self._win.on_interrupt = cb

    def set_state(self, state: str):
        self._win._state_sig.emit(state)

    def write_log(self, text: str):
        self._win._log_sig.emit(text)

    def wait_for_api_key(self):
        while not (self._win._ready and self._win._authed):
            time.sleep(0.1)

    def show_content(self, title: str, text: str):
        """Thread-safe: display content in the panel below the HUD."""
        self._win._content_sig.emit(title[:48], text[:4000])

    def prompt_reconfig(self):
        """Thread-safe: show the API key setup overlay (e.g. after an auth error)."""
        self._win._ready = False
        self._win._reconfig_sig.emit()

    def show_camera_frame(self, img_bytes: bytes):
        """Thread-safe: show a webcam frame in the small overlay (screen captures)."""
        self._win._camera_sig.emit(img_bytes)

    def start_camera_stream(self) -> None:
        """Thread-safe: start live camera feed in the full HUD area."""
        self._win.start_camera_stream()

    def stop_camera_stream(self) -> None:
        """Thread-safe: stop the live camera feed."""
        self._win.stop_camera_stream()

    @property
    def assistant_name(self) -> str:
        return self._win._assistant_name

    def start_speaking(self):
        self.set_state("SPEAKING")

    def stop_speaking(self):
        if not self.muted:
            self.set_state("LISTENING")