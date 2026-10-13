const { chromium } = require('/workspace/fitness-app/node_modules/playwright-core');
const fs = require('fs'); const svg = fs.readFileSync(__dirname + '/../src/icons/icon.svg', 'utf8');
(async () => { const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const [n, s, pad] of [['icon-512', 512, 0], ['icon-192', 192, 0], ['apple-touch-icon', 180, 0], ['icon-maskable-512', 512, 0]]) {
    const p = await b.newPage({ viewport: { width: s, height: s } });
    await p.setContent(`<style>body{margin:0}svg{width:${s}px;height:${s}px;display:block}</style>${svg}`);
    await p.screenshot({ path: __dirname + `/../src/icons/${n}.png` }); await p.close(); }
  await b.close(); })();
