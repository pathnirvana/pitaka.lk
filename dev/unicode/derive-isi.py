"""Derive the Isi -> Unicode table from the 2020 Isi-to-Unicode conversion and draw a proof.

    ../sinhala-unicode/build-2026/.venv/bin/python -I dev/unicode/derive-isi.py [proof.png]

The 2020 conversion (sinhala-unicode/isi fonts 2020/scripts/copy-glyphs.py) lists, for every glyph it copied, the
Isi code point and the glyph name in the Unicode font. This script turns those names into Unicode text, writes
tools/unicode/lib/encodings/isi-table.js and, given a path, a proof image: each Isi glyph next to the Unicode it
converts to, set in Abhaya Uni.
"""
import ast
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SU = REPO.parent / 'sinhala-unicode'
SCRIPT = SU / 'isi fonts 2020/scripts/copy-glyphs.py'
ISI_FONT = SU / 'isi fonts 2020/isi originals/Isi Abhaya.ttf'
UNI_FONT = SU / 'build-2026/fonts/AbhayaUni-Regular.ttf'
OUT = REPO / 'tools/unicode/lib/encodings/isi-table.js'

KOMBU, REPAYA = '', ''
HAL, ZWJ = '්', '‍'

CONS = dict(ka='ක', kha='ඛ', ga='ග', gha='ඝ', knaasi='ඞ', nga='ඟ', cha='ච', Ja='ඡ', ja='ජ', kdha='ඣ', kna='ඤ',
            gna='ඥ', nja='ඦ', ta='ට', Ta='ඨ', Da='ඩ', Dha='ඪ', Na='ණ', nDa='ඬ', tha='ත', Tha='ථ', da='ද', dha='ධ',
            na='න', nda='ඳ', pa='ප', pha='ඵ', ba='බ', bha='භ', ma='ම', mba='ඹ', ya='ය', ra='ර', la='ල', va='ව',
            sha='ශ', Sha='ෂ', sa='ස', ha='හ', La='ළ', fa='ෆ')
SIGN = dict(al=HAL, aa='ා', ae='ැ', aee='ෑ', i='ි', ii='ී', u='ු', uu='ූ', rakar=HAL + ZWJ + 'ර',
            oo='ා' + HAL)  # oo: the ා් half of ෝ; the kombuva is typed before the consonant
OTHER = {
    'reph': REPAYA, 'reph_high': REPAYA, 'rakar': HAL + ZWJ + 'ර', 'rakar_long': HAL + ZWJ + 'ර', 'yansa': HAL + ZWJ + 'ය',
    'reph.yansa': REPAYA + HAL + ZWJ + 'ය', 'reph.Na': 'ණ' + REPAYA, 'reph.Tha': 'ථ' + REPAYA, 'sha.rakar.ii': 'ශ්‍රී',
    'ta.rakar.i': 'ට්‍රි', 'ta.rakar.al': 'ට්‍ර්',
    'anusa': 'ං', 'visar': 'ඃ', 'kundaliya': '෴',
    'v_a': 'අ', 'v_i': 'ඉ', 'v_ii': 'ඊ', 'v_u': 'උ', 'v_e': 'එ', 'v_ee': 'ඒ', 'v_o': 'ඔ', 'v_oo': 'ඕ', 'v_iru': 'ඍ',
    'v_ilu': 'ඏ',
    'al_short': HAL, 'al_long': HAL, 'i_long': 'ි', 'i_closed': 'ි', 'ii_long': 'ී', 'ii_closed': 'ී',
    'u_long': 'ු', 'u_long2': 'ු', 'u_misc': 'ු', 'u.kt': 'ු', 'uu_long': 'ූ', 'uu_long2': 'ූ', 'uu_misc': 'ූ',
    'uu.kt': 'ූ', 'e': KOMBU, 'gp': 'ෘ', 'gk': 'ෟ',
    'sakn': '', 'sakn_long': '', 'sakn_2': '',  # sanyaka: only meaningful before a consonant, see SANYAKA
}
SANYAKA_CODES = [0x00bc, 0x00bd, 0x00be]
SANYAKA = {'ජ': 'ඦ', 'ද': 'ඳ', 'ඩ': 'ඬ', 'ග': 'ඟ', 'බ': 'ඹ'}
# names the 2020 conversion builds with OpenType rules, not from one Isi code
SKIP = {'v_aa', 'v_ae', 'v_aee', 'v_uu', 'v_ei', 'v_ou', 'v_iruu', 'v_iluu', 'ei', 'dgp', 'ee', 'o', 'oo', 'ou',
        'dgk', 'zwj', 'dottedcircle', 'nja', 'space'}


