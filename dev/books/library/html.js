/**
 * the single html file of a book for the tipitaka.lk library: one file with its styles and images inside, a linked
 * table of contents, numbered notes at the end of each chapter. The fonts are in the file too (about 330 KB): the
 * library serves it from tipitaka.lk and pitaka.lk sends no CORS header for its web fonts, and it works offline
 * singleHtml(m, {doc, headings}, info) - m from library-files.js bookMeta, info: the html of the information lines
 */

const fs = require('fs'), path = require('path');
const { tableShape } = require('./typst');

const escHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const FONT_DIR = path.join(__dirname, '../../../tools/unicode/fonts/web');
const font = (family, file, weight) => `@font-face { font-family: '${family}'; src: url(data:font/woff2;base64,${
    fs.readFileSync(path.join(FONT_DIR, file + '.woff2')).toString('base64')}) format('woff2'); font-weight: ${weight}; font-display: swap; }`;

const CSS = `
${font('Abhaya Uni', 'AbhayaUni-Regular', 'normal')}
${font('Abhaya Uni', 'AbhayaUni-Bold', 'bold')}
${font('Seela', 'Seela-Bold', 'bold')}
:root { --bg: #fdfbf7; --surface: #f6f0e6; --text: #29231c; --muted: #6b6155; --border: #e4d9c7; --heading: #6e2b12;
    --link: #9a3d12; --accent-soft: #f6e3d1; --verse: #7d3a14; color-scheme: light dark; }
@media (prefers-color-scheme: dark) { :root { --bg: #161412; --surface: #211e1a; --text: #e8e1d5; --muted: #a69c8d; --border: #39332b;
    --heading: #f0c08a; --link: #f2b56f; --accent-soft: #3b2b1b; --verse: #e9b27c; } }
* { box-sizing: border-box; }
html { scroll-padding-top: 52px; -webkit-text-size-adjust: 100%; }
body { margin: 0; background: var(--bg); color: var(--text); font: 19px/1.75 'Abhaya Uni', 'Noto Serif Sinhala', 'Iskoola Pota', serif; }
main { max-width: 760px; margin: 0 auto; padding: 0 16px 80px; }
a { color: var(--link); }
h1, h2, h3, h4, h5, .title { font-family: 'Seela', 'Abhaya Uni', 'Noto Serif Sinhala', serif; font-weight: bold; color: var(--heading); line-height: 1.4; }
h1 { font-size: 1.75em; text-align: center; margin: 2.4em 0 .9em; padding-top: 1.2em; border-top: 1px solid var(--border); }
h1::after { content: '෴'; display: block; font-size: .5em; margin-top: .2em; opacity: .7; }
h2 { font-size: 1.35em; text-align: center; margin: 1.8em 0 .7em; }
h3 { font-size: 1.18em; margin: 1.6em 0 .5em; }
h4 { font-size: 1.06em; margin: 1.3em 0 .4em; }
h5 { font-size: 1em; margin: 1.1em 0 .3em; font-family: inherit; }
p { margin: 0 0 .7em; text-align: justify; }
b, strong { color: var(--heading); }
.top { position: sticky; top: 0; z-index: 2; background: var(--bg); border-bottom: 1px solid var(--border); }
.top div { max-width: 760px; margin: 0 auto; padding: 0 16px; display: flex; gap: 12px; align-items: center; height: 44px; font-size: .9em; }
.top .name { flex: 1; min-width: 0; color: var(--muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.top a { text-decoration: none; font-weight: bold; }
.first-page { text-align: center; padding: 3em 0 2em; }
.title { font-size: 2.2em; margin: 0; }
.subtitle { font-size: 1.15em; margin-top: .3em; }
.author { font-size: 1.25em; margin-top: 1em; }
.orn { color: var(--heading); opacity: .7; margin: .6em 0; }
.info { font-size: .85em; color: var(--muted); text-align: center; margin: 1.5em auto 0; max-width: 34em; }
.info p { text-align: center; margin: 0 0 .4em; }
nav.toc { margin: 2em 0; padding: 1em 1.2em; background: var(--surface); border: 1px solid var(--border); border-radius: 12px; }
nav.toc h2 { margin: .2em 0 .6em; }
nav.toc ul { list-style: none; margin: 0; padding-left: 1.3em; }
nav.toc > ul { padding-left: 0; }
nav.toc li { margin: .15em 0; line-height: 1.5; }
nav.toc a { text-decoration: none; color: var(--text); }
nav.toc a:hover { color: var(--link); }
nav.toc .l1 > a { font-weight: bold; color: var(--heading); }
nav.toc .l1 { margin-top: .5em; }
.gatha { margin: .6em 0 .9em 1.25em; padding-left: .9em; border-left: 3px solid var(--accent-soft); color: var(--verse); }
.gatha > p { margin: 0; text-align: start; }
.gatha + .gatha { margin-top: -.3em; }
.subhead { color: var(--heading); font-weight: bold; font-size: 1.1em; margin: 1.2em 0 .4em; }
.subhead > p { margin: 0; }
.largefont { font-size: 1.15em; }
.centered, .centered p { text-align: center; }
ol.enum, ul.enum { list-style: none; padding-left: 2.4em; }
ol.enum > li > .li-num, ul.enum > li > .li-num { display: inline-block; min-width: 2.4em; margin-left: -2.4em; padding-right: .3em; color: var(--heading); }
span.gatha-number { font-size: .6em; position: relative; top: -.6em; margin-left: 1px; }
.image-placeholder { margin: 20px 0; text-align: center; }
.image-placeholder img, main img { max-width: 100%; height: auto; }
.img-label { display: block; margin-top: 8px; font-size: .9em; color: var(--muted); }
.table { overflow-x: auto; margin: 0 0 1em; }
table { border-collapse: collapse; font-size: .9em; }
td, th { border: 1px solid var(--border); padding: 4px 8px; text-align: left; vertical-align: top; line-height: 1.5; }
td > p, th > p { margin: 0; text-align: left; }
th.vert { writing-mode: vertical-rl; transform: rotate(180deg); text-align: left; vertical-align: bottom; padding: 8px 4px; white-space: nowrap; }
p.footnote { font-size: .85em; color: var(--muted); }
span.pg { display: none; }
sup.fn a { text-decoration: none; font-size: .8em; padding: 0 1px; }
ol.notes { margin: 2em 0 0; padding: 12px 0 0 1.6em; border-top: 1px solid var(--border); font-size: .85em; line-height: 1.6; color: var(--muted); }
ol.notes li { margin-bottom: .4em; }
ol.notes .back { text-decoration: none; margin-left: .3em; }
p.end-note { font-size: .85em; color: var(--muted); }
@media print { .top { display: none; } nav.toc { break-after: page; } h1 { break-before: page; border: 0; } }
`;

