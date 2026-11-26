#!/usr/bin/env python3
"""Import Iconify icons into engine/icons.js as ink-stroke polylines.

Usage:
  python3 tools/fetch_icon.py search "bull"
  python3 tools/fetch_icon.py add ox --icon game-icons:bull
  python3 tools/fetch_icon.py add music --query "music note"

Icons are downloaded from https://api.iconify.design, converted to the kit's
+/-100 local coordinate box, and appended to engine/icons.js as:

  case'music':/* tabler:music -- MIT */return[Pl([[x,y],...]),...];

Everything is vendored: no network access happens at render time.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import math
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

API = 'https://api.iconify.design'
ROOT = Path(__file__).resolve().parent.parent
ICONS_JS = ROOT / 'engine' / 'icons.js'
VENDOR_DIR = ROOT / 'engine' / 'icons'
MANIFEST = VENDOR_DIR / 'MANIFEST.json'
LICENSES_MD = VENDOR_DIR / 'LICENSES.md'

UA = 'video-kit-icon-fetch/1.0'
TIMEOUT = 20
ATTEMPTS = 4  # initial request + 3 retries

# Collections whose stroke-only look suits the kit best.
PREFERRED = ['tabler', 'lucide', 'lucide-lab', 'mdi-light', 'material-symbols',
             'material-symbols-light', 'ph', 'solar', 'iconoir']

ALLOWED_LICENSES = {
    'CC0-1.0', 'MIT', 'ISC', 'Apache-2.0', 'CC-BY-3.0', 'CC-BY-4.0', 'OFL-1.1',
}
ATTRIBUTION_LICENSES = {'CC-BY-3.0', 'CC-BY-4.0'}
BLOCKED_ID_PARTS = ['emoji', 'openmoji', 'twemoji', 'noto', 'fluent-emoji', 'color']

SHAPE_TAGS = {'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'}

NUMBER_RE = re.compile(r'[+-]?(?:\d+\.\d*|\.\d+|\d+)(?:[eE][+-]?\d+)?')
NAME_RE = re.compile(r'^[a-z][a-z0-9-]{0,39}$')
ICON_RE = re.compile(r'^([a-z0-9-]+):([a-z0-9-]+)$')


class FetchError(Exception):
    """A user-facing failure."""

    def __init__(self, message: str, code: int = 1):
        super().__init__(message)
        self.code = code


# ---------------------------------------------------------------- network

def _http_get(url: str) -> bytes:
    last = None
    for attempt in range(ATTEMPTS):
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': UA,
                'Accept': 'application/json, image/svg+xml, */*',
            })
            with urllib.request.urlopen(req, timeout=TIMEOUT) as res:
                return res.read()
        except urllib.error.HTTPError as e:
            if e.code == 404:
                raise FetchError(f'not found: {url} (HTTP 404)', 2)
            if e.code in (429, 500, 502, 503, 504):
                last = f'HTTP {e.code}'
            else:
                raise FetchError(f'download failed: {url} (HTTP {e.code})', 2)
        except (urllib.error.URLError, TimeoutError, OSError) as e:
            last = getattr(e, 'reason', None) or str(e)
        if attempt < ATTEMPTS - 1:
            time.sleep(2 ** attempt)
    raise FetchError(
        f'could not download {url} after {ATTEMPTS - 1} retries ({last}). '
        'Is the network down?', 2)


def _get_json(url: str):
    raw = _http_get(url)
    try:
        return json.loads(raw)
    except json.JSONDecodeError as e:
        raise FetchError(f'bad JSON from {url}: {e}', 2)


_collections_cache = None
_svg_cache: dict[str, str] = {}
_style_cache: dict[str, str] = {}


def collections() -> dict:
    global _collections_cache
    if _collections_cache is None:
        _collections_cache = _get_json(f'{API}/collections')
    return _collections_cache


def fetch_svg(icon_id: str) -> str:
    if icon_id not in _svg_cache:
        m = ICON_RE.match(icon_id)
        if not m:
            raise FetchError(f'bad icon id "{icon_id}" (expected prefix:name)')
        prefix, name = m.groups()
        guard_collection(prefix, icon_id)
        _svg_cache[icon_id] = _http_get(f'{API}/{prefix}/{name}.svg').decode('utf-8')
    return _svg_cache[icon_id]


def guard_collection(prefix: str, icon_id: str) -> dict:
    cols = collections()
    if prefix not in cols:
        raise FetchError(f'unknown Iconify collection "{prefix}"')
    info = cols[prefix]
    license_spdx = (info.get('license') or {}).get('spdx') or 'unlicensed'
    low = icon_id.lower()
    bad = next((p for p in BLOCKED_ID_PARTS if p in low), None)
    if bad:
        raise FetchError(
            f'refusing {icon_id}: colour/emoji icon sets are not ink line art '
            f'(id contains "{bad}")')
    if license_spdx not in ALLOWED_LICENSES:
        raise FetchError(
            f'refusing {icon_id}: license {license_spdx} is not allowed '
            f'(allowed: {", ".join(sorted(ALLOWED_LICENSES))})')
    return info


# ---------------------------------------------------------------- svg parsing

def _local(tag: str) -> str:
    return tag.rsplit('}', 1)[-1]


def _floats(text: str) -> list[float]:
    return [float(m.group(0)) for m in NUMBER_RE.finditer(text or '')]


def _matrix_mul(a, b):
    """Affine matrix a*b (apply b first, then a); tuples (a,b,c,d,e,f)."""
    a1, b1, c1, d1, e1, f1 = a
    a2, b2, c2, d2, e2, f2 = b
    return (a1 * a2 + c1 * b2,
            b1 * a2 + d1 * b2,
            a1 * c2 + c1 * d2,
            b1 * c2 + d1 * d2,
            a1 * e2 + c1 * f2 + e1,
            b1 * e2 + d1 * f2 + f1)


def _parse_transform(text: str):
    mat = (1.0, 0.0, 0.0, 1.0, 0.0, 0.0)
    if not text:
        return mat
    for name, args in re.findall(r'([a-zA-Z]+)\s*\(([^)]*)\)', text):
        v = _floats(args)
        name = name.lower()
        if name == 'matrix' and len(v) >= 6:
            t = tuple(v[:6])
        elif name == 'translate' and v:
            t = (1.0, 0.0, 0.0, 1.0, v[0], v[1] if len(v) > 1 else 0.0)
        elif name == 'scale' and v:
            sx = v[0]
            sy = v[1] if len(v) > 1 else v[0]
            t = (sx, 0.0, 0.0, sy, 0.0, 0.0)
        elif name == 'rotate' and v:
            a = math.radians(v[0])
            ca, sa = math.cos(a), math.sin(a)
            t = (ca, sa, -sa, ca, 0.0, 0.0)
            if len(v) >= 3:
                t = _matrix_mul((1.0, 0.0, 0.0, 1.0, v[1], v[2]),
                                _matrix_mul(t, (1.0, 0.0, 0.0, 1.0, -v[1], -v[2])))
        elif name == 'skewx' and v:
            t = (1.0, 0.0, math.tan(math.radians(v[0])), 1.0, 0.0, 0.0)
        elif name == 'skewy' and v:
            t = (1.0, math.tan(math.radians(v[0])), 0.0, 1.0, 0.0, 0.0)
        else:
            continue
        mat = _matrix_mul(mat, t)
    return mat


def _apply(mat, pts):
    a, b, c, d, e, f = mat
    return [(a * x + c * y + e, b * x + d * y + f) for x, y in pts]


def _cubic(p0, p1, p2, p3, n):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1 - t
        x = mt ** 3 * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t ** 3 * p3[0]
        y = mt ** 3 * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t ** 3 * p3[1]
        out.append((x, y))
    return out


def _quad(p0, p1, p2, n):
    out = []
    for i in range(1, n + 1):
        t = i / n
        mt = 1 - t
        out.append((mt * mt * p0[0] + 2 * mt * t * p1[0] + t * t * p2[0],
                    mt * mt * p0[1] + 2 * mt * t * p1[1] + t * t * p2[1]))
    return out


def _segments(length: float, minimum: int = 2) -> int:
    n = int(math.ceil(length / 6.0))
    return max(minimum, min(n, 80))


def _arc_points(p0, rx, ry, phi_deg, large, sweep, p1):
    """Endpoint arc -> sampled points, per the SVG implementation notes."""
    x1, y1 = p0
    x2, y2 = p1
    rx, ry = abs(rx), abs(ry)
    if rx == 0 or ry == 0 or (x1, y1) == (x2, y2):
        return [p1]
    phi = math.radians(phi_deg % 360.0)
    cp, sp = math.cos(phi), math.sin(phi)
    dx2, dy2 = (x1 - x2) / 2.0, (y1 - y2) / 2.0
    x1p = cp * dx2 + sp * dy2
    y1p = -sp * dx2 + cp * dy2
    lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry)
    if lam > 1:
        s = math.sqrt(lam)
        rx *= s
        ry *= s
    num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p
    den = rx * rx * y1p * y1p + ry * ry * x1p * x1p
    coef = (-1 if large == sweep else 1) * math.sqrt(max(0.0, num / den)) if den else 0.0
    cxp = coef * rx * y1p / ry
    cyp = -coef * ry * x1p / rx
    cx = cp * cxp - sp * cyp + (x1 + x2) / 2.0
    cy = sp * cxp + cp * cyp + (y1 + y2) / 2.0

    def angle(ux, uy, vx, vy):
        dot = ux * vx + uy * vy
        det = ux * vy - uy * vx
        return math.atan2(det, dot)

    ux, uy = (x1p - cxp) / rx, (y1p - cyp) / ry
    vx, vy = (-x1p - cxp) / rx, (-y1p - cyp) / ry
    theta = angle(1.0, 0.0, ux, uy)
    delta = angle(ux, uy, vx, vy)
    if not sweep and delta > 0:
        delta -= 2 * math.pi
    elif sweep and delta < 0:
        delta += 2 * math.pi
    n = _segments(abs(delta) * max(rx, ry), 3)
    out = []
    for i in range(1, n + 1):
        t = theta + delta * i / n
        out.append((cx + rx * math.cos(t) * cp - ry * math.sin(t) * sp,
                    cy + rx * math.cos(t) * sp + ry * math.sin(t) * cp))
    return out


def parse_path(d: str):
    """Return a list of (points, closed) subpaths in the path's coordinates."""
    tokens = []
    i, n = 0, len(d)
    while i < n:
        ch = d[i]
        if ch in ' \t\r\n,':
            i += 1
            continue
        if ch.isalpha():
            tokens.append(ch)
            i += 1
            continue
        m = NUMBER_RE.match(d, i)
        if not m:
            raise ValueError(f'bad path data near "{d[i:i + 16]}"')
        tokens.append(float(m.group(0)))
        i = m.end()

    subpaths = []
    cur = None
    start = (0.0, 0.0)
    pos = (0.0, 0.0)
    last_cubic = None
    last_quad = None
    cmd = None
    idx = 0

    def flush(closed=False):
        nonlocal cur
        if cur is not None and len(cur) >= 2:
            if closed and cur[-1] != cur[0]:
                cur.append(cur[0])
            subpaths.append((cur, closed))
        cur = None

    def nums(count):
        nonlocal idx
        if idx + count > len(tokens) or any(isinstance(t, str) for t in tokens[idx:idx + count]):
            raise ValueError('truncated path data')
        vals = tokens[idx:idx + count]
        idx += count
        return vals

    while idx < len(tokens):
        t = tokens[idx]
        if isinstance(t, str):
            cmd = t
            idx += 1
            if cmd in 'Zz':
                if cur is not None:
                    flush(closed=True)
                pos = start
                continue
        elif cmd is None:
            raise ValueError('path data does not start with a command')

        rel = cmd.islower()
        c = cmd.upper()
        if c == 'M':
            x, y = nums(2)
            if rel:
                x, y = pos[0] + x, pos[1] + y
            flush()
            pos = (x, y)
            start = pos
            cur = [pos]
            cmd = 'l' if rel else 'L'
            last_cubic = last_quad = None
        elif c == 'L':
            x, y = nums(2)
            if rel:
                x, y = pos[0] + x, pos[1] + y
            pos = (x, y)
            cur.append(pos)
            last_cubic = last_quad = None
        elif c == 'H':
            x, = nums(1)
            if rel:
                x += pos[0]
            pos = (x, pos[1])
            cur.append(pos)
            last_cubic = last_quad = None
        elif c == 'V':
            y, = nums(1)
            if rel:
                y += pos[1]
            pos = (pos[0], y)
            cur.append(pos)
            last_cubic = last_quad = None
        elif c == 'C':
            x1, y1, x2, y2, x, y = nums(6)
            if rel:
                x1, y1 = pos[0] + x1, pos[1] + y1
                x2, y2 = pos[0] + x2, pos[1] + y2
                x, y = pos[0] + x, pos[1] + y
            ctrl = (x1, y1)
            p3 = (x, y)
            length = (math.dist(pos, ctrl) + math.dist(ctrl, (x2, y2)) +
                      math.dist((x2, y2), p3))
            cur.extend(_cubic(pos, ctrl, (x2, y2), p3, _segments(length)))
            last_cubic = (x2, y2)
            last_quad = None
            pos = p3
        elif c == 'S':
            x2, y2, x, y = nums(4)
            if rel:
                x2, y2 = pos[0] + x2, pos[1] + y2
                x, y = pos[0] + x, pos[1] + y
            ctrl = (2 * pos[0] - last_cubic[0], 2 * pos[1] - last_cubic[1]) if last_cubic else pos
            p3 = (x, y)
            length = (math.dist(pos, ctrl) + math.dist(ctrl, (x2, y2)) +
                      math.dist((x2, y2), p3))
            cur.extend(_cubic(pos, ctrl, (x2, y2), p3, _segments(length)))
            last_cubic = (x2, y2)
            last_quad = None
            pos = p3
        elif c == 'Q':
            x1, y1, x, y = nums(4)
            if rel:
                x1, y1 = pos[0] + x1, pos[1] + y1
                x, y = pos[0] + x, pos[1] + y
            p2 = (x, y)
            length = math.dist(pos, (x1, y1)) + math.dist((x1, y1), p2)
            cur.extend(_quad(pos, (x1, y1), p2, _segments(length)))
            last_quad = (x1, y1)
            last_cubic = None
            pos = p2
        elif c == 'T':
            x, y = nums(2)
            if rel:
                x, y = pos[0] + x, pos[1] + y
            ctrl = (2 * pos[0] - last_quad[0], 2 * pos[1] - last_quad[1]) if last_quad else pos
            p2 = (x, y)
            length = math.dist(pos, ctrl) + math.dist(ctrl, p2)
            cur.extend(_quad(pos, ctrl, p2, _segments(length)))
            last_quad = ctrl
            last_cubic = None
            pos = p2
        elif c == 'A':
            rx, ry, rot, large, sweep, x, y = nums(7)
            if rel:
                x, y = pos[0] + x, pos[1] + y
            p1 = (x, y)
            cur.extend(_arc_points(pos, rx, ry, rot, bool(large), bool(sweep), p1))
            last_cubic = last_quad = None
            pos = p1
        else:
            raise ValueError(f'unsupported path command "{cmd}"')

    flush()
    return subpaths


