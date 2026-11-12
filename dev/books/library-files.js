/**
 * the single html file and the typed pdf of a book for the tipitaka.lk library, from the corrected input html
 *   node dev/books/library-files.js <folder>...            html and pdf of these books
 *   node dev/books/library-files.js --all                   every book with a library html file
 *   node dev/books/library-files.js --proof <folder>        a few sample pages in every font pairing (files/proofs)
 *   options: --fonts <pairing>, --no-html, --no-pdf
 * output: dev/books/files/<library folder>/<name - author>.html / .pdf - the library admin gives them their ids on upload
 * fonts: sinhala-unicode/build-2026/fonts (static ttf), see PAIRINGS
 * books.json "library": {"html": id, "pdf": the typed pdf id, "altPdf": another pdf (scan or old typed), "scans": [ids],
 *   "keepPdf": true - the library pdf is kept as it is (for history), only the html is made}
 * books.json "pdf": {"fonts": pairing, "tocDepth": 3, "tocColumns": 2 (a long toc of short entries), "mainStart": h1 text where page 1 is, the prefaces before it get i, ii ...,
 *   "noteColumns": 3 - the notes of a page in rows of 3 columns (books of many short notes), a long note gets a row of its own,
 *   "fixedNoteMarks": true - the note marks take the room of two digits, for a page that would not settle otherwise (amawathura)}
 * the pdf is made with typst (brew install typst) from library/book.typ, pdftoppm makes the proof previews
 */

const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { JSDOM } = require('jsdom');
const { loadBook, textOf, tableCols, softenWideTables } = require('./library/load');
const { toTypst, esc, str } = require('./library/typst');

const FONT_DIR = path.join(__dirname, '../../../sinhala-unicode/build-2026/fonts');
const FONT_FILES = {
    'Abhaya Uni': ['AbhayaUni-Regular', 'AbhayaUni-Bold'], 'Seela': ['Seela-Regular', 'Seela-Bold'],
    'Saddha': ['Saddha-Regular', 'Saddha-Bold'], 'Malithi Uni': ['MalithiUni-Regular'], 'Samantha Uni': ['SamanthaUni-Regular'],
};
// body text, headings (and their weight), verses
const PAIRINGS = {
    'abhaya-seela': { body: 'Abhaya Uni', heading: 'Seela', headingWeight: 'bold', verse: 'Abhaya Uni' },
    'abhaya-malithi': { body: 'Abhaya Uni', heading: 'Malithi Uni', headingWeight: 'regular', verse: 'Abhaya Uni' },
    'seela-saddha': { body: 'Seela', heading: 'Saddha', headingWeight: 'bold', verse: 'Seela' },
    'seela-samantha': { body: 'Seela', heading: 'Samantha Uni', headingWeight: 'regular', verse: 'Seela' },
    'abhaya-samantha': { body: 'Abhaya Uni', heading: 'Samantha Uni', headingWeight: 'regular', verse: 'Abhaya Uni' },
};
const DEFAULT_PAIRING = 'abhaya-seela';
const BODY_SIZE = { 'Abhaya Uni': '10.5pt', 'Seela': '10.5pt' };

const bookList = JSON.parse(fs.readFileSync(__dirname + '/books.json', 'utf8'));
const filesDir = path.join(__dirname, 'files'), buildDir = path.join(filesDir, '.build');
const today = new Date().toISOString().slice(0, 10);

// ---- book information shown on the second page
function bookMeta(book) {
    const scans = (book.library && book.library.scans) || [];
    return { title: book.name, subtitle: book.subtitle || '', author: book.author || '', folder: book.folder, scans,
        webUrl: `https://pitaka.lk/books/${book.folder}/`, tocDepth: (book.pdf && book.pdf.tocDepth) || 3, tocColumns: (book.pdf && book.pdf.tocColumns) || 1, mainStart: book.pdf && book.pdf.mainStart, fixedNoteMarks: !!(book.pdf && book.pdf.fixedNoteMarks), noteColumns: (book.pdf && book.pdf.noteColumns) || 1 };
}
// the lines after the title and author: text and links
const infoLines = (m, link) => [
    ['මෙම පොත වෙබ් පිටු ලෙස කියවීමට: ', link(m.webUrl, m.webUrl.replace('https://', ''))],
    m.scans.length ? ['මුල් මුද්‍රිත පොතේ ස්කෑන් කළ පිටපත්: ', ...m.scans.flatMap((id, i) => [i ? ', ' : '', link(`https://tipitaka.lk/library/${id}`, `tipitaka.lk/library/${id}`)])] : null,
    [`pitaka.lk · ${today}`],
    ['ධර්ම දානය පිණිස නොමිලේ බෙදා හැරීම සඳහා ය.'],
].filter(Boolean);
function infoTypst(m) {
    const link = (url, text) => `#link(${str(url)})[${esc(text)}]`;
    const lines = infoLines(m, link).map(parts => parts.map(x => x.startsWith('#link(') ? x : esc(x)).join(''));
    return `[#text(size: 1.15em, strong[${esc(m.title)}])${m.author ? ` \\ ${esc(m.author)}` : ''}\n\n${lines.join('\n\n')}]`;
}

