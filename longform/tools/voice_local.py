"""Narration for $0 with edge-tts (Microsoft neural voices). Free, no account; synthesis happens on
Microsoft's servers, so the local CPU load is near zero (just an mp3->wav decode). Word timings come
from edge-tts's own WordBoundary events -- no Whisper, no local AI model.

  scripts/py scripts/voice.py <project>          script.json -> data/narration.wav + data/lines.json
                                                 + data/words.json + data/words.txt (word times, exact)
  scripts/py scripts/voice.py --list             voices that narrate well
  scripts/py scripts/voice.py --download         no-op (edge-tts needs no model files)

script.json: { "voice": "en-KE-ChilembaNeural", "speed": 1.05, "lead": 0.45, "outro": 0.9, "gap": 0.32,
               "lines": [ { "text": "What if you swallow gum?", "caps": "...", "gap": 0.3 }, ... ] }
One line = one CUT, not one sentence: a sentence can run across several lines. Lines are grouped into
whole sentences (a line ending in . ? ! closes one; "break": true forces a close) and each sentence is
spoken in ONE edge-tts pass so the intonation flows; every cut inside a sentence is placed exactly on
the WordBoundary events, so line times are exact to the word. "gap" (on a sentence's last line) = the
pause after that sentence. Write numbers the way they're SAID. words.py is kept only as a pass-through
/ for --audio own recordings; voice.py already writes the word timings.
"""
import argparse, asyncio, edge_tts, json, os, re, subprocess, sys, tempfile
from difflib import SequenceMatcher
from pathlib import Path
import numpy as np
from scipy.io import wavfile

SR = 24000
DEFAULT_VOICE = os.environ.get('FACELESS_VOICE', 'en-KE-ChilembaNeural')
GOOD = {
    'en-KE-ChilembaNeural': 'Kenyan English male, warm storyteller (default)',
    'en-NG-AbeoNeural': 'Nigerian English male, lively',
    'en-NG-EzinneNeural': 'Nigerian English female, bright',
    'en-ZA-LukeNeural': 'South African English male, steady',
    'en-ZA-LeahNeural': 'South African English female, warm',
    'en-TZ-EliasNeural': 'Tanzanian English male, calm',
    'en-US-GuyNeural': 'US male, energetic',
    'en-US-ChristopherNeural': 'US male, deep explainer',
    'en-GB-RyanNeural': 'UK male, documentary',
    'en-GB-SoniaNeural': 'UK female, crisp',
}
norm = lambda w: re.sub(r'[^a-z0-9]+', '', w.lower())


def rate_str(speed):
    return f'{round((float(speed) - 1) * 100):+d}%'


def trim(x, thr=0.008):
    """cut leading/trailing silence so line start/end times are exact; return (x, front_samples_cut)"""
    idx = np.where(np.abs(x) > thr)[0]
    if not len(idx): return x, 0
    a = max(0, idx[0] - int(0.01 * SR)); b = min(len(x), idx[-1] + int(0.03 * SR))
    return x[a:b], a


async def speak(text, voice, rate):
    """one edge-tts pass -> (mp3 bytes, [(word, start_s, end_s)])"""
    c = edge_tts.Communicate(text, voice, rate=rate, boundary='WordBoundary')
    audio, words = b'', []
    async for ch in c.stream():
        if ch['type'] == 'audio': audio += ch['data']
        elif ch['type'] == 'WordBoundary':
            words.append((ch['text'], ch['offset'] / 1e7, (ch['offset'] + ch['duration']) / 1e7))
    return audio, words


async def speak_retry(text, voice, rate, tries=15):
    last = None
    for k in range(tries):
        try: return await speak(text, voice, rate)
        except Exception as e:
            last = e; print(f'  retry {k+1}/{tries} in {min(30, 3*(k+1))}s: {e}', flush=True); await asyncio.sleep(min(30, 3 * (k + 1)))
    raise SystemExit(f'edge-tts synthesis failed after {tries} tries: {last}')


def mp3_to_float(mp3):
    """decode edge-tts's mp3 -> 24 kHz mono float64 via ffmpeg (tiny CPU cost)"""
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as f:
        f.write(mp3); p = f.name
    try:
        r = subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', p, '-ac', '1', '-ar', str(SR),
                            '-f', 'f32le', 'pipe:1'], capture_output=True, check=True)
        return np.frombuffer(r.stdout, dtype=np.float32).astype(np.float64)
    finally:
        os.unlink(p)


