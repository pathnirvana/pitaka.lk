// Which legacy encoding a text or a font uses.
import { toUnicode } from './convert.js'
import { quality } from './validate.js'
import { N, table } from './sinhala-model.js'
import fm from './encodings/fm.js'
import isi from './encodings/isi.js'

export const encodings = [fm, isi]

// the legacy encoding of a font by its name, or null for Unicode and other fonts
export function encodingOfFont(fontName) {
    if (!fontName || / Uni$|^UN-/i.test(fontName)) return null
    return encodings.find((e) => e.fontNames.some((re) => re.test(fontName))) || null
}

// average cost, in half bits per character, of the text under the Sinhala character model: low for real Sinhala
const sym = (c) => /\s/.test(c) ? 1 : c === '\u200D' ? 2 : c >= '\u0D80' && c <= '\u0DFF' ? 3 + c.charCodeAt(0) - 0x0D80 : 0
export function sinhalaCost(text) {
    let prev = 1, cost = 0, n = 0
    for (const c of text + ' ') {
        const s = sym(c)
        if (s === 1 && prev === 1) continue
        cost += parseInt(table[prev * N + s], 36)
        prev = s
        n++
    }
    return n ? cost / n : 99
}

// every encoding with how well its conversion reads as Sinhala, best first: [{ enc, score }]
// score is the share of the output with no broken sequences (1 for clean text). FM comes first unless another
// encoding reads clearly better: for years the converter was FM only, so that is what most people bring.
export function detect(text) {
    const sample = text.length > 4000 ? text.slice(0, 4000) : text
    // text that is mostly Sinhala Unicode already needs no conversion
    const sinhala = (sample.match(/[\u0D80-\u0DFF]/g) || []).length
    const letters = (sample.match(/[A-Za-z -ɏ -⃿]/g) || []).length
    if (sinhala > letters) return [{ enc: null, score: 1 }]
    const ranked = encodings
        .map((enc) => {
            const u = toUnicode(sample, enc)
            const score = quality(u)
            return { enc, score, rank: sinhalaCost(u) * (2 - score) }
        })
        .sort((a, b) => a.rank - b.rank)
    // a few keys say little: the box shouldn't jump to another font after the first keystroke
    const keys = sample.replace(/\s/g, '').length
    const fmAt = ranked.findIndex((r) => r.enc === fm)
    if (fmAt > 0 && (keys < 5 || ranked[0].rank > ranked[fmAt].rank * 0.8)) ranked.unshift(...ranked.splice(fmAt, 1))
    return ranked
}
