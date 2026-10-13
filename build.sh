#!/bin/sh
# Static build: copies src to dist and zips it for Netlify drag-and-drop.
set -e; cd "$(dirname "$0")"
python3 scripts/fetch_games.py src/games.json || echo "games fetch failed, keeping old games.json"
rm -rf dist couple-app.zip && cp -r src dist
printf '/*\n  Cache-Control: no-cache\n' > dist/_headers
python3 -c "import shutil; shutil.make_archive('couple-app', 'zip', 'dist')"
echo built
