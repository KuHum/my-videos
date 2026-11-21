# Into the Unknown.

Start an editable *Into the Unknown.* project in an empty folder using this guide. Download the footage, music, fonts, and DeepSeek SVG using the public sources listed below. Trim each clip to its listed source time range. Build the text, whale mask, depth gauge, sonar window, footage wall, and IPO letter masks as editable elements. Hit the downbeat at 20.115 s. Morph the circle at 28.297 s, pull back from Hangzhou to reveal the wall at 37.388 s, and enter Shanghai at 41.933 s. Include the unofficial concept-film credit on the end card. Export a 52-second, 1920×1080 MP4 at 60 fps with audio. Check the picture and sound against the export checkpoints at the end of this guide.

## Timeline

Time starts at the first frame. The track runs at 132 BPM in 5/4, about 0.455 s per beat. Count the second half from the downbeat at 20.115 s. The sonar montage cuts every two beats. Each `Open to` phrase gets five.

| Time (s) | Picture and on-screen text | Motion and transition |
| --- | --- | --- |
| 0–4.400 | A pale blue line draws the whale mark against near-black. Footage of a humpback and her calf (`p002`) fills the outline. The only text beneath it is `DEEPSEEK`. Three sonar rings expand in succession. | At 3.15 s, accelerate into the whale shape. At 3.95 s, place the same footage full-screen behind the mask, at the same source time. |
| 4.400–9.290 | A whale dives as **How deep** appears in the center. At 6.85 s, cut to shafts of underwater light and add **can curiosity go?** | Center the first phrase on its own. As the second arrives, shift the first left and fade it to half opacity so the whole question sits in the center. The depth ruler starts scrolling on the left. |
| 9.290–13.950 | **What haven’t** appears over a researcher at a microscope. At 11.62 s, cut to a calculation on a chalkboard and add **we solved yet?** | A diagonal band of light sweeps across the frame as the question enters. Each letter rises into focus, starting 28 ms after the previous one. |
| 13.950–18.200 | A robotic arm plays chess under **Can a machine**. Cut to hands on a keyboard at 16.30 s and add **learn to reason?** Cut again to a screen of code at 16.72 s. | The question fades. At 18.20 s, the footage drops away and the depth counter at bottom left stops at `10935 m`. |
| 18.200–20.115 | The music falls nearly silent. From 18.32 s, a blue block cursor types `Unravel the mystery of AGI with curiosity.` at 33 characters per second. | At 19.72 s, the line contracts horizontally, leaving a blue dot at the center. A cool white flash lands on the downbeat at 20.115 s as a circular window expands from the dot to reveal the eye. |
| 20.115–28.297 | Footage cuts inside a 600 px circular window centered at (960, 500). Behind it sit a blurred copy of the same frame and the outlined words `INTO THE UNKNOWN`. The depth readout resolves to `UNKNOWN`. | The circle pops slightly larger and settles on each cut. The dashed ring turns clockwise and the 72 tick marks turn counterclockwise. A blue progress ring completes one revolution across all nine shots. |
| 28.297–37.388 | In 0.5 s, the circle moves beside `Open to` and reshapes into a 300×124 px pill. It reveals `researchers.`, then `builders.`, `students.`, and `everyone.` | Each bar starts with three beats of footage. The window narrows as the audience name appears letter by letter. At 36.438 s, the final Hangzhou shot starts expanding to fill the frame behind the text. |
| 37.388–41.933 | Hangzhou keeps playing as the camera pulls back to reveal it at the center of a wall nine tiles wide and seven high. `HANGZHOU · EST. 2023` appears below. | Pull back from 4× to 0.62×. Tilt the wall 50° around X and rotate it −14° around Z. At 39.658 s, a ripple of light spreads from the center. At 40.683 s, dive toward the tile two places to its right in the same row. |
| 41.933–46.479 | The Shanghai skyline darkens. The white DeepSeek wordmark wipes on above it, and a line traces upward to the right. **I**, **P**, and **O** rise at 43.05, 43.47, and 43.90 s. A second shot of city lights plays inside the letters. | Begin typing `Answer the essential question with long-termism.` at 44.75 s. In the final 0.55 s, enlarge the letters toward the camera. A cool white flash takes the image into the end card. |
| 46.479–52.000 | The blue whale mark pops onto a pale blue gradient. At 47.57 s, it slides left as the wordmark wipes on to the right. `Into the Unknown.` appears from 48.05 s, followed by the fine print from 48.70 s. | Hold the card long enough to read. The music starts fading at 50.30 s. The picture starts fading to black at **51.25 s** and reaches full black at 51.95 s. |

