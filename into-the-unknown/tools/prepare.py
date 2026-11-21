#!/usr/bin/env python3
"""Prepare render assets for the "Into the Unknown." film.

Reads the original downloads under deepseek-assets/ and writes the processed
media used by the composition under assets/:

  - fonts/       the four TTFs, used via @font-face
  - audio/       first 52 s of the score, 1.70 s fade at 50.30 s, two-pass
                 loudnorm to -14 LUFS / -1.5 dBTP, stereo 48 kHz FLAC
  - brand/       full logo, whale-only mark and wordmark-only SVGs
  - media/       16:9 trims, 1920x1080 @ 30 fps, silent
  - media/sonar/ nine 1080x1080 squares @ 30 fps (vertical crop center 62 %
                 for p223, 55 % for p025, 50 % for the others)
  - media/sonar-blur/ blurred copies of the squares for the background plate
  - stills/      one 640x360 JPEG per source at min(2 s, duration / 3)

Every step skips work that is already done, so it can be re-run safely.
"""

import json
import math
import re
import shutil
import subprocess
from pathlib import Path

SRC = Path("deepseek-assets")
OUT = Path("assets")

# 16:9 clips: id -> (source start, source end)
TRIMS = {
    "p002": (10.00, 14.80),
    "p000": (3.00, 5.80),
    "p029": (2.00, 4.80),
    "p042": (0.50, 3.10),
    "p055": (1.20, 3.80),
    "p114": (1.00, 3.60),
    "p208": (2.00, 2.80),
    "p064": (2.00, 3.80),
    "p038": (0.50, 3.10),
    "p059": (1.00, 3.60),
    "p098": (1.00, 3.60),
    "p176": (1.00, 8.00),
    "p129": (1.50, 6.70),
    "p131": (4.00, 9.20),
}

# Sonar squares: id -> (source start, source end, vertical crop center)
SONAR = {
    "p097": (0.40, 1.60, 0.50),
    "p223": (3.00, 4.20, 0.62),
    "p019": (3.00, 4.20, 0.50),
    "p169": (1.00, 2.20, 0.50),
    "p121": (2.00, 3.20, 0.50),
    "p025": (2.00, 3.20, 0.55),
    "p194": (2.00, 3.20, 0.50),
    "p083": (15.00, 16.20, 0.50),
    "p089": (0.20, 1.40, 0.50),
}

WALL_IDS = [
    "p000", "p002", "p003", "p012", "p019", "p025", "p029", "p034",
    "p038", "p042", "p053", "p055", "p059", "p064", "p083", "p087",
    "p089", "p097", "p098", "p114", "p121", "p129", "p131", "p139",
    "p151", "p164", "p169", "p176", "p194", "p201", "p208", "p223",
]


def run(cmd):
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise SystemExit(f"command failed: {' '.join(map(str, cmd))}\n{result.stderr[-2000:]}")
    return result


def probe(path):
    out = run([
        "ffprobe", "-v", "error", "-select_streams", "v:0",
        "-show_entries", "stream=width,height:format=duration",
        "-of", "json", str(path),
    ]).stdout
    data = json.loads(out)
    return (
        int(data["streams"][0]["width"]),
        int(data["streams"][0]["height"]),
        float(data["format"]["duration"]),
    )


def done(path):
    return path.is_file() and path.stat().st_size > 0


