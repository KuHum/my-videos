# Style and content rules (Stickman, Ink)

The look is fixed by the engine. Do not change colours, fonts or line style. This page is about *what to draw*.

## The look in one paragraph
Hand-inked stick figures on warm paper (#F4EFE4). Ink black, soft graphite, and at most two spot colours per scene: red (#C8452E) for what is wrong or urgent, blue (#2F5D8A) for what is right or settled, and a yellow highlighter behind the one key word. Lines draw themselves on. Text is hand-lettered (Caveat). No gradients, no filled bodies, no clip-art.

## Content rules
1. **The article is the content.** Add no facts, numbers, names, dates, quotes or claims that are not in the article. Numbers on screen are copied word for word.
2. **Short text.** Labels 1 to 4 words, headlines up to 7. Use the article's own words. No full sentences on screen (the narrator is already saying them).
3. **No hook, no call to action, no logo** unless the project asks for them.
4. **Real people.** Never draw a likeness of a real person. Use a generic figure with a name label. Do not caricature or mock anyone's appearance. Draw the *idea* someone stands for, not the person.
5. **Brands and logos.** Never draw a real logo. Use a name label.
6. **Sacred persons.** Do not draw God the Father, Jesus, the Holy Spirit or angels as figures. Use symbols: cross, open book, crown, flame, key, shield. (This is a default for Christian content; the author can change it in `project.json` notes for their own project.)
7. **Scripture.** Show the reference and, at most, one to three short key phrases while the narrator reads. Never a whole verse. Use the `scripture` template.
8. **Tone.** Calm and clear. The narration can be polemical; the drawings should not be cruel.

## One idea at a time
One main picture per scene. Supporting marks come second. Change something every 2 to 4 seconds (new element, state change, a pose change, the scroll into the next scene). Never hold a still for more than about 3.5 s.

## Safe areas (1920×1080)
Text at least 80 px from every edge. Headline top-left. Ground line at y=900. Labels at least 36 px high, headlines 52 px+, so they read on a phone.

## Turning an article into scenes (what to reach for)
| What the article is doing | Template |
|---|---|
| Title, or a new section begins (heading read aloud) | `title` |
| Opening hook, a news event, a claim someone made | `talk` (lead says it) or `quote` (someone else says it) |
| An objection and the answer | `compare` (Objection | Answer) with stamps |
| The world's view | Scripture's view | `compare` |
| A Bible passage is read or cited | `scripture` |
| Reasons, steps, qualifications | `list` |
| "Therefore", cause and effect | `chain` |
| Weighing two truths, "on the one hand" | `scale` |
| A personal story or anecdote (Tom, a church member) | `story` with first names |
| A quote from a confession, Luther, a theologian, a politician | `quote` with a name label |
| One number or one key phrase | `stat` |
| One vivid image (a bomb, a gift, a house, a hospital, a crown) | `focus` |
| "Everyone does X, but he does not" | `crowd` |
| Conclusion, call, closing exhortation | `verdict` |

Typical blog arc: `title` → `talk`/`quote` (the hook) → `compare` or `list` (the thesis) → several `scripture`, `story`, `chain`, `compare` scenes (the argument) → `compare` (objection and answer) → `verdict` (the close).

## Pacing for a 10 to 15 minute reading
* A paragraph usually becomes one scene (2 to 5 sentences). A short punchy sentence ("No.") can share a scene with its neighbours.
* Do not illustrate every sentence. Lead each paragraph with its main picture; use `extras` and `lead.pose` changes to keep it alive.
* Vary templates: avoid the same template three scenes in a row.
* Put a `title` or a headlined `compare`/`list` at each section heading so viewers can feel the structure.

## Sound
Light curious music (plucked strings, soft piano, brushed rhythm) sits well under the voice and dips while words are spoken. Sound effects are automatic: pen scratches as things draw, soft pops for bubbles and stamps, paper rustle on each page scroll. Nothing to configure per scene.
