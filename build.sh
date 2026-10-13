#!/bin/sh
# Static build: copies src to dist and zips it for Netlify drag-and-drop.
set -e; cd "$(dirname "$0")"
rm -rf dist couple-app.zip && cp -r src dist
printf '/*\n  Cache-Control: no-cache\n' > dist/_headers
python3 -c "import shutil; shutil.make_archive('couple-app', 'zip', 'dist')"
echo built