## The nine sonar shots

Each shot starts at `20.115 + shot index × 2 × 60 / 132` seconds, counting from zero. Resolve the text to the left of the slash first, then the text to the right. Crop each source to a square. The X and Y values below place the focal point within that square, measured from the top left as fractions of its width and height. Start at 1.07 times the listed zoom and ease back to the listed value over the shot.

| Start (s) | Inside the circle | Final label | Focal point X / Y · base zoom |
| ---: | --- | --- | --- |
| 20.115 | `p097` Eye close-up | `DeepSeek-V3 / open weights` | 0.70 / 0.52 · 1.55× |
| 21.024 | `p223` Half moon | `DeepSeek-R1 / reasoning` | 0.44 / 0.45 · 1.15× |
| 21.933 | `p019` Jellyfish | `DeepSeek-V3.1 / hybrid thinking` | 0.30 / 0.66 · 1.35× |
| 22.842 | `p169` Earth’s horizon | `DeepSeek-V3.2 / open source` | 0.66 / 0.40 · 1.35× |
| 23.751 | `p121` Processor | `DeepSeek-V4 / open source` | 0.50 / 0.52 · 1.15× |
| 24.660 | `p025` Pink jellyfish | `DeepSeek-V4.1 / Flash` | 0.58 / 0.62 · 1.25× |
| 25.570 | `p194` Galaxy | `DeepSeek / Harness` | 0.50 / 0.50 · 1.10× |
| 26.479 | `p083` Moon through a telescope | `API / web search + fetch` | 0.50 / 0.58 · 1.20× |
| 27.388 | `p089` Iris | The GitHub hostname / `deepseek-ai` | 0.38 / 0.42 · 1.55× |

For the iris label, set the hostname in lowercase, including its `.com` ending. Hold the circle’s size and position as the iris cuts to the microscope, then reshape it into the pill. The four pills show a microscope (`p038`), programming (`p059`), a classroom (`p098`), and Hangzhou (`p176`). Cue the words at 29.660, 31.933, 34.206, and 36.479 s. Animate `Open to` in once. Keep the line centered as the window narrows and the new word takes up its measured width.

## Picture and sound

- **Type and color.** Use `#03060D` for the background, `#4176E6` for the end-card whale and block cursor, and `#7FA4FF` for the progress ring and the dot that follows the typing. Set the questions in 92 px Montserrat, weight 300 for the first phrase and 600 for the second. Set `Open to` at 110 px, weight 600, and IPO at 440 px, weight 900. Use DM Mono for the depth reading, typed lines, and labels. Use DM Sans as the default typeface. The end-card gradient runs from `#9EBBEA` through `#D6E2F6` to `#F9F8F8`.
- **Whale and depth gauge.** Clip the opening footage to the whale silhouette. Use the full DeepSeek logo on the end card. The 720 px ruler starts at x=40, y=180 on the left. Place the `DEPTH` readout 72 px from the left and 58 px from the bottom. Leave the other three corners clear. Set the end-card credit to `IPO · A CONCEPT FILM · NOT AFFILIATED WITH DEEPSEEK`.
- **From Hangzhou to Shanghai.** Keep `p176` on the same playback clock from the last pill into the center tile. Each tile is 480×270 px. Tile centers are 516 px apart horizontally and 306 px vertically, with perspective set to 1600 px. Counting rows and columns from zero, Hangzhou is at (3, 4) and Shanghai at (3, 6). Start `p129` in the target tile 1.4 s before the IPO sequence, then restart that source trim when Shanghai fills the screen. Fill the three IPO letters with `p131` and give them a 2 px white outline. Draw the rising line behind the letters through 41 points.
- **Score.** Use the first 52 seconds of *Epic Hybrid* as the entire soundtrack. Keep the quiet passage from 18.20 to 20.115 s for the typing. Apply a 1.70 s music fade starting at 50.30 s, then normalize in two passes to −14 LUFS with a −1.5 dBTP true-peak ceiling. Mix in stereo at 48 kHz. Credit the track as *Music by Kulakovka from Pixabay.*

