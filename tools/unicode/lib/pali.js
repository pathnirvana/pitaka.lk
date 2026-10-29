// Pali in Sinhala script: touching letters (bandi akuru) for consonant clusters, the special conjuncts, and the
// spelling of e/o. Moved from pali_bandi.htm and Ven. Gnanavansa Thero's hal tool (pali_lengthening.html).
// Touching letters are C + ZWJ + ් + C, conjuncts C + ් + ZWJ + C.

// pairs with their own conjunct glyph
export const commonSpecials = [['ක', 'ව'], ['ක', 'ෂ'], ['ත', 'ථ'], ['ත', 'ව'], ['න', 'ව'], ['න', 'ථ'], ['න', 'ද'], ['න', 'ධ']]
// split from the common ones on Bertram's advice. ම්‍බ is used in Sinhala, not in Pali
export const rareSpecials = [['ඤ', 'ච'], ['ඤ', 'ජ'], ['ඤ', 'ඡ'], ['ට', 'ඨ'], ['ණ', 'ඩ'], ['ද', 'ධ'], ['ද', 'ව'], ['ම', 'බ'], ['ඞ', 'ග', 'ඟ']]

export const specialResult = ([a, b, joined]) => joined || a + '\u0DCA\u200D' + b

function convertSpecials(text, specials) {
    for (const s of specials) text = text.replaceAll(s[0] + '\u200D\u0DCA' + s[1], specialResult(s))
    return text
}

// e/o: 'keep' as typed, 'short' ඒ ේ ඕ ෝ written short (Pali e and o are always long), or 'long' ෙ ො and එ ඔ made
// long except before a consonant with hal (Ven. Gnanavansa Thero)
export function convertPali(text, { vowels = 'keep', common = true, rare = false, repaya = true } = {}) {
    text = text.replace(/\u200C/g, '') // tipitaka.org text has ZWNJ
    // twice, for consecutive hals: න්ත්ව (ntv) ගන්ත්වා, න්ද්ව (ndv) බින්ද්වාගමෙ, ත්ථ්ව (tthv) වත්ථ්වෙත්ථ
    text = text.replace(/([ක-ෆ])්([ක-ෆ])/g, '$1\u200D්$2')
    text = text.replace(/([ක-ෆ])්([ක-ෆ])/g, '$1\u200D්$2')
    if (vowels === 'short') {
        text = text.replace(/ඒ/g, 'එ').replace(/ඕ/g, 'ඔ').replace(/ේ/g, 'ෙ').replace(/ෝ/g, 'ො')
    } else if (vowels === 'long') {
        // a consonant with hal, possibly touching (C ZWJ ්), closes the syllable
        const closed = '(?![ක-ෆ]\u200D?්)'
        text = text.replace(new RegExp('ො' + closed, 'g'), 'ෝ').replace(new RegExp('ඔ' + closed, 'g'), 'ඕ')
            .replace(new RegExp('ෙ' + closed, 'g'), 'ේ').replace(new RegExp('එ' + closed, 'g'), 'ඒ')
    }
    if (common) text = convertSpecials(text, commonSpecials)
    if (rare) text = convertSpecials(text, rareSpecials)
    // yansaya and rakaransaya are part of Sinhala spelling, never touching letters
    text = text.replace(/([ක-ෆ])\u200D්([රය])/g, '$1්\u200D$2')
    if (repaya) text = text.replace(/ර\u200D්([ක-ෆ])/g, 'ර්\u200D$1')
    return text
}
