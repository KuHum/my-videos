#!/usr/bin/env python3
"""Ink Explainer Kit - command line.  Run:  python3 tools/kit.py -h"""
import sys, os, json, re, shutil, subprocess, hashlib, argparse, glob, math, time, base64, tempfile, platform
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENGINE = os.path.join(ROOT, 'engine'); TOOLS = os.path.join(ROOT, 'tools')
sys.path.insert(0, TOOLS)
WORKFLOW = 'render-kit.yml'

def say(*a): print(*a, flush=True)
def die(msg): print('\nERROR: ' + msg); sys.exit(1)
def require_ci(what):
    """Local frame drawing is disabled in this kit: the master render and the contact
    sheets run on GitHub Actions, never on this machine. The runner sets GITHUB_ACTIONS."""
    if os.environ.get('GITHUB_ACTIONS') == 'true': return
    die('%s does not run on this machine any more. GitHub Actions is the only renderer.\n'
        '  master:   python3 tools/kit.py cloud render projects/<name> --push\n'
        '  stills:   python3 tools/kit.py cloud preview projects/<name> --push [--chapter chNN]\n'
        '  check:    python3 tools/kit.py check projects/<name>   (still local, cheap)\n'
        '  player:   python3 tools/kit.py build projects/<name>   (local, no frames)\n'
        '  verify:   python3 tools/kit.py verify projects/<name>  (local, ffprobe only)' % what)
def rd(p): return open(p, encoding='utf-8').read()
def run(cmd, **kw): return subprocess.run(cmd, check=True, **kw)

def machine():
    """Cores and RAM, for advising local vs cloud rendering."""
    cores = os.cpu_count() or 1
    try: mem = os.sysconf('SC_PAGE_SIZE') * os.sysconf('SC_PHYS_PAGES') / 1e9
    except Exception: mem = 0.0
    return cores, mem

def auto_workers():
    cores, _ = machine()
    return 1 if cores <= 2 else min(4, cores)

