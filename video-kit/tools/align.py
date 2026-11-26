"""Article parsing, audio pause detection and sentence/word alignment.
Produces timing.json (the single source of truth for every cue in the video)."""
import re, math, json, subprocess, bisect, difflib, os
import numpy as np
from scipy.io import wavfile

PUNC = re.compile(r'[“”".,:;?!—()]')
def norm_word(w):
    w = w.replace('\u2019', "'")
    return PUNC.sub('', w.lower().replace('’', "'").replace('‘', "'"))

ABBR = ['Mr','Mrs','Ms','Dr','St','vs','etc','cf','Rev','Prof','Gen','Ex','Exod','Lev','Num','Deut','Josh','Judg','Sam','Kgs','Chr','Neh','Esth','Ps','Pss','Prov','Eccl','Isa','Jer','Lam','Ezek','Dan','Hos','Obad','Mic','Nah','Hab','Zeph','Hag','Zech','Mal','Matt','Mk','Lk','Jn','Rom','Cor','Gal','Eph','Phil','Col','Thess','Tim','Tit','Philem','Heb','Jas','Pet','Vol','pp','ff','e.g','i.e','a.m','p.m']
_ABBR_RE = re.compile(r'\b(' + '|'.join(re.escape(a) for a in sorted(ABBR, key=len, reverse=True)) + r')\.')