## Adapting the film to your brand

| What to change | How to keep the motion working |
| --- | --- |
| Opening and closing logo | Separate the symbol from the wordmark. Aim the opening push-in at a solid area of the symbol. On the end card, adjust how far the symbol slides left to make room for the new wordmark. |
| Questions, labels, and audiences | Split each question at the shot change. Once the font has loaded, measure the text and recenter the complete line. Each audience name has two beats of reading time after its footage. |
| Footage | Check the subject in the square crop before applying the circular mask. Allow enough footage in the final audience shot to carry the movement into the wall. |
| Music | Find the quiet passage and the downbeat in the new track, then retime the nine cuts, four word reveals, and dive into the wall. Adjust the three IPO letter entrances, end-card wordmark, and music fade to their new cues. |

## Public asset downloads

The 32 Pexels MP4s total about 470 MB. Each entry gives the creator’s page slug and the exact MP4 filename used in the film. For the creator’s page, append the slug and a trailing slash to the Pexels website’s /video/ path. The number at the end of the slug is the video ID. To get Pexels’ default download in a browser, add /download/video/ID/ to the homepage address. The command below prints all the original page and file addresses or downloads the exact renditions used here.

### Music, logo, and fonts

- `epic-hybrid.mp3` — “Epic Hybrid” by Kulakovka, Pixabay Music track 283164. On Pixabay, open /music/upbeat-epic-hybrid-283164/ and choose Download.
  Pixabay download/audio/2025/01/09/audio_7dd045344c.mp3?filename=kulakovka-epic-hybrid-283164.mp3
- `deepseek.svg` — The header logo on the official DeepSeek homepage. Select `svg[viewBox="0 0 143 23"]` for the full vector. Its `g path` is the whale silhouette.
  DeepSeek /

The four TTFs come from the public google/fonts repository on GitHub. Use Google Fonts revision `06bfe0d62a98375cb09c942fa18e68bd32cff057` and the paths below.

- `Montserrat.ttf` — Variable font for the questions, audience names, and IPO letters.
  GoogleFonts ofl/montserrat/Montserrat%5Bwght%5D.ttf
- `DMSans.ttf` — Variable font for the default typeface.
  GoogleFonts ofl/dmsans/DMSans%5Bopsz,wght%5D.ttf
- `DMMono-Regular.ttf` — Weight 400 for typed lines, labels, and end-card fine print.
  GoogleFonts ofl/dmmono/DMMono-Regular.ttf
- `DMMono-Medium.ttf` — Weight 500 for the depth counter and emphasized labels.
  GoogleFonts ofl/dmmono/DMMono-Medium.ttf

### 32 Pexels clips

Source trims are in seconds from the start of each downloaded clip. The timeline above gives the edit times. On the Pexels videos subdomain, the direct file path is /video-files/ID/FILENAME.

Prepare a centered 16:9 crop for the full-screen shots, pill inserts, and IPO footage. For each of the nine sonar shots, crop a square with sides equal to the source’s shorter dimension, then resize it to 1080×1080. Set the vertical crop center to 62% of the source height for the moon (`p223`), 55% for the pink jellyfish (`p025`), and 50% for the others. Keep the crop inside the source frame. Sample all footage at 30 fps and render the text, masks, and camera movement at 60 fps.

#### Whales and the three questions

- `p002` — Humpback whale and calf inside the opening logo · Source 10.00–14.80 s · Adrien JACTA
  Page a-humpback-whale-and-her-calf-swimming-in-the-blue-sea-15546563
  MP4 15546563-hd_1920_1080_25fps.mp4