/** the heading where the main text starts (page 1; the prefaces before it get roman numbers): books.json
 * "pdf": {"mainStart": "<h1 text>"}, otherwise the first h1. Returns false when there is none */
function markMain(doc, text) {
    const h1s = [...doc.querySelectorAll('h1')];
    const h = text ? h1s.find(h => textOf(h) == text) : h1s[0];
    if (text && !h) throw new Error(`pdf.mainStart '${text}' is not an h1 of the book`);
    if (h) h.dataset.main = '1';
    return !!h;
}

function fontDirFor(pairing) {
    const dir = path.join(buildDir, 'fonts', pairing), p = PAIRINGS[pairing];
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(dir, { recursive: true });
    new Set([p.body, p.heading, p.verse, 'Abhaya Uni']).forEach(f => FONT_FILES[f].forEach(n =>
        fs.symlinkSync(path.join(FONT_DIR, `${n}.ttf`), path.join(dir, `${n}.ttf`))));
    return dir;
}

// ---- pdf with typst
function typstPdf(m, doc, pairing, outPdf) {
    const p = PAIRINGS[pairing], dir = path.join(buildDir, `${m.folder}-typst-${pairing}`);
    fs.mkdirSync(dir, { recursive: true });
    ['book.typ', 'lib.typ'].forEach(f => fs.copyFileSync(path.join(__dirname, 'library', f), path.join(dir, f)));
    fs.writeFileSync(path.join(dir, 'meta.typ'), [
        `#let book-title = ${str(m.title)}`, `#let book-subtitle = ${str(m.subtitle)}`, `#let book-author = ${str(m.author)}`,
        `#let body-font = ${str(p.body)}`, `#let heading-font = ${str(p.heading)}`, `#let heading-weight = ${str(p.headingWeight)}`,
        `#let verse-font = ${str(p.verse)}`, `#let body-size = ${BODY_SIZE[p.body] || '10.5pt'}`, `#let toc-depth = ${m.tocDepth}`, `#let toc-columns = ${m.tocColumns}`, `#let fixed-note-marks = ${m.fixedNoteMarks}`, `#let note-columns = ${m.noteColumns}`,
        `#let info = ${infoTypst(m)}`, `#let has-main = ${markMain(doc, m.mainStart)}`, ''].join('\n'));
    softenWideTables(doc);
    fs.writeFileSync(path.join(dir, 'content.typ'), '#import "lib.typ": *\n\n' + toTypst(doc));
    const t = Date.now();
    execFileSync('typst', ['compile', '--no-pdf-tags', '--root', '/', '--ignore-system-fonts', '--font-path', fontDirFor(pairing),
        path.join(dir, 'book.typ'), outPdf], { stdio: ['ignore', 'inherit', 'inherit'] });
    return (Date.now() - t) / 1000;
}

