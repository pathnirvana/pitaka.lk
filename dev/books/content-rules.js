/**
 * rules that find verses and lists typed as plain paragraphs in the book sources (used by fix-content.js)
 * blocks: the leaf <p>/<li> of a book in document order, {k: 'p'|'li', ctx: '' for body level <p>, t: text, br: lines split at <br>,
 * g: inside div.gatha, gn: starts with a mahavanshaya verse number, f: page id}
 * verse tiers: A = convert (V1-pada: lines of two padas 'a - b', V2-pali: short pali lines with a verse cue,
 *   V2-pali-even: pali lines of even length, V3-br: lines split by <br>), B = review, C = formulas, leave alone
 * list tiers: A = convert (consecutive items 1. 2. 3. / (අ) (ආ) / i. ii., starting at the first, items <= 300 chars),
 *   B = review (continuation paragraphs, inline enumerations), C = numbered paragraphs, leave as <p>
 * from the analysis of 2026-10-30: tier A was ~98% verse and ~97-100% lists in the samples checked by hand
 */

const SINHALA_ONLY = /[ඇඈැෑෘෲඍඎඏඐඒඓඕඖෆඳඟඬඹඥශෂෛෞේෝෟෳ]/; // letters/signs not used in Pali written in Sinhala script
const SINHALA_CHAR = /[඀-෿]/g;
const PALI_MARKERS = /(ං(\s|$|[,.;:!?”’'"])|ඤ්ඤ|ත්‍?ථ|ස්ස|ම්හි|න්ති(\s|$|[,.;”’])|ස්මිං|ත්වා(\s|$)|ාය(\s|$)|ානං|ෙහි(\s|$)|ාති(\s|$)|ෙති(\s|$)|ොති(\s|$))/;

const sinhalaLen = s => (s.match(SINHALA_CHAR) || []).length;
// pali: mostly Sinhala-script, no Sinhala-only letters, at least one pali marker
function isPali(s) {
    const t = s.replace(/\(.*?\)/g, ''); // ignore bracketed Sinhala glosses
    if (sinhalaLen(t) < 6) return false;
    if (SINHALA_ONLY.test(t)) return false;
    return PALI_MARKERS.test(t);
}
const hasSinhalaOnly = s => SINHALA_ONLY.test(s);

// pada separator used in Pali gathas typed on one line: 'ඉච්ඡිතං පත්ථිතං තුය්හං - ඛිප්පමෙව සමිජ්ඣතු'
const PADA_SEP = /\S\s+[-–—]\s+\S/;
function hasPadaSplit(s) {
    const m = s.split(/\s+[-–—]\s+/);
    return m.length === 2 && m.every(x => sinhalaLen(x) >= 8 && x.length <= 45);
}
const endsComma = s => /[,;]\s*["”’']?\s*$/.test(s);
const endsStop = s => /[.!?।॥‖]\s*["”’')\]]*\s*$/.test(s);
const verseEndMarker = s => /(\|\|?|‖|॥|।)\s*\d*\s*$|\(\s*[\d෦-෯]+\s*\)\s*$|[॥‖]\s*$/.test(s);
const lastSyllable = s => { // crude rhyme key: last consonant cluster + vowel signs of the last word
    const w = s.replace(/[^඀-෿‍\s]/g, '').trim().split(/\s+/).pop() || '';
    const m = w.match(/[ක-ෆ](්‍?[ක-ෆ])?[්-ෟංඃ]*$/);
    return m ? m[0] : w.slice(-2);
};

const VERSE_MAX = 60;      // max chars of a verse line typed as its own <p> (99% of existing gatha lines are <= 60)
const PADA_LINE_MAX = 95;  // a line holding two padas 'a - b'
const BR_LINE_MAX = 75;
const MAX_GAP = 3;         // continuation paragraphs allowed between two list items ('loose' list)

const plain = b => b && b.k === 'p' && !b.ctx;
const BAD_VERSE = [
    [/\s=\s/, 'glossary'], [/\b(1[89]|2[0-5])\d\d\b/, 'year'], [/https?:/, 'url'], [/[:：]\s*-?\s*$/, 'intro-colon'],
    [/^\s*-?\s*පෙ\s*-?\s*$/, 'pe'], [/(පිටුව|පි\s*[.:])\s*\d/, 'page-ref'], [/^[\d\s.\-/]+$/, 'number'],
];
const badVerse = t => (BAD_VERSE.find(([re]) => re.test(t)) || [])[1];
const quoteStart = t => /^\s*[“‘"'(]/.test(t), quoteEnd = t => /[”’"']\s*(\(\s*\d+\s*\))?\s*[.,]?\s*(යි|යනු)?\s*[.,]?$/.test(t);
const stanzaNum = t => /^\s*\(?\d{1,4}(-\d{1,4})?\s*[.)]\s|\(\s*\d{1,4}\s*\)\s*[.,]?\s*$|[|‖॥]\s*\d*\s*$/.test(t);

// ---------------- enumerators
const SI_VOWELS = 'අආඇඈඉඊඋඌඑඒඔඕ'.split(''), PALI_VOWELS = 'අආඉඊඋඌඑඔ'.split('');
const SI_CONS = 'කඛගඝඞචඡජඣඤටඨඩඪණතථදධනපඵබභමයරලවශෂසහළෆ'.split(''), PALI_CONS = 'කඛගඝඞචඡජඣඤටඨඩඪණතථදධනපඵබභමයරලවසහළ'.split('');
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii', 'xiii', 'xiv', 'xv', 'xvi', 'xvii', 'xviii', 'xix', 'xx'];
const SI_DIGITS = '෦෧෨෩෪෫෬෭෮෯';
function enumOf(t) {
    let m;
    if ((m = t.match(/^\s*([•◦▪➢✓●○■□►▶✔❖➤*])\s*(?=\S)/)) || (m = t.match(/^\s*([-–—])\s+(?!පෙ)(?=\S)/)))
        return { type: 'bullet', style: m[1], v: 0, marker: m[0].trim() };
    if ((m = t.match(/^\s*(\(?)\s*(\d{1,3})\s*(\.\)|[.)\]]|:-|\s(?=\D))\s*(?=\S)/)) && !/^\s*\d+\s*\.\s*\d/.test(t)) {
        const style = m[1] + (m[3].trim() || '_') + (m[2].length > 1 && m[2][0] === '0' ? '0' : '');
        return { type: 'arabic', style, v: +m[2], marker: m[0].trim() };
    }
    if ((m = t.match(new RegExp(`^\\s*(\\(?)([${SI_DIGITS}]{1,3})\\s*([.)])\\s*(?=\\S)`))))
        return { type: 'si-digit', style: m[1] + m[3], v: +[...m[2]].map(c => SI_DIGITS.indexOf(c)).join(''), marker: m[0].trim() };
    if ((m = t.match(/^\s*(\(?)(x{0,1}(?:ix|iv|v?i{0,3}))\s*([.)])\s*(?=\S)/i)) && m[2] && (m[1] || m[3] === '.')) {
        const v = ROMAN.indexOf(m[2].toLowerCase()) + 1;
        if (v) return { type: 'roman', style: m[1] + m[3] + (m[2] === m[2].toUpperCase() ? 'I' : 'i'), v, marker: m[0].trim() };
    }
    // a lone Sinhala letter (with no vowel sign) in brackets or followed by '.' / ')'
    if ((m = t.match(/^\s*(\(?)([අ-ඖක-ෆ])\s*([.)])\s*(?=\S)/)) && (m[1] ? m[3] === ')' : true)) {
        const c = m[2];
        return { type: SI_VOWELS.includes(c) ? 'si-vowel' : 'si-cons', style: m[1] + m[3], c, v: 0, marker: m[0].trim() };
    }
    return null;
}
function follows(a, b) { // is enumerator b the next one after a
    if (!a || !b || a.type !== b.type || a.style !== b.style) return false;
    if (a.type === 'bullet') return true;
    if (a.type === 'si-vowel') return [SI_VOWELS, PALI_VOWELS].some(s => s.indexOf(b.c) === s.indexOf(a.c) + 1 && s.indexOf(a.c) >= 0);
    if (a.type === 'si-cons') return [SI_CONS, PALI_CONS].some(s => s.indexOf(b.c) === s.indexOf(a.c) + 1 && s.indexOf(a.c) >= 0);
    return b.v === a.v + 1;
}
const firstOk = e => e.type === 'bullet' || ['si-vowel'].includes(e.type) ? (e.type === 'bullet' || e.c === 'අ') : e.type === 'si-cons' ? e.c === 'ක' : e.v === 1;
// a paragraph holding several enumerators: an inline summary ('1. a, 2. b, 3. c') or a flattened multi-column table row
const inlineEnum = t => (t.match(/(^|\s)\(?\d{1,3}\s*[.)]\s+\S/g) || []).length >= 2 || /\(අ\).+\(ආ\)/.test(t);

// ---------------- per book
function analyse(blocks) {
    blocks.forEach((b, i) => b.i = i);
    const verse = [], lists = [], used = new Set();

    // V3: one <p> holding verse lines separated by <br>
    for (const b of blocks) {
        if (b.k !== 'p' && b.k !== 'li' || b.g || !b.br) continue;
        if ((b.ctx || '').includes('td')) continue;
        const L = b.br;
        if (L.some(l => l.length > BR_LINE_MAX)) continue;
        const cues = L.filter(l => isPali(l) || hasPadaSplit(l)).length;
        if (cues * 2 >= L.length && !L.some(badVerse))
            verse.push({ tier: 'A', ci: [b.ci, b.ci], rule: b.k === 'li' ? 'V3-li-br' : 'V3-br', start: b.i, end: b.i, lines: L.length, f: b.f, text: L });
    }

    // runs of consecutive plain <p>
    const runs = []; let cur = [];
    for (const b of blocks) { if (plain(b)) cur.push(b); else { if (cur.length) runs.push(cur); cur = []; } }
    if (cur.length) runs.push(cur);

    for (const run of runs) {
        // V1: pada-split lines 'a - b' (Pali gathas and Sinhala kavi typed two padas per line)
        for (let i = 0; i < run.length;) {
            let j = i;
            while (j < run.length && !run[j].br && run[j].t.length <= PADA_LINE_MAX && padaLine(stripNum(run[j].t)) && !badVerse(run[j].t)) j++;
            if (j - i >= 2) {
                const seg = run.slice(i, j);
                const lefts = seg.map(b => stripNum(b.t).split(/\s+[-–—]\s+/)[0].trim());
                const dialogue = new Set(lefts).size < lefts.length && lefts.every(l => l.split(/\s+/).length <= 3);
                const numbered = seg.filter(b => enumOfList(b.t)).length;
                const termDef = numbered >= seg.length - 1; // every line numbered: a numbered 'term - definition' list, not stanza numbers
                const T = seg.map(b => b.t);
                // a 2-line run needs a verse cue: opening/closing quote, a line ending in a comma, or a stanza number
                const cue = seg.length > 2 || /^\s*(\S+\s*:-?\s*)?[“‘"']/.test(T[0]) || quoteEnd(T[T.length - 1]) || T.some(endsComma) || T.some(t => /^\s*\(?\d/.test(t));
                if (!dialogue && !termDef && !litany(T)) { verse.push(mk(cue ? 'V1-pada' : 'V1-pada-nocue', seg)); if (cue) seg.forEach(b => used.add(b.i)); }
            }
            i = Math.max(j, i + 1);
        }
        // V2: short Pali lines with a verse cue
        for (let i = 0; i < run.length;) {
            let j = i;
            const ok = b => !used.has(b.i) && !b.br && b.t.length <= VERSE_MAX && b.t.length >= 8 && !badVerse(b.t) && (isPali(stripNum(b.t)) || padaLine(b.t)) && !enumOfList(b.t) && !/[?]\s*$/.test(b.t);
            while (j < run.length && ok(run[j])) j++;
            if (j - i >= 2) {
                const seg = run.slice(i, j), T = seg.map(b => b.t);
                const lefts = T.map(t => t.split(/\s+[-–—]\s+/)[0].trim());
                if (T.every(t => /\s[-–—]\s/.test(t)) && new Set(lefts).size < lefts.length) { i = j; continue; } // dialogue 'speaker - words'
                const cue = quoteStart(T[0]) || quoteEnd(T[T.length - 1]) || T.some(endsComma) || T.some(stanzaNum) || T.some(verseEndMarker);
                const formula = litany(T) || T.some(t => /-?\s*පෙ\s*-|\.{3,}/.test(t));
                const L = T.map(t => sinhalaLen(t));
                const metric = !T.slice(0, -1).some(t => /[.]\s*$/.test(t)) && Math.max(...L) / Math.min(...L) <= 1.6 && !T.some(t => /\s[-–—]\s/.test(t) && !padaLine(t));
                const rule = formula ? 'V2-pali-formula' : cue ? 'V2-pali' : metric ? 'V2-pali-even' : 'V2-pali-nocue';
                verse.push(mk(rule, seg)); if (rule === 'V2-pali' || rule === 'V2-pali-even') seg.forEach(b => used.add(b.i));
            }
            i = Math.max(j, i + 1);
        }
        // V4: Sinhala kavi - >= 4 short lines sharing the end rhyme (elisama)
        for (let i = 0; i < run.length;) {
            const key = lastSyllable(run[i].t);
            let j = i;
            const ok = b => !used.has(b.i) && !b.br && b.t.length <= 70 && b.t.length >= 12 && !badVerse(b.t) && !enumOfList(b.t) && !/පෙ\s*-?\s*$/.test(b.t);
            while (j < run.length && ok(run[j]) && lastSyllable(run[j].t) === key) j++;
            if (j - i >= 4 && key) {
                const seg = run.slice(i, j), T = seg.map(b => b.t);
                const lastWords = new Set(T.map(t => t.replace(/[^\u0D80-\u0DFF\u200D\s]/g, '').trim().split(/\s+/).pop()));
                if (lastWords.size >= T.length * 0.75 && !litany(T)) { verse.push(mk(PROSE_END.has(key) ? 'V4-rhyme-weak' : 'V4-rhyme', seg)); seg.forEach(b => used.add(b.i)); }
            }
            i = Math.max(j, i + 1);
        }
    }

    // L: enumerated paragraphs (only plain p not already taken as verse)
    for (const run of runs) {
        const items = run.map(b => ({ b, e: used.has(b.i) || b.gn ? null : enumOfList(b.t) }));
        let k = 0;
        while (k < items.length) {
            if (!items[k].e) { k++; continue; }
            const seq = [k];
            let last = k, gaps = 0;
            for (let x = k + 1; x < items.length && x - last - 1 <= MAX_GAP; x++) {
                if (items[x].e && follows(items[last].e, items[x].e)) { gaps += x - last - 1; seq.push(x); last = x; }
                else if (items[x].e && items[x].e.type === items[last].e.type && items[x].e.style === items[last].e.style && items[x].e.type !== 'bullet') break; // a restart (1. again) or a jump ends the list
            }
            if (seq.length >= 2) {
                const its = seq.map(x => items[x]);
                const lens = its.map(o => o.b.t.length).sort((a, b) => a - b), med = lens[lens.length >> 1];
                const e0 = its[0].e;
                const nested = [];
                for (let x = seq[0]; x <= last; x++) if (!seq.includes(x) && items[x].e && (items[x].e.type !== e0.type || items[x].e.style !== e0.style)) nested.push(items[x].e.type + items[x].e.style);
                const inl = its.filter(o => inlineEnum(o.b.t)).length;
                const tier = med > 300 ? 'C' : (gaps === 0 && firstOk(e0) && !inl && e0.style !== '_' && !its.some(o => o.b.gn)) ? 'A' : 'B';
                lists.push({ tier, ci: [its[0].b.ci, items[last].b.ci],
                    rule: 'L-' + e0.type, style: e0.style, start: its[0].b.i, end: items[last].b.i, items: seq.length,
                    first: e0.type === 'si-vowel' || e0.type === 'si-cons' ? e0.c : e0.v, startsAt1: firstOk(e0),
                    loose: gaps > 0, gaps, medLen: med, kind: med > 300 ? 'numbered-paragraphs' : med > 150 ? 'long-items' : 'short-items',
                    nested: [...new Set(nested)], inline: its.filter(o => inlineEnum(o.b.t)).length,
                    f: its[0].b.f, text: its.map(o => o.b.t.slice(0, 90)),
                });
                seq.forEach(x => items[x].e = null);
            }
            k++;
        }
    }
    return { verse, lists };

    function mk(rule, seg) { return { ci: [seg[0].ci, seg[seg.length - 1].ci], tier: /nocue|rhyme/.test(rule) ? 'B' : /formula/.test(rule) ? 'C' : 'A', rule, start: seg[0].i, end: seg[seg.length - 1].i, lines: seg.length, f: seg[0].f, text: seg.map(b => b.t) }; }
}
const PROSE_END = new Set(['ය', 'යි', 'ක', 'ද', 'හ', 'ම', 'ම්', 'ත්', 'නි', 'මි', 'වේ', 'හි', 'ති', 'න', 'ව', 'ත']);
// a line made of two padas 'a b - c d': both halves 2+ words, 8..40 Sinhala chars, similar length
function padaLine(t) {
    const h = t.split(/\s+[-–—]\s+/);
    if (h.length !== 2) return false;
    const L = h.map(x => sinhalaLen(x));
    return h.every(x => x.trim().split(/\s+/).length >= 2) && L.every(l => l >= 8 && l <= 40) && Math.max(...L) / Math.min(...L) <= 2;
}
// repeated formula (peyyala / litany): more than half the lines share the first word or the last word
function litany(T) {
    if (T.length < 3) return false;
    const words = T.map(t => t.replace(/[^\u0D80-\u0DFF\u200D\s]/g, ' ').trim().split(/\s+/));
    const top = arr => Math.max(...Object.values(arr.reduce((m, w) => (m[w] = (m[w] || 0) + 1, m), {})));
    return top(words.map(w => w[0])) > T.length / 2 || top(words.map(w => w[w.length - 1])) > T.length / 2;
}
const stripNum = t => t.replace(/^\s*\(?\d{1,4}(-\d{1,4})?\s*[.)]\s*/, '');
function enumOfList(t) { const e = enumOf(t); return e && !(e.type === 'arabic' && e.style === '_' && /^\s*\d+\s+(පිටුව|පටන්|වන|වැනි|වෙනි)/.test(t)) ? e : null; }

module.exports = { analyse, enumOf, stripNum, padaLine, isPali };