def main():
    (OUT / "fonts").mkdir(parents=True, exist_ok=True)
    (OUT / "audio").mkdir(parents=True, exist_ok=True)
    (OUT / "brand").mkdir(parents=True, exist_ok=True)
    (OUT / "media" / "sonar").mkdir(parents=True, exist_ok=True)
    (OUT / "media" / "sonar-blur").mkdir(parents=True, exist_ok=True)
    (OUT / "stills").mkdir(parents=True, exist_ok=True)

    # ---- fonts -----------------------------------------------------------
    for name in ("Montserrat.ttf", "DMSans.ttf", "DMMono-Regular.ttf", "DMMono-Medium.ttf"):
        target = OUT / "fonts" / name
        if not done(target):
            shutil.copy2(SRC / name, target)
            print("font", name, flush=True)

    # ---- score: 52 s trim, fade at 50.30 s, two-pass loudnorm -------------
    score = OUT / "audio" / "score.flac"
    if not done(score):
        trim = ["-t", "52"]
        fade = "afade=t=out:st=50.30:d=1.70"
        common = ["-i", str(SRC / "epic-hybrid.mp3"), *trim]
        # pass 1: measure
        p1 = run(["ffmpeg", "-y", *common, "-af",
                  f"{fade},loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json",
                  "-f", "null", "-"])
        match = re.search(r"\{[^{}]*\}", p1.stderr.split("Parsed_loudnorm")[-1])
        measured = json.loads(match.group(0)) if match else {}
        if not measured.get("input_i"):
            raise SystemExit("loudnorm pass 1 produced no measurements")
        ln = ("loudnorm=I=-14:TP=-1.5:LRA=11:linear=true:"
              f"measured_I={measured['input_i']}:"
              f"measured_TP={measured['input_tp']}:"
              f"measured_LRA={measured['input_lra']}:"
              f"measured_thresh={measured['input_thresh']}:"
              f"offset={measured['target_offset']}")
        run(["ffmpeg", "-y", *common, "-af", f"{fade},{ln}",
             "-ar", "48000", "-ac", "2", "-c:a", "flac", str(score)])
        print("audio score.flac", flush=True)

    # ---- 16:9 trims ------------------------------------------------------
    for pid, (start, end) in TRIMS.items():
        target = OUT / "media" / f"{pid}.mp4"
        if done(target):
            continue
        run(["ffmpeg", "-y", "-ss", f"{start}", "-to", f"{end}",
             "-i", str(SRC / f"{pid}.mp4"),
             "-an", "-vf", "scale=1920:1080,fps=30",
             "-c:v", "libx264", "-preset", "medium", "-crf", "18",
             "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target)])
        print("trim", pid, flush=True)

    # ---- sonar squares + blurred copies ----------------------------------
    for pid, (start, end, vc) in SONAR.items():
        src = SRC / f"{pid}.mp4"
        w, h, _ = probe(src)
        side = min(w, h)
        if w >= h:
            x = (w - side) // 2
            y = round(min(max(vc * h - side / 2, 0), h - side))
        else:
            x = 0
            y = round(min(max(vc * h - side / 2, 0), h - side))
        crop = f"crop={side}:{side}:{x}:{y},scale=1080:1080"
        target = OUT / "media" / "sonar" / f"{pid}.mp4"
        if not done(target):
            run(["ffmpeg", "-y", "-ss", f"{start}", "-to", f"{end}", "-i", str(src),
                 "-an", "-vf", f"{crop},fps=30",
                 "-c:v", "libx264", "-preset", "medium", "-crf", "18",
                 "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(target)])
            print("sonar", pid, flush=True)
        blurred = OUT / "media" / "sonar-blur" / f"{pid}.mp4"
        if not done(blurred):
            run(["ffmpeg", "-y", "-ss", f"{start}", "-to", f"{end}", "-i", str(src),
                 "-an", "-vf", f"{crop},scale=1080:1080,gblur=sigma=14,fps=30",
                 "-c:v", "libx264", "-preset", "medium", "-crf", "21",
                 "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(blurred)])
            print("sonar-blur", pid, flush=True)

    # ---- wall stills -----------------------------------------------------
    for pid in WALL_IDS:
        target = OUT / "stills" / f"{pid}.jpg"
        if done(target):
            continue
        src = SRC / f"{pid}.mp4"
        _, _, dur = probe(src)
        at = min(2.0, dur / 3)
        w, h, _ = probe(src)
        cw = min(w, math.floor(h * 16 / 9))
        ch = min(h, math.floor(w * 9 / 16))
        x = (w - cw) // 2
        y = (h - ch) // 2
        run(["ffmpeg", "-y", "-ss", f"{at}", "-i", str(src), "-frames:v", "1",
             "-vf", f"crop={cw}:{ch}:{x}:{y},scale=640:360",
             "-q:v", "3", str(target)])
        print("still", pid, flush=True)

    # ---- brand SVGs ------------------------------------------------------
    logo_src = (SRC / "deepseek.svg").read_text(encoding="utf-8")

    # full logo, as downloaded (viewBox 0 0 143 23)
    full = OUT / "brand" / "deepseek-logo.svg"
    if not done(full):
        full.write_text(logo_src, encoding="utf-8")

    # whale-only mark: the <g clip-path> group plus its clipPath definition
    whale = OUT / "brand" / "deepseek-whale.svg"
    if not done(whale):
        group = re.search(r"<g clip-path.*?</g>", logo_src, re.DOTALL).group(0)
        clipdef = re.search(r"<clipPath id=\"clip0_logo\">.*?</clipPath>", logo_src, re.DOTALL).group(0)
        whale_svg = (
            '<svg viewBox="0.163086 1.75 26.634 19.6" fill="none" '
            'xmlns="http://www.w3.org/2000/svg">'
            f"{group}<defs>{clipdef}</defs></svg>"
        )
        whale.write_text(whale_svg, encoding="utf-8")

    # wordmark-only: every letter path, without the whale group
    wordmark = OUT / "brand" / "deepseek-wordmark.svg"
    if not done(wordmark):
        letters = re.findall(r"<path d=\"[^\"]*\" fill=\"currentColor\" />", logo_src)
        wordmark_svg = (
            '<svg viewBox="30.5 0 110 23" fill="none" '
            'xmlns="http://www.w3.org/2000/svg">' + "".join(letters) + "</svg>"
        )
        wordmark.write_text(wordmark_svg, encoding="utf-8")

    # explicit-fill variants (currentColor renders black inside an <img>)
    def variant(src_name, out_name, fill):
        target = OUT / "brand" / out_name
        if not done(target):
            text = (OUT / "brand" / src_name).read_text(encoding="utf-8")
            target.write_text(text.replace('fill="currentColor"', f'fill="{fill}"'), encoding="utf-8")

    variant("deepseek-whale.svg", "deepseek-whale-blue.svg", "#4176E6")
    variant("deepseek-wordmark.svg", "deepseek-wordmark-white.svg", "#FFFFFF")
    variant("deepseek-wordmark.svg", "deepseek-wordmark-blue.svg", "#4176E6")

    print("ASSETS_READY", flush=True)


if __name__ == "__main__":
    main()