def clean_inline(t):
    t = re.sub(r'\[\[.*?\]\]', '', t)                     # [[not spoken]]
    t = re.sub(r'\[([^\]]+)\]\((?:[^)]+)\)', r'\1', t)    # [text](url) -> text
    t = re.sub(r'[*_`]+', '', t)
    t = re.sub(r'^\s*>\s?', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def split_sentences(par):
    p = _ABBR_RE.sub(lambda m: m.group(1) + '\u2024', par)
    p = re.sub(r'(\d)\.(\d)', '\\1\u2024\\2', p)
    parts = re.split(r'(?<=[.!?…])["”’\')\]]*\s+(?=["“‘\'(\[]?[A-Z0-9])', p)
    out = []
    for s in parts:
        s = s.replace('\u2024', '.').strip()
        if s: out.append(s)
    # re-attach closing quotes that the split left at the start of a part
    return out

def parse_article(text, speak_headings=False):
    """-> list of sentences: {id,text,heading,para_end}"""
    sents = []; heading = None
    for block in re.split(r'\n\s*\n', text.replace('\r', '')):
        lines = [l for l in block.split('\n') if l.strip() and not l.strip().startswith('//')]
        if not lines: continue
        first = lines[0].strip()
        m = re.match(r'^#{1,6}\s+(.*)$', first)
        if m and len(lines) == 1:
            h = clean_inline(m.group(1))
            if speak_headings:
                sents.append({'text': h if re.search(r'[.!?]$', h) else h + '.', 'heading': h, 'para_end': True, 'is_heading': True})
            heading = h
            continue
        par = clean_inline(' '.join(lines))
        if not par: continue
        ss = split_sentences(par)
        for i, s in enumerate(ss):
            sents.append({'text': s, 'heading': heading if i == 0 else None, 'para_end': i == len(ss) - 1})
        heading = None
    for i, s in enumerate(sents): s['id'] = 's%d' % (i + 1)
    return sents

def syllables(text):
    n = 0
    for w in re.findall(r"[A-Za-z']+|\d+", text):
        n += max(1, len(re.findall(r'[aeiouy]+', w.lower()))) if not w.isdigit() else 1 + len(w) // 2
    return n + 1.5

def decode(path, sr=24000):
    tmp = path + '.analysis.wav'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', path, '-ac', '1', '-ar', str(sr), tmp], check=True)
    r, x = wavfile.read(tmp); os.remove(tmp)
    return r, x.astype(np.float32) / 32768.0

def detect_pauses(path, min_pause=0.18, threshold=None):
    sr, x = decode(path)
    win = int(.01 * sr); n = len(x) // win
    rms = np.sqrt((x[:n * win].reshape(n, win) ** 2).mean(1))
    th = threshold or max(0.006, float(np.percentile(rms, 5)) * 3, float(np.percentile(rms, 99)) * 0.035)
    sil = rms < th
    pauses = []; i = 0
    while i < n:
        if sil[i]:
            j = i
            while j < n and sil[j]: j += 1
            if (j - i) * .01 >= min_pause: pauses.append((i * .01, j * .01))
            i = j
        else: i += 1
    voiced = np.where(~sil)[0]
    ss = voiced[0] * .01 if len(voiced) else 0.0
    se = (voiced[-1] + 1) * .01 if len(voiced) else len(x) / sr
    # pauses touching the very start/end are not boundaries
    pauses = [p for p in pauses if p[0] > ss + .05 and p[1] < se - .05]
    return {'duration': len(x) / sr, 'speech_start': ss, 'speech_end': se, 'pauses': pauses, 'threshold': th}

def align_dp(sents, A, sigma=.45, gamma=1.2):
    N = len(sents); pa = A['pauses']; P = len(pa)
    if P < N - 1:
        raise RuntimeError('Only %d pauses were found for %d sentences. Lower --min-pause, or supply an SRT.' % (P, N))
    S = [p[0] for p in pa]; E = [p[1] for p in pa]; L = [p[1] - p[0] for p in pa]
    pre = [0.0]
    for l in L: pre.append(pre[-1] + l)
    w = [syllables(s['text']) for s in sents]
    ss, se = A['speech_start'], A['speech_end']
    r = (se - ss - 0.4 * (N - 1)) / sum(w)
    INF = 1e18
    for it in range(3):
        for wide in (1.0, 1.6):
            lo_f, hi_f = .3 / wide, 3.2 * wide
            # best[i] : dict bj -> (cost, prev_bi)
            best = [dict() for _ in range(N)]; final = {}
            best[0] = {-1: (0.0, None)}
            ok = True
            for i in range(N):  # sentence i ends at boundary bj (or virtual end for last)
                exp = w[i] * r
                nxt = {}
                for bi, (c0, _) in best[i].items():
                    start = ss if bi < 0 else E[bi]
                    rng_ = range(bi + 1, P) if i < N - 1 else [P]
                    for bj in rng_:
                        end = se if bj >= P else S[bj]
                        inner = pre[min(bj, P)] - pre[bi + 1]
                        dur = end - start - inner
                        if dur > hi_f * exp + 0.3 and bj < P: break
                        if dur < lo_f * exp or dur < .12: continue
                        c = (math.log(dur / exp) ** 2) / sigma ** 2
                        if bj < P:
                            pl = min(L[bj], 1.2)
                            c -= gamma * pl
                            if sents[i].get('para_end'): c -= gamma * min(L[bj] / .6, 1.2)
                        c += c0
                        if bj not in nxt or c < nxt[bj][0]: nxt[bj] = (c, bi)
                if i < N - 1:
                    if not nxt: ok = False; break
                    best[i + 1] = nxt
                else:
                    final = nxt
            if ok and final: break
        if not (ok and final): raise RuntimeError('Could not align the sentences to the pauses. Check that the article text matches the recording, or supply an SRT.')
        # reconstruct
        path = [None] * (N + 1)
        cur = P
        for i in range(N - 1, -1, -1):
            tbl = final if i == N - 1 else best[i + 1]
            c, bi = tbl[cur]
            path[i + 1] = cur; cur = bi
        path[0] = -1
        bounds = path  # bounds[i] = start boundary of sentence i ; bounds[i+1] = end boundary
        # re-estimate rate
        tot = 0
        for i in range(N):
            bi, bj = bounds[i], bounds[i + 1]
            start = ss if bi < 0 else E[bi]; end = se if bj >= P else S[bj]
            tot += end - start - (pre[min(bj, P)] - pre[bi + 1])
        r = tot / sum(w)
    out = []
    for i in range(N):
        bi, bj = bounds[i], bounds[i + 1]
        start = ss if bi < 0 else E[bi]; end = se if bj >= P else S[bj]
        inner = [(S[k], L[k]) for k in range(bi + 1, min(bj, P))]
        exp = w[i] * r; dur = end - start - sum(l for _, l in inner)
        out.append({'start': start, 'end': end, 'pause_after': (L[bj] if bj < P else 0.0), 'inner': inner,
                    'ratio': dur / exp if exp else 1.0})
    return out

def word_times(text, start, end, inner):
    """Spread words over the sentence, snapping detected inner pauses to punctuation breaks."""
    toks = [{'raw': m.group(0), 'i': m.start(), 'n': norm_word(m.group(0))} for m in re.finditer(r'\S+', text)]
    inner = [p for p in inner if p[0] > start + .15 and p[0] + p[1] < end - .1 and p[1] >= .26]
    voiced = (end - start) - sum(p[1] for p in inner)
    cand = [k for k, t in enumerate(toks) if k < len(toks) - 1 and (re.search(r'[,;:?"”—]$', t['raw']) or toks[k + 1]['raw'] == '—')]
    tot = len(text); breaks = []; used = -1; vb = 0.0
    for p in inner:
        vf = (p[0] - start - vb) / voiced; vb += p[1]
        best, bd = -1, 9
        for k in cand:
            if k <= used: continue
            cf = (toks[k]['i'] + len(toks[k]['raw'])) / tot
            d = abs(cf - vf)
            if d < bd and d < .22: bd, best = d, k
        if best >= 0: breaks.append((best, p)); used = best
    def t_at(c):
        t = start + (c / tot) * voiced; add = 0.0
        for k, p in breaks:
            bc = toks[k]['i'] + len(toks[k]['raw'])
            if c >= bc - .01: add += p[1]
        return t + add
    return [{'n': t['n'], 't0': round(t_at(t['i']), 3), 't1': round(t_at(t['i'] + len(t['raw'])), 3)} for t in toks if t['n']]

# ---------- SRT ----------
def parse_srt(path):
    txt = open(path, encoding='utf-8-sig').read().replace('\r', '')
    cues = []
    for blk in re.split(r'\n\s*\n', txt.strip()):
        m = re.search(r'(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)', blk)
        if not m: continue
        g = [int(x) for x in m.groups()]
        t0 = g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000.0; t1 = g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000.0
        body = blk[m.end():].strip().replace('\n', ' ')
        body = re.sub(r'<[^>]+>', '', body)
        cues.append((t0, t1, body))
    return cues

def align_srt(sents, srt_path, duration):
    cues = parse_srt(srt_path)
    sw = []  # (norm, t0, t1)
    for t0, t1, body in cues:
        ws = [w for w in body.split() if norm_word(w)]
        if not ws: continue
        tot = sum(len(w) + 1 for w in ws); c = 0
        for w in ws:
            a = t0 + (t1 - t0) * c / tot; c += len(w) + 1
            sw.append((norm_word(w), a, t0 + (t1 - t0) * c / tot))
    aw = []  # (sent index, norm)
    for i, s in enumerate(sents):
        for m in re.finditer(r'\S+', s['text']):
            n = norm_word(m.group(0))
            if n: aw.append((i, n))
    sm = difflib.SequenceMatcher(None, [a[1] for a in aw], [b[0] for b in sw], autojunk=False)
    t0s = [None] * len(aw); t1s = [None] * len(aw)
    for a, b, size in sm.get_matching_blocks():
        for k in range(size): t0s[a + k] = sw[b + k][1]; t1s[a + k] = sw[b + k][2]
    matched = sum(1 for t in t0s if t is not None) / max(1, len(aw))
    # interpolate gaps
    idx = [k for k, t in enumerate(t0s) if t is not None]
    if not idx: raise RuntimeError('The SRT text does not match the article at all.')
    for k in range(len(aw)):
        if t0s[k] is not None: continue
        j = bisect.bisect_left(idx, k)
        lo = idx[j - 1] if j > 0 else None; hi = idx[j] if j < len(idx) else None
        if lo is None: t0s[k] = max(0, t0s[hi] - .3 * (hi - k)); t1s[k] = t0s[k] + .3
        elif hi is None: t0s[k] = t1s[lo] + .3 * (k - lo); t1s[k] = t0s[k] + .3
        else:
            f = (k - lo) / (hi - lo); t0s[k] = t1s[lo] + (t0s[hi] - t1s[lo]) * f; t1s[k] = t0s[k] + max(.12, (t0s[hi] - t1s[lo]) / (hi - lo))
    out = []; k = 0
    for i, s in enumerate(sents):
        ws = []
        while k < len(aw) and aw[k][0] == i:
            ws.append({'n': aw[k][1], 't0': round(t0s[k], 3), 't1': round(t1s[k], 3)}); k += 1
        out.append({'start': ws[0]['t0'], 'end': ws[-1]['t1'], 'words': ws})
    for i in range(len(out) - 1): out[i]['pause_after'] = max(0.0, out[i + 1]['start'] - out[i]['end'])
    out[-1]['pause_after'] = 0.0
    return out, matched

def plan_chapters(sents, target=60.0):
    n = len(sents); chapters = []; i0 = 0
    while i0 < n:
        t_target = sents[i0]['start'] + target
        if sents[-1]['end'] - sents[i0]['start'] < target * 1.4:
            j = n - 1
        else:
            best, bs = None, -1e9
            for j in range(i0, n - 1):
                d = sents[j]['end'] - t_target
                if abs(d) > 16: continue
                sc = min(sents[j]['pause_after'], 1.2) * 2 + (1.0 if sents[j].get('para_end') else 0) - abs(d) / 20
                if sc > bs: bs, best = sc, j
            j = best if best is not None else min(n - 1, max(i0, next((k for k in range(i0, n) if sents[k]['end'] >= t_target), n - 1)))
        chapters.append({'from': sents[i0]['id'], 'to': sents[j]['id'], 'i0': i0, 'i1': j})
        i0 = j + 1
    for k, c in enumerate(chapters):
        c['id'] = 'ch%02d' % (k + 1)
        c['start'] = 0.0 if k == 0 else (sents[c['i0'] - 1]['end'] + sents[c['i0']]['start']) / 2
    for k, c in enumerate(chapters):
        c['end'] = chapters[k + 1]['start'] if k + 1 < len(chapters) else None
        del c['i0'], c['i1']
    return chapters

def build_timing(article_text, audio_path, srt_path=None, speak_headings=False, chapter_seconds=60, min_pause=0.18):
    sents = parse_article(article_text, speak_headings)
    if not sents: raise RuntimeError('The article has no sentences.')
    A = detect_pauses(audio_path, min_pause)
    mode = 'srt' if srt_path else 'pauses'
    report = {'mode': mode, 'sentences': len(sents), 'pauses_found': len(A['pauses']), 'warnings': []}
    if srt_path:
        al, matched = align_srt(sents, srt_path, A['duration'])
        report['srt_word_match'] = round(matched, 3)
        if matched < .85: report['warnings'].append('Only %d%% of the article words matched the SRT; check that the article is what was read.' % round(matched * 100))
        for s, a in zip(sents, al): s.update(start=round(a['start'], 3), end=round(a['end'], 3), pause_after=round(a['pause_after'], 3), words=a['words'])
    else:
        m = min_pause
        while True:
            try:
                al = align_dp(sents, A); break
            except RuntimeError as e:
                if 'Only' in str(e) and m > .07:
                    m = round(m * .7, 3); A = detect_pauses(audio_path, m); report['min_pause_used'] = m; continue
                raise
        for k, (s, a) in enumerate(zip(sents, al)):
            s.update(start=round(a['start'], 3), end=round(a['end'], 3), pause_after=round(a['pause_after'], 3), words=word_times(s['text'], a['start'], a['end'], a['inner']))
            if len(s['text'].split()) > 3 and abs(math.log(max(a['ratio'], 1e-3))) > .55: report['warnings'].append('%s: its length on the audio is unusual for its text (ratio %.2f). Check that the sentence was read as written.' % (s['id'], a['ratio']))
            if a['pause_after'] < .25 and k < len(al) - 1: s['soft_cut'] = True
    chapters = plan_chapters(sents, chapter_seconds)
    total = A['duration']
    for c in chapters:
        if c['end'] is None: c['end'] = total
        c['start'] = round(c['start'], 3); c['end'] = round(c['end'], 3)
    for s in sents: s.setdefault('soft_cut', False)
    return {'duration': round(total, 3), 'speech_start': round(A['speech_start'], 3), 'speech_end': round(A['speech_end'], 3),
            'timing_mode': mode, 'sentences': sents, 'chapters': chapters}, report

def write_outline(timing, path, title=''):
    L = ['# Outline for "%s"' % title if title else '# Outline', '',
         'Duration: %.1f s. Timing: %s. Sentences: %d.' % (timing['duration'], 'exact (SRT)' if timing['timing_mode'] == 'srt' else 'estimated from pauses', len(timing['sentences'])),
         'Columns: id | start-end (s) | pause after (s) | text.  ✂ = a good place to cut between scenes (pause of 0.3 s or more, or the end of a paragraph).', '']
    cm = {c['from']: c for c in timing['chapters']}
    for s in timing['sentences']:
        if s['id'] in cm:
            c = cm[s['id']]; L += ['', '## Chapter %s  (%.0f s – %.0f s)' % (c['id'], c['start'], c['end']), '']
        if s.get('heading'): L.append('### [section heading] %s' % s['heading'])
        cut = '✂' if (s['pause_after'] >= .3 or s.get('para_end')) else ' '
        L.append('%s | %.2f-%.2f | %.2f %s | %s' % (s['id'], s['start'], s['end'], s['pause_after'], cut, s['text']))
        if s.get('para_end'): L.append('')
    open(path, 'w').write('\n'.join(L) + '\n')
