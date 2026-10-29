// node --test dev/unicode/test/
import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { toUnicode, fromUnicode } from '../../../tools/unicode/lib/convert.js'
import { findIssues } from '../../../tools/unicode/lib/validate.js'
import fm from '../../../tools/unicode/lib/encodings/fm.js'
import isi from '../../../tools/unicode/lib/encodings/isi.js'
import { bookWords } from '../corpus.mjs'

const oldFm = createRequire(import.meta.url)('../baseline/old-fm.cjs')
const words = [...bookWords().keys()]

for (const enc of [fm, isi]) {
    test(`${enc.id}: book words convert back to themselves`, () => {
        let checked = 0
        const wrong = []
        for (const w of words) {
            const legacy = fromUnicode(w, enc)
            if (legacy === null) continue // has touching letters or conjuncts the encoding can't write
            checked++
            // a word that was already wrong (decomposed or doubled signs) may come back corrected
            if (toUnicode(legacy, enc) !== w && !findIssues(w).length) wrong.push(`${w} ${legacy} ${toUnicode(legacy, enc)}`)
        }
        assert.ok(checked > words.length * 0.95, `only ${checked} of ${words.length} words written in ${enc.id}`)
        assert.deepEqual(wrong, [])
    })
}

test('fm: never worse than the old converter on book words', () => {
    const worse = []
    for (const w of words) {
        const legacy = fromUnicode(w, fm)
        if (legacy !== null && oldFm(legacy) === w && toUnicode(legacy, fm) !== w) worse.push(w)
    }
    assert.deepEqual(worse, [])
})

test('fm: kombuva, rakaransaya, yansaya and repaya in any typing order', () => {
    const cases = {
        'fldrKh': 'කොරණය', 'fla%': 'ක්‍රේ', 'fl%a': 'ක්‍රේ', 'ls%': 'ක්‍රි', 'l%s': 'ක්‍රි', 'ff;%': 'ත්‍රෛ', 'fí%': 'බ්‍රේ',
        'hH_': 'ර්‍ය්‍ය', 'l_': 'ර්‍ක', 'fød': 'ද්‍රො', 'fÞ': 'දො', 'fm%!': 'ප්‍රෞ', 'fkHda': 'න්‍යෝ', 'ft': 'ඓ', 'Y%S': 'ශ්‍රී',
        'CI': 'ක්‍ෂ', 'Ë': 'ක්‍ෂ', 'wd': 'ආ', 'T!': 'ඖ', 'l¿': 'කළු', 'wdhqfndajdoh': 'ආයුබෝවාදය',
    }
    for (const [legacy, uni] of Object.entries(cases)) assert.equal(toUnicode(legacy, fm), uni, legacy)
})

test('fm: fixes of the old converter', () => {
    assert.equal(toUnicode('f>%da', fm), 'ඝ්‍රෝ') // the old one started with a stray ZWJ
    assert.equal(toUnicode('“', fm), 'ර්‍ණ') // and added a space
    assert.equal(toUnicode('(ස)', fm).includes('(i)'), false) // Tipitaka numbering is gone
    assert.equal(toUnicode('l¥Ëd', fm), 'කදූක්‍ෂා')
    assert.equal(toUnicode('µ', fm), 'ද්‍ය') // FM Abhaya, Malithi, Bindumathi ...
    assert.equal(toUnicode('µ', fm, { fontName: 'FM Derana' }), 'i') // FM Derana puts roman numerals here
    assert.equal(toUnicode('l%Þ', fm), 'ක්‍රදා')
    assert.equal(toUnicode('Cd', fm), 'ක්‍ා') // left for the validator to flag
})

test('isi: vowel letters typed with signs', () => {
    assert.equal(toUnicode('R£', isi), 'ආ')
    assert.equal(toUnicode('»Y£', isi), 'කො')
    assert.equal(toUnicode('»Y£Š', isi), 'කෝ')
    assert.equal(toUnicode('Q', isi), 'ශ්‍රී')
})