- `p000` — Diving whale · Source 3.00–5.80 s · Sébastien Vincon
  Page big-animal-swimming-underwater-10377082
  MP4 10377082-hd_1920_1080_30fps.mp4
- `p029` — Shafts of light underwater · Source 2.00–4.80 s · Adrien JACTA
  Page serene-sunlit-underwater-seascape-40432354
  MP4 17276625_2560_1440_25fps.mp4
- `p042` — Researchers at a microscope · Source 0.50–3.10 s · Pressmaster
  Page scientist-looking-through-a-microscope-while-having-a-discussion-with-her-colleague-3196600
  MP4 3196600-hd_1920_1080_25fps.mp4
- `p055` — Working through an equation on a chalkboard · Source 1.20–3.80 s · Yan Krukau
  Page a-man-solving-a-formula-on-the-blackboard-8197039
  MP4 8197039-hd_1920_1080_25fps.mp4
- `p114` — Robotic arm playing chess · Source 1.00–3.60 s · Pavel Danilyuk
  Page a-robot-and-a-chessboard-8327795
  MP4 8327795-hd_1920_1080_25fps.mp4
- `p208` — Typing on a keyboard · Source 2.00–2.80 s · Nothing Ahead
  Page a-person-typing-on-a-backlit-keyboard-4873235
  MP4 4873235-hd_1920_1080_30fps.mp4
- `p064` — Code on a monitor · Source 2.00–3.80 s · Jakub Zerdzicki
  Page modern-programmer-working-on-multiscreen-setup-34268782
  MP4 14519249_2560_1440_25fps.mp4

#### Sonar montage

- `p097` — Brown eye in close-up · Source 0.40–1.60 s · Emirhan Emiroğlu
  Page close-up-of-a-human-brown-eye-flickering-32198166
  MP4 13731731_2560_1440_60fps.mp4
- `p223` — Half moon · Source 3.00–4.20 s · Septimiu Lupea
  Page half-moon-against-black-night-sky-32873862
  MP4 14011446_1080_1920_30fps.mp4
- `p019` — Jellyfish · Source 3.00–4.20 s · Yudha Aprilian
  Page jellyfish-under-water-11277955
  MP4 11277955-hd_1920_1080_31fps.mp4
- `p169` — Earth’s horizon · Source 1.00–2.20 s · Kindel Media
  Page light-dawn-sky-art-7649279
  MP4 7649279-hd_1920_1080_30fps.mp4
- `p121` — Processor · Source 2.00–3.20 s · Route4Design Agency
  Page futuristic-circuit-board-with-central-processor-35977437
  MP4 15254965_1920_1080_24fps.mp4
- `p025` — Pink jellyfish · Source 2.00–3.20 s · Atlantic Ambience
  Page jellyfish-swimming-underwater-12860646
  MP4 12860646-hd_1080_1920_30fps.mp4
- `p194` — Galaxy · Source 2.00–3.20 s · Nicola Narracci
  Page colorful-galaxies-and-stars-in-cosmic-animation-29823750
  MP4 12809737_1920_1080_30fps.mp4
- `p083` — Moon through a telescope · Source 15.00–16.20 s · Earth Photart
  Page crescent-moon-viewed-through-telescope-37723924
  MP4 15999003_1080_1920_29fps.mp4
- `p089` — Iris · Source 0.20–1.40 s · Sasha Poberailo
  Page close-up-of-eyes-12271148
  MP4 12271148-hd_1920_1080_25fps.mp4

#### The four audiences and the IPO night shots

- `p038` — Researcher at a microscope · Source 0.50–3.10 s · Mikhail Nilov
  Page scientists-looking-through-a-microscope-9373536
  MP4 9373536-hd_1920_1080_25fps.mp4
- `p059` — Programming close-up · Source 1.00–3.60 s · Raddy
  Page close-up-of-programming-13522169
  MP4 13522169-hd_1920_1080_25fps.mp4
- `p098` — Students in a classroom · Source 1.00–3.60 s · Pavel Danilyuk
  Page a-student-returning-an-eraser-8342706
  MP4 8342706-hd_1920_1080_25fps.mp4
