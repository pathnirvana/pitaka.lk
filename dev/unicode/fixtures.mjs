// Test documents in legacy fonts, made from the Unicode .docx sources of the pitaka.lk books: the Sinhala text of
// each run is written back in a legacy encoding and its font set to a legacy font. Converting the result must give
// the original text again.
import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { unzipSync, zipSync, strFromU8, strToU8 } from '../../tools/unicode/lib/vendor/fflate.js'
import { fromUnicode } from '../../tools/unicode/lib/convert.js'

export const { DOMParser, XMLSerializer } = new JSDOM('').window
const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
export const BOOKS = path.resolve(import.meta.dirname, '../books/input')

// returns { bytes, expected: Map of w:t index (document order) -> the Unicode text it must convert back to }
export function legacyDocx(file, enc, fontName) {
    const files = unzipSync(fs.readFileSync(path.join(BOOKS, file)))
    const doc = new DOMParser().parseFromString(strFromU8(files['word/document.xml']), 'application/xml')
    const expected = new Map()
    const index = new Map([...doc.getElementsByTagNameNS(W, 't')].map((t, i) => [t, i]))
    for (const run of [...doc.getElementsByTagNameNS(W, 'r')]) {
        // only the run's own text: a run holding a text box contains the text box's runs too
        const ts = [...run.childNodes].filter((n) => n.localName === 't')
        const text = ts.map((t) => t.textContent).join('')
        if (!/[඀-෿]/.test(text)) continue
        const legacy = ts.map((t) => fromUnicode(t.textContent, enc))
        if (legacy.some((l) => l === null)) continue // not writable in this encoding (touching letters, rare conjuncts)
        ts.forEach((t, i) => { expected.set(index.get(t), t.textContent); t.textContent = legacy[i] })
        let rPr = [...run.childNodes].find((n) => n.localName === 'rPr')
        if (!rPr) { rPr = doc.createElementNS(W, 'w:rPr'); run.insertBefore(rPr, run.firstChild) }
        let rf = [...rPr.childNodes].find((n) => n.localName === 'rFonts')
        if (!rf) { rf = doc.createElementNS(W, 'w:rFonts'); rPr.insertBefore(rf, rPr.firstChild) }
        for (const a of [...rf.attributes]) rf.removeAttributeNode(a)
        rf.setAttributeNS(W, 'w:ascii', fontName)
        rf.setAttributeNS(W, 'w:hAnsi', fontName)
    }
    files['word/document.xml'] = strToU8(new XMLSerializer().serializeToString(doc))
    return { bytes: zipSync(files), expected }
}

export function docxTexts(bytes) {
    const files = unzipSync(bytes)
    const doc = new DOMParser().parseFromString(strFromU8(files['word/document.xml']), 'application/xml')
    return { files, doc, texts: [...doc.getElementsByTagNameNS(W, 't')].map((t) => t.textContent) }
}