def _poly_from_points(text: str, closed: bool):
    v = _floats(text)
    pts = [(v[i], v[i + 1]) for i in range(0, len(v) - 1, 2)]
    if closed and len(pts) >= 2:
        pts.append(pts[0])
    return [(pts, closed)] if len(pts) >= 2 else []


def _shape_subpaths(node):
    tag = _local(node.tag)
    a = node.attrib
    if tag == 'path':
        return parse_path(a.get('d', ''))
    if tag == 'circle':
        cx, cy, r = float(a.get('cx', 0)), float(a.get('cy', 0)), float(a.get('r', 0))
        if r <= 0:
            return []
        pts = [(cx + r * math.cos(2 * math.pi * i / 32),
                cy + r * math.sin(2 * math.pi * i / 32)) for i in range(32)]
        pts.append(pts[0])
        return [(pts, True)]
    if tag == 'ellipse':
        cx, cy = float(a.get('cx', 0)), float(a.get('cy', 0))
        rx, ry = float(a.get('rx', 0)), float(a.get('ry', 0))
        if rx <= 0 or ry <= 0:
            return []
        pts = [(cx + rx * math.cos(2 * math.pi * i / 32),
                cy + ry * math.sin(2 * math.pi * i / 32)) for i in range(32)]
        pts.append(pts[0])
        return [(pts, True)]
    if tag == 'rect':
        x, y = float(a.get('x', 0)), float(a.get('y', 0))
        w, h = float(a.get('width', 0)), float(a.get('height', 0))
        if w <= 0 or h <= 0:
            return []
        pts = [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]
        return [(pts, True)]
    if tag == 'line':
        pts = [(float(a.get('x1', 0)), float(a.get('y1', 0))),
               (float(a.get('x2', 0)), float(a.get('y2', 0)))]
        return [(pts, False)] if pts[0] != pts[1] else []
    if tag == 'polyline':
        return _poly_from_points(a.get('points', ''), False)
    if tag == 'polygon':
        return _poly_from_points(a.get('points', ''), True)
    return []


