// Converts pasted text word by word, so that web addresses, emails and words the user marks stay as typed.
import { toUnicode } from './convert.js'

const KEEP = /^\s*(?:(?:https?:\/\/|www\.)\S+|[\w.+-]+@[\w-]+\.[\w.-]+)$/i

// keep: indexes of words to leave as typed. Returns { text, words: [{ from, to, outFrom, outTo, kept }] }
export function convertText(text, enc, { fontName, keep = new Set() } = {}) {
    let out = ''
    const words = []
    // a word carries the spaces before it: some FM keys start with a space
    for (const m of text.matchAll(/\s*\S+|\s+$/g)) {
        const w = m[0], i = words.length
        const kept = !enc || keep.has(i) || KEEP.test(w)
        const u = kept ? w : toUnicode(w, enc, { fontName })
        words.push({ from: m.index, to: m.index + w.length, outFrom: out.length, outTo: out.length + u.length, kept })
        out += u
    }
    return { text: out, words }
}
