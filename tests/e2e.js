// Click-through of dist/ in headless Chrome at 390x844, light + dark, with screenshots and AA contrast checks.
const { chromium } = require('/workspace/fitness-app/node_modules/playwright-core');
const SHOTS = __dirname + '/../shots-ranch/'; require('fs').mkdirSync(SHOTS, { recursive: true });
const URL = process.env.URL || 'http://127.0.0.1:8765/';
let pass = 0, fail = 0; const ok = (c, m) => { c ? pass++ : fail++; console.log(c ? '  ✔' : '  ✘ FAIL', m); };
const contrastJS = () => {
  const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const parse = (s) => { const m = s.match(/[\d.]+/g); if (!m) return null; const n = m.map(Number); return s.startsWith('color(') ? n.map((v, i) => (i < 3 ? v * 255 : v)) : n; };
  const bgOf = (el) => { let stack = []; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); const c = parse(cs.backgroundColor); if (cs.backgroundImage !== 'none' && !c?.[3]) return null; if (c && (c.length < 4 || c[3] > 0)) { stack.push(c); if (c.length < 4 || c[3] >= 1) break; } } let base = [255, 255, 255]; for (const c of stack.reverse()) { const a = c.length < 4 ? 1 : c[3]; base = base.map((v, i) => v * (1 - a) + c[i] * a); } return base; };
  const bad = [];
  for (const el of document.querySelectorAll('main *, header *, nav *')) {
    if (!el.childNodes.length || ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().replace(/\p{Extended_Pictographic}|\uFE0F/gu, ''))) continue;
    const r = el.getBoundingClientRect(); if (!r.width || r.bottom < 0) continue;
    const cs = getComputedStyle(el); const fg = parse(cs.color); const bg = bgOf(el); if (!bg) continue;
    const L1 = lum(fg.slice(0, 3)), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const large = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && +cs.fontWeight >= 700);
    if (ratio < (large ? 3 : 4.5)) bad.push(`${ratio.toFixed(2)} "${el.textContent.trim().slice(0, 30)}" ${el.className}`);
  }
  return [...new Set(bad)];
};
(async () => {
  const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  for (const scheme of ['light', 'dark']) {
    console.log('== ' + scheme);
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme });
    const p = await ctx.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
    p.on('dialog', (d) => d.accept(d.type() === 'prompt' ? 'Errands' : undefined));
    if (scheme === 'light') { // old v1 data compatibility
      await p.goto(URL); await p.evaluate(() => { localStorage.clear(); localStorage.setItem('us-app-v1', JSON.stringify({ ...window.__us.S.sampleData(), settings: { appName: 'Us', users: { a: { name: 'Jon', color: '#e8613c' }, b: { name: 'Partner', color: '#7b5cd6' } }, me: 'a' } })); const s = JSON.parse(localStorage['us-app-v1']); s.posts[0].reactions['😮'] = ['b']; localStorage['us-app-v1'] = JSON.stringify(s); });
      await p.reload(); await p.waitForTimeout(300);
      ok(await p.locator('.rx', { hasText: '😮' }).count() === 1, 'old-version reaction still shown');
      await p.evaluate(() => { localStorage.clear(); }); await p.reload();
    } else { await p.goto(URL); await p.evaluate(() => localStorage.clear()); await p.reload(); }
    await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(400);
    ok(await p.evaluate(() => document.fonts.check('16px Rye') && document.fonts.check('700 16px Bitter')), 'fonts loaded locally');
    ok(await p.locator('.hero svg').count() === 1, 'hero art renders');
    const tabs = ['feed', 'calendar', 'dates', 'trips', 'lists', 'settings'];
    const allBad = {};
    for (const t of tabs) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(250); allBad[t] = await p.evaluate(contrastJS);
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${t}: no horizontal overflow`);
      if (scheme === 'light') await p.screenshot({ path: SHOTS + `${tabs.indexOf(t) + 1}-${t}.png` }); }
    if (scheme === 'dark') { await p.click('[data-tab="feed"]'); await p.waitForTimeout(200); await p.screenshot({ path: SHOTS + '7-feed-dark.png' });
      await p.click('[data-tab="trips"]'); await p.screenshot({ path: SHOTS + '8-trailfund-dark.png' }); }
    for (const [t, bad] of Object.entries(allBad)) ok(!bad.length, `${t}: WCAG AA contrast` + (bad.length ? ' ' + JSON.stringify(bad.slice(0, 6)) : ''));
    if (scheme === 'light') {
      await p.click('[data-tab="feed"]');
      await p.fill('#compose textarea', 'Test post 🐎'); await p.click('#compose .primary'); ok(await p.locator('.post', { hasText: 'Test post' }).count() === 1, 'text post');
      await p.click('[data-react][data-emoji="🤠"] >> nth=0'); ok(await p.locator('.rx.on', { hasText: '🤠' }).count() >= 1, 'cowboy-hat reaction');
      await p.fill('.cform input >> nth=0', 'yeehaw'); await p.press('.cform input >> nth=0', 'Enter'); ok(await p.locator('.cmt', { hasText: 'yeehaw' }).count() === 1, 'comment');
      await p.click('[data-status^="Running late"]'); ok(await p.locator('.post', { hasText: 'hold the horses' }).count() === 1, 'late status autopost');
      await p.click('[data-cmode="poll"]'); await p.fill('#compose [name=text]', 'Who left the gate open?'); await p.click('#compose .primary'); await p.click('[data-vote] >> nth=0'); ok(await p.locator('.post').first().locator('.popt b').count() === 2, 'poll vote');
      await p.click('[data-cmode="meme"]'); await p.fill('#compose [name=top]', 'howdy'); await p.click('[data-sticker="🐴"]'); await p.screenshot({ path: SHOTS + '0-meme-composer.png' }); await p.click('#compose .primary'); ok(await p.locator('.post img.pimg').count() >= 1, 'meme post');
      await p.click('[data-tab="calendar"]'); await p.click('[data-newev]'); await p.fill('#evform [name=title]', 'Feed horses'); await p.click('#evform .primary'); ok(await p.locator('.ev', { hasText: 'Feed horses' }).count() === 1, 'add event');
      await p.click('[data-calview="agenda"]'); ok(await p.locator('.ev').count() >= 1, 'agenda view');
      await p.click('[data-tab="dates"]'); await p.click('[data-filter="cost"][data-val="free"]'); ok(await p.locator('.idea', { hasText: 'bonfire' }).count() === 1, 'filter shows ranch idea');
      await p.click('[data-filter="cost"][data-val="free"]'); const id = 'r1';
      await p.click(`[data-heart="${id}"]`); await p.click('[data-who="b"]'); await p.click(`[data-heart="${id}"]`); ok(await p.locator('.idea.match').count() === 1, 'match');
      await p.click(`[data-rate="${id}"][data-n="5"]`); await p.click('[data-who="a"]');
      await p.click('[data-tab="trips"]'); await p.fill('#contrib [name=amount]', '800'); await p.click('#contrib .primary'); await p.waitForTimeout(100);
      ok(await p.evaluate(() => window.__us.S.get().posts.some((x) => /Halfway to the trail/.test(x.text))), 'halfway milestone post');
      await p.click('[data-skip="6"]'); ok(await p.evaluate(() => window.__us.S.get().posts[0].text.includes('Trail Fund')), 'skip it');
      await p.click('[data-tab="lists"]'); await p.fill('#additem [name=t]', 'Hay bales'); await p.click('#additem .primary'); await p.click('[data-check] >> nth=0'); await p.click('[data-claim] >> nth=1'); await p.click('[data-newlist]'); ok(await p.locator('[data-list="Errands"]').count() === 1, 'lists');
      await p.click('[data-tab="settings"]'); await p.fill('[name=appName]', 'Rice Ranch'); await p.fill('[name=abrand]', 'jr'); await p.click('#setform .primary');
      ok((await p.textContent('#appname')) === 'Rice Ranch', 'ranch name'); ok(await p.evaluate(() => window.__us.S.get().settings.users.a.brand === 'JR'), 'brand saved');
      await p.click('[data-tab="feed"]'); ok(await p.locator('.post .avatar', { hasText: 'JR' }).count() >= 1, 'brand avatar'); await p.screenshot({ path: SHOTS + '9-feed-branded.png' });
      await p.click('[data-delpost] >> nth=0');
    }
    ok(!errs.length, 'no console errors ' + errs.join(' | '));
    await ctx.close();
  }
  await b.close(); console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
