#!/usr/bin/env bash
# Web fonts for the books and dhammapada sites, made from the published Uni fonts in tools/unicode/fonts into tools/unicode/fonts/web:
# Sinhala, Latin-1 and punctuation only, and no hinting (phones ignore it; it is 60% of the file).
# Needs fonttools: python3 -m venv /tmp/ft && /tmp/ft/bin/pip install fonttools brotli && PYFTSUBSET=/tmp/ft/bin/pyftsubset dev/site-lib/make-fonts.sh
# dev/unicode/sync-fonts.mjs runs this after updating the fonts. The sites load them from /tools/unicode/fonts/web/ and
# sync-apps.sh copies them into the apps (whose pages can not reach /tools).
set -euo pipefail
cd "$(dirname "$0")/../.."
SRC=tools/unicode/fonts OUT=tools/unicode/fonts/web
PYFTSUBSET=${PYFTSUBSET:-pyftsubset}
UNICODES="U+0000-00FF,U+0131,U+0152-0153,U+02BC,U+02C6,U+02DA,U+02DC,U+0D80-0DFF,U+111E1-111F4,U+200B-200D,U+2013-2014,U+2018-201E,U+2022,U+2026,U+2032-2033,U+20AC,U+2122,U+25CC,U+FEFF,U+FFFD"
mkdir -p "$OUT"
for f in AbhayaUni-Regular AbhayaUni-Bold; do
  "$PYFTSUBSET" "$SRC/$f.ttf" --unicodes="$UNICODES" --layout-features='*' --no-hinting --flavor=woff2 --output-file="$OUT/$f.woff2"
  echo "$OUT/$f.woff2 $(( $(wc -c < "$OUT/$f.woff2") / 1024 )) KB"
done
# Alakamanda is only for the site titles in the top bar (appbar brand): just their letters, a few KB
# add the letters of any new title here; the parts of the split vowel signs (ෙ ා ෟ for ො ෞ) and ZWJ are needed too,
# since the shaper draws ො and ෞ as two glyphs
TITLES="බෞද්ධ පොත් ධම්මපද කතා අටුවා ෙ ා ෟ ් ‍"
"$PYFTSUBSET" "$SRC/AlakamandaUni-Regular.ttf" --text="$TITLES" --layout-features='*' --no-hinting --flavor=woff2 --output-file="$OUT/AlakamandaUni-Title.woff2"
echo "$OUT/AlakamandaUni-Title.woff2 $(( $(wc -c < "$OUT/AlakamandaUni-Title.woff2") / 1024 )) KB"
rm -f "$OUT/AlakamandaUni-Regular.woff2"