def svg_subpaths(svg: str):
    """All stroked contours in source coordinates, with transforms applied."""
    try:
        root = ET.fromstring(svg)
    except ET.ParseError as e:
        raise FetchError(f'could not parse SVG: {e}')

    out = []

    def walk(node, matrix):
        tag = _local(node.tag)
        if tag in ('defs', 'clipPath', 'mask', 'symbol', 'title', 'desc', 'style'):
            return
        matrix = _matrix_mul(matrix, _parse_transform(node.attrib.get('transform', '')))
        if tag in SHAPE_TAGS:
            try:
                for pts, closed in _shape_subpaths(node):
                    out.append((_apply(matrix, pts), closed))
            except (ValueError, TypeError) as e:
                raise FetchError(f'could not convert <{tag}>: {e}')
        for child in node:
            walk(child, matrix)

    walk(root, (1.0, 0.0, 0.0, 1.0, 0.0, 0.0))
    return out


def classify_svg(svg: str) -> str:
    """'stroke-only', 'filled', 'mixed' or 'unknown'."""
    try:
        root = ET.fromstring(svg)
    except ET.ParseError:
        return 'unknown'
    filled = stroked = False

    def walk(node, inherit_fill, inherit_stroke):
        nonlocal filled, stroked
        tag = _local(node.tag)
        fill = node.attrib.get('fill', inherit_fill)
        stroke = node.attrib.get('stroke', inherit_stroke)
        if tag in SHAPE_TAGS:
            if fill.lower() not in ('none', 'transparent'):
                filled = True
            if stroke.lower() != 'none':
                stroked = True
        for child in node:
            walk(child, fill, stroke)

    walk(root, 'black', 'none')
    if filled and stroked:
        return 'mixed'
    if filled:
        return 'filled'
    if stroked:
        return 'stroke-only'
    return 'unknown'


