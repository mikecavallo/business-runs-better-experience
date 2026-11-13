// Renders scene.html to a silent 1080x1920 30fps MP4, one screenshot per frame.
//   python3 -m http.server 8765   (from the repo root, so the fonts load)
//   node docs/ad/cartoon/render.cjs out.mp4 [story|feed]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const FPS = 30, DUR = 30, OUT = process.argv[2] || 'video-only.mp4';
const FORMAT = process.argv[3] === 'feed' ? 'feed' : 'story', H = FORMAT === 'feed' ? 1350 : 1920;
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: H } });
  p.on('pageerror', e => console.log('page error:', e.message));
  await p.goto('http://127.0.0.1:8765/docs/ad/cartoon/scene.html?format=' + FORMAT);
  await p.evaluate(() => window.ready);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', OUT], { stdio: ['pipe', 'inherit', 'inherit'] });
  const N = FPS * DUR;
  for (let i = 0; i < N; i++) {
    await p.evaluate(t => render(t), i / FPS);
    const buf = await p.screenshot({ type: 'jpeg', quality: 96 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % 90 === 0) console.log(`frame ${i}/${N}`);
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  await b.close();
  console.log('done', OUT);
})();
