import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { fromUnicode } from '../../../tools/unicode/lib/convert.js'
import { detect, encodingOfFont } from '../../../tools/unicode/lib/detect.js'
import { findIssues } from '../../../tools/unicode/lib/validate.js'
import { convertText } from '../../../tools/unicode/lib/text.js'
import { convertPali } from '../../../tools/unicode/lib/pali.js'
import fm from '../../../tools/unicode/lib/encodings/fm.js'
import isi from '../../../tools/unicode/lib/encodings/isi.js'

test('legacy fonts by name', () => {
    for (const n of ['FMAbhaya', 'FM Abhaya', 'FM-Malithi', 'FM_MALIT', 'FM AbaBld', 'fm_deran']) assert.equal(encodingOfFont(n), fm, n)
    for (const n of ['IsiAbhaya', 'Isi Abhaya', 'IsiIsiwara']) assert.equal(encodingOfFont(n), isi, n)
    for (const n of ['FM Bamini', 'Isiwara Uni', 'Alakamanda Uni', 'UN-Abhaya', 'Abhaya Uni', 'Iskoola Pota', 'Times New Roman', '']) assert.equal(encodingOfFont(n), null, n)
})

test('detects the encoding of paragraphs', () => {
    const html = fs.readFileSync(new URL('../../../books/buddha-charithaya/10-1.html', import.meta.url), 'utf8')
    const paras = [...html.matchAll(/<p>([^<]{40,})</g)].map((m) => m[1].trim().slice(0, 200))
    assert.ok(paras.length > 5)
    for (const p of paras) for (const enc of [fm, isi]) {
        const legacy = fromUnicode(p, enc)
        if (legacy !== null) assert.equal(detect(legacy)[0].enc, enc, legacy)
    }
    assert.equal(detect('මෙය දැනටමත් යුනිකේත ය')[0].enc, null)
    // single words: every encoding gives valid Unicode, only one gives Sinhala
    for (const w of ['wdhqfndajdoh', 'fldrKh', ',xld']) assert.equal(detect(w)[0].enc, fm, w)
    assert.equal(detect('R»Y£')[0].enc, isi)
})

test('finds broken sequences', () => {
    const kinds = (s) => findIssues(s).map((x) => x.kind)
    assert.deepEqual(kinds('ශ්‍රී ලංකා ක්‍ෂ ක‍්ෂ ර්‍ක කෝ'), [])
    assert.deepEqual(kinds('කාා'), ['two-signs'])
    assert.deepEqual(kinds(' ෙක'), ['no-letter'])
    assert.deepEqual(kinds('ක ‍ක'), ['stray-zwj'])
    assert.deepEqual(kinds('lක'), ['leftover'])
})

test('web addresses and marked words stay as typed', () => {
    const r = convertText('wdhqfndajdoh www.pitaka.lk a@b.lk l', fm)
    assert.equal(r.text, 'ආයුබෝවාදය www.pitaka.lk a@b.lk ක')
    assert.equal(convertText('wdhqfndajdoh l', fm, { keep: new Set([1]) }).text, 'ආයුබෝවාදය l')
})

test('pali: touching letters, conjuncts and e/o', () => {
    assert.equal(convertPali('සම්මා'), 'සම‍්මා')
    assert.equal(convertPali('ගන්ත්වා'), 'ගන‍්ත්‍වා') // ත්ව is a common special
    assert.equal(convertPali('අත්ථ'), 'අත්‍ථ') // common special
    assert.equal(convertPali('පඤ්ච', { rare: false }), 'පඤ‍්ච')
    assert.equal(convertPali('පඤ්ච', { rare: true }), 'පඤ්‍ච')
    assert.equal(convertPali('අර්ත්ථ'), 'අර්‍ත්‍ථ')
    // yansaya and rakaransaya always; repaya on request
    assert.equal(convertPali('න්යාය බ්රූ', { repaya: false }), 'න්\u200Dයාය බ්\u200Dරූ'.replace(/\u200D/g, '\u200D'))
    assert.equal(convertPali('අර්ත්ථ', { repaya: false }), 'අර\u200D්ත්\u200Dථ')
    assert.equal(convertPali('සොත්ථි', { vowels: 'long' }), 'සොත්\u200Dථි')
    assert.equal(convertPali('භගවතෝ', { vowels: 'short' }), 'භගවතො')
    // Ven. Gnanavansa Thero: long unless the syllable is closed by a consonant with hal
    assert.equal(convertPali('භගවතො තෙන සොත්ථි', { vowels: 'long' }), 'භගවතෝ තේන සොත්‍ථි')
})
