/**
 * brings a corrected OCR book (misc-ai/sinhala-ocr work/books_html/<book>.html) into dev/books/input
 *   node dev/books/import-ocr.js <src.html> <folder>
 * - drops the html comments (<!-- SKIP ... -->, <!-- empty page -->)
 * - keeps the scan page markers <span data-page="22-5"> as hidden anchors <span class="pg" id="p22-5" data-page="22-5">
 *   (library id of the scanned pdf - page number in that pdf)
 * - repairs the **bold** marks the OCR left unpaired (see fixBold) and makes the straight quotes curved
 * - checks the h1-h4 tree like build.js does (top level only, no level jumps, no empty headings) and exits 1 on a problem,
 *   fix those in the source and import again
 * then add the book to books.json and run build.js
 */

const fs = require('fs'), path = require('path');
const { JSDOM } = require('jsdom');

const [src, folder] = process.argv.slice(2);
if (!src || !folder) { console.log('usage: node dev/books/import-ocr.js <src.html> <folder>'); process.exit(1); }

let html = fs.readFileSync(src, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
html = html.replace(/<span data-page="(\d+)-(\d+)"><\/span>/g, '<span class="pg" id="p$1-$2" data-page="$1-$2"></span>');

const doc = new JSDOM(html).window.document, problems = [];
const textOf = (el) => el.textContent.replace(/\s+/g, ' ').trim();

// the blocks that hold text directly (a <td> with <p>s inside is not one, its <p>s are)
const LEAF = 'p, li, td, th, h1, h2, h3, h4, h5, h6';
const leaves = [...doc.body.querySelectorAll(LEAF)].filter(e => !e.querySelector(LEAF));

/** bold: the OCR marks bold with **, a converter paired them in order, so one missing or extra mark leaves a stray **
 * and flips bold/plain for the rest of the block. Back to marks, then for a block with an odd count drop the mark that
 * leaves the least bold text (bold is used for short terms). A bold verse over two lines (**line 1 / line 2**) has one
 * mark in each line: those lines are made bold whole. */
const marks = (e) => e.innerHTML.replace(/<\/?(b|strong)>/g, '**');
const count = (s) => s.split('**').length - 1;
const visible = (s) => s.replace(/<[^>]+>/g, '').trim().length;
function pairUp(s) {
    let parts = s.split('**');
    if (parts.length % 2 == 0) { // an odd count of marks
        let best = null;
        for (let i = 1; i < parts.length; i++) {
            const p = [...parts.slice(0, i - 1), parts[i - 1] + parts[i], ...parts.slice(i + 1)];
            const score = p.reduce((n, x, j) => n + (j % 2 ? visible(x) : 0), 0);
            if (!best || score <= best.score) best = { p, score };
        }
        parts = best.p;
    }
    return parts.map((x, j) => j % 2 && visible(x) ? `<b>${x}</b>` : x).join('');
}
let boldFixed = 0;
const odd = new Set(leaves.filter(e => e.innerHTML.includes('**') && count(marks(e)) % 2));
for (const e of odd) {
    if (!odd.has(e) || !marks(e).trim().startsWith('**')) continue;
    const run = [e];
    for (let n = e.nextElementSibling; n && run.length < 8 && n.matches(LEAF); n = n.nextElementSibling) {
        run.push(n);
        if (odd.has(n)) break;
    }
    const last = run[run.length - 1];
    if (run.length < 2 || !odd.has(last) || !marks(last).trim().endsWith('**')) continue;
    run.forEach((x, i) => {
        x.innerHTML = `<b>${marks(x).replace(/\*\*/g, '')}</b>`;
        odd.delete(x);
    });
    boldFixed += run.length;
}
for (const e of leaves) {
    if (!e.innerHTML.includes('**')) continue;
    e.innerHTML = pairUp(marks(e));
    boldFixed++;
}

/** quotes: " and ' open after a space, a bracket or a dash (or at the start), close otherwise */
let quotes = 0;
{
    let prev = ' ', block = null;
    const w = doc.createTreeWalker(doc.body, 4 /* text */);
    for (let n; (n = w.nextNode());) {
        const b = n.parentElement.closest(LEAF); // every text node, also the text of an <li> that holds a nested list
        if (b !== block) { block = b; prev = ' '; }
        const t = n.textContent.replace(/["']/g, (q, i, s) => {
            const before = i ? s[i - 1] : prev, open = /[\s(\[{\u2014\u2013\-\/\u201c\u2018]/.test(before);
            quotes++;
            return q == '"' ? (open ? '\u201c' : '\u201d') : (open ? '\u2018' : '\u2019');
        });
        if (t != n.textContent) n.textContent = t;
        if (t) prev = t[t.length - 1];
    }
}
console.log(`bold repaired in ${boldFixed} blocks, ${quotes} quotes curved`);
const headers = [...doc.querySelectorAll('h1,h2,h3,h4')];
let prev = 0;
const counts = {};
for (const h of headers) {
    const level = Number(h.tagName[1]), t = textOf(h);
    counts[h.tagName] = (counts[h.tagName] || 0) + 1;
    if (h.parentElement !== doc.body) problems.push(`${h.tagName} '${t}' is not at the top level`);
    if (!t) problems.push(`empty ${h.tagName} after '${textOf(headers[headers.indexOf(h) - 1] || h)}'`);
    if (level > prev + 1) problems.push(`level jumps h${prev} -> h${level} at '${t}'`);
    prev = level;
}
counts.H5 = doc.querySelectorAll('h5').length;
counts.pages = doc.querySelectorAll('span.pg').length;
console.log(Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', '));
if (problems.length) { console.log(problems.join('\n')); process.exit(1); }

const out = path.join(__dirname, 'input', `${folder}.html`);
const left = (doc.body.innerHTML.match(/\*\*/g) || []).length;
if (left) console.log(`${left} ** left`);
fs.writeFileSync(out, doc.body.innerHTML.trim() + '\n');
console.log(`wrote ${out}`);