def name_to_unicode(name, uni):
    if name in OTHER:
        return OTHER[name]
    if name in SIGN:
        return SIGN[name]
    base = name.replace('_bandi', '')
    if base in CONS:
        return CONS[base]
    if '.' in name:
        parts = name.split('.')
        if parts[0] in CONS and all(p in SIGN for p in parts[1:]):
            return CONS[parts[0]] + ''.join(SIGN[p] for p in parts[1:])
        if parts[0] in CONS and parts[1:] in (['al', 'zwj'], ['al', 'zwj_long']):
            return CONS[parts[0]] + HAL + ZWJ
    if uni and not 0x0D80 <= uni <= 0x0DFF:  # punctuation keeps the code the 2020 font gave it
        return chr(uni)
    raise ValueError(name)


def load_map():
    src = SCRIPT.read_text()
    body = src[src.index('map = [') + 6: src.index('import sys')]
    return ast.literal_eval(re.sub(r'#.*', '', body).strip())


def main():
    table = {}
    for m in load_map():
        code, name = m[0], m[1]
        uni = m[2] if len(m) > 2 else 0
        if name in SKIP or code == 0:
            continue
        key = chr(code)
        if key in table:  # one code reused for several names (a consonant and its bandi form)
            continue
        table[key] = name_to_unicode(name, uni)
    for c in SANYAKA_CODES:
        for cons, nasal in SANYAKA.items():
            key = next(k for k, v in table.items() if v == cons)
            table[chr(c) + key] = nasal
    # doubled gata pilla and gayanukitta
    table[chr(0x00af) * 2] = 'ෲ'
    table[chr(0x00b0) * 2] = 'ෳ'
    # the fonts give some glyphs a second code point (Windows and Mac codes, e.g. µ and μ): same outline, same text
    from fontTools.ttLib import TTFont
    from fontTools.pens.recordingPen import RecordingPen
    font = TTFont(ISI_FONT)
    cmap, glyphs = font.getBestCmap(), font.getGlyphSet()

    def outline(cp):
        pen = RecordingPen()
        glyphs[cmap[cp]].draw(pen)
        return tuple(pen.value), glyphs[cmap[cp]].width

    mapped = {outline(ord(k)): k for k in table if len(k) == 1 and ord(k) in cmap and outline(ord(k))[0]}
    for cp in cmap:
        if chr(cp) not in table and outline(cp) in mapped:
            table[chr(cp)] = table[mapped[outline(cp)]]
    lines = [f'    {js(k)}: {js(v)},' for k, v in table.items()]
    OUT.write_text('// Generated by dev/unicode/derive-isi.py from the 2020 Isi conversion - do not edit.\n'
                   '// \\uE000 is the kombuva marker and \\uE001 the repaya marker of convert.js.\n\nexport default {\n' + '\n'.join(lines) + '\n}\n')
    print(len(table), 'entries ->', OUT)
    if len(sys.argv) > 1:
        proof(table, sys.argv[1])


def js(s):
    """JS string literal; markers, ZWJ and other invisible characters as \\u escapes"""
    return "'" + ''.join({'\\': '\\\\', "'": "\\'"}.get(ch, ch) if ch.isprintable() and ch not in (ZWJ, KOMBU, REPAYA)
                         else f'\\u{ord(ch):04X}' for ch in s) + "'"


def proof(table, path):
    from fontTools.ttLib import TTFont
    from PIL import Image, ImageDraw, ImageFont
    cmap = TTFont(ISI_FONT).getBestCmap()
    codes = sorted(set(cmap) | {ord(k) for k in table if len(k) == 1})
    codes = [c for c in codes if c > 0x20]
    cols, cw, ch = 8, 220, 90
    rows = (len(codes) + cols - 1) // cols
    img = Image.new('RGB', (cols * cw, rows * ch), 'white')
    d = ImageDraw.Draw(img)
    isi = ImageFont.truetype(str(ISI_FONT), 48)
    uni = ImageFont.truetype(str(UNI_FONT), 44, layout_engine=ImageFont.Layout.RAQM)
    lab = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial Unicode.ttf', 13)
    for i, c in enumerate(codes):
        x, y = (i % cols) * cw, (i // cols) * ch
        d.rectangle([x, y, x + cw - 1, y + ch - 1], outline='#ccc')
        d.text((x + 3, y + 2), f'{c:04X}', font=lab, fill='#c00')
        d.text((x + 10, y + 18), chr(c), font=isi, fill='black')
        u = table.get(chr(c))
        if u is None:
            d.text((x + 120, y + 30), 'unmapped' if c in cmap else 'no glyph', font=lab, fill='#c00')
            continue
        show = u.replace(KOMBU, 'ෙ').replace(REPAYA, '(රේ)')
        d.text((x + 115, y + 18), show, font=uni, fill='#06c')
    img.save(path)
    print('proof', path, img.size)


if __name__ == '__main__':
    main()