- `p176` — Hangzhou at night, continuing into the center tile · Source 1.00–8.00 s · LayG Traveller
  Page stunning-night-view-of-hangzhou-skyline-39846097
  MP4 16997819_2560_1440_25fps.mp4
- `p129` — Shanghai at night, continuing into the IPO background · Source 1.50–6.70 s · LayG Traveller
  Page stunning-shanghai-skyline-at-night-39410948
  MP4 16781501_2560_1440_25fps.mp4
- `p131` — City lights inside the IPO letters · Source 4.00–9.20 s · xiaobao wei
  Page vibrant-night-cityscape-with-colorful-light-show-35335999
  MP4 14971661_2560_1440_30fps.mp4

#### Nine additional clips for the footage wall

Build the wall from the 23 clips above and the nine below. From each source, take a still at `min(2.00 s, source duration ÷ 3)`, then center-crop to 16:9 and resize to 640×360. Sort the 32 short edit IDs (p000 through p223) in ascending numerical order. For row r and column c, use the still at zero-based index `(5r + 3c) mod 32`. Use the moving Hangzhou and Shanghai trims for the center and target tiles.

- `p003` — Humpback whales seen from above · Wall still · Stockfilm (creator name ends in .com)
  Page view-from-above-on-humpbacks-11279748
  MP4 11279748-hd_1920_1080_30fps.mp4
- `p012` — A school of fish · Wall still · Cheng
  Page a-large-group-of-fish-swimming-in-the-ocean-18568945
  MP4 18568945-hd_1080_1920_30fps.mp4
- `p034` — A swimmer underwater · Wall still · Vladimir Koshenkov
  Page man-swimming-underwater-in-blue-sea-water-4749122
  MP4 4749122-hd_1920_1080_30fps.mp4
- `p053` — Writing on a chalkboard · Wall still · Yan Krukau
  Page man-writing-on-the-chalkboard-8197042
  MP4 8197042-hd_1920_1080_25fps.mp4
- `p087` — Using a laptop outdoors · Wall still · Pavel Danilyuk
  Page a-man-and-a-woman-using-a-laptop-outdoors-9121281
  MP4 9121281-hd_1920_1080_25fps.mp4
- `p139` — Trading screens · Wall still · Rafael Minguet Delgado
  Page dynamic-stock-market-charts-displayed-on-screens-38698437
  MP4 16438790_2560_1440_50fps.mp4
- `p151` — Overhead view of diving whales · Wall still · Los Muertos Crew
  Page overhead-shot-of-whales-diving-in-the-ocean-8906187
  MP4 8906187-hd_1920_1080_24fps.mp4
- `p164` — Jellyfish · Wall still · João Pavese
  Page agua-viva-27303010
  MP4 12115929_2560_1440_24fps.mp4
- `p201` — The Milky Way · Wall still · Borys Zaitsev
  Page milky-way-on-space-space-12336972
  MP4 12336972-hd_1920_1028_60fps.mp4

### Save or list the assets

Save the guide as a file named `motion` with the `.md` extension. Run the command from that folder with Python 3 and curl installed. It saves the 38 assets under `deepseek-assets/` and skips completed files when you run it again. To print the public addresses instead, change the command’s first line to `python3 - --list <<'PY'`. To fetch just the opening assets, use `python3 - p002.mp4 deepseek.svg <<'PY'`.

```sh
python3 - <<'PY'
from concurrent.futures import ThreadPoolExecutor
from os.path import isfile
from pathlib import Path
from re import DOTALL, MULTILINE, findall, search
from subprocess import run
from tempfile import TemporaryDirectory
import sys
import xml.etree.ElementTree as ET

def site(*labels):
    return "https://" + ".".join(labels)

guide = Path("motion").with_suffix(".md").read_text(encoding="utf-8")
revision = search(r"Google Fonts revision `?([0-9a-f]{40})", guide)[1]
footage = findall(
    r"^[ \t]*(?:[-*•][ \t]+)?`?(p\d{3})`? +—[^\n]*?\s+Page ([-\w]+)\s+MP4 ([\w.-]+)",
    guide, MULTILINE
)
assets = {}
pages = {}
for name, slug, filename in footage:
    video_id = slug.rsplit("-", 1)[1]
    pages[name + ".mp4"] = site("www", "pexels", "com") + "/video/" + slug + "/"
    assets[name + ".mp4"] = site("videos", "pexels", "com") + f"/video-files/{video_id}/{filename}"

