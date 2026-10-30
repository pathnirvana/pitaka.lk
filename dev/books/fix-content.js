/**
 * marks up verses and lists that are typed as plain paragraphs in the book sources (dev/books/input/*.html)
 *   node dev/books/fix-content.js                 report what would change in all books
 *   node dev/books/fix-content.js --write [book]  change the source files (review with git diff, then rebuild)
 * verses -> <div class="gatha"> with one <p> per line, a div per stanza; lists -> <ol class="enum"> keeping the
 * original marker (1. / (අ) / i.) as text. only the tier A rules of content-rules.js, the others need a person.
 * the files are edited in place: only the paragraphs that change are replaced, the rest of the file stays as it is
 */

const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');
const { analyse, enumOf, padaLine, isPali } = require('./content-rules');

const inputDir = path.join(__dirname, 'input');
// tier A matches checked by hand and found to be prose: [book, start of the first line]
const NOT_VERSE = [['vishuddhi-margaya', 'ද්වාෂෂ්ටික වශයෙන්']];
// hand made html with their own conventions (see the analysis): only the <br> verses of the jathaka book
const SKIP = { 'mahavanshaya': 'all', 'palibhashavatharanaya-1': 'all', 'pansiya-panas-jathaka': 'lists' };

const args = process.argv.slice(2), write = args.includes('--write');
const only = args.filter(a => !a.startsWith('--'));
const books = JSON.parse(fs.readFileSync(path.join(__dirname, 'books.json'), 'utf8')).map(b => b.folder)
    .filter(f => (!only.length || only.includes(f)) && SKIP[f] != 'all');

const norm = s => s.replace(/[\s ]+/g, ' ').trim();
const textNoFn = (el) => { const c = el.cloneNode(true); c.querySelectorAll('sup').forEach(s => s.remove()); return norm(c.textContent); };
const brLines = (el) => el.innerHTML.split(/<br\s*\/?>/i).map(s => s.trim()).filter(s => norm(s.replace(/<[^>]+>/g, '')));