# ---------------------------------------------------------------- conversion

def fmt(v: float) -> str:
    s = f'{v:.1f}'
    return s[:-2] if s.endswith('.0') else s


def convert_svg(svg: str):
    """Convert an SVG to (case body, bbox, subpath count)."""
    subpaths = svg_subpaths(svg)
    all_pts = [p for pts, _ in subpaths for p in pts]
    if not all_pts:
        raise FetchError('SVG contains no usable path/shape geometry')
    xs = [p[0] for p in all_pts]
    ys = [p[1] for p in all_pts]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = max(x1 - x0, 1e-6), max(y1 - y0, 1e-6)
    scale = min(190.0 / w, 190.0 / h)
    cxs, cys = (x0 + x1) / 2.0, (y0 + y1) / 2.0

    parts = []
    for pts, _closed in subpaths:
        mapped = [((x - cxs) * scale, (y - cys) * scale) for x, y in pts]
        dedup = []
        for p in mapped:
            q = (round(p[0], 1), round(p[1], 1))
            if not dedup or q != dedup[-1]:
                dedup.append(q)
        if len(dedup) < 2:
            continue
        parts.append('Pl([' + ','.join(f'[{fmt(x)},{fmt(y)}]' for x, y in dedup) + '])')
    if not parts:
        raise FetchError('conversion produced no drawable polylines')
    bbox = {'x': round(x0, 1), 'y': round(y0, 1), 'w': round(w, 1), 'h': round(h, 1)}
    return 'return[' + ','.join(parts) + '];', bbox, len(parts)


