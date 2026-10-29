// Legacy Sinhala font text (FM, DL, Isi) to Unicode and back.
// Legacy fonts store text in visual order: the kombuva (ෙ) is typed before its consonant, repaya after it,
// and ො ෝ ෞ are built from pieces. An encoding table maps each legacy key sequence to Unicode, with two
// markers for the pieces that have to move: KOMBU and REPAYA. toUnicode() tokenizes the text (longest key
// first) and then rebuilds every syllable in logical order.

export const KOMBU = '\uE000', REPAYA = '\uE001'
export const HAL = '්', ZWJ = '\u200D'

const isCons = (c) => c >= 'ක' && c <= 'ෆ'
const isVowelSign = (c) => (c >= 'ා' && c <= 'ෟ') || c === 'ෲ' || c === 'ෳ'
const isTail = (c) => c === 'ං' || c === 'ඃ' // ං ඃ come after the vowel sign

const compiled = new Map()
function compile(enc, fontName) {
    const key = enc.id + '|' + (fontName || '')
    if (compiled.has(key)) return compiled.get(key)
    const map = new Map(Object.entries(enc.map))
    for (const v of enc.variants || []) {
        if (fontName && v.fontNames.some((re) => re.test(fontName))) Object.entries(v.map).forEach(([k, u]) => map.set(k, u))
    }
    const maxLen = Math.max(...[...map.keys()].map((k) => k.length))
    // reverse: Unicode -> the first legacy key that produces it (tables list the preferred key first)
    const reverse = new Map()
    for (const [k, u] of map) if (!reverse.has(u) && !/^\s+$/.test(u)) reverse.set(u, k)
    const c = { enc, map, maxLen, reverse }
    compiled.set(key, c)
    return c
}

function tokenize(text, { map, maxLen }) {
    let out = ''
    for (let i = 0; i < text.length; ) {
        let n = Math.min(maxLen, text.length - i)
        for (; n > 0; n--) {
            const u = map.get(text.substr(i, n))
            if (u !== undefined) { out += u; break }
        }
        if (n === 0) { out += text[i]; n = 1 }
        i += n
    }
    return out
}

// puts each syllable in logical order: repaya, consonant cluster, yansaya/rakaransaya, vowel sign, ං/ඃ
export function reorder(s) {
    let out = ''
    for (let i = 0; i < s.length; ) {
        let j = i, kombu = 0
        while (s[j] === KOMBU) { kombu++; j++ }
        if (!isCons(s[j])) {
            if (kombu === 1 && s[j] === 'එ') { out += 'ඓ'; i = j + 1; continue }
            out += (kombu ? (kombu === 2 ? 'ෛ' : 'ෙ'.repeat(kombu)) : '') + (j < s.length ? s[j] : '')
            i = j + 1
            continue
        }
        let c = j + 1
        while (s[c] === HAL && s[c + 1] === ZWJ && isCons(s[c + 2])) c += 3 // conjuncts, yansaya, rakaransaya
        const cluster = s.slice(j, c)
        let repaya = false, post = '', vowels = [], tail = ''
        for (;;) {
            const ch = s[c]
            if (ch === REPAYA) { repaya = true; c++ }
            else if (ch === HAL && s[c + 1] === ZWJ && (s[c + 2] === 'ය' || s[c + 2] === 'ර')) { post += s.substr(c, 3); c += 3 }
            else if (isVowelSign(ch) || ch === HAL) { vowels.push(ch); c++ }
            else if (isTail(ch)) { tail += ch; c++ }
            else break
        }
        let v = ''
        if (kombu === 1) {
            const take = (m) => { const k = vowels.indexOf(m); if (k < 0) return false; vowels.splice(k, 1); return true }
            const aa = take('ා'), hal = take(HAL), ga = !aa && take('ෟ')
            v = aa ? (hal ? 'ෝ' : 'ො') : hal ? 'ේ' : ga ? 'ෞ' : 'ෙ'
        } else if (kombu >= 2) {
            v = 'ෛ' + 'ෙ'.repeat(kombu - 2)
        }
        out += (repaya ? 'ර' + HAL + ZWJ : '') + cluster + post + v + vowels.join('') + tail
        i = c
    }
    return out
}

export function toUnicode(text, enc, { fontName } = {}) {
    const c = compile(enc, fontName)
    for (const [re, to] of enc.pre || []) text = text.replace(re, to)
    let s = reorder(tokenize(text, c))
    for (const [re, to] of enc.post || []) s = s.replace(re, to)
    return s
}

// Unicode to legacy. Returns null when some part can't be written in the encoding.
const KOMBU_SIGNS = { 'ෙ': [1, ''], 'ේ': [1, HAL], 'ො': [1, 'ා'], 'ෝ': [1, 'ා' + HAL], 'ෞ': [1, 'ෟ'], 'ෛ': [2, ''] }
export function fromUnicode(text, enc, { fontName } = {}) {
    const c = compile(enc, fontName)
    for (const [re, to] of enc.unpost || []) text = text.replace(re, to)
    // units: a consonant, a ්\u200D + consonant join, or one sign. A legacy key may cover several whole units.
    const greedy = (s) => {
        const units = []
        for (let i = 0; i < s.length; ) {
            const n = s[i] === HAL && s[i + 1] === ZWJ && isCons(s[i + 2]) ? 3 : 1
            units.push(s.substr(i, n)); i += n
        }
        let out = ''
        for (let i = 0; i < units.length; ) {
            let n = units.length - i
            for (; n > 0; n--) {
                const k = c.reverse.get(units.slice(i, i + n).join(''))
                if (k !== undefined) { out += k; break }
            }
            if (n === 0) {
                if (/[\u0D80-\u0DFF\u200C\u200D]/.test(units[i])) return null
                out += units[i]; n = 1
            }
            i += n
        }
        return out
    }
    let out = ''
    for (let i = 0; i < text.length; ) {
        let j = i, repaya = false
        if (text[j] === 'ර' && text[j + 1] === HAL && text[j + 2] === ZWJ && isCons(text[j + 3])) { repaya = true; j += 3 }
        if (!isCons(text[j])) {
            const g = greedy(text[i]); if (g === null) return null
            out += g; i++
            continue
        }
        let e = j + 1
        while (text[e] === HAL && text[e + 1] === ZWJ && isCons(text[e + 2])) e += 3
        const cluster = text.slice(j, e)
        let marks = ''
        while (isVowelSign(text[e]) || text[e] === HAL || isTail(text[e])) marks += text[e++]
        let kombu = 0
        marks = marks.replace(/[ෙේොෝෞෛ]/, (m) => { kombu = KOMBU_SIGNS[m][0]; return KOMBU_SIGNS[m][1] })
        let body
        if (repaya) { // repaya is typed after the first consonant
            const first = greedy(cluster[0]), rest = greedy(cluster.slice(1) + marks), r = c.reverse.get(REPAYA)
            body = first === null || rest === null || r === undefined ? null : first + r + rest
        } else body = greedy(cluster + marks)
        if (body === null) return null
        out += c.reverse.get(KOMBU).repeat(kombu) + body
        i = e
    }
    return out
}
