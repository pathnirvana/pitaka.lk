#!/usr/bin/env bash
# The iOS app "Sinhala Buddhist Books" (App Store id 1516496078, dev/apple/project.yml), with Xcode on this Mac:
#   dev/apple/build-ios.sh sim                 debug build for the simulator -> build/sim/Build/Products/Debug-iphonesimulator/Books.app
#   dev/apple/build-ios.sh archive [--upload]  archive + export -> build/export/Books.ipa, and upload it to App Store Connect (TestFlight)
# The sites are copied into build/site at the same paths as on the web (books/, dhammapada/, tools/unicode/fonts/web/,
# static/singlish-search/), like dev/sync-apps.sh does for Android: build both sites first (npm run build in dev/).
# Signing is automatic with the account signed in to Xcode (-allowProvisioningUpdates); the App Store Connect API key
# (the one of tipitaka.lk's scripts/build-apple.sh) only uploads. VERSION is the app version; BUILD (default yymmddHHMM)
# must be new for every upload.
set -euo pipefail
cd "$(dirname "$0")"
REPO=$(cd ../.. && pwd)
TEAM_ID=${TEAM_ID:-4456F3J27A}
VERSION=${VERSION:-3.0}
BUILD=${BUILD:-$(date +%y%m%d%H%M)}
export TEAM_ID VERSION BUILD
WHAT=${1:-sim} UPLOAD=${2:-}
B=build

node "$REPO/dev/site-lib/check.js" books dhammapada
OPTS=(-rlt --checksum --delete --exclude=.DS_Store --exclude=sitemap.xml)
mkdir -p "$B/site/tools/unicode/fonts/web" "$B/site/static/singlish-search"
# the jpgs are left out: the pages show the webp versions (iOS 14+); the link preview cards are for the web only
rsync "${OPTS[@]}" --exclude=/Android --exclude='/jathaka-images/*.jp*g' --exclude=/common/og/ --exclude='/common/*.ttf' \
  --exclude=/common/og-books-500x300.png --exclude=/common/logo-512.png "$REPO/books/" "$B/site/books/"
rsync "${OPTS[@]}" --exclude='/paintings/*.jpg' --exclude=/common/og/ --exclude=/common/logo.png "$REPO/dhammapada/" "$B/site/dhammapada/"
rsync "${OPTS[@]}" --include='*.woff2' --exclude='*' "$REPO/tools/unicode/fonts/web/" "$B/site/tools/unicode/fonts/web/"
rsync "${OPTS[@]}" "$REPO/static/singlish-search/" "$B/site/static/singlish-search/"
echo "site: $(du -sh "$B/site" | cut -f1)"

xcodegen generate --quiet

if [ "$WHAT" = sim ]; then
  xcodebuild -project Books.xcodeproj -scheme Books-iOS -configuration Debug -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$B/sim" build -quiet
  echo "$B/sim/Build/Products/Debug-iphonesimulator/Books.app"
  exit 0
fi

ASC_KEY_ID=${ASC_KEY_ID:-CNJQZ82QCH} ASC_ISSUER_ID=${ASC_ISSUER_ID:-177929b9-56d5-4755-88a7-b8a4a017d089}
ASC_KEY_PATH=${ASC_KEY_PATH:-/Volumes/2TB/Android/AuthKey_CNJQZ82QCH.p8}
xcodebuild -project Books.xcodeproj -scheme Books-iOS -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$B/Books.xcarchive" -allowProvisioningUpdates archive -quiet
cat > "$B/ExportOptions.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>method</key><string>app-store-connect</string>
  <key>destination</key><string>export</string>
  <key>teamID</key><string>$TEAM_ID</string>
  <key>signingStyle</key><string>automatic</string>
  <key>manageAppVersionAndBuildNumber</key><false/>
  <key>uploadSymbols</key><true/>
</dict></plist>
EOF
rm -rf "$B/export"
# the export copies with /usr/bin/rsync, which runs "rsync" from PATH: Homebrew's rejects Apple's options
PATH="/usr/bin:/bin:/usr/sbin:/sbin:$PATH" xcodebuild -exportArchive -archivePath "$B/Books.xcarchive" -exportOptionsPlist "$B/ExportOptions.plist" \
  -exportPath "$B/export" -allowProvisioningUpdates -quiet
IPA=$(find "$B/export" -maxdepth 1 -name '*.ipa' | head -1)
echo "Books $VERSION ($BUILD): $IPA $(du -h "$IPA" | cut -f1)"
[ "$UPLOAD" = --upload ] || exit 0
xcrun altool --upload-app -f "$IPA" -t ios --api-key "$ASC_KEY_ID" --api-issuer "$ASC_ISSUER_ID" --p8-file-path "$ASC_KEY_PATH" 2>&1 | grep -v -e Progress -e '^$'