# ---------------------------------------------------------------- icons.js

def read_icons_js() -> str:
    if not ICONS_JS.exists():
        raise FetchError(f'missing {ICONS_JS}')
    return ICONS_JS.read_text(encoding='utf-8')


def existing_names(js: str) -> set[str]:
    m = re.search(r'const ICON_NAMES=\[(.*?)\];', js)
    if not m:
        raise FetchError('could not find const ICON_NAMES in engine/icons.js')
    return set(re.findall(r"'([^']+)'", m.group(1)))


def build_icons_js(js: str, name: str, icon_id: str, license_spdx: str, body: str) -> str:
    if f"case'{name}'" in js or name in existing_names(js):
        raise FetchError(f'icon "{name}" already exists in engine/icons.js; '
                         'refusing to overwrite')
    case = f"case'{name}':/* {icon_id} \u2014 {license_spdx} */{body}"
    marker = re.search(r'\n \}return\[\]\}', js)
    if not marker:
        raise FetchError('could not find the end of the _iconStrokes switch')
    js_new = js[:marker.start()] + '\n ' + case + js[marker.start():]

    m = re.search(r'const ICON_NAMES=\[(.*?)\];', js_new)
    inner = m.group(1)
    addition = ('' if inner.rstrip().endswith(',') else ',') + f"'{name}'"
    js_new = js_new[:m.start(1)] + inner + addition + js_new[m.end(1):]
    return js_new


