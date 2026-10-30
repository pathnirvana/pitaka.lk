import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { unzipSync, strFromU8 } from '../../../tools/unicode/lib/vendor/fflate.js'
import { convertDocx, scanDocx, obfuscateFont } from '../../../tools/unicode/lib/docx.js'
import fm from '../../../tools/unicode/lib/encodings/fm.js'
import isi from '../../../tools/unicode/lib/encodings/isi.js'
import { legacyDocx, docxTexts, DOMParser, XMLSerializer } from '../fixtures.mjs'

const FONTS = new URL('../../../tools/unicode/fonts/', import.meta.url)
const BUILD = '/Volumes/2TB/node/sinhala-unicode/build-2026/fonts/'
// the published fonts once dev/unicode/sync-fonts.mjs has run, the build folder before
const fetchFont = async (f) => {
    const p = fs.existsSync(new URL(f + '.ttf', FONTS)) ? new URL(f + '.ttf', FONTS) : BUILD + f + '.ttf'
    return new Uint8Array(fs.readFileSync(p))
}
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'

for (const [file, enc, font] of [['keles-1500.docx', fm, 'FMAbhaya'], ['karma-vipaka.docx', isi, 'IsiMalithi']]) {
    test(`${enc.id} .docx (${file}) converts back to the original text`, async () => {
        const { bytes, expected } = legacyDocx(file, enc, font)
        assert.deepEqual(scanDocx(bytes, { DOMParser }).map((f) => f.name), [font])
        const out = await convertDocx(bytes, { DOMParser, XMLSerializer, fetchFont })
        const { texts, doc, files } = docxTexts(out.bytes)
        // runs may trade a split syllable, so compare the text as a whole
        assert.equal([...expected.keys()].map((i) => texts[i]).join(''), [...expected.values()].join(''))
        // no converted run keeps a legacy font, and Sinhala gets the complex-script slot
        for (const rf of doc.getElementsByTagNameNS(W, 'rFonts')) {
            const ascii = rf.getAttributeNS(W, 'ascii') || ''
            assert.notEqual(ascii, font)
            if (ascii.endsWith(' Uni')) assert.equal(rf.getAttributeNS(W, 'cs'), ascii)
        }
        // every part is still well-formed XML
        for (const [p, data] of Object.entries(files)) {
            if (!/\.(xml|rels)$/.test(p)) continue
            const d = new DOMParser().parseFromString(strFromU8(data), 'application/xml')
            assert.equal(d.getElementsByTagName('parsererror').length, 0, p)
        }
        assert.match(strFromU8(files['word/settings.xml']), /<w:embedTrueTypeFonts\/>/)
        assert.match(strFromU8(files['[Content_Types].xml']), /Extension="odttf"/)
    })
}

test('embedded fonts are the published TTFs behind the Office obfuscation', async () => {
    const { bytes } = legacyDocx('keles-1500.docx', fm, 'FMAbhaya')
    const out = await convertDocx(bytes, { DOMParser, XMLSerializer, fetchFont })
    const files = unzipSync(out.bytes)
    const table = new DOMParser().parseFromString(strFromU8(files['word/fontTable.xml']), 'application/xml')
    const rels = strFromU8(files['word/_rels/fontTable.xml.rels'])
    const font = [...table.getElementsByTagNameNS(W, 'font')].find((f) => f.getAttributeNS(W, 'name') === 'Abhaya Uni')
    const reg = font.getElementsByTagNameNS(W, 'embedRegular')[0]
    const target = rels.match(new RegExp(`Id="${reg.getAttribute('r:id')}"[^>]*Target="([^"]+)"`))[1]
    // XOR is its own inverse
    const ttf = obfuscateFont(files['word/' + target], reg.getAttributeNS(W, 'fontKey'))
    assert.deepEqual(ttf, await fetchFont('AbhayaUni-Regular'))
})

test('Unicode text and other fonts are left alone', async () => {
    const bytes = new Uint8Array(fs.readFileSync(new URL('../../books/input/keles-1500.docx', import.meta.url)))
    assert.deepEqual(scanDocx(bytes, { DOMParser }), [])
    const out = await convertDocx(bytes, { DOMParser, XMLSerializer, fetchFont })
    assert.equal(out.report.runs, 0)
    assert.deepEqual(docxTexts(out.bytes).texts, docxTexts(bytes).texts)
})

test('text from a PDF or OCR becomes a Word file with the Uni font embedded', async () => {
    const { textToDocx } = await import('../../../tools/unicode/lib/textdocx.js')
    const pages = [['පළමු පිටුව', 'A & B < C'], ['දෙවැනි පිටුව']]
    const bytes = await textToDocx(pages, { fontId: 'malithi', DOMParser, XMLSerializer, fetchFont })
    const { texts, files } = docxTexts(bytes)
    assert.deepEqual(texts, ['පළමු පිටුව', 'A & B < C', 'දෙවැනි පිටුව'])
    const doc = strFromU8(files['word/document.xml'])
    assert.equal((doc.match(/w:type="page"/g) || []).length, 1)
    assert.match(strFromU8(files['word/styles.xml']), /w:cs="Malithi Uni"/)
    assert.match(strFromU8(files['word/fontTable.xml']), /Malithi Uni[\s\S]*embedRegular/)
    for (const [p, data] of Object.entries(files)) {
        if (/\.(xml|rels)$/.test(p)) assert.equal(new DOMParser().parseFromString(strFromU8(data), 'application/xml').getElementsByTagName('parsererror').length, 0, p)
    }
})
