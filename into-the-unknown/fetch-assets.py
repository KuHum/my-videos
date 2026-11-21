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
