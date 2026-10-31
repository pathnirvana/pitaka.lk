#!/usr/bin/env bash
# The FM Abhaya and Isi Abhaya fonts as WOFF2, so the converter shows legacy text the way it is typed.
# They are only used by the input box of the converter, not offered for download.
#   dev/unicode/legacy-webfonts.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
SU=../sinhala-unicode
PY=$SU/build-2026/.venv/bin/python
OUT=tools/unicode/lib/legacy
mkdir -p "$OUT"
"$PY" -I -c '
import sys
from fontTools.ttLib import TTFont
for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
    f = TTFont(src)
    f.flavor = "woff2"
    f.save(dst)
    print(dst)
' "$SU/fm fonts 2014/FM Fonts/FM originals/FMABHAYA.TTF" "$OUT/fm-abhaya.woff2" \
  "$SU/isi fonts 2020/isi originals/Isi Abhaya.ttf" "$OUT/isi-abhaya.woff2"
