// usage: node tools/render.mjs <mv dir> <out.mp4>   | node tools/render.mjs <mv dir> --stills <t...>  (STILLS=<dir>)
// env: FFMPEG (ffmpeg path), CHROME_PATH (optional Chromium executable). Requires `npm i --no-save playwright-core`.
// env AR=9x16 renders the vertical 1080×1920 cut.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { spawn } from 'node:child_process';
import { chromium } from 'playwright-core';
const [dir, out, ...times] = process.argv.slice(2);
const MIME = { '.html': 'text/html', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.m4a': 'audio/mp4', '.js': 'text/javascript' };
const srv = http.createServer((q, r) => { const f = path.join(dir, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); }).listen(0);
const port = srv.address().port;
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined, args: ['--disable-web-security', '--font-render-hinting=none'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', m => console.log('[page]', m.text())); page.on('pageerror', e => console.log('[err]', e.message));
await page.goto(`http://127.0.0.1:${port}/index.html?render${process.env.AR ? `&ar=${process.env.AR}` : ""}`);
await page.waitForFunction(() => window.ready === true, null, { timeout: 120000 });
const grab = t => page.evaluate(t => { renderFrame(t); return document.getElementById('c').toDataURL('image/jpeg', 0.95).split(',')[1]; }, t);
if (out === '--stills') {
  fs.mkdirSync(process.env.STILLS, { recursive: true });
  for (const t of times) { fs.writeFileSync(path.join(process.env.STILLS, `t${(+t).toFixed(2)}.jpg`), Buffer.from(await grab(+t), 'base64')); }
} else {
  const { FPS, DUR } = await page.evaluate(() => window.META);
  const n = Math.round(DUR * FPS);
  const ff = spawn(process.env.FFMPEG || 'ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-', '-i', path.join(dir, 'assets/clip.m4a'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let i = 0; i < n; i++) {
    const b = Buffer.from(await grab(i / FPS), 'base64');
    if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 60 === 0) console.log(`frame ${i}/${n}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close(); srv.close();