def git_root(path):
    r = subprocess.run(['git', '-C', path, 'rev-parse', '--show-toplevel'], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None

def git_branch(repo):
    r = subprocess.run(['git', '-C', repo, 'rev-parse', '--abbrev-ref', 'HEAD'], capture_output=True, text=True)
    return r.stdout.strip() if r.returncode == 0 else None

def github_slug(repo):
    """owner/repo from the origin remote, or None."""
    r = subprocess.run(['git', '-C', repo, 'remote', 'get-url', 'origin'], capture_output=True, text=True)
    if r.returncode: return None
    m = re.search(r'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?/?$', r.stdout.strip())
    return '%s/%s' % (m.group(1), m.group(2)) if m else None

def gh(*args, check=False):
    r = subprocess.run(['gh'] + list(args), capture_output=True, text=True)
    if check and r.returncode:
        die('gh %s failed: %s' % (' '.join(args), (r.stderr or r.stdout).strip()[:800]))
    return r

def rel(path, start):
    return os.path.relpath(os.path.abspath(path), os.path.abspath(start)).replace(os.sep, '/')

class Project:
    def __init__(self, path):
        self.dir = os.path.abspath(path)
        if not os.path.isdir(self.dir): die('Project folder not found: ' + path)
        pj = os.path.join(self.dir, 'project.json')
        self.cfg = json.load(open(pj)) if os.path.exists(pj) else {}
        c = self.cfg
        self.name = c.get('name') or os.path.basename(self.dir.rstrip('/'))
        self.title = c.get('title') or self.name.replace('-', ' ').title()
        self.speak_headings = c.get('speak_headings', False)
        self.chapter_seconds = c.get('chapter_seconds', 60)
        self.music = c.get('music', True); self.sfx = c.get('sfx', True)
        self.work = os.path.join(self.dir, 'work'); self.out = os.path.join(self.dir, 'out')
        self.scenes = os.path.join(self.dir, 'scenes'); os.makedirs(self.work, exist_ok=True)
    def find(self, *names):
        for n in names:
            for p in sorted(glob.glob(os.path.join(self.dir, n))):
                return p
        return None
    @property
    def article(self): return self.find('article.md', 'article.txt')
    @property
    def voice(self): return self.find('voiceover.*')
    @property
    def srt(self): return self.find('*.srt')
    @property
    def timing_path(self): return os.path.join(self.work, 'timing.json')
    def timing(self):
        if not os.path.exists(self.timing_path): die('No timing map yet. Run:  python3 tools/kit.py prep ' + self.dir)
        return json.load(open(self.timing_path))

# ---------------------------------------------------------------- prep
def cmd_prep(a):
    import align
    P = Project(a.project)
    if not P.article: die('Put your article in %s/article.md (plain text or markdown).' % P.dir)
    if not P.voice: die('Put your voiceover in %s as voiceover.mp3 / .wav / .m4a.' % P.dir)
    say('Reading article and analysing the recording...')
    T, rep = align.build_timing(rd(P.article), P.voice, P.srt if not a.no_srt else None, P.speak_headings, P.chapter_seconds, a.min_pause)
    json.dump(T, open(P.timing_path, 'w'), ensure_ascii=False)
    align.write_outline(T, os.path.join(P.work, 'outline.md'), P.title)
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', P.voice, '-ac', '1', '-b:a', '96k', os.path.join(P.work, 'vo.mp3')])
    os.makedirs(P.scenes, exist_ok=True)
    s = T['sentences']
    for c in T['chapters']:
        fp = os.path.join(P.scenes, c['id'] + '.js')
        if os.path.exists(fp): continue
        i0 = next(i for i, x in enumerate(s) if x['id'] == c['from']); i1 = next(i for i, x in enumerate(s) if x['id'] == c['to'])
        lines = ['// Chapter %s: %.0f s to %.0f s, sentences %s..%s.' % (c['id'], c['start'], c['end'], c['from'], c['to']),
                 '// Cover every sentence exactly once, in order. A scene = {from, to, template, headline, p:{...}}. See docs/TEMPLATES.md.',
                 '// Cut scenes only where the outline shows a scissors mark.', 'SCENES.push(']
        for x in s[i0:i1 + 1]:
            lines.append('  // %s  %s' % (x['id'], x['text'][:110] + ('...' if len(x['text']) > 110 else '')))
        lines += [');', '']
        open(fp, 'w').write('\n'.join(lines))
    say('\nTiming:   %s  (%s)' % (os.path.relpath(P.timing_path), 'exact, from your SRT' if T['timing_mode'] == 'srt' else 'estimated from pauses'))
    say('Outline:  %s   <- give this to the AI that writes the scenes' % os.path.relpath(os.path.join(P.work, 'outline.md')))
    say('Chapters: %d  (about %d s each); empty scene files created in %s' % (len(T['chapters']), P.chapter_seconds, os.path.relpath(P.scenes)))
    say('Sentences: %d   Duration: %.1f s   Pauses found: %d' % (len(s), T['duration'], rep['pauses_found']))
    for w in rep['warnings']: say('WARNING: ' + w)
    if T['timing_mode'] != 'srt': say('\nTip: an SRT file (auto-captions from CapCut or similar) saved in the project folder makes every cue exact. Re-run prep after adding it.')

# ---------------------------------------------------------------- check
def cmd_check(a, quiet=False):
    P = a if isinstance(a, Project) else Project(a.project)
    out = os.path.join(P.work, 'check.json')
    r = subprocess.run(['node', os.path.join(TOOLS, 'check.js'), ENGINE, P.timing_path, P.scenes, out], capture_output=True, text=True)
    if not quiet or r.returncode: say(r.stdout.strip())
    if r.stderr.strip(): say(r.stderr.strip())
    return r.returncode == 0

# ---------------------------------------------------------------- build
def build_html(P, embed_audio, dest):
    T = P.timing()
    tpl = rd(os.path.join(ENGINE, 'player.tpl.html'))
    font = base64.b64encode(open(os.path.join(ROOT, 'fonts', 'caveat-700.woff2'), 'rb').read()).decode()
    vo = ''
    if embed_audio and os.path.exists(os.path.join(P.work, 'vo.mp3')): vo = base64.b64encode(open(os.path.join(P.work, 'vo.mp3'), 'rb').read()).decode()
    th = P.cfg.get('thumbnail', {}) or {}
    scene_files = '\n'.join('/* ' + os.path.basename(f) + ' */\n' + rd(f) for f in sorted(glob.glob(os.path.join(P.scenes, '*.js'))))
    html = tpl
    rep = {'/*FONT*/': font, '/*TIMING*/': json.dumps(T, ensure_ascii=False), '/*VO*/': vo, '/*TITLE*/': P.title.replace('<', ''), '/*LEAD*/': P.cfg.get('lead', 'pastor'),
           '/*THUMB_T*/': str(th.get('time') if th.get('time') is not None else round(T['duration'] * .7, 1)), '/*THUMB_TITLE*/': (th.get('title') or '').replace('"', ''),
           '/*CORE*/': rd(os.path.join(ENGINE, 'core.js')), '/*ICONS*/': rd(os.path.join(ENGINE, 'icons.js')), '/*TEMPLATES*/': rd(os.path.join(ENGINE, 'templates.js')),
           '/*SCENE_FILES*/': scene_files, '/*SCENES_RT*/': rd(os.path.join(ENGINE, 'scenes.js')), '/*AUDIO*/': rd(os.path.join(ENGINE, 'audio.js')), '/*UI*/': rd(os.path.join(ENGINE, 'ui.js'))}
    # replace the big/risky ones last so their content is never re-scanned
    for k in ['/*LEAD*/', '/*TITLE*/', '/*THUMB_T*/', '/*THUMB_TITLE*/', '/*TIMING*/', '/*VO*/', '/*FONT*/', '/*CORE*/', '/*ICONS*/', '/*TEMPLATES*/', '/*SCENE_FILES*/', '/*SCENES_RT*/', '/*AUDIO*/', '/*UI*/']:
        html = html.replace(k, rep[k], 1) if k in ('/*CORE*/', '/*ICONS*/', '/*TEMPLATES*/', '/*SCENE_FILES*/', '/*SCENES_RT*/', '/*AUDIO*/', '/*UI*/', '/*TIMING*/', '/*VO*/', '/*FONT*/') else html.replace(k, rep[k])
    open(dest, 'w', encoding='utf-8').write(html)
    return dest

def cmd_build(a):
    P = Project(a.project)
    if not cmd_check(P, quiet=True): cmd_check(P); die('Fix the errors above first.')
    os.makedirs(P.out, exist_ok=True)
    dest = os.path.join(P.out, P.name + '-player.html')
    build_html(P, True, dest)
    say('Player page: %s  (%.1f MB). Open it in a browser to play it with the voiceover.' % (os.path.relpath(dest), os.path.getsize(dest) / 1e6))

# ---------------------------------------------------------------- browser helpers
def with_page(html, fn):
    import asyncio
    from playwright.async_api import async_playwright
    async def go():
        async with async_playwright() as p:
            br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1300, 'height': 900})
            pg.on('pageerror', lambda e: print('PAGE ERROR', str(e)[:300]))
            await pg.goto('file://' + os.path.abspath(html)); await pg.evaluate('window.ready')
            r = await fn(pg); await br.close(); return r
    return asyncio.run(go())