def atomic_write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + '.tmp')
    with open(tmp, 'w', encoding='utf-8', newline='') as f:
        f.write(text)
        f.flush()
        os.fsync(f.fileno())
    os.replace(tmp, path)


def record_provenance(meta: dict):
    VENDOR_DIR.mkdir(parents=True, exist_ok=True)
    manifest = []
    if MANIFEST.exists():
        try:
            manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
        except json.JSONDecodeError:
            raise FetchError(f'{MANIFEST} is not valid JSON; fix it first')
    manifest = [m for m in manifest if m.get('name') != meta['name']]
    manifest.append(meta)
    manifest.sort(key=lambda m: m['name'])
    atomic_write(MANIFEST, json.dumps(manifest, indent=2) + '\n')

    lines = [
        '# Imported icon licenses',
        '',
        'Generated by `tools/fetch_icon.py`. Source geometry is vendored in',
        '`engine/icons.js`; nothing is fetched at render time.',
        '',
        '**CC-BY icons require credit in the video description.**',
        '',
        '| Icon | Source | Collection / author | License |',
        '| --- | --- | --- | --- |',
    ]
    for m in manifest:
        author = m.get('author') or m['collection']
        lic = m['license']
        url = m.get('license_url') or ''
        lic_cell = f'[{lic}]({url})' if url else lic
        if m.get('attribution_required'):
            lic_cell += ' — **credit required**'
        lines.append(f"| `{m['name']}` | `{m['source']}` | {m.get('collection_name', m['collection'])} ({author}) | {lic_cell} |")
    lines += [
        '',
        '## Attribution notes',
        '',
        'Include the collection and license in the video description for every',
        'CC-BY icon above, for example:',
        '',
        '> Bull icon by GameIcons (game-icons.net), CC BY 3.0.',
        '',
    ]
    atomic_write(LICENSES_MD, '\n'.join(lines))


# ---------------------------------------------------------------- commands

def probe(icon_id: str) -> str:
    if icon_id not in _style_cache:
        _style_cache[icon_id] = classify_svg(fetch_svg(icon_id))
    return _style_cache[icon_id]


def search_candidates(query: str, limit: int = 40):
    data = _get_json(f'{API}/search?' + urllib.parse.urlencode({'query': query, 'limit': limit}))
    ids = data.get('icons') or []
    cols = collections()
    rows = []
    with ThreadPoolExecutor(max_workers=8) as pool:
        styles = list(pool.map(lambda i: _safe_style(i), ids))
    for icon_id, style in zip(ids, styles):
        prefix = icon_id.split(':')[0]
        info = cols.get(prefix) or {}
        spdx = (info.get('license') or {}).get('spdx') or 'unlicensed'
        low = icon_id.lower()
        blocked = None
        if any(p in low for p in BLOCKED_ID_PARTS):
            blocked = 'emoji/colour set'
        elif spdx not in ALLOWED_LICENSES:
            blocked = f'license {spdx}'
        rows.append({'id': icon_id, 'prefix': prefix, 'license': spdx,
                     'style': style, 'blocked': blocked, 'info': info})
    return rows


def _safe_style(icon_id):
    try:
        return probe(icon_id)
    except FetchError:
        return 'unknown'


