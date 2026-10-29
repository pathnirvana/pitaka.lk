// Finds what a conversion got wrong: Unicode Sinhala sequences that no font can show properly, and keyboard
// characters left inside Sinhala words. Each issue is { start, end, kind } over the converted text.
import { HAL, ZWJ } from './convert.js'

const isCons = (c) => c >= 'ක' && c <= 'ෆ'
const isIndep = (c) => c >= 'අ' && c <= 'ඖ'
const isSign = (c) => (c >= 'ා' && c <= 'ෟ') || c === 'ෲ' || c === 'ෳ'
const isTail = (c) => c === 'ං' || c === 'ඃ'
const isSinhala = (c) => c >= '\u0D80' && c <= '\u0DFF'

export const KINDS = {
    'no-letter': 'a vowel sign with no letter before it',
    'two-signs': 'two vowel signs on one letter',
    'stray-zwj': 'a joiner that joins nothing',
    'leftover': 'a keyboard character left inside a Sinhala word',
}

export function findIssues(text) {
    const issues = []
    const add = (start, end, kind) => {
        const last = issues[issues.length - 1]
        if (last && last.kind === kind && last.end === start) last.end = end
        else issues.push({ start, end, kind })
    }
    // state: what the last character allows next
    // 'none' nothing to attach to, 'cons' a consonant, 'signed' a consonant with its sign, 'hal' a hal, 'join' a joiner
    let state = 'none'
    for (let i = 0; i < text.length; i++) {
        const c = text[i]
        if (isCons(c)) state = 'cons'
        else if (isIndep(c)) state = 'indep'
        else if (c === HAL) {
            if (state === 'cons' || state === 'join') state = 'hal'
            else { add(i, i + 1, state === 'none' || state === 'indep' ? 'no-letter' : 'two-signs'); state = 'signed' }
        } else if (isSign(c)) {
            if (state === 'cons') state = 'signed'
            else add(i, i + 1, state === 'none' || state === 'indep' ? 'no-letter' : 'two-signs')
        } else if (isTail(c)) {
            if (state === 'none') add(i, i + 1, 'no-letter')
            state = 'tail'
        } else if (c === ZWJ) {
            // C ZWJ ් (touching) or ් ZWJ C (conjunct, yansaya, rakaransaya, repaya)
            const ok = (state === 'cons' && text[i + 1] === HAL) || (state === 'hal' && isCons(text[i + 1]))
            if (!ok) add(i, i + 1, 'stray-zwj')
            state = ok ? 'join' : state
        } else if (c === '\u200C') {
            // ZWNJ: harmless
        } else {
            state = 'none'
        }
    }
    // keyboard letters and private-use markers touching Sinhala letters
    for (const m of text.matchAll(/[\u0D80-\u0DFF\u200D]*[A-Za-zÀ-ɏ\uE000-\uF8FF`~|\\^_{}[\]][\u0D80-\u0DFF\u200D]*/g)) {
        const w = m[0]
        if (![...w].some(isSinhala) && !/[\uE000-\uF8FF]/.test(w)) continue
        for (let k = 0; k < w.length; k++) if (!isSinhala(w[k]) && w[k] !== ZWJ) add(m.index + k, m.index + k + 1, 'leftover')
    }
    return issues.sort((a, b) => a.start - b.start)
}

// share of Sinhala characters that are not part of an issue: 1 for clean text
export function quality(text) {
    let sinhala = 0
    for (const c of text) if (isSinhala(c)) sinhala++
    if (!sinhala) return 0
    const bad = findIssues(text).reduce((n, x) => n + (x.end - x.start), 0)
    return Math.max(0, 1 - bad / sinhala)
}
