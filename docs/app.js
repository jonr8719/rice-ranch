import * as S from './store.js';
import { MILESTONES } from './config.js';
import { DATE_IDEAS, NEAR_ME } from './dates.js';
import * as G from './games.js';
import { HERO, HORSESHOE, WHEAT, LASSO, BARN } from './art.js';

const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const todayISO = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };
const localISO = (d) => new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
const money = (n) => '$' + Math.round(n).toLocaleString();
const ago = (t) => { const m = Math.round((Date.now() - t) / 6e4); return m < 1 ? 'now' : m < 60 ? m + 'm' : m < 1440 ? Math.round(m / 60) + 'h' : Math.round(m / 1440) + 'd'; };
const fmtT = (t) => { if (!t) return ''; const [h, m] = t.split(':').map(Number); return ((h % 12) || 12) + (m ? ':' + String(m).padStart(2, '0') : '') + (h < 12 ? 'a' : 'p'); };

let tab = 'feed', calMonth = new Date(), calSel = todayISO(), calView = 'month', dateFilters = {}, listName = 'Groceries';
const st = () => S.get();
const me = () => st().settings.me;
const other = () => (me() === 'a' ? 'b' : 'a');
const U = (k) => st().settings.users[k] || { name: 'Both', color: '#d4a72c' };
const brandOf = (k) => (k === 'auto' ? '🐴' : (U(k).brand || nameOf(k)[0] || '?'));
const nameOf = (k) => (k === 'both' ? 'Both' : k === 'auto' ? st().settings.appName : U(k).name);

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200); }
function autoPost(text) { S.update((s) => s.posts.unshift({ id: S.uid(), by: 'auto', at: Date.now(), type: 'auto', text, reactions: {}, comments: [] })); }

