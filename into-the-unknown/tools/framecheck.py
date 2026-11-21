#!/usr/bin/env python3
"""Region statistics for checkpoint frames, without image libraries.

Extracts raw grayscale (or RGB) bytes via ffmpeg for named regions of each
snapshot PNG and prints mean / standard deviation / bright-pixel fraction,
so expected picture content can be verified numerically.
"""

import subprocess
import sys
from pathlib import Path

SNAP = Path(sys.argv[1] if len(sys.argv) > 1 else ".hyperframes/artifacts/snapshots")


def region_stats(png, x, y, w, h, mode="gray", thresh=200):
    out = subprocess.run(
        [
            "ffmpeg", "-v", "error", "-i", str(png),
            "-vf", f"crop={w}:{h}:{x}:{y},format={mode}",
            "-f", "rawvideo", "-",
        ],
        capture_output=True,
    ).stdout
    n = len(out)
    if mode == "gray":
        vals = list(out)
        mean = sum(vals) / n
        var = sum((v - mean) ** 2 for v in vals) / n
        bright = sum(1 for v in vals if v > thresh) / n
        return {"mean": round(mean, 1), "std": round(var ** 0.5, 1), "bright": round(bright, 4)}
    # rgb: return mean color
    return {
        "r": round(sum(out[0::3]) / (n / 3)),
        "g": round(sum(out[1::3]) / (n / 3)),
        "b": round(sum(out[2::3]) / (n / 3)),
    }


def color_at(png, x, y, w=1, h=1):
    return region_stats(png, x, y, w, h, mode="rgb24")


CHECKS = [
    # (file, region name, x, y, w, h, expectation)
    ("frame-00-at-2s.png", "whale-mask footage", 760, 340, 400, 260, "std > 18 (humpback footage inside outline)"),
    ("frame-00-at-2s.png", "corner bg", 40, 40, 300, 200, "mean < 12 (near-black, no footage leak)"),
    ("frame-00-at-2s.png", "DEEPSEEK label", 770, 726, 380, 40, "bright > 0 (label visible)"),
    ("frame-01-at-12s.png", "question 2 line", 360, 450, 1200, 100, "bright > 0.02 (What haven't we solved yet?)"),
    ("frame-01-at-12s.png", "depth ruler", 40, 200, 100, 600, "std > 8 (ticks scrolling)"),
    ("frame-02-at-17s.png", "question 3 line", 360, 450, 1200, 100, "bright > 0.02 (Can a machine learn to reason?)"),
    ("frame-03-at-19.5s.png", "typed line", 560, 470, 800, 60, "bright > 0.02 (typed text)"),
    ("frame-03-at-19.5s.png", "depth readout", 72, 950, 300, 72, "bright > 0.05 (DEPTH 10935 m holds)"),
    ("frame-04-at-24s.png", "circle window", 760, 260, 400, 280, "std > 20 (processor footage)"),
    ("frame-04-at-24s.png", "outside circle", 40, 900, 240, 120, "mean < 90 (blurred plate, not sharp)"),
    ("frame-04-at-24s.png", "label row", 660, 850, 600, 60, "bright > 0.03 (DeepSeek-V4 / open source)"),
    ("frame-05-at-30.5s.png", "pill row", 500, 430, 920, 140, "std > 25 (pill + Open to researchers.)"),
    ("frame-06-at-33.5s.png", "pill row", 500, 430, 920, 140, "std > 25 (pill + Open to students.)"),
    ("frame-07-at-38.5s.png", "whole wall", 60, 60, 1800, 960, "std > 30 (tilted tile wall visible)"),
    ("frame-07-at-38.5s.png", "hz label", 660, 640, 600, 70, "bright > 0.05 (HANGZHOU . EST. 2023)"),
    ("frame-08-at-39.9s.png", "whole wall", 60, 60, 1800, 960, "std > 30 (wall held, ripple fading)"),
    ("frame-09-at-44.5s.png", "letters block", 520, 390, 880, 300, "std > 25 (IPO letters, p131 inside)"),
    ("frame-09-at-44.5s.png", "wordmark band", 720, 130, 480, 110, "bright > 0.35 (white wordmark wiped on)"),
    ("frame-09-at-44.5s.png", "typed line 2", 560, 870, 800, 60, "bright > 0.02 (typing line)"),
    ("frame-10-at-49.3s.png", "card top-left", 30, 30, 200, 120, "bluish gradient (b > r)"),
    ("frame-10-at-49.3s.png", "card bottom-right", 1700, 950, 190, 110, "near-white (mean > 200)"),
    ("frame-10-at-49.3s.png", "whale blue", 560, 360, 260, 180, "blue mark (b > r + 60)"),
    ("frame-10-at-49.3s.png", "title band", 560, 528, 800, 80, "dark-on-light (std > 10)"),
    ("frame-11-at-51.6s.png", "whole frame", 0, 0, 1920, 1080, "mean well below card (fade ~half)"),
    ("frame-12-at-51.75s.png", "whole frame", 0, 0, 1920, 1080, "mean < 20 (near full black)"),
]

for fname, rname, x, y, w, h, expect in CHECKS:
    png = SNAP / fname
    if not png.is_file():
        print(f"MISSING  {fname}")
        continue
    print(f"{fname[:-4]}  {rname:24s} {region_stats(png, x, y, w, h)}  expect: {expect}")

# spot colors
print()
print("2.0s top-left bg color:", color_at(SNAP / "frame-00-at-2s.png", 10, 10, 60, 40))
print("49.3s card colors tl/br:", color_at(SNAP / "frame-10-at-49.3s.png", 20, 20, 80, 60), color_at(SNAP / "frame-10-at-49.3s.png", 1810, 1000, 80, 60))
print("49.3s whale color:", color_at(SNAP / "frame-10-at-49.3s.png", 640, 400, 120, 90))
