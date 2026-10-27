#!/usr/bin/env bash
# Deploy the pitaka.lk static sites to the server with rsync (only changed files are sent).
#   dev/deploy.sh          dry run: list what would change
#   dev/deploy.sh --go     deploy
# Each site folder is synced with --delete inside that folder only. The server's main/, pirith/
# and bjt/newbooks (page scans, server only) are never touched.
set -euo pipefail

HOST=${DEPLOY_HOST:-tipitaka.lk}                     # the droplet of tipitaka.lk and the pitaka.lk reader (dev/migrate.sh)
ROOT=${DEPLOY_ROOT:-/home/janaka/www/pitaka.lk}
SITES=(books dhammapada dict tools static bjt .well-known)
FILES=(index.html robots.txt "Buddha Jayanthi Tipitaka.html")

cd "$(dirname "$0")/.."
OPTS=(-rltz --checksum --itemize-changes --omit-dir-times --chmod=D755,F644
  --exclude=.DS_Store --exclude='._*' --exclude=.git --exclude=node_modules)
[[ "${1:-}" == "--go" ]] || OPTS+=(--dry-run)

for s in "${SITES[@]}"; do
  EXTRA=(--delete)  # excluded paths are also left alone on the server by --delete
  [[ $s == bjt ]] && EXTRA+=(--exclude=/newbooks/ --exclude=/books/)
  [[ $s == books ]] && EXTRA+=(--exclude=/Android)
  rsync "${OPTS[@]}" "${EXTRA[@]}" "$s/" "$HOST:$ROOT/$s/"
done
rsync "${OPTS[@]}" "${FILES[@]}" "$HOST:$ROOT/"
if [[ "${1:-}" != "--go" ]]; then echo "(dry run - rerun with --go to deploy)"; fi