/* ---------- Shell ---------- */
function render() {
  const s = st();
  document.title = s.settings.appName;
  document.documentElement.style.setProperty('--a', s.settings.users.a.color);
  document.documentElement.style.setProperty('--b', s.settings.users.b.color);
  $('#appname').textContent = s.settings.appName;
  if (!$('#logo').innerHTML) $('#logo').innerHTML = HORSESHOE;
  $('#who').innerHTML = ['a', 'b'].map((k) => `<button class="whobtn ${k === me() ? 'on' : ''}" data-who="${k}" style="--c:${U(k).color}" aria-pressed="${k === me()}">${esc(U(k).name)}</button>`).join('');
  $('#sample').hidden = !s.sample;
  document.querySelectorAll('.tabbar button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
  const v = { feed, calendar, dates, trips, lists, settings }[tab]();
  $('#view').innerHTML = v;
}
S.subscribe(render);

/* ---------- Feed ---------- */
function todayCard() {
  const t = todayISO();
  const col = (k) => {
    const evs = st().events.filter((e) => e.date === t && (e.by === k || e.by === 'both')).sort((x, y) => x.start.localeCompare(y.start));
    const s = st().status[k];
    return `<div class="tc-col" style="--c:${U(k).color}"><div class="tc-name"><span class="dot"></span>${esc(U(k).name)}</div>
      ${s ? `<div class="bubble">${esc(s.text)} <small>${ago(s.at)}</small></div>` : ''}
      ${evs.length ? evs.map((e) => `<div class="tc-ev">${fmtT(e.start)} · ${esc(e.title)}</div>`).join('') : '<div class="tc-ev muted">Nothing scheduled</div>'}</div>`;
  };
  return `<section class="card today"><h2 class="deco">${BARN}Today on the ranch</h2><div class="tc-grid">${col('a')}${col('b')}</div>
    <div class="chips" role="group" aria-label="Set your status">${['Headed home 🐎', 'Running late, hold the horses ⏰', 'Out in the field 🌾', 'Thinking of you 💭'].map((x) => `<button class="chip" data-status="${x}">${x}</button>`).join('')}<button class="chip" data-status="__custom">✏️ Custom</button></div></section>`;
}
function postHTML(p) {
  const c = p.by === 'auto' ? 'var(--accent)' : U(p.by).color;
  const RX = ['❤️', '😂', '🔥', '🐎', '🤠', '🌻'];
  const rx = [...RX, ...Object.keys(p.reactions).filter((e) => !RX.includes(e) && p.reactions[e].length)].map((e) => { const who = p.reactions[e] || []; return `<button class="rx ${who.includes(me()) ? 'on' : ''}" data-react="${p.id}" data-emoji="${e}" aria-label="React ${e}">${e}${who.length ? ' ' + who.length : ''}</button>`; }).join('');
  let body = p.text ? `<p class="ptext">${esc(p.text)}</p>` : '';
  if (p.img) body += `<img class="pimg" src="${p.img}" alt="Photo posted by ${esc(nameOf(p.by))}">`;
  if (p.type === 'poll') {
    const tot = Object.keys(p.votes).length, mine = p.votes[me()];
    body += `<div class="poll">${p.options.map((o, i) => { const n = Object.values(p.votes).filter((v) => v === i).length; const pct = tot ? Math.round((n / tot) * 100) : 0; return `<button class="popt ${mine === i ? 'on' : ''}" data-vote="${p.id}" data-i="${i}"><span class="pbar" style="width:${mine !== undefined ? pct : 0}%"></span><span>${esc(o)}</span>${mine !== undefined ? `<b>${pct}%</b>` : ''}</button>`; }).join('')}</div>`;
  }
  return `<article class="card post ${p.type === 'auto' ? 'auto' : ''}" style="--c:${c}">
    <header><span class="avatar">${esc(brandOf(p.by))}</span><b>${esc(nameOf(p.by))}</b><small>${ago(p.at)}</small>${p.by === me() ? `<button class="del" data-delpost="${p.id}" aria-label="Delete post">✕</button>` : ''}</header>
    ${body}<div class="rxs">${rx}</div>
    <div class="comments">${p.comments.map((c) => `<div class="cmt"><b style="--c:${U(c.by).color}">${esc(nameOf(c.by))}</b> ${esc(c.text)}</div>`).join('')}
    <form class="cform" data-comment="${p.id}"><input name="c" placeholder="Add a comment…" aria-label="Comment" autocomplete="off"><button>Send</button></form></div></article>`;
}
function feed() {
  return `<div class="hero">${HERO}<div class="hero-text"><b>${esc(st().settings.appName)}</b><small>Howdy, ${esc(U(me()).name)} 🤠</small></div></div>` + todayCard() + `<section class="card composer">
    <div class="seg" role="tablist">${['text', 'photo', 'meme', 'poll'].map((m) => `<button data-cmode="${m}" class="${composerMode === m ? 'on' : ''}">${{ text: '💬 Post', photo: '📷 Photo', meme: '🤠 Meme', poll: '📊 Poll' }[m]}</button>`).join('')}</div>
    <form id="compose">
      ${composerMode === 'poll' ? `<input name="text" placeholder="Ask something… e.g. Who left the barn door open?" aria-label="Poll question" required>
        <div class="row"><input name="o1" value="${esc(U('a').name)}" aria-label="Option 1"><input name="o2" value="${esc(U('b').name)}" aria-label="Option 2"></div>`
      : composerMode === 'meme' ? `<input name="top" placeholder="TOP TEXT" aria-label="Top caption"><input name="bottom" placeholder="BOTTOM TEXT" aria-label="Bottom caption">
        <label class="filebtn">Choose photo<input type="file" name="photo" accept="image/*" hidden></label>
        <div class="stickers">${['😂', '❤️', '🤠', '🐴', '👢', '🌻', '🔥', '🙄'].map((x) => `<button type="button" data-sticker="${x}">${x}</button>`).join('')}</div><canvas id="memecv" width="600" height="600" hidden></canvas>`
      : `<textarea name="text" rows="2" placeholder="What's new on the ranch, ${esc(U(me()).name)}?" aria-label="Post text"></textarea>${composerMode === 'photo' ? '<label class="filebtn">Choose photo<input type="file" name="photo" accept="image/*" hidden></label><img id="preview" hidden alt="Photo preview">' : ''}`}
      <button class="primary">Post</button></form></section>` + st().posts.map(postHTML).join('');
}
let composerMode = 'text', pendingImg = null, memeImg = null, memeSticker = '';
function compress(file, max = 1080) {
  return new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => { const img = new Image(); img.onload = () => { const r = Math.min(1, max / Math.max(img.width, img.height)); const c = document.createElement('canvas'); c.width = img.width * r; c.height = img.height * r; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); res({ url: c.toDataURL('image/jpeg', 0.75), img: c }); }; img.onerror = rej; img.src = fr.result; }; fr.readAsDataURL(file); });
}
function drawMeme() {
  const cv = $('#memecv'); if (!cv) return null; const f = $('#compose'); const x = cv.getContext('2d');
  const src = memeImg; const W = 600, H = src ? Math.round((600 * src.height) / src.width) : 600; cv.width = W; cv.height = H;
  if (src) x.drawImage(src, 0, 0, W, H); else { x.fillStyle = '#5a3b24'; x.fillRect(0, 0, W, H); }
  x.textAlign = 'center'; x.lineWidth = 6; x.strokeStyle = '#000'; x.fillStyle = '#fff'; x.font = 'bold 54px Impact, "Arial Black", sans-serif';
  const line = (t, y, base) => { if (!t) return; t = t.toUpperCase(); x.textBaseline = base; x.strokeText(t, W / 2, y, W - 30); x.fillText(t, W / 2, y, W - 30); };
  line(f.top.value, 16, 'top'); line(f.bottom.value, H - 16, 'bottom');
  if (memeSticker) { x.font = '90px sans-serif'; x.textBaseline = 'middle'; x.fillText(memeSticker, W - 70, H / 2); }
  cv.hidden = false; return cv;
}

