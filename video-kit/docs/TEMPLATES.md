# Template reference

A **scene** covers one or more whole sentences and uses one **template**:

```js
{ from:'s4', to:'s7', template:'compare', headline:'With a qualifier',
  lead:{ pose:[['s4:automatically','think']] },        // optional, see "The lead character"
  p:{ ...template parameters... },                     // see below
  extras:[ ...free callouts... ] }                     // optional
```

Add scenes with `SCENES.push( {...}, {...} );` in the files under `scenes/`.

## Cues: how to say "when"

Every `at`, `stampAt`, `crossAt`, `labelAt`, `out`, ... value is a cue. Cues are written as text:

| Cue | Meaning |
|---|---|
| `'s9'` | the moment sentence s9 starts |
| `'s9:end'` | the moment s9 ends |
| `'s9:fit'` | the word starting with "fit" in s9 (first match) |
| `'s9:the#1'` | the second "the" in s9 (`#0` is the first) |
| `'s9:fit@-0.3'` | 0.3 s before that word (use `@+0.3` for after) |
| `'scene'` / `'sceneEnd'` | start / end of this scene |
| `12.5` | an absolute time in seconds (avoid; use words) |

Words are matched in lower case without punctuation. `"s11:can't"` works. A visual should appear **on its word or up to 0.3 s before it, never after**: use `@-0.2` for most things.
If a word is not found, `check` tells you exactly which sentence and word.

## Rules every template follows
* On-screen text is short: labels 1 to 4 words, headlines up to 7 words, taken from the article's own words.
* Numbers come from the article word for word.
* Something should appear or change at least every 3 to 4 seconds. `check` warns if not; add more `at` cues, `extras`, or `lead.pose` changes.
* The `headline` (top-left, hand-lettered, underlined) is optional on every scene except `title`. Use `hi:{word:'must'}` to put a yellow highlighter behind one headline word.

## The 13 templates

### `title`: opening card or section card
`p:{ text, sub?, at?, subAt?, size? }` · no lead by default
```js
{ from:'s1', to:'s1', template:'title', p:{ text:'Why Your Single Pastor Is Probably a Problem', sub:'Humphrey Kutosi' } }
```

### `talk`: the lead speaks or thinks; a bubble holds a tiny diagram
`p:{ bubble:{ kind:'say'|'think', at, out?, items:[ {icon?, text?, at, crossAt?} ] } }` · lead at left
Up to 3 items. An item can be an icon, text, or both (icon above, text below). `crossAt` draws a red X over it.

### `list`: points build one by one
`p:{ items:[ {text, at, mark?:'dot'|'tick'|'cross'|'num', icon?, hl?} ], y? }` · lead at left
Up to 6 items. `hl:true` puts the highlighter behind that line.

### `compare`: two cards, side by side
`p:{ left:{title, sub?, at?, stamp?, stampAt?, col?, icon?}, right:{...} }` · lead in the middle
Use for objection | answer, the world | Scripture, claim | verdict. A `stamp` is a big hand-lettered "No." / "Yes." in a circle. `col` is `'red'` or `'blue'`.

### `chain`: cause leads to effect
`p:{ nodes:[ {label, icon?, at, hl?} ] }` · 2 to 4 nodes · no lead by default

### `scripture`: an open Bible with the reference and key words
`p:{ ref, at?, key:[ {text, at} ] }` · lead points at the book
`ref` like `'1 Timothy 3:4–5'`. `key` holds one to three short phrases (up to 8 words) copied from the verse; each is highlighted as it is read. **Never put a whole verse on screen.**

### `quote`: someone else is speaking (a generic stand-in with a name label)
`p:{ name, text, who?, at?, textAt?, x?, pose? }` · no lead by default
`who` is a look: `man`, `official`, `scribe`, `elder`, `teacher`, `woman`, `child`. `text` up to 14 words, split over two lines automatically. Use for a pastor, politician, author, a Reddit commenter, a confession.

### `story`: an anecdote with named people in a place
`p:{ place?:'house'|'church'|'hospital'|'none', placeX?, placeSize?, people:[ {name?, who?, pose?, x?, face?, at?} ], bubble?:{ from, text, at } }`
One to three people. Use first names or role names ("Tom", "the apostles"). `bubble.from` is the index of the speaker.

### `stat`: one big phrase or number from the article
`p:{ big, label?, at?, labelAt?, bars?:[ {label, v, at} ], hiLast? }`
`bars` draws a small ink bar chart. Values must come from the article.

### `scale`: weighing two things
`p:{ left:{label, icon?, at}, right:{...}, tip:'left'|'right'|'level', tipAt }` · lead at left
The heavier side sinks at `tipAt`.

### `focus`: one big symbol with a label
`p:{ icon, label?, at?, labelAt?, cross?, crossAt?, sparks?, x?, size? }` · lead at left
Use `cross:true` to strike the symbol out in red.

### `crowd`: many ordinary figures and one outlier (the lead)
`p:{ n?, mark?:'rings'|'none', outlier:{label, at}, burden?:{label, dropAt} }` · lead at right
`burden` drops a boulder on the lead, who slumps under it.

### `verdict`: the conclusion
`p:{ text, at?, mark?:'tick'|'xmark', markAt?, family?, familyAt?, labels?:[ {text, x, at} ] }` · lead in the middle, celebrating
`family:true` adds a wife and child next to the lead.

## Icons
`rings` `book` `scroll` `church` `house` `tree` `gift` `bomb` `crown` `heart` `coins` `hospital` `cross` `flame` `shield` `key` `question` `tick` `xmark`
Add a new icon by adding one `case` in `engine/icons.js` (draw it inside a box of ±100 units).

## `extras`: callouts you can add to any scene
A free-placed list, drawn on top of the template. Screen is 1920×1080; the ground line is at y=900; keep text 80 px from every edge.
```js
extras:[
  { text:'character', x:560, y:790, size:100, hl:true, at:'s10:character@-0.05' },   // hand-lettered text (hl = highlighter)
  { icon:'scroll',  x:1010, y:730, size:95, at:'s10:marriage' },                      // an icon (size = half the width in px)
  { icon:'xmark',   x:1010, y:730, size:100, at:'s10:certificate@-0.1' },
  { icon:'church',  x:1620, ground:true, size:220, at:'s11:care' },                   // ground:true sits the icon on the ground line
  { arrow:[480,600, 700,700], bend:-40, at:'s5' },                                   // an arrow
  { text:'warning', x:300, y:300, col:'red' } ]                                      // col: 'red' | 'blue' | 'gray'
```

## The lead character
One character (a pastor with a blue tie by default; change `"lead"` in `project.json`) appears across scenes, walks into the next scene while the page scrolls, and acts with poses.
* Each template has a default position (`L`, `C`, `R`) or none. Override with `lead:{ slot:'C' }`, hide with `lead:false`, show where there is none with `lead:{ slot:'R' }`.
* Poses: `idle` `say` `think` `shrug` `stop` `point` `slump` `carry` `cele` `anx` `front` `hold`.
  `lead:{ pose:'think' }` or a sequence `lead:{ pose:[ ['s2:singleness','think'], ['s2:stop','stop'] ] }`.
* `lead:{ who:'scribe' }` makes the lead look like another person for that scene (Paul, a prophet). Looks: `pastor` (blue tie), `man`, `official` (red tie), `scribe` (beard + scroll), `elder` (beard), `teacher` (beret), `woman` (red scarf, dress), `child`.
* `lead:{ face:-1 }` makes the lead face left.
