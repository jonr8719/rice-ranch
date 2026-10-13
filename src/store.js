// Data layer: the ONLY module that touches storage.
// Swap load/save for Firebase/Supabase later; keep the same API.
import { STORAGE_KEY, APP_NAME } from './config.js';

const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function sampleData() {
  const now = Date.now(), h = 3600e3;
  return {
    sample: true,
    settings: { appName: APP_NAME, users: { a: { name: 'Jon', color: '#a63a2b' }, b: { name: 'Kayla', color: '#4f6b3a' } }, me: 'a' },
    status: { a: { text: 'At the office 💼', at: now - 2 * h }, b: { text: 'Headed home 🐎', at: now - 20 * 60e3 } },
    posts: [
      { id: uid(), by: 'b', at: now - 1 * h, type: 'text', text: '[Sample] Caught him singing George Strait to the horses again 🎤🐎 Encore tonight?', reactions: { '😂': ['a', 'b'], '❤️': ['a'] }, comments: [{ by: 'a', text: 'It was a private concert 😤', at: now - 50 * 60e3 }] },
      { id: uid(), by: 'a', at: now - 5 * h, type: 'poll', text: '[Sample] Who left the milk out?', options: ['Jon', 'Kayla'], votes: { a: 1, b: 0 }, reactions: {}, comments: [] },
      { id: uid(), by: 'auto', at: now - 26 * h, type: 'auto', text: '🐎 Gatlinburg Trail Fund hit 25%! $750 saved.', reactions: { '🎉': ['b'] }, comments: [] },
    ],
    events: [
      { id: uid(), by: 'a', date: addDays(0), start: '09:00', end: '17:00', title: 'Work' },
      { id: uid(), by: 'b', date: addDays(0), start: '18:00', end: '19:00', title: 'Gym' },
      { id: uid(), by: 'a', date: addDays(1), start: '19:00', end: '20:30', title: 'Late meeting' },
      { id: uid(), by: 'b', date: addDays(2), start: '12:00', end: '13:00', title: 'Dentist' },
      { id: uid(), by: 'both', date: addDays(4), start: '18:30', end: '21:00', title: 'Dinner w/ friends' },
    ],
    hearts: {}, ratings: {},
    trip: { name: 'Gatlinburg', date: addDays(200), goal: 3000, contributions: [
      { id: uid(), by: 'a', amount: 450, note: 'Paycheck', at: now - 20 * 24 * h },
      { id: uid(), by: 'b', amount: 300, note: 'Side gig', at: now - 10 * 24 * h },
      { id: uid(), by: 'b', amount: 6, note: 'Skipped: latte', skip: true, at: now - 2 * 24 * h },
    ], milestonesHit: [0.25] },
    lists: { Groceries: [
      { id: uid(), text: 'Eggs', claimed: null, done: false },
      { id: uid(), text: 'Coffee beans', claimed: 'b', done: false },
      { id: uid(), text: 'Horse feed + salt lick', claimed: null, done: false },
      { id: uid(), text: 'Taco night stuff', claimed: 'a', done: true },
    ], Chores: [
      { id: uid(), text: 'Take out trash', claimed: 'a', done: false },
      { id: uid(), text: 'Fix the gate latch', claimed: null, done: false },
    ] },
  };
}

let state = null;
const subs = new Set();
export function load() {
  try { state = JSON.parse(localStorage.getItem(STORAGE_KEY)); } catch { state = null; }
  if (!state) { state = sampleData(); persist(); }
  return state;
}
function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (e) { alert('Storage is full — try removing some photo posts.'); }
}
export const get = () => state;
export function update(fn) { fn(state); persist(); subs.forEach((s) => s(state)); }
export const subscribe = (fn) => (subs.add(fn), () => subs.delete(fn));
export const exportJSON = () => JSON.stringify(state, null, 2);
export function importJSON(text) { const d = JSON.parse(text); if (!d.settings || !d.posts) throw new Error('Not a backup file'); state = d; persist(); subs.forEach((s) => s(state)); }
export function reset() { state = sampleData(); persist(); subs.forEach((s) => s(state)); }
