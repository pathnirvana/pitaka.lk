#!/usr/bin/env bash
# Copy the built books and dhammapada sites into the Android app projects (the offline apps) after checking them.
#   dev/sync-apps.sh          dry run: list what would change
#   dev/sync-apps.sh --go     copy
# books: the pages go in the app assets and the jathaka images (webp only, the pages use them) in the install-time
# asset pack. dhammapada: the jpg paintings are left out, the pages show the webp ones (the jpgs are for link previews).
# The iOS apps (iOS 11+) need the same files plus the jpgs: iOS before 14 shows no webp.
set -euo pipefail

ANDROID=${ANDROID_DIR:-/Volumes/2TB/Android}
cd "$(dirname "$0")/.."
node dev/site-lib/check.js books dhammapada

OPTS=(-rlt --checksum --itemize-changes --exclude=.DS_Store --exclude=sitemap.xml --exclude=/pagefind/) # no search in the apps yet: fetch() can not read local files
[[ "${1:-}" == "--go" ]] || OPTS+=(--dry-run)
FONTS=("${OPTS[@]}")
OPTS+=(--delete)

# the pages load the fonts from /tools/unicode/fonts/web on the web; in the apps from common/
rsync "${OPTS[@]}" --exclude=/Android --exclude=/jathaka-images/ --filter='P common/*.woff2' books/ "$ANDROID/Books/app/src/main/assets/"
rsync "${FONTS[@]}" tools/unicode/fonts/web/ "$ANDROID/Books/app/src/main/assets/common/"
rsync "${OPTS[@]}" --include='*.webp' --exclude='*' books/jathaka-images/ "$ANDROID/Books/jathaka_images_asset/src/main/assets/jathaka-images/"
rsync "${OPTS[@]}" --exclude='/paintings/*.jpg' --filter='P common/*.woff2' dhammapada/ "$ANDROID/Dhammapada/app/src/main/assets/"
rsync "${FONTS[@]}" tools/unicode/fonts/web/ "$ANDROID/Dhammapada/app/src/main/assets/common/"
if [[ "${1:-}" != "--go" ]]; then echo "(dry run - rerun with --go to copy, then bump versionCode in each app/build.gradle)"; fi
