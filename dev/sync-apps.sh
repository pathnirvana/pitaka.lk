#!/usr/bin/env bash
# Copy the built books and dhammapada sites into the Android app projects (the offline apps) after checking them.
#   dev/sync-apps.sh          dry run: list what would change
#   dev/sync-apps.sh --go     copy
# Books app (3.0+, carries the dhammapada too): the pages at the same paths as on the web (assets/books/, assets/dhammapada/,
# assets/tools/unicode/fonts/web/, assets/static/singlish-search/), served by the app at https://appassets.androidplatform.net/,
# so search works; the pictures and recordings in two install-time asset packs. Link preview cards and the jpgs (webp shown)
# are left out. The iOS app (dev/apple) copies the same files into its bundle.
# Dhammapada app (old, until its farewell update): the pages from file:///android_asset/ as before, without search.
set -euo pipefail

ANDROID=${ANDROID_DIR:-/Volumes/2TB/Android}
cd "$(dirname "$0")/.."
node dev/site-lib/check.js books dhammapada

OPTS=(-rlt --checksum --itemize-changes --exclude=.DS_Store --exclude=sitemap.xml)
[[ "${1:-}" == "--go" ]] || OPTS+=(--dry-run)
FONTS=("${OPTS[@]}")
OPTS+=(--delete)

B=$ANDROID/Books/app/src/main/assets
mkdir -p "$B/tools/unicode/fonts/web" "$B/static/singlish-search" "$ANDROID/Books/dhammapada_media_asset/src/main/assets/dhammapada" "$ANDROID/Books/jathaka_images_asset/src/main/assets/books/jathaka-images"
# the books app before 3.0 had the books pages at the top of its assets: only the four site folders stay
for f in "$B"/* "$B"/.[!.]*; do case "${f##*/}" in books|dhammapada|tools|static|\*|'.[!.]*') ;; *) [[ "${1:-}" == "--go" ]] && rm -rf "$f" || echo "remove $f";; esac; done
rsync "${OPTS[@]}" --exclude=/Android --exclude=/jathaka-images/ --exclude=/common/og/ --exclude='/common/*.ttf' --exclude=/common/og-books-500x300.png --exclude=/common/logo-512.png \
  books/ "$B/books/"
rsync "${OPTS[@]}" --exclude=/paintings/ --exclude=/thumbs/ --exclude=/recordings/ --exclude=/common/og/ --exclude=/common/logo.png dhammapada/ "$B/dhammapada/"
rsync "${OPTS[@]}" --include='*.woff2' --exclude='*' tools/unicode/fonts/web/ "$B/tools/unicode/fonts/web/"
rsync "${OPTS[@]}" static/singlish-search/ "$B/static/singlish-search/"
rsync "${OPTS[@]}" --include='*.webp' --exclude='*' books/jathaka-images/ "$ANDROID/Books/jathaka_images_asset/src/main/assets/books/jathaka-images/"
rm -rf "$ANDROID/Books/jathaka_images_asset/src/main/assets/jathaka-images" # before 3.0
rsync "${OPTS[@]}" --include='/paintings/' --include='/paintings/*.webp' --include='/thumbs/' --include='/thumbs/*.jpg' --include='/recordings/' --include='/recordings/*.mp3' --exclude='*' \
  dhammapada/ "$ANDROID/Books/dhammapada_media_asset/src/main/assets/dhammapada/"

# the old dhammapada app: the fonts from common/ (its pages can not reach /tools)
rsync "${OPTS[@]}" --exclude='/paintings/*.jpg' --exclude=/pagefind/ --exclude=/search-words/ --exclude=/common/og/ --filter='P common/*.woff2' dhammapada/ "$ANDROID/Dhammapada/app/src/main/assets/"
rsync "${FONTS[@]}" tools/unicode/fonts/web/ "$ANDROID/Dhammapada/app/src/main/assets/common/"
if [[ "${1:-}" != "--go" ]]; then echo "(dry run - rerun with --go to copy, then bump versionCode in the app/build.gradle)"; fi
