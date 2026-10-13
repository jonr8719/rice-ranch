// Football schedules (Vols + Cowboys) from ESPN's public API. Read-only, cached separately
// from user data so it can never overwrite user-created events.
const KEY = 'us-games-v1', MAX_AGE = 6 * 3600e3;
export const TEAMS = {
  vols: { name: 'Vols', full: 'Tennessee Volunteers', icon: '🍊', color: '#ff8200', url: 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/2633/schedule', id: '2633' },
  cowboys: { name: 'Cowboys', full: 'Dallas Cowboys', icon: '⭐', color: '#041e42', url: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/6/schedule', id: '6' },
};
const pad = (n) => String(n).padStart(2, '0');
function parse(team, data) {
  return (data.events || []).map((e) => {
    const c = e.competitions?.[0] || {}; const cs = c.competitors || [];
    const us = cs.find((x) => x.team?.id === TEAMS[team].id) || cs[0] || {}; const them = cs.find((x) => x !== us) || {};
    const d = new Date(e.date), tv = [...new Set((c.broadcasts || []).map((b) => b.media?.shortName).filter(Boolean))].join(', ');
    const done = !!c.status?.type?.completed, sc = (x) => x.score?.displayValue ?? (typeof x.score === 'string' ? x.score : null);
    return { id: 'espn-' + e.id, team, at: e.date, timeValid: e.timeValid !== false && c.timeValid !== false,
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`, start: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
      opp: them.team?.shortDisplayName || them.team?.displayName || 'TBD', home: us.homeAway === 'home', neutral: !!c.neutralSite,
      tv, done, us: done ? sc(us) : null, them: done ? sc(them) : null, venue: c.venue?.fullName || '' };
  });
}
let cache = null;
export function games() {
  if (!cache) { try { cache = JSON.parse(localStorage.getItem(KEY)); } catch {} cache ||= { at: 0, list: [] }; }
  return cache.list;
}
export async function refresh(force = false) {
  games(); if (!force && Date.now() - cache.at < MAX_AGE && cache.list.length) return false;
  const byId = new Map(cache.list.map((g) => [g.id, g])); let ok = false, stale = true;
  try { // same-origin copy refreshed by a GitHub Action every 6h (ESPN's CORS is unreliable in browsers)
    const r = await fetch('games.json?t=' + Date.now(), { cache: 'no-store' });
    if (r.ok) { const j = await r.json(); stale = Date.now() - (j.fetched || 0) > 2 * MAX_AGE; for (const t of Object.keys(TEAMS)) if (j[t]) { for (const g of parse(t, j[t])) byId.set(g.id, g); ok = true; } }
  } catch {}
  if (!ok || stale) await Promise.all(Object.keys(TEAMS).map(async (t) => {
    try { const r = await fetch(TEAMS[t].url); if (!r.ok) return; for (const g of parse(t, await r.json())) byId.set(g.id, g); ok = true; } catch {}
  }));
  if (!ok) return false;
  cache = { at: Date.now(), list: [...byId.values()].sort((a, b) => a.at.localeCompare(b.at)) };
  try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch {}
  return true;
}
export const lastUpdated = () => (games(), cache.at);
export const title = (g) => `${TEAMS[g.team].icon} ${TEAMS[g.team].name} ${g.home || g.neutral ? 'vs' : 'at'} ${g.opp}`;
export function detail(g) {
  const time = g.timeValid ? new Date(g.at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }) : 'Time TBD';
  if (g.done && g.us != null) { const w = +g.us > +g.them ? 'W' : +g.us < +g.them ? 'L' : 'T'; return `Final: ${w} ${g.us}–${g.them}`; }
  return time + (g.tv ? ' · 📺 ' + g.tv : '');
}
