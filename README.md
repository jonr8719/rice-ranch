# Us: couple's home base (prototype), ranch edition

**v2 theme (Oct 13, 2026):** Southeastern ranch look. Saddle-leather browns, parchment, pasture green, barn red, and golden-hour amber, with a "night on the ranch" dark mode. Inline SVG art (sunset hills, barn, fence, horses, horseshoe, wheat, lasso), stitched-leather cards, rope dividers, and a horseshoe-and-heart app icon. Fonts are bundled in `src/fonts/` (Rye for the logo, Bitter for headings, about 75 KB), so it works offline. Tabs: **Porch** (feed), **Round-Up** (calendar), **Date Night**, **Trail Fund**, **Chores** (Chores & Feed Store). Settings adds a **Ranch name** (header and hero) and a **brand** of 1–3 letters per person, used as their avatar. The data format is unchanged; v1 data loads as is. The v1 build is saved in `backup-v1/`.

A private, two-person social app: feed, shared calendar, date finder, trip fund, and shared lists. It's a mobile-first PWA you can install to your home screen. Rename it in `src/config.js` (`APP_NAME`) or in ⚙️ Settings.

## Features (v1)
- **Feed:** text, photo (compressed on device), meme (top/bottom caption + sticker drawn on a canvas), and two-option polls. Emoji reactions and comments. Auto-posts for trip fund milestones, Skip-it saves, date hearts and matches, and On my way / Running late statuses.
- **Today card:** each person's events today, plus status bubbles (presets or custom).
- **Calendar:** month and agenda views, color-coded per person (or Both). Add, edit, and delete events. Days where you're both free in the evening are shaded green, and a "You're both free tonight" card links to Dates.
- **Dates:** 34 curated ideas (Murfreesboro, Nashville, ranch and country ideas like trail rides, rodeos, orchards, two-step lessons, bonfires, and stargazing, plus KY, GA, Carolinas, and AL spots) with cost, indoor/outdoor, energy, and time filters. Heart an idea to save it. When you both heart one, it's a 💘 match post, and then you can give it 1–5 stars. "Near me" uses geolocation to open Google Maps searches (no API key needed).
- **Trips:** countdown, goal, progress bar, per-person totals, weekly amount needed, Skip-it buttons, and celebration posts at 25/50/75/100%.
- **Lists:** groceries and chores (plus custom lists), with claim, check off, and clear checked.
- **Settings:** app name, names, colors, JSON export/import, reset to sample data. Use the Jon/Partner switcher at the top to act as either person.
- Works offline (service worker), follows dark mode, and respects reduced motion.

## Deploy (Netlify drop)
1. Go to https://app.netlify.com/drop (or your site's **Deploys** page).
2. Drag `couple-app.zip` (or the `dist/` folder) onto it.
3. Open the URL on each phone. On iPhone, tap Safari's Share button, then **Add to Home Screen**.

To rebuild after edits: `./build.sh` (copies `src/` to `dist/` and makes the zip).

## Important limitation
**In this prototype, data stays on each phone** (browser localStorage). Two phones will NOT see each other's posts, events, or lists. For now, test it on one phone and switch users, or move data with Export/Import. Photos are stored inside that storage, so after a few dozen photos the browser's ~5 MB limit can fill up.

## What real syncing needs
- A shared backend, such as **Firebase** (free Spark tier: Auth + Firestore + Storage) or Supabase's free tier.
- Sign-in for exactly two people, plus a "couple" record that links them. Security rules let only those two read and write.
- `src/store.js` is the only file that touches storage. You'd replace load/update with Firestore reads and real-time listeners, and move photos to Storage.
- Optional: push notifications for posts and "On my way," and syncing from Google or Apple Calendar.
- **Estimated effort:** about 2–4 days for basic sync with login, plus 2–3 days for notifications and calendar import. Free-tier costs for two people should be $0.

## Files
`src/` source · `dist/` static build · `couple-app.zip` Netlify upload · `shots-ranch/` v2 390×844 screenshots (`shots/` = v1) · `tests/e2e.js` headless Chrome click-through + WCAG AA contrast (serve `dist/` on :8765, then `node tests/e2e.js`) · `tests/icons.js` renders PNG icons from `src/icons/icon.svg` · `backup-v1/` · `build.sh`