bases = {
    "Pixabay": site("cdn", "pixabay", "com") + "/",
    "DeepSeek": site("www", "deepseek", "com") + "/",
    "GoogleFonts": site("raw", "githubusercontent", "com") + f"/google/fonts/{revision}/",
}
for name, source, path in findall(
    r"^[ \t]*(?:[-*•][ \t]+)?`?([\w.-]+\.(?:mp3|svg|ttf))`? +—[^\n]*?\s+"
    r"(Pixabay|DeepSeek|GoogleFonts) ((?:download/audio/|ofl/)\S+|/)(?=\s|$)",
    guide, MULTILINE
):
    assets[name] = bases[source] + path.lstrip("/")

if len(footage) != 32 or len(assets) != 38:
    raise SystemExit("Copy the complete guide, including the asset list.")
list_only = "--list" in sys.argv[1:]
names = [arg for arg in sys.argv[1:] if arg != "--list"] or list(assets)
if any(name not in assets for name in names):
    raise SystemExit("Choose asset names from the list. For footage, add the .mp4 extension.")
if list_only:
    for name in names:
        print(name, assets[name], pages.get(name, ""), sep="\t")
    raise SystemExit

folder = Path("deepseek-assets")
folder.mkdir(exist_ok=True)

def save(name):
    output = folder / name
    if isfile(output) and output.stat().st_size:
        return
    with TemporaryDirectory(dir=folder) as staging:
        temp = Path(staging) / name
        run(["curl", "--fail", "--location", "--silent", "--show-error",
             "--globoff", "--connect-timeout", "20", "--retry", "3",
             "--retry-all-errors", "--output", str(temp), assets[name]], check=True)
        if name == "deepseek.svg":
            with open(temp, encoding="utf-8") as page:
                html = "".join(page)
            logo = search(r'<svg\b[^>]*\bviewBox="0 0 143 23"[^>]*>.*?</svg>', html, DOTALL)
            if logo is None:
                raise ValueError("Look for the logo SVG in the header of the DeepSeek homepage.")
            root = ET.fromstring(logo[0])
            if root.tag == "svg":
                root.set("xmlns", "http://" + ".".join(("www", "w3", "org")) + "/2000/svg")
            ET.ElementTree(root).write(temp, encoding="utf-8")
        temp.replace(output)
        print(name, flush=True)

with ThreadPoolExecutor(max_workers=4) as pool:
    downloads = [pool.submit(save, name) for name in names]
    for download in downloads:
        download.result()
PY
```

## Export checkpoints

Export a landscape H.264 MP4 from OpenMotion at 1920×1080 and 60 fps. The runtime is 52.000 seconds, or 3120 frames. Use stereo AAC at 48 kHz with a target bitrate of 256 kb/s. The original film measures about −14.1 LUFS integrated.

| Film time | What to look or listen for |
| --- | --- |
| 2.0 s | On a black background, underwater footage is visible only inside the whale silhouette. The small `DEEPSEEK` label sits below it. |
| 19.0 → 20.115 s | The depth reading holds at bottom left. The line types out during the quiet passage, contracts to a point of light, and gives way to the first sonar window on the downbeat. |
| 24.0 s | The processor sits inside the circle. The progress ring is partway around, with outlined type visible behind the footage. |
| 37.0 → 39.66 s | `Open to everyone.` overlays Hangzhou at night. As the city recedes into the center tile, a ripple of light crosses the tilted wall. |
| 44.5 s | Shanghai fills the background. A different city-light shot fills all three IPO letters, and the white DeepSeek wordmark is fully visible above. |
| 49.3 → 52.0 s | The concept-film credit is readable on the pale blue card. Music starts fading at 50.30 s. The picture starts fading at 51.25 s and reaches full black at 51.95 s. |