def align_times(script_words, heard):
    """script_words: [str]; heard: [(word, s, e)] -> [(s, e)] per script word (1:1 when counts match,
    otherwise matched by spelling, gaps spread by word length)"""
    a = [norm(w) for w in script_words]; b = [(norm(w), s, e) for w, s, e in heard]
    if len(a) == len(b) and all(x == y[0] for x, y in zip(a, b)): return [(y[1], y[2]) for y in b]
    times = [None] * len(a)
    for blk in SequenceMatcher(None, a, [y[0] for y in b], autojunk=False).get_matching_blocks():
        for k in range(blk.size): times[blk.a + k] = (b[blk.b + k][1], b[blk.b + k][2])
    i = 0
    while i < len(a):
        if times[i] is not None: i += 1; continue
        j = i
        while j < len(a) and times[j] is None: j += 1
        lo = times[i - 1][1] if i > 0 else (b[0][1] if b else 0.0)
        hi = times[j][0] if j < len(a) else (b[-1][2] if b else lo + 0.3 * (j - i))
        if hi <= lo: hi = lo + 0.05 * (j - i)
        L = [max(1, len(a[k])) for k in range(i, j)]; tot = sum(L); c = lo
        for k, l in zip(range(i, j), L): d = (hi - lo) * l / tot; times[k] = (c, c + d * 0.9); c += d
        i = j
    return times


async def run(P, S, voice, speed):
    # group the lines into whole sentences (a line ending in . ? ! closes one; "break": true forces a close)
    groups, cur = [], []
    for i, ln in enumerate(S['lines']):
        cur.append(i)
        if re.search(r'[.?!]["\')]*$', ln['text'].strip()) or ln.get('break') or i == len(S['lines']) - 1: groups.append(cur); cur = []
    rate = rate_str(speed)
    out = [np.zeros(int(float(S.get('lead', 0.4)) * SR))]; t = len(out[0]) / SR
    lines = [None] * len(S['lines']); all_words = []
    for g in groups:
        mp3, heard = await speak_retry(' '.join(S['lines'][i]['text'] for i in g), voice, rate)
        x, front = trim(mp3_to_float(mp3)); off = front / SR
        n = len(x) / SR
        # map the heard words onto the script tokens (script spelling wins; keep words on their line)
        toks = [(w, i) for i in g for w in S['lines'][i]['text'].split() if norm(w)]
        times = align_times([w for w, _ in toks], [(w, s - off, e - off) for w, s, e in heard if norm(w)])
        for (w, i), (s, e) in zip(toks, times):
            all_words.append({'w': w, 'line': i, 's': round(t + s, 3), 'e': round(t + e, 3)})
        by_line = {i: [] for i in g}
        for w in all_words:
            if w['line'] in by_line: by_line[w['line']].append(w)
        for i in g:   # a line's window = its first word's start .. its last word's end
            ws = by_line.get(i) or []
            lo = ws[0]['s'] - t if ws else 0.0; hi = ws[-1]['e'] - t if ws else n
            lines[i] = {'i': i, 'text': S['lines'][i]['text'], 'start': round(t + lo, 3), 'end': round(t + hi, 3)}
            print(f'{i:2d} {lines[i]["start"]:6.2f}-{lines[i]["end"]:6.2f}  {S["lines"][i]["text"]}', flush=True)
        gap = np.zeros(int(float(S['lines'][g[-1]].get('gap', S.get('gap', 0.3))) * SR))
        out += [x, gap]; t += n + len(gap) / SR
    outro = np.zeros(int(float(S.get('outro', 0.9)) * SR)); out.append(outro)
    y = np.concatenate(out); y = y / (np.abs(y).max() + 1e-9) * 0.9
    (P / 'data').mkdir(exist_ok=True)
    wavfile.write(P / 'data/narration.wav', SR, (y * 32767).astype(np.int16))
    dur = len(y) / SR
    (P / 'data/lines.json').write_text(json.dumps({'duration': round(dur, 3), 'voice': voice, 'speed': speed, 'lines': lines}, indent=1))
    (P / 'data/words.json').write_text(json.dumps(all_words, indent=1))
    (P / 'data/words.txt').write_text('\n'.join(f"{w['s']:7.2f} {w['e']:7.2f}  L{w['line']:<2d} {w['w']}" for w in all_words))
    print(f'data/narration.wav ({dur:.2f} s, {voice} x{speed}) + data/lines.json + data/words.json '
          f'({len(all_words)} words, edge-tts WordBoundary). words.py not needed.')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('project', nargs='?'); ap.add_argument('--list', action='store_true'); ap.add_argument('--download', action='store_true')
    ap.add_argument('--voice'); ap.add_argument('--speed', type=float)
    a = ap.parse_args()
    if a.list:
        for k, v in GOOD.items(): print(f'{k:24s} {v}')
        return
    if a.download: print('edge-tts needs no model files; nothing to download'); return
    if not a.project: ap.error('project folder missing')
    P = Path(a.project); S = json.loads((P / 'script.json').read_text())
    voice = a.voice or S.get('voice', DEFAULT_VOICE); speed = a.speed or S.get('speed', 1.0)
    asyncio.run(run(P, S, voice, speed))


if __name__ == '__main__':
    main()
