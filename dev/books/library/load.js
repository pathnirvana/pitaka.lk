/**
 * reads a book of dev/books/input for the library files (single html, pdf)
 * the footnotes become inline <span class="fn"> at their reference (the pdf puts them at the page bottom, the html
 * turns them back into numbered notes), the headings get ids, the images get a file path and a data url
 */

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const { JSDOM } = require('jsdom');

const booksOut = path.join(__dirname, '../../../books'); // the built site, for the images saved by build.js
const textOf = (el) => el.textContent.replace(/\s+/g, ' ').trim();
const MIME = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', gif: 'image/gif', webp: 'image/webp' };

function loadBook(book) {
    const doc = new JSDOM(fs.readFileSync(path.join(__dirname, '../input', `${book.folder}.html`), 'utf8')).window.document;
    doc.querySelectorAll('head, style, script, meta, title').forEach(e => e.remove());

    // footnotes: the mammoth lists <li id="footnote-N"><p>text <a href="#footnote-ref-N">↑</a></p></li>
    const notes = new Map([...doc.querySelectorAll("li[id^='footnote-']")].map(li => [li.id.replace('footnote-', ''), li]));
    new Set([...notes.values()].map(li => li.parentElement)).forEach(list => list.remove());
    const used = new Set();
    doc.querySelectorAll("a[id^='footnote-ref-']").forEach(ref => {
        const n = ref.id.replace('footnote-ref-', ''), li = notes.get(n);
        const target = ref.closest('sup') || ref;
        if (!li) { target.remove(); return; }
        used.add(n);
        const fn = doc.createElement('span');
        fn.className = 'fn';
        li.querySelectorAll("a[href^='#footnote-ref-']").forEach(a => a.remove());
        fn.innerHTML = [...li.querySelectorAll(':scope > p')].map(p => p.innerHTML.trim()).join('<br>') || li.innerHTML.trim();
        // a note with no text (lost in the conversion) would only show a number: drop it, and say where it was
        if (!fn.textContent.replace(/[\s ]/g, '') && !fn.querySelector('img')) {
            const before = (target.previousSibling && target.previousSibling.textContent || '').replace(/\s+/g, ' ').slice(-40);
            console.log(`${book.folder}: empty footnote ${n} dropped, after "${before}"`);
            target.remove(); return;
        }
        target.replaceWith(fn);
    });
    // a note in a heading would show in the table of contents: move it to the start of the next paragraph
    doc.querySelectorAll('h1 span.fn, h2 span.fn, h3 span.fn, h4 span.fn, h5 span.fn').forEach(fn => {
        const h = fn.closest('h1,h2,h3,h4,h5');
        let next = h.nextElementSibling;
        while (next && next.matches('span.pg')) next = next.nextElementSibling;
        if (next && next.matches('p')) next.prepend(fn); else h.after(fn);
    });
    // notes with no reference in the text stay at the end of the book
    const unused = [...notes.entries()].filter(([n]) => !used.has(n)).map(([, li]) => li);
    unused.forEach(li => {
        li.querySelectorAll("a[href^='#footnote-ref-']").forEach(a => a.remove());
        const p = doc.createElement('p'); p.className = 'end-note'; p.innerHTML = li.textContent.trim() ? li.innerHTML.replace(/<\/?p[^>]*>/g, ' ').trim() : '';
        if (p.innerHTML) doc.body.appendChild(p);
    });

    // headings are bold already: their <b> would only show up in the table of contents
    doc.querySelectorAll('h1 b, h1 strong, h2 b, h2 strong, h3 b, h3 strong, h4 b, h4 strong, h5 b, h5 strong').forEach(b => b.replaceWith(...b.childNodes));
    // headings get stable ids for the table of contents and the bookmarks
    const headings = [...doc.querySelectorAll('h1,h2,h3,h4,h5')].map((h, i) => {
        h.id = `h-${i + 1}`;
        const c = h.cloneNode(true);
        c.querySelectorAll('span.fn').forEach(e => e.remove());
        return { el: h, level: Number(h.tagName[1]), id: h.id, text: textOf(c) };
    });

    // images: a file for the pdf and a data url for the single html
    doc.querySelectorAll('img').forEach(img => {
        const src = img.getAttribute('src') || '';
        let file = '', data = '';
        const m = /^data:image\/(\w+);base64,(.*)$/s.exec(src);
        if (m) {
            const buf = Buffer.from(m[2], 'base64'), ext = m[1] == 'jpeg' ? 'jpg' : m[1];
            file = path.join(booksOut, book.folder, 'images', `${crypto.createHash('md5').update(buf).digest('hex').slice(0, 10)}.${ext}`);
            if (!fs.existsSync(file)) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); }
            data = src;
        } else if (src && !/^https?:/.test(src)) {
            file = path.join(booksOut, book.folder, src);
            if (fs.existsSync(file)) data = `data:${MIME[path.extname(file).slice(1).toLowerCase()] || 'image/jpeg'};base64,${fs.readFileSync(file).toString('base64')}`;
            else file = '';
        }
        if (file) img.dataset.file = file;
        if (data) img.dataset.inline = data;
    });
    return { doc, headings, unused };
}

/** pdf only: in tables wider than minCols columns a word may break between letters (before a consonant or vowel that
 * does not continue a cluster), otherwise the Sinhala words of the narrow columns run out of their cells; the header
 * cells are set vertically (typst.js) and keep their words whole */
const tableCols = (t) => Math.max(...[...t.querySelectorAll('tr')].map(tr => [...tr.children].reduce((s, c) => s + (Number(c.getAttribute('colspan')) || 1), 0)));
function softenWideTables(doc, minCols = 14) {
    const ZW = /(?<=[\u0d80-\u0dff])(?<![\u0dca\u200d])(?=[\u0d85-\u0dc6])/g;
    doc.querySelectorAll('table').forEach(t => {
        if (tableCols(t) < minCols) return;
        const w = doc.createTreeWalker(t, 4 /* text */);
        for (let n; (n = w.nextNode());) if (!n.parentElement.closest('th, thead')) n.textContent = n.textContent.replace(ZW, '\u200b');
    });
}

module.exports = { loadBook, textOf, tableCols, softenWideTables };