# ---------------------------------------------------------------- preview
def cmd_preview(a):
    require_ci('preview')
    from PIL import Image, ImageDraw
    P = Project(a.project)
    if not cmd_check(P, quiet=True): cmd_check(P); die('Fix the errors above first.')
    chk = json.load(open(os.path.join(P.work, 'check.json'))); T = P.timing()
    scenes = chk['SCN']
    sel = list(range(len(scenes)))
    if a.chapter:
        c = next((c for c in T['chapters'] if c['id'] == a.chapter), None)
        if not c: die('No chapter ' + a.chapter)
        sel = [i for i, s in enumerate(scenes) if s['end'] > c['start'] and s['start'] < c['end']]
    if a.scene: sel = [int(x) - 1 for x in a.scene.split(',')]
    html = os.path.join(P.work, 'preview.html'); build_html(P, False, html)
    frames = []
    for i in sel:
        s = scenes[i]; d = s['end'] - s['start']
        for f in (.3, .65, .97): frames.append((i, s['start'] + d * f))
    async def grab(pg):
        out = []
        for i, t in frames: out.append(base64.b64decode(await pg.evaluate('window.frameJpeg(%f)' % t)))
        return out
    jp = with_page(html, grab)
    pdir = os.path.join(P.work, 'preview'); shutil.rmtree(pdir, ignore_errors=True); os.makedirs(pdir)
    import io
    paths = []
    per = 3 * 3
    for sheet in range(0, len(frames), per):
        chunk = list(zip(frames[sheet:sheet + per], jp[sheet:sheet + per]))
        im = Image.new('RGB', (1920, 360 * math.ceil(len(chunk) / 3)), 'white')
        for k, ((i, t), b) in enumerate(chunk):
            f = Image.open(io.BytesIO(b)).resize((640, 360)); dr = ImageDraw.Draw(f)
            dr.rectangle([0, 0, 330, 20], fill=(255, 255, 255)); dr.text((4, 4), 'scene %d  %s  %.1fs' % (i + 1, scenes[i]['template'], t), fill=(200, 0, 0))
            im.paste(f, ((k % 3) * 640, (k // 3) * 360))
        pth = os.path.join(pdir, 'sheet%02d.png' % (sheet // per + 1)); im.save(pth); paths.append(pth)
    say('Preview sheets (3 frames per scene: early, middle, end):')
    for p in paths: say('  ' + os.path.relpath(p))

# ---------------------------------------------------------------- render
def last_json(s):
    """First JSON object at or before the last '}' — ffmpeg may print extra lines after it."""
    i = s.rfind('{')
    while i >= 0:
        try:
            obj, _ = json.JSONDecoder().raw_decode(s[i:])
            if isinstance(obj, dict): return obj
        except ValueError:
            pass
        i = s.rfind('{', 0, i)
    raise ValueError('no JSON object in ffmpeg output')

def lufs(path):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else -40.0

def write_wav(path, chunks):
    import wave
    f = wave.open(path, 'wb'); f.setnchannels(1); f.setsampwidth(2); f.setframerate(48000)
    for c in chunks: f.writeframes(c)
    f.close()

def make_stems(P, html, T, want_music=True):
    dur = T['duration']; edges = list(range(0, int(dur), 120)) + [dur]
    async def go(pg):
        res = {}
        for which in (['music'] if want_music else []) + ['sfx']:
            ch = []
            for a, b in zip(edges[:-1], edges[1:]):
                ch.append(base64.b64decode(await pg.evaluate('window.stemB64("%s",%f,%f)' % (which, a, b))))
            res[which] = ch
        return res
    return with_page(html, go)

def cmd_render(a):
    require_ci('render')
    P = Project(a.project); T = P.timing()
    workers = a.workers if a.workers and a.workers > 0 else auto_workers()
    if not cmd_check(P, quiet=True): cmd_check(P); die('Fix the errors above first.')
    chk = json.load(open(os.path.join(P.work, 'check.json')))
    os.makedirs(P.out, exist_ok=True); seg = os.path.join(P.work, 'seg'); os.makedirs(seg, exist_ok=True)
    html = os.path.join(P.work, 'render.html'); build_html(P, False, html)
    chs = T['chapters']; total = math.ceil(T['duration'] * 30)
    pick = set(range(len(chs))) if a.chapters in (None, 'all') else {int(x) - 1 for x in a.chapters.split(',')}
    eng_hash = hashlib.sha1(b''.join(open(f, 'rb').read() for f in sorted(glob.glob(ENGINE + '/*.js'))) + open(P.timing_path, 'rb').read() + json.dumps(P.cfg, sort_keys=True).encode()).hexdigest()
    jobs = []
    for k, c in enumerate(chs):
        f0 = 0 if k == 0 else round(c['start'] * 30); f1 = round(chs[k + 1]['start'] * 30) if k + 1 < len(chs) else total
        sc = [s['raw'] for s in chk['SCN'] if s['end'] > c['start'] - 1.3 and s['start'] < c['end'] + 1.3]
        h = hashlib.sha1((eng_hash + json.dumps(sc, sort_keys=True)).encode()).hexdigest()[:12]
        out = os.path.join(seg, c['id'] + '.mp4'); hp = out + '.hash'
        fresh = os.path.exists(out) and os.path.exists(hp) and rd(hp) == h and not a.force
        jobs.append((k, c, f0, f1, out, hp, h, fresh))
    todo = [j for j in jobs if j[0] in pick and not j[7]]
    say('Chapters: %d. To render now: %d (%s). Parallel chapters: %d.' % (len(chs), len(todo), ', '.join(j[1]['id'] for j in todo) or 'none; all up to date', workers))
    def work(j):
        k, c, f0, f1, out, hp, h, _ = j
        t0 = time.time()
        r = subprocess.run([sys.executable, os.path.join(TOOLS, 'render_chunk.py'), html, str(f0), str(f1), out, str(a.crf)])
        if r.returncode: raise RuntimeError('render failed for ' + c['id'])
        open(hp, 'w').write(h); say('  %s done (%d frames, %.0f s)' % (c['id'], f1 - f0, time.time() - t0))
    with ThreadPoolExecutor(max_workers=workers) as ex: list(ex.map(work, todo))
    missing = [j[1]['id'] for j in jobs if not os.path.exists(j[4])]
    if missing:
        say('\nNot all chapters are rendered yet (missing: %s). Re-run without --chapters, or with the missing ones, to finish.' % ', '.join(missing)); return
    # audio
    say('Mixing audio...')
    mp = os.path.join(P.work, 'music.wav'); sp = os.path.join(P.work, 'sfx.wav')
    st = make_stems(P, html, T, want_music=P.music and not os.path.exists(mp))
    if 'music' in st: write_wav(mp, st['music'])
    write_wav(sp, st['sfx'])
    vo = P.voice; D = T['duration']; lv = lufs(vo)
    mg = (lv - 18) - lufs(mp) if P.music else -90; sg = (lv - 24) - lufs(sp)
    pre = os.path.join(P.work, 'pre.wav'); fin = os.path.join(P.work, 'final_mix.wav')
    ins = ['-i', vo]; flt = '[0:a]aresample=48000,apad=whole_dur=%f,atrim=0:%f[v]' % (D, D); mix = '[v]'; n = 1
    if P.music: ins += ['-i', mp]; flt += ';[%d:a]volume=%.2fdB[m]' % (n, mg); mix += '[m]'; n += 1
    if P.sfx: ins += ['-i', sp]; flt += ';[%d:a]volume=%.2fdB[s]' % (n, sg); mix += '[s]'; n += 1
    flt += ';%samix=inputs=%d:normalize=0:duration=first,aformat=channel_layouts=stereo' % (mix, n)
    run(['ffmpeg', '-y', '-loglevel', 'error'] + ins + ['-filter_complex', flt, '-ar', '48000', pre])
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', pre, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
    j = last_json(r.stderr)
    ln = 'loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=%s:measured_TP=%s:measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true' % (j['input_i'], j['input_tp'], j['input_lra'], j['input_thresh'], j['target_offset'])
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', pre, '-af', ln, '-ar', '48000', fin])
    # join + mux
    lst = os.path.join(P.work, 'concat.txt'); open(lst, 'w').write(''.join("file '%s'\n" % j[4] for j in jobs))
    vid = os.path.join(P.work, 'video.mp4'); run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', vid])
    final = os.path.join(P.out, P.name + '.mp4'); tmp = final + '.part.mp4'
    run(['ffmpeg', '-y', '-loglevel', 'error', '-i', vid, '-i', fin, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', '%f' % D, '-movflags', '+faststart', tmp])
    os.rename(tmp, final)
    pr = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,duration', '-of', 'csv=p=0', final], capture_output=True, text=True).stdout.strip().replace('\n', ' | ')
    say('\nDONE: %s  (%.1f MB)\n  ffprobe: %s\n  loudness before final pass: %s LUFS, true peak %s dBTP -> -14 LUFS / -1.5 dBTP' % (os.path.relpath(final), os.path.getsize(final) / 1e6, pr, j['input_i'], j['input_tp']))
    if a.small:
        sm = os.path.join(P.out, P.name + '-small.mp4'); tmp = sm + '.part.mp4'
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', final, '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '27', '-vf', 'scale=1280:720', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', tmp]); os.rename(tmp, sm)
        say('  smaller copy (720p): %s  (%.1f MB)' % (os.path.relpath(sm), os.path.getsize(sm) / 1e6))
    cmd_thumb(argparse.Namespace(project=a.project, time=None, title=None))

def cmd_thumb(a):
    require_ci('thumb')
    P = Project(a.project); T = P.timing(); th = P.cfg.get('thumbnail', {}) or {}
    t = a.time if a.time is not None else (th.get('time') if th.get('time') is not None else T['duration'] * .7)
    title = a.title if a.title is not None else (th.get('title') or '')
    html = os.path.join(P.work, 'render.html')
    if not os.path.exists(html): build_html(P, False, html)
    async def go(pg): return await pg.evaluate('(()=>thumbCanvas(%f,%s).toDataURL("image/png").split(",")[1])()' % (t, json.dumps(title) if title else 'null'))
    b = with_page(html, go); os.makedirs(P.out, exist_ok=True)
    p = os.path.join(P.out, P.name + '-thumbnail.png'); open(p, 'wb').write(base64.b64decode(b)); say('Thumbnail: ' + os.path.relpath(p))

# ---------------------------------------------------------------- verify
def cmd_verify(a):
    P = Project(a.project); T = P.timing()
    final = os.path.join(P.out, P.name + '.mp4')
    if not os.path.exists(final): die('No finished MP4 at %s. Render first.' % os.path.relpath(final))
    r = subprocess.run(['ffprobe', '-v', 'error', '-show_streams', '-show_format', '-of', 'json', final], capture_output=True, text=True)
    if r.returncode: die('ffprobe could not read ' + final)
    info = json.loads(r.stdout); streams = info.get('streams', [])
    v = next((s for s in streams if s.get('codec_type') == 'video'), {})
    au = next((s for s in streams if s.get('codec_type') == 'audio'), {})
    dur = float(info.get('format', {}).get('duration', 0) or 0)
    bad = []
    if v.get('codec_name') != 'h264': bad.append('video codec is %s, expected h264' % v.get('codec_name'))
    if (v.get('width'), v.get('height')) != (1920, 1080): bad.append('frame is %sx%s, expected 1920x1080' % (v.get('width'), v.get('height')))
    if v.get('r_frame_rate') not in ('30/1', '30'): bad.append('frame rate is %s, expected 30' % v.get('r_frame_rate'))
    if au.get('codec_name') != 'aac': bad.append('audio codec is %s, expected aac' % au.get('codec_name'))
    if abs(dur - T['duration']) > .25: bad.append('duration %.2f s vs voiceover %.2f s' % (dur, T['duration']))
    lr = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', final, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True)
    im = re.findall(r'I:\s+(-?[\d.]+) LUFS', lr.stderr); pm = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', lr.stderr)
    lufs = float(im[-1]) if im else None; peak = float(pm[-1]) if pm else None
    say('File:      %s (%.1f MB)' % (os.path.relpath(final), os.path.getsize(final) / 1e6))
    say('Picture:   %s %sx%s %s fps, %s' % (v.get('codec_name'), v.get('width'), v.get('height'), v.get('r_frame_rate'), '%.2f s' % dur))
    say('Audio:     %s %d Hz %d ch' % (au.get('codec_name'), int(au.get('sample_rate', 0) or 0), int(au.get('channels', 0) or 0)))
    if lufs is not None: say('Loudness:  %.1f LUFS integrated, true peak %.1f dBTP' % (lufs, peak))
    if bad:
        for b in bad: say('FAIL:      ' + b)
        sys.exit(1)
    say('Structure: OK (h264 1920x1080 30 fps, aac, duration within %.2f s)' % abs(dur - T['duration']))
    if lufs is not None and abs(lufs + 14) > 1.0: say('WARNING:   loudness is %.1f LUFS; target is -14 LUFS.' % lufs)
    if peak is not None and peak > -1.0: say('WARNING:   true peak is %.1f dBTP; target is -1.5 dBTP or lower.' % peak)

# ---------------------------------------------------------------- plan (parallel writers)
CONTRACT = """## The locked contract

1. **Files.** Edit only the chapter files listed above. Never edit `engine/`, `tools/`, `docs/`, `project.json`, `work/`, or another writer's chapter file.
2. **Wrapper.** Each scene file starts with `SCENES.push(` and ends with `);`. Add scene objects inside that call, separated by commas. Keep the wrapper.
3. **Coverage.** Every sentence in your chapter belongs to exactly one scene, in order, with no gaps. The next scene starts at the sentence after the previous one's `to`.
4. **Cuts.** End a scene only on a line marked with a scissors (a pause of 0.3 s or more, or a paragraph end).
5. **Beats.** One idea per scene, 2 to 6 s. Something must appear or change every 2 to 4 s.
6. **Words on screen.** Labels 1 to 4 words, headlines up to 7, copied from the article. Numbers exactly as written.
7. **Timing.** Cue every visual to a sentence and a spoken word: `'s12:household'` or `'s12:household@-0.2'`. A visual lands on its word or up to 0.3 s before it, never after.
8. **Vocabulary.** Use only the templates and icons in `docs/TEMPLATES.md`, with the parameters they document. If nothing fits, use `extras` or another template and note it.
9. **Content.** No facts, names, numbers or quotes that are not in `article.md`. No real likenesses or logos. No calls to action or branding.
10. **No rendering.** Do not run the whole-project checker while other chapters are unfinished. The integrator runs `check`, `preview` and the render.
"""

def sentence_block(T, c):
    ids = [s['id'] for s in T['sentences']]
    i0, i1 = ids.index(c['from']), ids.index(c['to'])
    out = []
    for s in T['sentences'][i0:i1 + 1]:
        cut = ' [cut here]' if (s.get('para_end') or (s.get('pause_after') or 0) >= .3) else ''
        out.append('%s | %5.2f-%-5.2f | pause %.2f%s\n  %s' % (s['id'], s['start'], s['end'], s.get('pause_after') or 0, cut, s['text']))
    return '\n\n'.join(out)

def cmd_plan(a):
    P = Project(a.project); T = P.timing()
    chs = list(T['chapters'])
    n = max(1, min(a.writers, len(chs)))
    loads = [0.0] * n; buckets = [[] for _ in range(n)]
    for c in sorted(chs, key=lambda x: x['end'] - x['start'], reverse=True):
        k = min(range(n), key=lambda i: loads[i])
        buckets[k].append(c); loads[k] += c['end'] - c['start']
    for b in buckets: b.sort(key=lambda x: x['start'])
    outdir = os.path.join(P.work, 'agents')
    if os.path.exists(outdir) and os.listdir(outdir) and not a.force:
        die('%s already has briefs. Use --force to regenerate.' % os.path.relpath(outdir))
    os.makedirs(outdir, exist_ok=True)
    proj = rel(P.dir, ROOT)
    rows, notes = [], []
    for i, b in enumerate([x for x in buckets if x], 1):
        files = ', '.join('scenes/%s.js' % c['id'] for c in b) or 'none'
        span = '%.0f s' % sum(c['end'] - c['start'] for c in b)
        rows.append('| %d | %s | %s | %s |' % (i, files, span, ', '.join(c['id'] for c in b)))
        body = ['# Writer %d of %d - %s' % (i, len([x for x in buckets if x]), P.title), '',
                'You are one writer on a parallel team. Your chapter files are independent; write only them.',
                'Kit root: `%s`  |  Project: `%s`' % (ROOT, proj), '',
                'Read first: `docs/TEMPLATES.md`, `docs/STYLE.md`, `examples/pastor/scenes/ch01.js`.', '',
                '## Your chapters', '| Chapter | File | Duration | Sentences |', '|---|---|---|---|']
        for c in b:
            body.append('| %s | scenes/%s.js | %.1f s | %s..%s |' % (c['id'], c['id'], c['end'] - c['start'], c['from'], c['to']))
        body += ['', '## The sentences (timings are from `work/timing.json`)', '']
        for c in b:
            body += ['### %s  (%.1f s - %.1f s)' % (c['id'], c['start'], c['end']), '', sentence_block(T, c), '']
        body += [CONTRACT, '## Finish with a short note', '',
                 'Reply with: the chapters you wrote; scene count per chapter; the template choices; any sentence you could not draw and why; anything the integrator should check.', '']
        p = os.path.join(outdir, 'writer-%d.md' % i)
        open(p, 'w', encoding='utf-8').write('\n'.join(body))
        notes.append('  writer-%d.md   %s  (%s)' % (i, ', '.join(c['id'] for c in b), span))
    integ = ['# Integrator brief - %s' % P.title, '',
             'The writers worked in parallel; each one owns separate chapter files, so there is nothing to merge by hand.', '',
             '| Writer | Files | Duration | Chapters |', '|---|---|---|---|'] + rows + ['',
             '## Steps', '',
             '1. Confirm every `scenes/chNN.js` exists and covers every sentence of its chapter, in order.',
             '2. `python3 tools/kit.py check %s` - fix every ERROR and read every WARN.' % proj,
             '3. `python3 tools/kit.py preview %s --chapter ch01` - one contact-sheet pass per chapter. If this machine has no Playwright, use `python3 tools/kit.py cloud preview %s --push --chapter ch01`.' % (proj, proj),
             '4. `python3 tools/kit.py cloud render %s --push` - the master render runs on GitHub Actions, not on this computer.' % proj,
             '5. `python3 tools/kit.py verify %s` - resolution, codecs, duration and loudness.' % proj, '',
             'Do not rewrite the engine, the templates, the style docs or `project.json`. Normalise text length and static holds by editing scenes only.', '']
    open(os.path.join(outdir, 'integrator.md'), 'w', encoding='utf-8').write('\n'.join(integ))
    say('Parallel plan written to %s' % os.path.relpath(outdir))
    for s in notes: say(s)
    say('\nGive each writer its brief (writer-N.md). Give integrator.md to the one who merges, checks and renders.')

# ---------------------------------------------------------------- cloud (GitHub Actions)
def install_workflow(repo):
    src = os.path.join(ROOT, 'ci', WORKFLOW)
    dst = os.path.join(repo, '.github', 'workflows', WORKFLOW)
    if os.path.exists(dst): return dst, False
    if not os.path.exists(src): die('Missing %s. Re-download the kit.' % os.path.relpath(src, ROOT))
    os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copyfile(src, dst)
    return dst, True

def cmd_cloud_install(a):
    repo = git_root(ROOT) or die('The kit is not inside a git repository. Run git init first.')
    dst, new = install_workflow(repo)
    say(('Installed %s' if new else 'Already installed: %s') % os.path.relpath(dst, repo))
    say('Commit and push it once, then run: python3 tools/kit.py cloud render projects/<name> --push')

def cloud_context(project):
    P = Project(project)
    repo = git_root(P.dir) or die('The kit is not inside a git repository. Run git init and add a GitHub remote first.')
    slug = github_slug(repo) or die('No GitHub origin remote found. Add one: git remote add origin https://github.com/<owner>/<repo>.git')
    branch = git_branch(repo)
    if not branch or branch == 'HEAD': die('Detached HEAD; check out a branch before submitting.')
    return P, repo, slug, rel(ROOT, repo), rel(P.dir, ROOT), branch

def wait_for_run(slug, branch, since, timeout=90):
    import datetime
    deadline = time.time() + timeout
    while time.time() < deadline:
        r = gh('run', 'list', '--repo', slug, '--workflow', WORKFLOW, '--branch', branch, '--limit', '20',
               '--json', 'databaseId,createdAt,status,conclusion,url')
        try: runs = json.loads(r.stdout or '[]')
        except Exception: runs = []
        for x in runs:
            try: created = datetime.datetime.fromisoformat(x['createdAt'].replace('Z', '+00:00')).timestamp()
            except Exception: continue
            if created >= since - 15: return x
        time.sleep(4)
    die('No workflow run appeared. Check that Actions is enabled and %s is on branch %s.' % (WORKFLOW, branch))

def cmd_cloud(a):
    P, repo, slug, kit_rel, proj_rel, branch = cloud_context(a.project)
    dst, installed = install_workflow(repo)
    if installed: say('Note: installed %s; include it in the commit (use --push).' % os.path.relpath(dst, repo))
    if a.push:
        paths = [kit_rel]
        wf_rel = rel(dst, repo)
        if wf_rel not in paths: paths.append(wf_rel)
        run(['git', '-C', repo, 'add', '--'] + paths)
        c = subprocess.run(['git', '-C', repo, 'commit', '-m', 'Render %s from CI' % proj_rel, '--'] + paths, capture_output=True, text=True)
        if c.returncode and 'nothing to commit' not in (c.stdout + c.stderr): die((c.stdout + c.stderr).strip())
        run(['git', '-C', repo, 'push', 'origin', branch])
        say('Pushed %s to %s.' % (branch, slug))
    else:
        dirty = subprocess.run(['git', '-C', repo, 'status', '--porcelain', '--'] + [kit_rel], capture_output=True, text=True).stdout.strip()
        if dirty: say('WARNING: uncommitted changes under %s will NOT reach CI. Add --push.' % kit_rel)
    mode = 'preview' if a.cloud_cmd == 'preview' else 'render'
    fields = ['-f', 'kit_dir=' + kit_rel, '-f', 'project=' + proj_rel, '-f', 'mode=' + mode]
    if mode == 'render':
        fields += ['-f', 'chapters=' + a.chapters, '-f', 'workers=' + str(a.workers), '-f', 'crf=' + str(a.crf)]
    else:
        fields += ['-f', 'chapter=' + (a.chapter or '')]
    if a.dry_run:
        say('Would run: gh workflow run %s --repo %s --ref %s %s' % (WORKFLOW, slug, branch, ' '.join(fields)))
        return
    trigger = time.time()
    r = None
    for attempt in range(3):
        r = gh('workflow', 'run', WORKFLOW, '--repo', slug, '--ref', branch, *fields)
        if r.returncode == 0: break
        time.sleep(5)
    if r.returncode: die('Could not start the workflow: %s' % (r.stderr or r.stdout).strip()[:800])
    run_row = wait_for_run(slug, branch, trigger, timeout=120)
    run_id = run_row['databaseId']
    url = run_row.get('url') or 'https://github.com/%s/actions/runs/%s' % (slug, run_id)
    say('%s run queued: %s' % (mode, url))
    if a.no_wait: return
    deadline = time.time() + a.timeout * 60
    last = ''
    while True:
        rr = gh('run', 'view', str(run_id), '--repo', slug, '--json', 'status,conclusion,url')
        try: row = json.loads(rr.stdout or '{}')
        except Exception: row = {}
        st = '%s/%s' % (row.get('status', '?'), row.get('conclusion') or '-')
        if st != last: say('  ' + st); last = st
        if row.get('status') == 'completed': break
        if time.time() > deadline: die('Timed out waiting for the run. Open %s' % url)
        time.sleep(10)
    if row.get('conclusion') != 'success':
        say('Run failed: %s' % url)
        say('Read the log: gh api /repos/%s/actions/jobs/<jobId>/logs --allow-escape-sequences' % slug)
        sys.exit(1)
    tmp = tempfile.mkdtemp(prefix='cloud-', dir=P.work)
    d = gh('run', 'download', str(run_id), '--repo', slug, '--dir', tmp)
    if d.returncode: die('Could not download the artifact: %s' % (d.stderr or d.stdout).strip()[:500])
    got = []
    for base, _, files in os.walk(tmp):
        for f in files:
            low = f.lower()
            if not low.endswith(('.mp4', '.png', '.html')): continue
            dest = os.path.join(P.work, 'preview') if os.path.basename(base) == 'preview' else P.out
            os.makedirs(dest, exist_ok=True)
            shutil.copy2(os.path.join(base, f), os.path.join(dest, f)); got.append(os.path.join(dest, f))
    shutil.rmtree(tmp, ignore_errors=True)
    say('\nDownloaded:')
    for g in sorted(got): say('  ' + os.path.relpath(g))
    if mode == 'render' and a.chapters in ('all', '', None):
        say('')
        cmd_verify(argparse.Namespace(project=P.dir))
    elif mode == 'render':
        say('\nPartial render (chapters %s): nothing to verify until every chapter is rendered.' % a.chapters)

def cmd_new(a):
    d = os.path.abspath(a.project)
    if os.path.exists(d) and os.listdir(d): die('That folder already exists and is not empty.')
    os.makedirs(os.path.join(d, 'scenes'), exist_ok=True)
    json.dump({'name': os.path.basename(d.rstrip('/')), 'title': a.title or os.path.basename(d.rstrip('/')).replace('-', ' ').title(), 'speak_headings': False, 'chapter_seconds': 60,
               'music': True, 'sfx': True, 'thumbnail': {'time': None, 'title': ''}}, open(os.path.join(d, 'project.json'), 'w'), indent=2)
    open(os.path.join(d, 'article.md'), 'w').write('# Paste your article here\n\nHeadings that start with # are not read aloud (unless you set speak_headings). Text in [[double square brackets]] is not read aloud either.\n')
    say('Created %s\nNext: put the article text in article.md and your recording in voiceover.mp3 (or .wav/.m4a), then run prep.' % d)

def cmd_doctor(a):
    ok = True
    cores, mem = machine()
    say('machine      %d cores, %.1f GB RAM' % (cores, mem))
    if cores <= 2: say('             this is a small machine: the master renders on GitHub Actions, never here.')
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        say('render       GitHub Actions only (local render/preview are disabled in this fork)')
    for name, cmd in [('ffmpeg', ['ffmpeg', '-version']), ('ffprobe', ['ffprobe', '-version']), ('node (18+)', ['node', '--version'])]:
        r = subprocess.run(cmd, capture_output=True, text=True) if shutil.which(cmd[0]) else None
        say('%-12s %s' % (name, (r.stdout.split('\n')[0][:60] if r and r.returncode == 0 else 'MISSING'))); ok &= bool(r and r.returncode == 0)
    for m in ['numpy', 'scipy', 'PIL', 'playwright']:
        try: __import__(m); say('%-12s ok' % m)
        except Exception: say('%-12s MISSING  (pip install %s)' % (m, 'pillow' if m == 'PIL' else m)); ok = False
    try:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p: b = p.chromium.launch(); b.close()
        say('%-12s ok' % 'chromium')
    except Exception as e: say('%-12s MISSING  (run: playwright install chromium)' % 'chromium'); ok = False
    g = subprocess.run(['gh', '--version'], capture_output=True, text=True) if shutil.which('gh') else None
    say('%-12s %s' % ('gh (cloud)', g.stdout.split('\n')[0] if g and g.returncode == 0 else 'not installed (only needed for cloud render)'))
    repo = git_root(ROOT)
    if repo:
        slug = github_slug(repo)
        say('%-12s %s%s' % ('git repo', repo, (' -> ' + slug) if slug else ' (no GitHub origin)'))
    else: say('%-12s not a git repo (only needed for cloud render)' % 'git repo')
    say('\nAll good.' if ok else '\nInstall what is missing, then run doctor again.')
    if cores <= 2: say('For big renders: python3 tools/kit.py cloud render projects/<name> --push')

def main():
    ap = argparse.ArgumentParser(prog='kit.py', description='Ink Explainer Kit')
    sp = ap.add_subparsers(dest='cmd')
    s = sp.add_parser('doctor'); s.set_defaults(f=cmd_doctor)
    s = sp.add_parser('new'); s.add_argument('project'); s.add_argument('--title'); s.set_defaults(f=cmd_new)
    s = sp.add_parser('prep'); s.add_argument('project'); s.add_argument('--min-pause', type=float, default=.18); s.add_argument('--no-srt', action='store_true'); s.set_defaults(f=cmd_prep)
    s = sp.add_parser('check'); s.add_argument('project'); s.set_defaults(f=lambda a: sys.exit(0 if cmd_check(a) else 1))
    s = sp.add_parser('preview'); s.add_argument('project'); s.add_argument('--chapter'); s.add_argument('--scene'); s.set_defaults(f=cmd_preview)
    s = sp.add_parser('build'); s.add_argument('project'); s.set_defaults(f=cmd_build)
    s = sp.add_parser('render'); s.add_argument('project'); s.add_argument('--chapters', help='e.g. 1,2 (default: all)'); s.add_argument('--workers', type=int, default=0, help='parallel chapters; 0 = auto (1 on 2 cores, up to 4)'); s.add_argument('--crf', default='20'); s.add_argument('--force', action='store_true'); s.add_argument('--small', action='store_true', help='also write a 720p smaller copy'); s.set_defaults(f=cmd_render)
    s = sp.add_parser('thumb'); s.add_argument('project'); s.add_argument('--time', type=float); s.add_argument('--title'); s.set_defaults(f=cmd_thumb)
    s = sp.add_parser('verify', help='probe the finished MP4: codecs, duration, loudness'); s.add_argument('project'); s.set_defaults(f=cmd_verify)
    s = sp.add_parser('plan', help='split the chapters across parallel scene writers and write their briefs'); s.add_argument('project'); s.add_argument('--writers', type=int, default=4); s.add_argument('--force', action='store_true'); s.set_defaults(f=cmd_plan)
    cloud = sp.add_parser('cloud', help='render or preview on GitHub Actions instead of this computer')
    cs = cloud.add_subparsers(dest='cloud_cmd')
    s = cs.add_parser('install', help='copy the workflow into the repo root .github/workflows/'); s.set_defaults(f=cmd_cloud_install)
    for name, helptext in (('render', 'render the master on GitHub Actions'), ('preview', 'render contact sheets on GitHub Actions')):
        s = cs.add_parser(name, help=helptext); s.add_argument('project'); s.add_argument('--push', action='store_true', help='commit the kit and push before submitting'); s.add_argument('--yes', action='store_true', help=argparse.SUPPRESS); s.add_argument('--no-wait', action='store_true'); s.add_argument('--dry-run', action='store_true'); s.add_argument('--timeout', type=int, default=90, help='minutes to wait')
        if name == 'render':
            s.add_argument('--chapters', default='all'); s.add_argument('--workers', type=int, default=4); s.add_argument('--crf', default='18')
        else: s.add_argument('--chapter', default='')
        s.set_defaults(f=cmd_cloud, cloud_cmd=name)
    a = ap.parse_args()
    if not getattr(a, 'f', None): ap.print_help(); return
    a.f(a)

if __name__ == '__main__': main()
