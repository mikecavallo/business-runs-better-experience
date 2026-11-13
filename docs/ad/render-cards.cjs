// Screenshots the five carousel cards in both formats into docs/ad/carousel/.
//   python3 -m http.server 8765   (from the repo root)
//   node docs/ad/render-cards.cjs
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const OUT = process.argv[2] || path.join(__dirname, 'carousel');
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  for (const [fmt, h] of [['square', 1080], ['story', 1920]]) {
    const p = await b.newPage({ viewport: { width: 1080, height: h } });
    for (let n = 1; n <= 5; n++) {
      await p.goto(`http://127.0.0.1:8765/docs/ad/cards.html?card=${n}&format=${fmt}`);
      await p.evaluate(() => window.ready);
      await p.screenshot({ path: path.join(OUT, `card-${n}-${fmt}.png`) });
    }
    await p.close();
  }
  await b.close();
  console.log('wrote', OUT);
})();
