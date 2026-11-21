#!/usr/bin/env python3
"""Render a PNG frame as ASCII luminance art so layout is readable in text."""
import subprocess
import sys

CH = " .:-=+*#%@"


def ascii_art(png, cols=110, rows=None, x=0, y=0, w=1920, h=1080, invert=False):
    if rows is None:
        rows = int(cols * (h / w) / 2.05)
    out = subprocess.run(
        [
            "ffmpeg", "-v", "error", "-i", png,
            "-vf", f"crop={w}:{h}:{x}:{y},scale={cols}:{rows},format=gray",
            "-f", "rawvideo", "-",
        ],
        capture_output=True,
    ).stdout
    lines = []
    for r in range(rows):
        row = out[r * cols:(r + 1) * cols]
        line = "".join(CH[min(9, (v * 10) // 256 if not invert else ((255 - v) * 10) // 256)] for v in row)
        lines.append(line)
    return "\n".join(lines)


if __name__ == "__main__":
    png = sys.argv[1]
    cols = int(sys.argv[2]) if len(sys.argv) > 2 else 110
    if len(sys.argv) > 6:
        x, y, w, h = map(int, sys.argv[4:8])
        print(ascii_art(png, cols, x=x, y=y, w=w, h=h))
    else:
        print(ascii_art(png, cols))
