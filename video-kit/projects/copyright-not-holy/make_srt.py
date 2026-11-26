#!/usr/bin/env python3
"""Word-timed SRT captions from work/timing.json -> out/<name>.srt.

The kit's timing map already holds a start/end time for every word, so captions can
be generated without a second transcription pass. Cues are broken at ~7 words, 3.5 s,
or sentence punctuation, whichever comes first.
"""
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
TIMING = os.path.join(HERE, 'work', 'timing.json')
OUT = os.path.join(HERE, 'out')
MAX_WORDS = 7
MAX_SECONDS = 3.5
MAX_CHARS = 84
MAX_LINE = 42


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return '%02d:%02d:%02d,%03d' % (h, m, s, ms)


def wrap(text):
    if len(text) <= MAX_LINE:
        return [text]
    words = text.split()
    best, best_diff = None, 10 ** 9
    for i in range(1, len(words)):
        a = ' '.join(words[:i])
        b = ' '.join(words[i:])
        if len(a) <= MAX_LINE and len(b) <= MAX_LINE:
            diff = abs(len(a) - len(b))
            if diff < best_diff:
                best, best_diff = (a, b), diff
    return list(best) if best else [text]


def main():
    data = json.load(open(TIMING))
    cues = []
    for sent in data['sentences']:
        tokens = sent['text'].split()
        words = sent['words']
        if len(tokens) != len(words):
            # fall back to one cue per sentence when the tokeniser disagrees
            cues.append((sent['start'], sent['end'], sent['text']))
            continue
        cur = []
        for tok, w in zip(tokens, words):
            cur.append((tok, w))
            span = cur[-1][1]['t1'] - cur[0][1]['t0']
            strong = re.search(r'[.;:?!]$', tok) is not None
            if len(cur) >= MAX_WORDS or span >= MAX_SECONDS or len(' '.join(t for t, _ in cur)) >= MAX_CHARS:
                cues.append((cur[0][1]['t0'], cur[-1][1]['t1'], ' '.join(t for t, _ in cur)))
                cur = []
            elif strong and len(cur) >= 4:
                cues.append((cur[0][1]['t0'], cur[-1][1]['t1'], ' '.join(t for t, _ in cur)))
                cur = []
        if cur:
            cues.append((cur[0][1]['t0'], cur[-1][1]['t1'], ' '.join(t for t, _ in cur)))

    # small gaps so captions do not run into each other
    fixed = []
    for i, (a, b, text) in enumerate(cues):
        b = min(b + 0.15, cues[i + 1][0] - 0.02) if i + 1 < len(cues) else b + 0.4
        fixed.append((max(a, 0.0), max(b, a + 0.6), text))

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, os.path.basename(HERE) + '.srt')
    with open(path, 'w') as fh:
        for i, (a, b, text) in enumerate(fixed, 1):
            fh.write('%d\n%s --> %s\n%s\n\n' % (i, srt_time(a), srt_time(b), '\n'.join(wrap(text))))
    print('Wrote %d cues: %s' % (len(fixed), path))


if __name__ == '__main__':
    main()