/* ---------- Calendar ---------- */
const hidden = () => st().settings.hideTeams || {};
const gamesOn = (date) => G.games().filter((g) => !hidden()[g.team] && (!date || g.date === date));
const gameHTML = (g, showDate) => `<button class="ev game ${g.team}" data-game="${g.id}" style="--c:${G.TEAMS[g.team].color}">${showDate ? `<small>${new Date(g.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>` : ''}<b>${esc(G.title(g))}</b><span>${esc(G.detail(g))}</span></button>`;
function busy(k, date) { return st().events.filter((e) => e.date === date && (e.by === k || e.by === 'both')); }
function freeEvening(date) { const ev = (k) => busy(k, date).some((e) => e.end > '17:00' || e.start >= '17:00'); return !ev('a') && !ev('b'); }
function calendar() {
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), first = new Date(y, m, 1), days = new Date(y, m + 1, 0).getDate();
  const t = todayISO(); let cells = '';
  for (let i = 0; i < first.getDay(); i++) cells += '<div></div>';
  for (let d = 1; d <= days; d++) {
    const iso = localISO(new Date(y, m, d)), evs = st().events.filter((e) => e.date === iso), gms = gamesOn(iso), dow = new Date(y, m, d).getDay();
    const free = iso >= t && freeEvening(iso);
    cells += `<button class="day ${iso === t ? 'today' : ''} ${iso === calSel ? 'sel' : ''} ${free ? 'free' : ''} ${dow % 6 === 0 ? 'wk' : ''}" data-day="${iso}" aria-label="${iso}${free ? ', both free evening' : ''}"><span>${d}</span><i>${gms.map((g) => `<em class="gdot" style="background:${G.TEAMS[g.team].color}"></em>`).join('')}${evs.slice(0, 3 - gms.length).map((e) => `<em style="background:${e.by === 'both' ? 'var(--both)' : U(e.by).color}"></em>`).join('')}</i></button>`;
  }
  const tonightFree = freeEvening(t);
  const sel = st().events.filter((e) => e.date === calSel).sort((a, b) => a.start.localeCompare(b.start));
  const agenda = calView === 'agenda' ? st().events.filter((e) => e.date >= t).sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start)) : sel;
  return `${tonightFree ? `<section class="card freetonight"><b>🌅 You're both free tonight!</b><p>No evening plans on either calendar. Saddle up for a date.</p><button class="primary" data-goto="dates">Find a date idea →</button></section>` : ''}
  <section class="card"><div class="calhead"><button data-cal="-1" aria-label="Previous month">‹</button><h2>${calMonth.toLocaleString(undefined, { month: 'long', year: 'numeric' })}</h2><button data-cal="1" aria-label="Next month">›</button></div>
  <div class="seg"><button data-calview="month" class="${calView === 'month' ? 'on' : ''}">Month</button><button data-calview="agenda" class="${calView === 'agenda' ? 'on' : ''}">Agenda</button></div>
  ${calView === 'month' ? `<div class="cal"><b>S</b><b>M</b><b>T</b><b>W</b><b>T</b><b>F</b><b>S</b>${cells}</div>
  <div class="legend"><span><em style="background:var(--a)"></em>${esc(U('a').name)}</span><span><em style="background:var(--b)"></em>${esc(U('b').name)}</span><span><em style="background:var(--both)"></em>Both</span>${Object.entries(G.TEAMS).filter(([k]) => !hidden()[k]).map(([k, T]) => `<span><em style="background:${T.color}"></em>${T.name}</span>`).join('')}<span><em class="freekey"></em>Both free evening</span></div>` : ''}</section>
  <section class="card"><h2>${calView === 'agenda' ? 'Upcoming' : new Date(calSel + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
  ${(() => { const gl = calView === 'agenda' ? gamesOn().filter((g) => g.date >= t) : gamesOn(calSel); const items = [...agenda.map((e) => ({ k: e.date + e.start, h: evHTML(e) })), ...gl.map((g) => ({ k: g.date + g.start, h: gameHTML(g, calView === 'agenda') }))].sort((a, b) => a.k.localeCompare(b.k)); return items.length ? items.map((x) => x.h).join('') : ''; })() || (agenda.length ? agenda.map((e) => `<button class="ev" data-editev="${e.id}" style="--c:${e.by === 'both' ? 'var(--both)' : U(e.by).color}">${calView === 'agenda' ? `<small>${new Date(e.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>` : ''}<b>${esc(e.title)}</b><span>${fmtT(e.start)}–${fmtT(e.end)} · ${esc(nameOf(e.by))}</span></button>`).join('') : `<p class="muted">${calView === 'month' && freeEvening(calSel) ? '🌅 Both free this evening. Perfect for a date.' : 'No events.'}</p>`)}
  <button class="primary" data-newev>+ Add event</button></section>`;
}
function evHTML(e) { return `<button class="ev" data-editev="${e.id}" style="--c:${e.by === 'both' ? 'var(--both)' : U(e.by).color}">${calView === 'agenda' ? `<small>${new Date(e.date + 'T12:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</small>` : ''}<b>${esc(e.title)}</b><span>${fmtT(e.start)}–${fmtT(e.end)} · ${esc(nameOf(e.by))}</span></button>`; }
function gameDialog(g) {
  const T = G.TEAMS[g.team];
  openDialog(`<h2>${esc(G.title(g))}</h2><p><b>${new Date(g.at).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</b><br>${esc(G.detail(g))}</p>
    <p class="muted">${g.home ? 'Home' : g.neutral ? 'Neutral site' : 'Away'}${g.venue ? ' · ' + esc(g.venue) : ''}<br>${esc(T.full)} schedule from ESPN, updates automatically.</p>`);
}
function eventDialog(ev) {
  const e = ev || { date: calSel, start: '18:00', end: '19:00', title: '', by: me() };
  openDialog(`<h2>${ev ? 'Edit' : 'New'} event</h2><form id="evform">
    <label>Title<input name="title" value="${esc(e.title)}" required></label>
    <label>Date<input type="date" name="date" value="${e.date}" required></label>
    <div class="row"><label>Start<input type="time" name="start" value="${e.start}"></label><label>End<input type="time" name="end" value="${e.end}"></label></div>
    <label>Whose<select name="by">${['a', 'b', 'both'].map((k) => `<option value="${k}" ${e.by === k ? 'selected' : ''}>${esc(nameOf(k))}</option>`).join('')}</select></label>
    <div class="row">${ev ? `<button type="button" class="danger" data-delev="${ev.id}">Delete</button>` : ''}<button class="primary">Save</button></div></form>`, (f) => {
    const d = Object.fromEntries(new FormData(f));
    S.update((s) => { if (ev) Object.assign(s.events.find((x) => x.id === ev.id), d); else s.events.push({ id: S.uid(), ...d }); });
    if (!ev && d.title) toast('Event added');
  });
}

/* ---------- Dates ---------- */
const FILTERS = { cost: ['free', 'cheap', 'splurge'], where: ['indoor', 'outdoor'], energy: ['chill', 'active'], time: ['quick', 'evening', 'day'] };
function dates() {
  const ideas = DATE_IDEAS.filter((d) => Object.entries(dateFilters).every(([k, v]) => !v || d[k] === v));
  const hearts = st().hearts;
  return `<section class="card"><h2 class="deco">${LASSO}Date Night</h2><p class="muted">Heart the ones you like. When you both heart one, it's a match 💘</p>
  ${Object.entries(FILTERS).map(([k, opts]) => `<div class="chips" role="group" aria-label="${k}">${opts.map((o) => `<button class="chip ${dateFilters[k] === o ? 'on' : ''}" data-filter="${k}" data-val="${o}">${{ free: 'Free', cheap: '$ Cheap', splurge: '$$$ Splurge', indoor: '🏠 Indoor', outdoor: '🌳 Outdoor', chill: '😌 Chill', active: '⚡ Active', quick: '⏱ Quick', evening: '🌙 Evening', day: '☀️ All day' }[o]}</button>`).join('')}</div>`).join('')}
  </section>
  <section class="card"><h2>📍 Near me</h2><p class="muted">Opens Google Maps around wherever you are, at home or out on the road.</p>
  <div class="chips">${NEAR_ME.map((q) => `<button class="chip" data-near="${q}">${q}</button>`).join('')}</div></section>
  ${ideas.map((d) => { const h = hearts[d.id] || []; const match = h.includes('a') && h.includes('b'); const r = st().ratings[d.id]; return `<article class="card idea ${match ? 'match' : ''}">
    <div class="ihead"><div><b>${esc(d.title)}</b><small>${d.area} · ${d.cost} · ${d.where} · ${d.energy} · ${d.time}</small></div>
    <button class="heart ${h.includes(me()) ? 'on' : ''}" data-heart="${d.id}" aria-label="Heart ${esc(d.title)}" aria-pressed="${h.includes(me())}">${h.includes(me()) ? '❤️' : '🤍'}</button></div>
    <div class="irow">${h.map((k) => `<span class="tag" style="--c:${U(k).color}">${esc(U(k).name)} ♥</span>`).join('')}${match ? '<span class="tag match">💘 Match!</span>' : ''}
    ${d.q ? `<a class="link" target="_blank" rel="noopener" href="https://www.google.com/maps/search/${encodeURIComponent(d.area === 'Anywhere' ? d.q + ' near me' : d.q)}">Map ↗</a>` : ''}</div>
    ${match ? `<div class="rate" aria-label="Rate this date">${[1, 2, 3, 4, 5].map((n) => `<button data-rate="${d.id}" data-n="${n}" aria-label="${n} stars">${r && r >= n ? '★' : '☆'}</button>`).join('')}<small>${r ? 'Rated' : 'Rate it after your date'}</small></div>` : ''}</article>`; }).join('') || '<p class="card muted">No ideas match those filters.</p>'}`;
}

/* ---------- Trips ---------- */
function trips() {
  const t = st().trip, saved = t.contributions.reduce((a, c) => a + c.amount, 0), pct = Math.min(1, saved / t.goal);
  const days = Math.ceil((new Date(t.date + 'T00:00') - new Date(todayISO() + 'T00:00')) / 864e5), weeks = Math.max(1, days / 7);
  const per = (k) => t.contributions.filter((c) => c.by === k).reduce((a, c) => a + c.amount, 0);
  const skips = t.contributions.filter((c) => c.skip).reduce((a, c) => a + c.amount, 0);
  return `<section class="card trip"><h2>Trail Fund</h2><div class="countdown"><span>${days > 0 ? days : 0}</span><small>days till we hit the road to<br><b>${esc(t.name)}</b></small></div>
  <div class="prog" role="progressbar" aria-valuenow="${Math.round(pct * 100)}" aria-valuemin="0" aria-valuemax="100"><div style="width:${pct * 100}%"></div></div>
  <div class="tstats"><div><b>${money(saved)}</b><small>saved of ${money(t.goal)}</small></div><div><b>${money(Math.max(0, t.goal - saved) / weeks)}</b><small>per week to hit it</small></div></div>
  <div class="tstats"><div style="--c:var(--a)"><b>${money(per('a'))}</b><small>${esc(U('a').name)}</small></div><div style="--c:var(--b)"><b>${money(per('b'))}</b><small>${esc(U('b').name)}</small></div><div><b>${money(skips)}</b><small>from skips</small></div></div>
  <button class="ghost" data-edittrip>Edit trip</button></section>
  <section class="card"><h2>🙅 Skip it</h2><p class="muted">Passed on a purchase? Put it in the Trail Fund.</p>
  <div class="chips">${[['☕ Coffee', 6], ['🍔 Takeout', 25], ['🛍️ Impulse buy', 40], ['🍿 Snack', 4], ['🍺 Round at the bar', 12]].map(([l, a]) => `<button class="chip" data-skip="${a}" data-label="${l}">${l} ${money(a)}</button>`).join('')}</div></section>
  <section class="card"><h2>Add to the fund</h2><form id="contrib" class="row"><input name="amount" type="number" min="1" step="1" placeholder="$ amount" required aria-label="Amount"><input name="note" placeholder="Note" aria-label="Note"><button class="primary">Add</button></form>
  <ul class="hist">${[...t.contributions].reverse().slice(0, 12).map((c) => `<li style="--c:${U(c.by).color}"><span class="dot"></span>${esc(U(c.by).name)} · ${esc(c.note || 'Contribution')}<b>+${money(c.amount)}</b></li>`).join('')}</ul></section>`;
}
function addContribution(amount, note, skip) {
  let hit = null;
  S.update((s) => {
    const t = s.trip; t.contributions.push({ id: S.uid(), by: s.settings.me, amount, note, skip, at: Date.now() });
    const pct = t.contributions.reduce((a, c) => a + c.amount, 0) / t.goal;
    for (const m of MILESTONES) if (pct >= m && !t.milestonesHit.includes(m)) { t.milestonesHit.push(m); hit = m; }
  });
  if (skip) autoPost(`🙅 ${U(me()).name} skipped ${note.replace('Skipped: ', '')} — ${money(amount)} to the ${st().trip.name} Trail Fund!`);
  if (hit) { const t = st().trip; const saved = money(t.contributions.reduce((a, c) => a + c.amount, 0)); autoPost(hit === 1 ? `🎉 ${t.name} is fully funded! Saddle up! 🤠` : hit === 0.5 ? `🐎 Halfway to the trail! ${t.name} fund is at 50%, ${saved} saved.` : `🐎 ${t.name} Trail Fund hit ${hit * 100}%! ${saved} saved.`); confetti(); }
  toast(`${money(amount)} added`);
}
function confetti() { const c = document.createElement('div'); c.className = 'confetti'; c.innerHTML = Array.from({ length: 30 }, (_, i) => `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * 0.4}s;background:${['#a63a2b', '#e9a84c', '#6f8550', '#8b5a2b', '#f3dfb4', '#c9a77a'][i % 6]}"></i>`).join(''); document.body.append(c); setTimeout(() => c.remove(), 2200); }

/* ---------- Lists ---------- */
function lists() {
  const L = st().lists, items = L[listName] || [];
  return `<section class="card"><h2 class="deco">${WHEAT}Chores & Feed Store</h2><div class="seg">${Object.keys(L).map((n) => `<button data-list="${esc(n)}" class="${n === listName ? 'on' : ''}">${esc(n)}</button>`).join('')}<button data-newlist aria-label="New list">＋</button></div>
  <form id="additem" class="row"><input name="t" placeholder="Add to ${esc(listName)}…" required aria-label="New item"><button class="primary">Add</button></form>
  <ul class="items">${items.map((i) => `<li class="${i.done ? 'done' : ''}"><button class="check" data-check="${i.id}" aria-label="${i.done ? 'Uncheck' : 'Check off'} ${esc(i.text)}">${i.done ? '✔' : ''}</button><span>${esc(i.text)}</span>
    <button class="claim" data-claim="${i.id}" style="--c:${i.claimed ? U(i.claimed).color : 'transparent'}">${i.claimed ? esc(U(i.claimed).name) : 'Claim'}</button><button class="del" data-delitem="${i.id}" aria-label="Delete">✕</button></li>`).join('') || '<li class="muted">Empty list</li>'}</ul>
  ${items.some((i) => i.done) ? '<button class="ghost" data-cleardone>Clear checked</button>' : ''}</section>`;
}

/* ---------- Settings ---------- */
function settings() {
  const s = st().settings;
  return `<section class="card"><h2>Settings</h2><form id="setform">
  <label>Ranch name<input name="appName" value="${esc(s.appName)}" placeholder="e.g. Rice Ranch" maxlength="28"></label>
  ${['a', 'b'].map((k) => `<div class="row"><label>Person ${k === 'a' ? 1 : 2}<input name="${k}name" value="${esc(s.users[k].name)}"></label><label class="colorl">Color<input type="color" name="${k}color" value="${s.users[k].color}"></label></div>
  <div class="brandrow" style="--c:${s.users[k].color}"><span class="avatar">${esc(brandOf(k))}</span><label style="flex:1">${esc(s.users[k].name)}'s brand (1–3 letters, shown as avatar)<input name="${k}brand" value="${esc(s.users[k].brand || '')}" maxlength="3" placeholder="${esc((s.users[k].name || '?')[0])}" autocapitalize="characters"></label></div>`).join('<div class="rope"></div>')}
  <button class="primary">Save</button></form></section>
  <section class="card"><h2>🏈 Game days</h2><p class="muted">Football schedules show up on the Round-Up calendar automatically.</p>
  ${Object.entries(G.TEAMS).map(([k, T]) => `<label class="toggle"><input type="checkbox" data-team="${k}" ${hidden()[k] ? '' : 'checked'}> <span class="tdot" style="background:${T.color}"></span>${T.icon} ${esc(T.full)}</label>`).join('')}
  <p class="muted small">${G.lastUpdated() ? 'Updated ' + ago(G.lastUpdated()) + ' ago' : 'Not loaded yet'} <button class="ghost" data-gamesrefresh>Refresh</button></p></section>
  <section class="card"><h2>Backup</h2><div class="row"><button class="ghost" data-export>Export JSON</button><label class="ghost filebtn">Import JSON<input type="file" accept="application/json" data-import hidden></label></div>
  <button class="danger" data-reset>Reset to sample data</button>
  <p class="muted small">Prototype: data lives only on this device (localStorage). Use export/import to move it.</p></section>`;
}

/* ---------- Dialog ---------- */
function openDialog(html, onSubmit) {
  const d = $('#dlg'); d.innerHTML = `<button class="x" aria-label="Close" data-close>✕</button>` + html; d.showModal();
  const f = d.querySelector('form'); if (f) f.onsubmit = (e) => { e.preventDefault(); onSubmit(f); d.close(); };
}

/* ---------- Events ---------- */
document.addEventListener('click', async (e) => {
  const b = e.target.closest('button, [data-day]'); if (!b) return; const d = b.dataset;
  if (d.tab) { tab = d.tab; render(); scrollTo(0, 0); }
  else if (d.who) S.update((s) => (s.settings.me = d.who));
  else if (d.goto) { tab = d.goto; render(); scrollTo(0, 0); }
  else if (d.close !== undefined) $('#dlg').close();
  else if (d.status) { let txt = d.status; if (txt === '__custom') txt = prompt('Your status'); if (!txt) return; S.update((s) => (s.status[s.settings.me] = { text: txt, at: Date.now() })); if (/way|late|headed/i.test(txt)) autoPost(`${U(me()).name}: ${txt}`); toast('Status updated'); }
  else if (d.cmode) { composerMode = d.cmode; pendingImg = memeImg = null; memeSticker = ''; render(); }
  else if (d.sticker) { memeSticker = memeSticker === d.sticker ? '' : d.sticker; drawMeme(); }
  else if (d.react) S.update((s) => { const p = s.posts.find((x) => x.id === d.react); const arr = (p.reactions[d.emoji] ||= []); const i = arr.indexOf(s.settings.me); i < 0 ? arr.push(s.settings.me) : arr.splice(i, 1); });
  else if (d.vote) S.update((s) => (s.posts.find((x) => x.id === d.vote).votes[s.settings.me] = +d.i));
  else if (d.delpost && confirm('Delete this post?')) S.update((s) => (s.posts = s.posts.filter((x) => x.id !== d.delpost)));
  else if (d.cal) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + +d.cal, 1); render(); }
  else if (d.calview) { calView = d.calview; render(); }
  else if (d.day) { calSel = d.day; render(); }
  else if (d.newev !== undefined) eventDialog();
  else if (d.game) gameDialog(G.games().find((x) => x.id === d.game));
  else if (d.gamesrefresh !== undefined) { toast('Checking schedules…'); if (await G.refresh(true)) { render(); toast('Schedules updated'); } else toast("Couldn't reach ESPN"); }
  else if (d.editev) eventDialog(st().events.find((x) => x.id === d.editev));
  else if (d.delev) { S.update((s) => (s.events = s.events.filter((x) => x.id !== d.delev))); $('#dlg').close(); }
  else if (d.filter) { dateFilters[d.filter] = dateFilters[d.filter] === d.val ? null : d.val; render(); }
  else if (d.near) nearMe(d.near);
  else if (d.heart) {
    let matched = false;
    S.update((s) => { const h = (s.hearts[d.heart] ||= []); const i = h.indexOf(s.settings.me); if (i < 0) { h.push(s.settings.me); matched = h.length === 2; } else h.splice(i, 1); });
    const idea = DATE_IDEAS.find((x) => x.id === d.heart);
    if (matched) { autoPost(`💘 It's a match! You both want: ${idea.title}`); confetti(); toast("It's a match! 💘"); }
    else if ((st().hearts[d.heart] || []).includes(me())) autoPost(`❤️ ${U(me()).name} hearted a date idea: ${idea.title}`);
  }
  else if (d.rate) { S.update((s) => (s.ratings[d.rate] = +d.n)); toast('Thanks for rating!'); }
  else if (d.skip) addContribution(+d.skip, 'Skipped: ' + d.label, true);
  else if (d.edittrip !== undefined) { const t = st().trip; openDialog(`<h2>Edit trip</h2><form><label>Destination<input name="name" value="${esc(t.name)}" required></label><label>Trip date<input type="date" name="date" value="${t.date}" required></label><label>Goal ($)<input type="number" name="goal" value="${t.goal}" min="1" required></label><button class="primary">Save</button></form>`, (f) => S.update((s) => { s.trip.name = f.name.value; s.trip.date = f.date.value; s.trip.goal = +f.goal.value; })); }
  else if (d.list) { listName = d.list; render(); }
  else if (d.newlist !== undefined) { const n = prompt('List name (e.g. Errands)'); if (n) { S.update((s) => (s.lists[n] ||= [])); listName = n; render(); } }
  else if (d.check) S.update((s) => { const i = s.lists[listName].find((x) => x.id === d.check); i.done = !i.done; });
  else if (d.claim) S.update((s) => { const i = s.lists[listName].find((x) => x.id === d.claim); i.claimed = i.claimed === s.settings.me ? null : s.settings.me; });
  else if (d.delitem) S.update((s) => (s.lists[listName] = s.lists[listName].filter((x) => x.id !== d.delitem)));
  else if (d.cleardone !== undefined) S.update((s) => (s.lists[listName] = s.lists[listName].filter((x) => !x.done)));
  else if (d.export !== undefined) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([S.exportJSON()], { type: 'application/json' })); a.download = `us-backup-${todayISO()}.json`; a.click(); }
  else if (d.reset !== undefined && confirm('Replace everything with sample data?')) { S.reset(); toast('Reset'); }
});
function nearMe(q) {
  const open = (u) => window.open(u, '_blank', 'noopener');
  if (!navigator.geolocation) return open(`https://www.google.com/maps/search/${encodeURIComponent(q + ' near me')}`);
  toast('Finding you…');
  navigator.geolocation.getCurrentPosition(
    (p) => open(`https://www.google.com/maps/search/${encodeURIComponent(q)}/@${p.coords.latitude},${p.coords.longitude},13z`),
    () => open(`https://www.google.com/maps/search/${encodeURIComponent(q + ' near me')}`), { timeout: 8000 });
}
document.addEventListener('change', async (e) => {
  const t = e.target;
  if (t.name === 'photo' && t.files[0]) {
    const r = await compress(t.files[0]);
    if (composerMode === 'meme') { memeImg = r.img; drawMeme(); } else { pendingImg = r.url; const p = $('#preview'); p.src = r.url; p.hidden = false; }
  } else if (t.dataset.team) { S.update((s) => { s.settings.hideTeams ||= {}; s.settings.hideTeams[t.dataset.team] = !t.checked; }); }
  else if (t.dataset.import !== undefined && t.files[0]) { try { S.importJSON(await t.files[0].text()); toast('Backup restored'); } catch (err) { alert('Import failed: ' + err.message); } }
});
document.addEventListener('input', (e) => { if (composerMode === 'meme' && (e.target.name === 'top' || e.target.name === 'bottom')) drawMeme(); });
document.addEventListener('submit', (e) => {
  const f = e.target; if (f.closest('dialog')) return; e.preventDefault();
  if (f.id === 'compose') {
    const post = { id: S.uid(), by: me(), at: Date.now(), reactions: {}, comments: [] };
    if (composerMode === 'poll') Object.assign(post, { type: 'poll', text: f.text.value, options: [f.o1.value || 'A', f.o2.value || 'B'], votes: {} });
    else if (composerMode === 'meme') { if (!memeImg && !f.top.value && !f.bottom.value) return toast('Add a photo or caption'); Object.assign(post, { type: 'meme', img: drawMeme().toDataURL('image/jpeg', 0.8) }); }
    else { if (!f.text.value.trim() && !pendingImg) return; Object.assign(post, { type: pendingImg ? 'photo' : 'text', text: f.text.value.trim(), img: pendingImg }); }
    pendingImg = memeImg = null; memeSticker = ''; composerMode = 'text';
    S.update((s) => s.posts.unshift(post)); toast('Posted!');
  } else if (f.dataset.comment) { const v = f.c.value.trim(); if (v) S.update((s) => s.posts.find((x) => x.id === f.dataset.comment).comments.push({ by: s.settings.me, text: v, at: Date.now() })); }
  else if (f.id === 'contrib') addContribution(+f.amount.value, f.note.value || 'Contribution', false);
  else if (f.id === 'additem') S.update((s) => s.lists[listName].push({ id: S.uid(), text: f.t.value, claimed: null, done: false }));
  else if (f.id === 'setform') { S.update((s) => { s.settings.appName = f.appName.value || 'Us'; for (const k of ['a', 'b']) { s.settings.users[k].name = f[k + 'name'].value || (k === 'a' ? 'Jon' : 'Kayla'); s.settings.users[k].color = f[k + 'color'].value; s.settings.users[k].brand = f[k + 'brand'].value.trim().toUpperCase() || undefined; } }); toast('Saved'); }
});

S.load(); render();
G.refresh().then((u) => u && render());
document.addEventListener('visibilitychange', () => { if (!document.hidden) G.refresh().then((u) => u && render()); });
$('#dismiss-sample').onclick = () => S.update((s) => (s.sample = false));
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js');
window.__us = { S, G, setTab: (t) => { tab = t; render(); } };