// the leaf paragraphs of a book like content-rules expects them, with their elements
function blocksOf(doc) {
    const blocks = [];
    const walker = doc.createTreeWalker(doc.body, 1 /* elements */);
    for (let n; (n = walker.nextNode());) {
        const tag = n.tagName.toLowerCase();
        if (/^h[1-4]$/.test(tag)) { blocks.push({ k: 'h', t: norm(n.textContent), el: n }); continue; }
        const leafLi = tag == 'li' && !n.querySelector('p,li');
        if (tag != 'p' && !leafLi) { if (tag == 'table') blocks.push({ k: 'table', el: n }); continue; }
        if (n.closest('td,th') || n.closest("li[id^='footnote-']")) continue;
        const ctx = []; // element context like the analysis: '' for a paragraph at the top level
        for (let e = n.parentElement; e && e.tagName != 'BODY'; e = e.parentElement) {
            const t = e.tagName.toLowerCase();
            if (t == 'div' && e.className) ctx.push('div.' + e.className.split(/\s+/)[0]);
            else if (['li', 'td', 'th', 'ol', 'ul', 'blockquote', 'table'].includes(t)) ctx.push(t);
        }
        const lines = brLines(n);
        blocks.push({
            k: tag, ctx: ctx.join('>'), t: textNoFn(n), el: n,
            br: lines.length > 1 ? lines.map(l => norm(l.replace(/<sup>.*?<\/sup>/g, '').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&'))) : undefined,
            g: n.closest('div.gatha') ? 1 : undefined,
            gn: n.firstElementChild && n.firstElementChild.matches('span.gatha-number') && norm(n.textContent).startsWith(norm(n.firstElementChild.textContent)) || undefined,
        });
    }
    blocks.forEach((b, i) => b.i = i);
    return blocks;
}

// split verse lines into stanzas: at stanza numbers and quotes, else evenly by 2 pada lines or 4 single lines
function stanzas(lines) {
    const startsNew = (t) => /^\s*\(?\d{1,4}(-\d{1,4})?\s*[.)]\s/.test(t) || /^\s*[“‘"]/.test(t);
    const endsQuote = (t) => /[”’"]\s*(\(\s*\d+\s*\))?\s*[.,]?\s*(යි|යනු)?\s*[.,]?$/.test(t);
    const groups = [];
    let cur = [];
    lines.forEach(l => {
        if (cur.length && startsNew(l.t)) { groups.push(cur); cur = []; }
        cur.push(l);
        if (endsQuote(l.t)) { groups.push(cur); cur = []; }
    });
    if (cur.length) groups.push(cur);
    return groups.flatMap(g => {
        const size = g.every(l => padaLine(l.t.replace(/^\s*\(?\d{1,4}(-\d{1,4})?\s*[.)]\s*/, ''))) ? 2 : 4;
        if (g.length <= size || g.length % size) return [g];
        const parts = [];
        for (let i = 0; i < g.length; i += size) parts.push(g.slice(i, i + size));
        return parts;
    });
}
const gathaDivs = (groups) => groups.map(g => `<div class="gatha">\n${g.map(l => `  <p>${l.html.trim()}</p>`).join('\n')}\n</div>`).join('\n');

// the list item without its marker, which is kept as text in a span
function listItem(el) {
    const c = el.cloneNode(true), e = enumOf(textNoFn(el));
    const walker = c.ownerDocument.createTreeWalker(c, 4 /* text */);
    let left = e.marker.replace(/\s+/g, '');
    for (let t; left && (t = walker.nextNode());) { // remove the marker characters from the start, across inline tags
        let s = t.data, k = 0;
        while (k < s.length && left) { if (/\s/.test(s[k])) k++; else if (s[k] == left[0]) { left = left.slice(1); k++; } else break; }
        t.data = s.slice(k).replace(/^\s+/, '');
        if (s.slice(k).trim() || left) break;
    }
    c.querySelectorAll('b,strong,i,em,span').forEach(x => { if (!x.textContent.trim() && !x.querySelector('img')) x.remove(); });
    return `  <li><span class="li-num">${e.marker}</span> ${c.innerHTML.trim()}</li>`;
}

let total = { verse: 0, lines: 0, lists: 0, items: 0 };
for (const book of books) {
    const file = path.join(inputDir, `${book}.html`), src = fs.readFileSync(file, 'utf8');
    const dom = new JSDOM(src, { includeNodeLocations: true }), doc = dom.window.document;
    // footnote lists are left alone (the rules ignore them as build.js does)
    const blocks = blocksOf(doc), { verse, lists } = analyse(blocks);
    const edits = []; // [start, end, html] in the source
    const loc = (el) => dom.nodeLocation(el);
    const skipLists = SKIP[book] == 'lists';

    for (const v of verse.filter(v => v.tier == 'A')) {
        if (NOT_VERSE.some(([b, t]) => b == book && v.text[0].includes(t))) continue;
        const els = blocks.slice(v.start, v.end + 1).map(b => b.el);
        if (v.rule == 'V3-br' || v.rule == 'V3-li-br') { // verse lines in one element split by <br>
            const el = els[0], l = loc(el), lines = brLines(el).map(html => ({ html, t: norm(html.replace(/<[^>]+>/g, '')) }));
            if (v.rule == 'V3-li-br') edits.push([l.startTag.endOffset, l.endTag.startOffset, '\n' + gathaDivs([lines]) + '\n']);
            else edits.push([l.startOffset, l.endOffset, gathaDivs([lines])]);
        } else {
            const lines = els.map(el => ({ html: el.innerHTML, t: textNoFn(el) }));
            edits.push([loc(els[0]).startOffset, loc(els[els.length - 1]).endOffset, gathaDivs(stanzas(lines))]);
        }
        total.verse++; total.lines += v.lines;
        if (!write) console.log(`${book} ${v.rule} ${v.f || ''}: ${v.text[0].slice(0, 70)}${v.lines > 1 ? ` (+${v.lines - 1} lines)` : ''}`);
    }
    if (!skipLists) for (const list of lists.filter(l => l.tier == 'A')) {
        const els = blocks.slice(list.start, list.end + 1).map(b => b.el);
        if (els.some(el => el.tagName != 'P')) continue;
        const tag = list.rule == 'L-bullet' ? 'ul' : 'ol';
        edits.push([loc(els[0]).startOffset, loc(els[els.length - 1]).endOffset, `<${tag} class="enum">\n${els.map(listItem).join('\n')}\n</${tag}>`]);
        total.lists++; total.items += list.items;
        if (!write) console.log(`${book} ${list.rule} ${list.style}: ${list.items} items: ${list.text[0].slice(0, 60)}`);
    }
    dom.window.close();
    edits.sort((a, b) => b[0] - a[0]);
    edits.forEach((e, i) => { if (i && e[1] > edits[i - 1][0]) throw new Error(`overlapping edits in ${book}`); });
    if (write && edits.length) {
        fs.writeFileSync(file, edits.reduce((s, [a, b, html]) => s.slice(0, a) + html + s.slice(b), src));
        console.log(`${book}: ${edits.length} changes`);
    }
}
console.log(`verses: ${total.verse} (${total.lines} lines), lists: ${total.lists} (${total.items} items)${write ? '' : ' - dry run, --write to change the files'}`);