def cmd_search(args):
    rows = search_candidates(args.query)
    if not rows:
        print(f'No icons found for "{args.query}".')
        return 1
    print(f'{"ICON":30} {"LICENSE":14} {"STYLE":12} STATUS')
    for r in rows:
        status = f'blocked ({r["blocked"]})' if r['blocked'] else 'ok'
        print(f'{r["id"]:30} {r["license"]:14} {r["style"]:12} {status}')
    print(f'\n{len(rows)} candidates; {sum(1 for r in rows if not r["blocked"])} allowed.')
    return 0


def choose_best(rows):
    def rank(r):
        pref = r['prefix'] in PREFERRED
        stroke = r['style'] == 'stroke-only'
        if pref and stroke:
            group = 0
        elif stroke:
            group = 1
        elif pref:
            group = 2
        else:
            group = 3
        return (group, PREFERRED.index(r['prefix']) if pref else 99)
    allowed = [r for r in rows if not r['blocked']]
    if not allowed:
        return None
    return sorted(allowed, key=rank)[0]


def cmd_add(args):
    if not NAME_RE.match(args.name):
        raise FetchError(f'invalid icon name "{args.name}" (use lowercase letters, digits, dashes)')
    js = read_icons_js()
    if args.name in existing_names(js) or f"case'{args.name}'" in js:
        raise FetchError(f'icon "{args.name}" already exists in engine/icons.js; '
                         'refusing to overwrite')

    if args.icon:
        icon_id = args.icon
    else:
        rows = search_candidates(args.query)
        best = choose_best(rows)
        if not best:
            raise FetchError(f'no icon with an allowed license found for "{args.query}"',
                             3)
        icon_id = best['id']
        print(f'Picked {icon_id} ({best["license"]}, {best["style"]}) for "{args.query}".')

    m = ICON_RE.match(icon_id)
    if not m:
        raise FetchError(f'bad icon id "{icon_id}" (expected prefix:name)')
    prefix, icon_name = m.groups()
    info = guard_collection(prefix, icon_id)
    svg = fetch_svg(icon_id)
    style = probe(icon_id)
    body, bbox, n_sub = convert_svg(svg)

    spdx = info['license']['spdx']
    js_new = build_icons_js(js, args.name, icon_id, spdx, body)
    atomic_write(ICONS_JS, js_new)

    author = (info.get('author') or {}).get('name') or info.get('name') or prefix
    meta = {
        'name': args.name,
        'source': icon_id,
        'collection': prefix,
        'collection_name': info.get('name') or prefix,
        'author': author,
        'license': spdx,
        'license_url': (info.get('license') or {}).get('url') or '',
        'svg_url': f'{API}/{prefix}/{icon_name}.svg',
        'sha256': hashlib.sha256(svg.encode('utf-8')).hexdigest(),
        'fetched_at': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ'),
        'bbox': bbox,
        'subpaths': n_sub,
        'attribution_required': spdx in ATTRIBUTION_LICENSES,
    }
    record_provenance(meta)

    print(f'Added case\'{args.name}\' from {icon_id} ({spdx}, {style}).')
    print(f'  {n_sub} polylines, source bbox {bbox["w"]}x{bbox["h"]}, '
          f'sha256 {meta["sha256"][:12]}...')
    if meta['attribution_required']:
        print('  CC-BY: credit this icon in the video description (see LICENSES.md).')
    return 0


def main(argv=None):
    p = argparse.ArgumentParser(
        description='Search Iconify and vendor icons into engine/icons.js.')
    sub = p.add_subparsers(dest='cmd', required=True)

    s = sub.add_parser('search', help='list candidate icons')
    s.add_argument('query')
    s.set_defaults(func=cmd_search)

    a = sub.add_parser('add', help='convert and append one icon')
    a.add_argument('name')
    g = a.add_mutually_exclusive_group(required=True)
    g.add_argument('--icon', help='explicit Iconify id, e.g. tabler:gavel')
    g.add_argument('--query', help='search text; best allowed stroke icon is used')
    a.set_defaults(func=cmd_add)

    args = p.parse_args(argv)
    try:
        return args.func(args)
    except FetchError as e:
        print(f'ERROR: {e}', file=sys.stderr)
        return e.code
    except KeyboardInterrupt:
        print('Interrupted; engine/icons.js was not modified.', file=sys.stderr)
        return 130


if __name__ == '__main__':
    raise SystemExit(main())