// ---- proofs: the same sample pages in every pairing
// a chapter opener with verses, the table with the most row/col spans, the widest table, a page with footnotes from another book
function proofDoc(book) {
    const { doc } = loadBook(book);
    const out = new JSDOM('<body></body>').window.document;
    const add = (title, els) => {
        const h = out.createElement('h1'); h.textContent = title; out.body.appendChild(h);
        els.forEach(e => out.body.appendChild(out.importNode(e, true)));
    };
    const top = [...doc.body.children];
    const firstGatha = top.findIndex(e => e.matches('div.gatha'));
    const opener = top.slice(0, firstGatha).map((e, i) => [e, i]).filter(([e]) => e.matches('h1,h2')).pop()[1];
    add(textOf(top[opener]), top.slice(opener + 1, opener + 1 + Math.max(14, firstGatha - opener + 6)));
    const tables = top.map((e, i) => [e, i]).filter(([e]) => e.matches('table'));
    const spans = (t) => t.querySelectorAll('[rowspan],[colspan]').length;
    const bySpans = tables.slice().sort((a, b) => spans(b[0]) - spans(a[0]))[0], byCols = tables.slice().sort((a, b) => tableCols(b[0]) - tableCols(a[0]))[0];
    if (bySpans) add(`වගුව: ${spans(bySpans[0])} span`, top.slice(bySpans[1] - 2, bySpans[1] + 1).filter(e => !e.matches('h1,h2,h3,h4,h5')));
    if (byCols && byCols !== bySpans) add(`වගුව: තීරු ${tableCols(byCols[0])}`, top.slice(byCols[1] - 1, byCols[1] + 1).filter(e => !e.matches('h1,h2,h3,h4,h5')));
    // footnotes: the first chapter of a book that has notes
    const other = loadBook(bookList.find(b => b.folder == 'abhidharmaye-mulika-karunu')).doc;
    const ot = [...other.body.children], fi = ot.findIndex(e => e.querySelector('span.fn'));
    add('පාද සටහන්', ot.slice(Math.max(0, fi - 2), fi + 6).filter(e => !e.matches('h1,h2,h3,h4,h5')));
    out.querySelectorAll('h1,h2,h3,h4,h5').forEach((h, i) => { h.id = `h-${i + 1}`; });
    return out;
}

function proofs(folder) {
    const book = bookList.find(b => b.folder == folder);
    const dir = path.join(filesDir, 'proofs');
    fs.mkdirSync(dir, { recursive: true });
    const m = { ...bookMeta(book), tocDepth: 2 };
    for (const pairing of Object.keys(PAIRINGS)) {
        const pdf = path.join(dir, `${pairing}.pdf`), secs = typstPdf(m, proofDoc(book), pairing, pdf);
        execFileSync('pdftoppm', ['-r', '110', '-png', pdf, path.join(dir, pairing)]);
        console.log(`${pairing}: ${secs}s ${pdf}`);
    }
}

// ---- whole books
function outBase(book) {
    const dir = path.join(filesDir, book.library.folder);
    fs.mkdirSync(dir, { recursive: true });
    const author = book.author || book.subtitle || '';
    return path.join(dir, `${book.name}${book.group != 2 && author ? ` - ${author}` : ''}`);
}

function buildBook(book, opts) {
    const m = bookMeta(book), pairing = opts.fonts || (book.pdf && book.pdf.fonts) || DEFAULT_PAIRING, base = outBase(book);
    if (opts.pdf && book.library.keepPdf) console.log(`${book.folder}: pdf kept (library ${book.library.pdf}), html only`);
    else if (opts.pdf) {
        const secs = typstPdf(m, loadBook(book).doc, pairing, base + '.pdf');
        console.log(`${book.folder}: ${base}.pdf (${pairing}, ${secs}s)`);
    }
    if (opts.html) {
        const { singleHtml } = require('./library/html');
        const link = (url, text) => `<a href="${url}">${text}</a>`;
        fs.writeFileSync(base + '.html', singleHtml(m, loadBook(book), infoLines(m, link).map(parts => `<p>${parts.join('')}</p>`).join('\n')));
        console.log(`${book.folder}: ${base}.html`);
    }
}

// ---- command line
const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const flag = (name) => { const i = args.indexOf(name); return i >= 0 ? (args.splice(i, 1), true) : false; };
const fonts = opt('--fonts'), proof = opt('--proof');
const all = flag('--all'), noHtml = flag('--no-html'), noPdf = flag('--no-pdf');
if (fonts && !PAIRINGS[fonts]) throw new Error(`unknown pairing ${fonts}: ${Object.keys(PAIRINGS).join(', ')}`);
if (proof) proofs(proof);
else {
    const books = all ? bookList.filter(b => b.library && b.library.html && !b.site) : args.map(f => bookList.find(b => b.folder == f) || f);
    if (!books.length) console.log('usage: node dev/books/library-files.js <book folder>... | --all | --proof <folder>');
    for (const book of books) {
        if (typeof book == 'string') { console.log(`unknown book ${book}`); continue; }
        buildBook(book, { fonts, html: !noHtml, pdf: !noPdf });
    }
}
