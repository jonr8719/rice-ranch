#!/usr/bin/env python3
"""Fetch Vols + Cowboys schedules from ESPN into games.json (raw ESPN payloads, parsed client-side)."""
import json, sys, urllib.request, time
URLS = {
  'vols': 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/teams/2633/schedule',
  'cowboys': 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/6/schedule',
}
out = {'fetched': int(time.time() * 1000)}
for k, u in URLS.items():
    d = json.load(urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'rice-ranch'}), timeout=30))
    out[k] = {'events': d.get('events', [])}
    if not out[k]['events']: sys.exit(f'no events for {k}')
for path in sys.argv[1:]:
    json.dump(out, open(path, 'w'), separators=(',', ':'))
