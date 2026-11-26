"""Render frames [a,b) of a built page to an H.264 mp4 (one chapter). Usage: render_chunk.py page.html a b out.mp4 crf"""
import sys, base64, asyncio, subprocess, os
from playwright.async_api import async_playwright
html, a, b, out, crf = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4], sys.argv[5]
async def main():
    async with async_playwright() as p:
        br = await p.chromium.launch(); pg = await br.new_page(viewport={'width': 1300, 'height': 900})
        pg.on('pageerror', lambda e: print('PAGE ERROR', str(e)[:300], flush=True))
        await pg.goto('file://' + os.path.abspath(html)); await pg.evaluate('window.ready')
        tmp = out + '.part.mp4'
        ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'veryfast', '-crf', crf, '-pix_fmt', 'yuv420p', '-r', '30', '-g', '30', '-f', 'mp4', tmp], stdin=subprocess.PIPE)
        for i in range(a, b):
            d = await pg.evaluate('window.frameJpeg(%d/30)' % i); ff.stdin.write(base64.b64decode(d))
        ff.stdin.close(); rc = ff.wait()
        if rc == 0: os.rename(tmp, out)
        else: print('ffmpeg failed', rc); sys.exit(1)
        await br.close()
asyncio.run(main())