// the table of contents as nested lists (levels to depth); a heading goes under the last one of a higher level
function tocHtml(headings, depth) {
    const root = { level: 0, kids: [] }, stack = [root];
    for (const h of headings.filter(h => h.level <= depth)) {
        while (stack[stack.length - 1].level >= h.level) stack.pop();
        const node = { ...h, kids: [] };
        stack[stack.length - 1].kids.push(node);
        stack.push(node);
    }
    const list = (kids) => kids.length ? `<ul>${kids.map(k => `<li class="l${k.level}"><a href="#${k.id}">${escHtml(k.text)}</a>${list(k.kids)}</li>`).join('')}</ul>` : '';
    return list(root.kids);
}

function singleHtml(m, { doc, headings }, info) {
    // notes: numbered through the book, listed at the end of each chapter (before the next h1)
    let n = 0, pending = [];
    const flush = (before) => {
        if (!pending.length) return;
        const ol = doc.createElement('ol');
        ol.className = 'notes'; ol.start = pending[0].n;
        ol.innerHTML = pending.map(({ n, html }) => `<li id="fn-${n}">${html} <a class="back" href="#fr-${n}">↑</a></li>`).join('');
        before ? before.before(ol) : doc.body.appendChild(ol);
        pending = [];
    };
    for (const el of [...doc.body.children]) {
        if (el.tagName == 'H1') flush(el);
        el.querySelectorAll('span.fn').forEach(fn => {
            n++;
            pending.push({ n, html: fn.innerHTML });
            const sup = doc.createElement('sup');
            sup.className = 'fn';
            sup.innerHTML = `<a id="fr-${n}" href="#fn-${n}">${n}</a>`;
            fn.replaceWith(sup);
        });
    }
    flush(doc.body.querySelector('p.end-note'));

    // images inside the file; the local file paths of load.js go
    doc.querySelectorAll('img').forEach(img => {
        if (img.dataset.inline) img.setAttribute('src', img.dataset.inline);
        img.removeAttribute('data-inline'); img.removeAttribute('data-file');
        img.setAttribute('loading', 'lazy');
    });
    // tables scroll sideways on a narrow screen; header cells that do not fit the column are set vertically (as in the pdf)
    doc.querySelectorAll('table').forEach(t => {
        if (t.parentElement.closest('table')) return;
        const { vertical, headCells } = tableShape(t);
        if (vertical) headCells.forEach(c => { if (c.textContent.trim()) { const th = doc.createElement('th'); th.innerHTML = c.innerHTML; [...c.attributes].forEach(a => th.setAttribute(a.name, a.value)); th.classList.add('vert'); c.replaceWith(th); } });
        const wrap = doc.createElement('div'); wrap.className = 'table';
        t.before(wrap); wrap.appendChild(t);
    });
    doc.querySelectorAll('[data-main]').forEach(e => e.removeAttribute('data-main'));

    const title = escHtml(m.title), desc = escHtml([m.title, m.author].filter(Boolean).join(' - '));
    return `<!DOCTYPE html>
<html lang="si">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
${m.author ? `<meta name="author" content="${escHtml(m.author)}">\n` : ''}<link rel="canonical" href="${m.webUrl}">
<style>${CSS}</style>
</head>
<body>
<header class="top"><div><span class="name">${title}</span><a href="#toc">පටුන</a></div></header>
<main>
<div class="first-page">
<div class="title">${title}</div>
${m.subtitle ? `<div class="subtitle">${escHtml(m.subtitle)}</div>\n` : ''}<div class="orn">෴</div>
${m.author ? `<div class="author">${escHtml(m.author)}</div>\n` : ''}<div class="info">${info}</div>
</div>
<nav class="toc" id="toc"><h2>පටුන</h2>${tocHtml(headings, m.tocDepth)}</nav>
${doc.body.innerHTML}
</main>
</body>
</html>
`;
}

module.exports = { singleHtml };
