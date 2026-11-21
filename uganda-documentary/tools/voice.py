#!/usr/bin/env python3
"""Narration for the Uganda film: script.json -> voice + exact line timings.

Free Microsoft neural TTS through edge-tts, Kenyan English male by default
(en-KE-ChilembaNeural). Word timings fall out of edge-tts's own boundary
events, so a cut lands on the word, not near it.

    PYTHONPATH=../ttslib python3 tools/voice.py

Writes:
    data/narration.wav   24 kHz mono, the whole read, gaps included
    data/narration.m4a   the copy the film actually plays
    data/lines.json      [{chapter, text, start, end}] in seconds
    data/chapters.json   [{id, num, title, date, key, start, duration}]

No scipy, no numpy: ffmpeg decodes, the wave module assembles.
"""
import asyncio
import json
import os
import subprocess
import sys
import time
import wave
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parent.parent
SR = 24000
SRC = ROOT / "script.json"
DATA = ROOT / "data"


def rate_str(speed):
    return f"{round((float(speed) - 1) * 100):+d}%"


async def synth(text, voice, rate, dest):
    com = edge_tts.Communicate(text, voice, rate=rate, boundary="WordBoundary")
    audio = bytearray()
    words = []
    async for chunk in com.stream():
        if chunk["type"] == "audio":
            audio.extend(chunk["data"])
        elif chunk["type"] == "WordBoundary":
            words.append(
                {
                    "text": chunk["text"],
                    "start": chunk["offset"] / 10_000_000,
                    "end": (chunk["offset"] + chunk["duration"]) / 10_000_000,
                }
            )
    dest.write_bytes(bytes(audio))
    return words


def decode(mp3, wav):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(mp3), "-ac", "1", "-ar", str(SR),
         "-c:a", "pcm_s16le", str(wav)],
        check=True,
    )
    with wave.open(str(wav), "rb") as w:
        return w.readframes(w.getnframes())


def trim(pcm, thr=350, head=0.012, tail=0.05):
    """Drop leading and trailing silence so a line's start is its first phoneme."""
    n = len(pcm) // 2
    first, last = 0, n - 1
    for i in range(n):
        if abs(int.from_bytes(pcm[i * 2:i * 2 + 2], "little", signed=True)) > thr:
            first = i
            break
    for i in range(n - 1, -1, -1):
        if abs(int.from_bytes(pcm[i * 2:i * 2 + 2], "little", signed=True)) > thr:
            last = i
            break
    a = max(0, first - int(head * SR))
    b = min(n, last + int(tail * SR))
    return pcm[a * 2:b * 2]


def silence(seconds):
    return b"\x00\x00" * int(seconds * SR)


def main():
    script = json.loads(SRC.read_text())
    voice = script.get("voice", "en-KE-ChilembaNeural")
    rate = script.get("rate", 1.0)
    lead = script.get("lead", 0.85)
    gap = script.get("gap", 0.34)
    chapter_gap = script.get("chapterGap", 1.1)

    DATA.mkdir(exist_ok=True)
    raw = DATA / "raw"
    raw.mkdir(exist_ok=True)

    buffer = bytearray(silence(lead))
    cursor = lead
    lines, chapters = [], []

    for ch in script["chapters"]:
        ch_start = max(0.0, cursor - 0.65)
        for idx, text in enumerate(ch["lines"]):
            slug = f"{ch['id']}-{idx:02d}"
            mp3 = raw / f"{slug}.mp3"
            wav = raw / f"{slug}.wav"
            if mp3.exists() and mp3.stat().st_size > 2000:
                print(f"  {slug}  cached", flush=True)
            else:
                print(f"  {slug}  {text[:56]}", flush=True)
                last = None
                for attempt in range(4):
                    try:
                        asyncio.run(synth(text, voice, rate_str(rate), mp3))
                        last = None
                        break
                    except Exception as exc:          # DNS hiccups happen
                        last = exc
                        print(f"    retry {attempt + 1}: {type(exc).__name__}", flush=True)
                        time.sleep(1.5 * (attempt + 1))
                if last is not None:
                    raise last
            pcm = trim(decode(mp3, wav))
            dur = len(pcm) / 2 / SR
            lines.append(
                {"chapter": ch["id"], "text": text, "start": round(cursor, 3),
                 "end": round(cursor + dur, 3)}
            )
            buffer.extend(pcm)
            cursor += dur
            if idx < len(ch["lines"]) - 1:
                buffer.extend(silence(gap))
                cursor += gap
        buffer.extend(silence(chapter_gap))
        cursor += chapter_gap
        chapters.append(
            {
                "id": ch["id"], "num": ch["num"], "title": ch["title"],
                "date": ch["date"], "key": ch["key"], "start": round(ch_start, 3),
                "voiceEnd": round(cursor, 3),
            }
        )

    total = len(buffer) / 2 / SR

    with wave.open(str(DATA / "narration.wav"), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(bytes(buffer))

    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(DATA / "narration.wav"),
         "-c:a", "aac", "-b:a", "112k", "-ar", "48000", str(DATA / "narration.m4a")],
        check=True,
    )

    # Chapter timing: a chapter owns the screen until the next one starts.
    for i, ch in enumerate(chapters):
        end = chapters[i + 1]["start"] if i + 1 < len(chapters) else total
        ch["duration"] = round(end - ch["start"], 3)

    (DATA / "lines.json").write_text(json.dumps(lines, indent=1))
    (DATA / "chapters.json").write_text(json.dumps(chapters, indent=1))

    print(f"\nvoice: {voice} @ {rate_str(rate)}")
    print(f"lines: {len(lines)}   chapters: {len(chapters)}")
    print(f"narration: {total:.1f} s")
    for ch in chapters:
        print(f"  {ch['num']} {ch['title']:16s} {ch['start']:6.1f} -> "
              f"{ch['start'] + ch['duration']:6.1f}  ({ch['duration']:.1f} s)")


if __name__ == "__main__":
    sys.exit(main())
