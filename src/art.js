// Inline SVG artwork (no image files). Decorative unless labelled.
const horse = (x, y, s = 1, fill = 'currentColor') => `<g transform="translate(${x} ${y}) scale(${s})" fill="${fill}">
  <path d="M8 22c2-7 9-10 19-10h14c3-6 6-11 11-13l2-3 1 4c3 1 5 4 7 8l-2 3-5-2c-2 1-3 4-4 8 0 3 1 6 0 9l-1 12h-3l0-10-4-4c-5 2-11 2-16 1l-3 5 2 8h-3l-3-9-2 1-2 8h-3l1-10c-3-2-5-5-6-8-3 3-5 9-8 13l-1-1c2-5 5-12 9-17z"/></g>`;
export const HERO = `<svg class="hero-art" viewBox="0 0 390 150" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--sky1)"/><stop offset="1" stop-color="var(--sky2)"/></linearGradient></defs>
  <rect width="390" height="150" fill="url(#sky)"/>
  <circle cx="300" cy="88" r="26" fill="var(--sun)"/>
  <path d="M0 96c60-24 120-26 190-8s140 12 200-10v72H0z" fill="var(--hill1)"/>
  <path d="M0 116c80-22 160-10 230 2s110 0 160-14v46H0z" fill="var(--hill2)"/>
  <g transform="translate(18 66) scale(.9)"><path d="M0 40V16L22 2l22 14v24z" fill="var(--barn)"/><path d="M-3 17L22 0l25 17" fill="none" stroke="var(--barnroof)" stroke-width="4"/><path d="M15 40V24h14v16" fill="none" stroke="var(--barntrim)" stroke-width="2"/><path d="M15 24l14 16M29 24L15 40" stroke="var(--barntrim)" stroke-width="1.5"/></g>
  <g stroke="var(--fence)" stroke-width="2.4" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<line x1="${150 + i * 22}" y1="${118 - i * 0.6}" x2="${150 + i * 22}" y2="${140 - i * 0.6}"/>`).join('')}
  <line x1="146" y1="124" x2="396" y2="117"/><line x1="146" y1="132" x2="396" y2="125"/></g>
  ${horse(222, 82, 0.62, 'var(--horse)')}${horse(262, 92, 0.48, 'var(--horse)')}
</svg>`;
export const STAR = `<svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path fill="currentColor" d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.6 5.7 21.5l1.7-7.3L2 9.5l7.1-.6z"/></svg>`;
export const HORSESHOE = `<svg viewBox="0 0 64 64" width="26" height="26" aria-hidden="true"><path d="M14 56V30a18 18 0 0 1 36 0v26" fill="none" stroke="currentColor" stroke-width="9" stroke-linecap="round"/><g fill="var(--card)"><circle cx="14" cy="44" r="1.8"/><circle cx="14" cy="34" r="1.8"/><circle cx="50" cy="44" r="1.8"/><circle cx="50" cy="34" r="1.8"/><circle cx="20" cy="22" r="1.8"/><circle cx="44" cy="22" r="1.8"/></g></svg>`;
export const WHEAT = `<svg viewBox="0 0 24 40" width="16" height="26" aria-hidden="true" fill="currentColor"><path d="M12 40V8" stroke="currentColor" stroke-width="1.6"/>${[10, 17, 24].map((y) => `<ellipse cx="8" cy="${y}" rx="3" ry="5.5" transform="rotate(-30 8 ${y})"/><ellipse cx="16" cy="${y}" rx="3" ry="5.5" transform="rotate(30 16 ${y})"/>`).join('')}<ellipse cx="12" cy="5" rx="2.6" ry="5"/></svg>`;
export const LASSO = `<svg viewBox="0 0 48 32" width="34" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2"><ellipse cx="20" cy="12" rx="16" ry="9"/><path d="M30 19c4 5 10 7 16 9" stroke-linecap="round"/></svg>`;
export const BARN = `<svg viewBox="0 0 48 44" width="30" height="28" aria-hidden="true"><path d="M4 42V18L24 4l20 14v24z" fill="currentColor"/><path d="M17 42V27h14v15M17 27l14 15M31 27L17 42" stroke="var(--card)" stroke-width="2" fill="none"/></svg>`;
export const ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2b35a"/><stop offset=".55" stop-color="#d9773a"/><stop offset="1" stop-color="#8b3a1f"/></linearGradient></defs>
<rect width="512" height="512" fill="url(#g)"/><path d="M0 380c110-50 230-56 340-20 70 22 130 18 172-2v154H0z" fill="#4f3220"/><path d="M0 430c120-30 260-26 512 0v82H0z" fill="#2e1f14"/>
<path d="M150 400V230a106 106 0 0 1 212 0v170" fill="none" stroke="#f6efe2" stroke-width="54" stroke-linecap="round"/>
<g fill="#8b3a1f"><circle cx="150" cy="330" r="9"/><circle cx="150" cy="268" r="9"/><circle cx="362" cy="330" r="9"/><circle cx="362" cy="268" r="9"/><circle cx="190" cy="168" r="9"/><circle cx="322" cy="168" r="9"/></g>
<path d="M256 330c-40-28-66-50-66-78 0-20 15-34 33-34 14 0 26 8 33 20 7-12 19-20 33-20 18 0 33 14 33 34 0 28-26 50-66 78z" fill="#a63a2b" stroke="#f6efe2" stroke-width="8"/></svg>`;
