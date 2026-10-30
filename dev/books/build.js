/**
 * builds the books site (pitaka.lk/books) from the html files in dev/books/input and the list in books.json
 *   node dev/books/build.js               all books and the index pages
 *   node dev/books/build.js kunala-jathaka ...   only the given books (and the index pages)
 *
 * each h1-h4 in a book becomes a page named by its position e.g. 2-10-3.html - keep the headings stable, the urls depend on them
 * the input html files have been hand corrected - do not regenerate them from the docx files (see library-files.js for the pdfs)
 * new books: npx mammoth book.docx book.html --style-map=mammoth-styles.txt, then add to books.json
 * jathaka images: the 1376px jpgs in books/jathaka-images, their 1000px webp versions are made here (needs cwebp)
 */

const fs = require('fs'), path = require('path'), crypto = require('crypto');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { SITE, esc, shorten, icon, iconSprite, breadcrumbLd, head, writeSitemap, webpVersion, imageSize,
    linkButton, shareButton, appbar, pager, crumbs, writeAssets, splitPadas, searchLink, searchBody, writeSearchIndex, continueBox } = require('../site-lib');

const outRoot = path.join(__dirname, '../../books');
const baseUrl = `${SITE}/books/`;
const siteName = 'බෞද්ධ පොත්';
const bookList = JSON.parse(fs.readFileSync(__dirname + '/books.json', 'utf8'));
const groupNames = ['ත්‍රිපිටකය ආශ්‍රිත පොත්', 'රේරුකානේ චන්දවිමල හිමි', 'වෙනත් පොත්'];
const ogImage = { url: `${baseUrl}common/og-books-500x300.png`, width: 500, height: 300, type: 'image/png' };

const nameAuthor = (book) => [book.name, book.author || book.subtitle].filter(s => s).join(' - ');
const fileOf = (node) => `${node.ids.join('-')}.html`;
const parseHtml = (file) => new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
const textOf = (el) => el.textContent.replace(/\s+/g, ' ').trim();

// ---- page shell shared by all pages
const IOS_APP = 1516496078;
function pageHtml({ headHtml, body, root, book, progress }) {
    let data = book ? ` data-folder="${book.folder}" data-book="${esc(book.name)}"` : '';
    if (progress) data += ` data-progress="books/${book.folder}" data-progress-path="${progress.path}" data-progress-title="${esc(progress.title)}" data-progress-label="${esc(book.name)}"`;
    return `<!DOCTYPE html>
<html lang="si">
${headHtml}
<body${data}>
${iconSprite(body)}
${body}
<div id="toast" role="status" aria-live="polite"></div>
<script src="${root}common/book.js"></script>
</body>
</html>
`;
}
const pageHead = ({ extra = '', ...opts }) => head({
    siteName, themeColor: '#f6f0e6', css: ['book.css'], appTitle: 'Buddhist Books', image: ogImage,
    extra: `<meta name="apple-itunes-app" content="app-id=${IOS_APP}">${extra}`, ...opts,
});

const starButton = (node, label = 'තරුවක් යොදන්න') => `<button type="button" class="icon-btn star" data-ids="${node.ids.join('-')}" aria-label="${label}">${icon('star_outline', 'off')}${icon('star', 'on')}</button>`;
const bookmarksLink = (root) => linkButton(`${root}bookmarks.html`, 'star', 'තරු යෙදූ මාතෘකා');
const footer = (extra = '') => `<footer class="note">
    ${extra}ධර්ම දානය පිණිස බෙදාහැරීමට ${icon('share')} මත click කර link එක ලබා ගන්න.
    <br>
    මෙම පොත් අන්තර්ජාලය නැතිව කියවීමට: <a href="https://play.google.com/store/apps/details?id=lk.pitaka.books">${icon('android')} Android</a>
    · <a href="https://apps.apple.com/app/id${IOS_APP}">iPhone / iPad</a>
    · <a href="https://tipitaka.lk/library/461">${icon('cloud_off')} පරිගණකයට</a>
    <br>
    ෴
</footer>`;

// ---- reading a book: heading tree, footnotes, images
function loadBook(book) {
    const doc = parseHtml(`${__dirname}/input/${book.folder}.html`);
    const footnotes = new Map([...doc.querySelectorAll("li[id^='footnote-']")].map(li => [li.id, li]));
    new Set([...footnotes.values()].map(li => li.parentElement)).forEach(list => list.remove()); // each page gets the notes it refers to

    const headers = [...doc.querySelectorAll('h1,h2,h3,h4')];
    assert(headers.length, `no headings in ${book.folder}`);
    const roots = [], stack = [], nodes = [];
    headers.forEach(h => {
        const level = Number(h.tagName[1]);
        assert(h.parentElement === headers[0].parentElement, `heading ${textOf(h)} is not at the top level of ${book.folder}`);
        while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        const parent = stack[stack.length - 1];
        assert(parent ? level == parent.level + 1 : level == 1, `heading level jumps at '${textOf(h)}' in ${book.folder}`);
        const siblings = parent ? parent.children : roots;
        const node = { level, parent, header: h, children: [], ids: [...(parent ? parent.ids : []), siblings.length + 1] };
        node.items = siblingsUntil(h, 'h1,h2,h3,h4');
        siblings.push(node); stack.push(node); nodes.push(node);
    });
    // the title page and any introduction before the first heading
    const frontMatter = [];
    for (let n = headers[0].parentElement.firstElementChild; n && n !== headers[0]; n = n.nextElementSibling) frontMatter.push(n);

    const imgDir = path.join(outRoot, book.folder, 'images');
    const imgCtx = { book, imgDir, written: new Set() };
    nodes.forEach(node => {
        node.footnotes = takeFootnotes([node.header, ...node.items], footnotes);
        node.headerText = textOf(stripRefs(node.header));
        node.items = node.items.map(el => fixImages(el, imgCtx, node.headerText)).filter(el => el);
    });
    nodes.forEach(node => node.items.forEach(el => splitPadas(el, '.gatha > p'))); // also matches when el is the div.gatha
    const front = { items: frontMatter.map(el => fixImages(el, imgCtx, book.name)).filter(el => el && (textOf(el) || el.querySelector('img'))) };
    front.footnotes = takeFootnotes(front.items, footnotes);
    // notes with no ref in the text stay at the end of the book as before
    const used = new Set([front, ...nodes].flatMap(n => n.footnotes)), unused = [...footnotes.values()].filter(li => !used.has(li));
    if (unused.length) {
        console.log(`${book.folder}: footnotes ${unused.map(li => li.id.replace('footnote-', '')).join(', ')} are not referred to in the text - put on the last page`);
        nodes[nodes.length - 1].footnotes.push(...unused);
    }
    return { roots, nodes, front };
}
function siblingsUntil(el, stopSelector) {
    const items = [];
    for (let n = el.nextElementSibling; n && !n.matches(stopSelector); n = n.nextElementSibling) items.push(n);
    return items;
}
const stripRefs = (h) => { const c = h.cloneNode(true); c.querySelectorAll("a[id^='footnote-ref-']").forEach(a => (a.closest('sup') || a).remove()); return c; };

// renumber the footnote refs from 1 within a page and collect their notes
function takeFootnotes(elems, footnotes) {
    const notes = [];
    elems.forEach(el => el.querySelectorAll("a[id^='footnote-ref-']").forEach(ref => {
        const li = footnotes.get(ref.id.replace('footnote-ref-', 'footnote-'));
        assert(li, `footnote ${ref.id} has no note`);
        notes.push(li);
        ref.textContent = `[${notes.length}]`;
        ref.classList.add('footnote-ref');
    }));
    return notes;
}

// inline data: images to files, sizes and lazy loading, webp variants of the jathaka images, figures for the captioned images
function fixImages(el, ctx, context) {
    for (const ph of [el, ...el.querySelectorAll('.image-placeholder')].filter(e => e.matches('.image-placeholder'))) {
        const img = ph.querySelector('img'), label = ph.querySelector('.img-label');
        if (!img) {
            console.log(`${ctx.book.folder}: image missing for '${label ? textOf(label) : ''}' - skipped`);
            if (ph === el) return null;
            ph.remove(); continue;
        }
        const fig = ph.ownerDocument.createElement('figure');
        fig.className = 'image-placeholder';
        fig.appendChild(img);
        if (label) {
            const cap = ph.ownerDocument.createElement('figcaption');
            cap.className = 'img-label'; cap.textContent = textOf(label);
            fig.appendChild(cap);
            img.setAttribute('alt', textOf(label));
        }
        ph.replaceWith(fig);
        if (ph === el) el = fig;
    }
    el.querySelectorAll('img').forEach(img => {
        let src = img.getAttribute('src') || '';
        if (src.startsWith('data:')) src = saveDataImage(img, src, ctx);
        const file = path.join(outRoot, ctx.book.folder, src);
        if (src && !/^https?:/.test(src) && fs.existsSync(file)) {
            const { width, height } = imageSize(file);
            img.setAttribute('width', width); img.setAttribute('height', height);
            if (src.startsWith('../jathaka-images/')) {
                const picture = img.ownerDocument.createElement('picture'), source = img.ownerDocument.createElement('source');
                source.setAttribute('type', 'image/webp'); source.setAttribute('srcset', `../jathaka-images/${path.basename(webpVersion(file))}`);
                img.replaceWith(picture); picture.append(source, img);
            }
        }
        if (!img.hasAttribute('alt')) img.setAttribute('alt', context);
        img.setAttribute('loading', 'lazy'); img.setAttribute('decoding', 'async');
    });
    return el;
}
function saveDataImage(img, src, ctx) {
    const m = /^data:image\/(\w+);base64,(.*)$/s.exec(src);
    assert(m, `unsupported data url in ${ctx.book.folder}`);
    const data = Buffer.from(m[2], 'base64'), ext = m[1] == 'jpeg' ? 'jpg' : m[1];
    const name = `images/${crypto.createHash('md5').update(data).digest('hex').slice(0, 10)}.${ext}`;
    if (!ctx.written.has(name)) {
        fs.mkdirSync(ctx.imgDir, { recursive: true });
        fs.writeFileSync(path.join(outRoot, ctx.book.folder, name), data);
        ctx.written.add(name);
    }
    img.setAttribute('src', name);
    return name;
}

// ---- writing a book
const written = []; // [{loc, file}] for the sitemap
function write(relPath, html) {
    const file = path.join(outRoot, relPath);
    fs.writeFileSync(file, html);
    written.push({ loc: baseUrl + relPath.replace(/(^|\/)index\.html$/, '$1'), file });
}

function writeBook(book) {
    const { roots, nodes, front } = loadBook(book);
    const bookDir = path.join(outRoot, book.folder);
    fs.mkdirSync(bookDir, { recursive: true });
    fs.readdirSync(bookDir).filter(f => f.endsWith('.html')).forEach(f => fs.unlinkSync(path.join(bookDir, f)));

    // a page title must be unique within the book - add the parent headings when needed
    const titleOf = (n, depth) => [n, ...ancestors(n).reverse()].slice(0, depth + 1).map(a => a.headerText).join(' - ');
    const counts = (depth) => nodes.reduce((m, n) => m.set(titleOf(n, depth), (m.get(titleOf(n, depth)) || 0) + 1), new Map());
    nodes.forEach(n => n.title = n.headerText);
    for (let depth = 1; depth < 4; depth++) {
        const c = counts(depth - 1);
        nodes.filter(n => c.get(titleOf(n, depth - 1)) > 1).forEach(n => n.title = titleOf(n, depth));
    }
    const seen = new Set(); // same heading under the same parent: add the section number
    nodes.forEach(n => { if (seen.has(n.title)) n.title += ` (${n.ids.join('-')})`; seen.add(n.title); });

    writeBookIndex(book, roots, front);
    nodes.forEach((node, i) => writeChapter(book, node, nodes[i - 1], nodes[i + 1]));
    console.log(`${book.folder}: ${nodes.length} pages`);
    return nodes.length;
}
const ancestors = (node) => { const a = []; for (let p = node.parent; p; p = p.parent) a.unshift(p); return a; };
const bookUrl = (book) => `${baseUrl}${book.folder}/`;
const bookLd = (book) => ({
    '@type': 'Book', name: book.name, inLanguage: 'si', url: bookUrl(book), bookFormat: 'https://schema.org/EBook',
    ...(book.author ? { author: { '@type': 'Person', name: book.author } } : {}),
    ...(book.subtitle ? { alternativeHeadline: book.subtitle } : {}),
});

function tocEntry(node) {
    const toggle = node.children.length
        ? `<button type="button" class="toc-toggle" aria-expanded="true" aria-label="උප මාතෘකා">${icon('expand_more')}</button>`
        : `<span class="toc-leaf">${icon('navigate_next')}</span>`;
    return `<div class="toc-item" id="${node.ids.join('-')}">
<div class="toc-row" data-level="${node.level}">${toggle}<a href="${fileOf(node)}">${esc(node.headerText)}</a>${starButton(node)}</div>
${node.children.length ? `<div class="toc-children"><div class="toc-inner">\n${node.children.map(tocEntry).join('\n')}\n</div></div>` : ''}
</div>`;
}
const footnoteList = (notes) => notes.length ? `<ol class="footnotes">\n${notes.map(li => li.outerHTML).join('\n')}\n</ol>` : '';

function writeBookIndex(book, roots, front) {
    const url = bookUrl(book), lib = book.library;
    const frontText = front.items.map(textOf).join(' ');
    const libLinks = [
        lib.html ? `මෙම පොත සම්පූර්ණ එක වෙබ් පිටුවක් ලෙස <a href="https://tipitaka.lk/library/${lib.html}">මෙතනින්</a> කියවන්න.` : '',
        (lib.pdf || lib.altPdf) ? `PDF පොත <a href="https://tipitaka.lk/library/${lib.pdf || lib.altPdf}">මෙතනින්</a>.` : '',
    ].filter(s => s).join(' ');
    const body = `${appbar({ left: linkButton('../index.html', 'home', 'මුල් පිටුව'), title: book.name, right: searchLink(`../search.html?book=${book.folder}`) + bookmarksLink('../') })}
<main class="page">
<div class="book-head"><h1>${esc(book.name)}</h1>${book.author || book.subtitle ? `<p class="lead">${esc(book.author || book.subtitle)}</p>` : ''}</div>
${continueBox(`books/${book.folder}`, '../')}
${front.items.length ? `<details class="front-matter"${frontText.length < 800 ? ' open' : ''}>
<summary>${icon('navigate_next')}පොත ගැන</summary>
<div class="front-body prose">
${front.items.map(el => el.outerHTML).join('\n')}
${footnoteList(front.footnotes)}
</div>
</details>` : ''}
<nav class="toc" aria-label="පටුන">
${roots.map(tocEntry).join('\n')}
</nav>
</main>
${footer(libLinks ? libLinks + '\n    <br>\n    ' : '')}`;
    const headHtml = pageHead({
        root: '../', url, type: 'book',
        title: `${nameAuthor(book)} | ${siteName}`,
        description: shorten(frontText.length > 60 ? frontText : `${nameAuthor(book)}. පටුන: ${roots.map(n => n.headerText).join(', ')}`, 155),
        ld: [bookLd(book), breadcrumbLd([[siteName, baseUrl], [book.name, url]])],
    });
    write(`${book.folder}/index.html`, pageHtml({ headHtml, body, root: '../', book }));
}

function writeChapter(book, node, prev, next) {
    const url = `${bookUrl(book)}${fileOf(node)}`, anc = ancestors(node);
    const header = node.header.cloneNode(true);
    const text = node.items.map(textOf).join(' ');
    const subTitles = node.children.map(c => c.headerText).join(', ');
    const body = `${appbar({ left: linkButton(`index.html#${node.ids.join('-')}`, 'toc', 'පටුන'), title: book.name, titleHref: 'index.html', right: searchLink(`../search.html?book=${book.folder}`) })}
${crumbs([[siteName, '../index.html'], [book.name, `index.html#${node.ids.join('-')}`], ...anc.map(a => [a.headerText, fileOf(a)])])}
<main class="page prose" data-headings="${esc(JSON.stringify([...anc, node].map(n => n.headerText)))}" data-pagefind-body data-pagefind-filter="book:${book.folder}">
<div class="page-title"><h1>${header.innerHTML.trim()}</h1>${starButton(node)}${shareButton(url, node.headerText)}</div>
${node.items.map(el => el.outerHTML).join('\n').replace(/<div class="gatha">/g, '<div class="gatha" data-pagefind-weight="2">')}
${node.children.length ? `<nav class="subheadings toc" aria-label="අනු මාතෘකා" data-pagefind-ignore>
<h2>අනු මාතෘකා</h2>
${node.children.map(tocEntry).join('\n')}
</nav>` : ''}
${footnoteList(node.footnotes)}
${pager(prev && { href: fileOf(prev), title: prev.headerText }, next && { href: fileOf(next), title: next.headerText })}
</main>
<span hidden data-pagefind-meta="book">${esc(book.name)}</span>`;
    const headHtml = pageHead({
        root: '../', url,
        title: `${node.title} | ${book.name}`,
        description: shorten(text.length > 40 ? text : `${node.headerText} - ${book.name}. ${subTitles || text}`, 155),
        ld: [
            { '@type': 'Chapter', name: node.headerText, inLanguage: 'si', url, isPartOf: bookLd(book) },
            breadcrumbLd([[siteName, baseUrl], [book.name, bookUrl(book)], ...anc.map(a => [a.headerText, `${bookUrl(book)}${fileOf(a)}`]), [node.headerText, url]]),
        ],
    });
    write(`${book.folder}/${fileOf(node)}`, pageHtml({ headHtml, body, root: '../', book, progress: { path: `${book.folder}/${fileOf(node)}`, title: node.headerText } }));
}

// ---- site index and bookmarks
function writeTopIndex() {
    const shelves = groupNames.map((name, gi) => `<section class="shelf">
<h2>${esc(name)}</h2>
<ul class="book-list">
${bookList.filter(b => b.group == gi + 1).map(b => `<li><a href="${b.folder}/index.html"><span class="book-text"><span class="book-name">${esc(b.name)}</span>${gi != 1 && (b.author || b.subtitle) ? `<span class="book-author">${esc(b.author || b.subtitle)}</span>` : ''}</span>${icon('navigate_next')}</a></li>`).join('\n')}
</ul>
</section>`).join('\n');
    const body = `${appbar({ left: linkButton('https://tipitaka.lk/library/', 'library_books', 'පුස්තකාලය') + bookmarksLink(''), title: siteName, brand: true, right: searchLink('search.html') })}
<main class="page">
<h1 class="sr-only">${siteName}</h1>
<p class="lead">සිංහල බෞද්ධ පොත් ${bookList.length} ක් සම්පූර්ණයෙන් කියවන්න. පොතක් තෝරා පටුනෙන් පරිච්ඡේදයට පිවිසෙන්න.</p>
${continueBox('books/')}
${shelves}
</main>
${footer()}`;
    const headHtml = pageHead({
        root: '', url: baseUrl, type: 'website',
        title: 'බෞද්ධ පොත් - රේරුකානේ චන්දවිමල හිමි ඇතුළු පොත් සම්පූර්ණයෙන් කියවන්න',
        description: `රේරුකානේ චන්දවිමල හිමියන්ගේ පොත්, විශුද්ධි මාර්ගය, සද්ධර්ම රත්නාවලිය, පන්සිය පණස් ජාතකය, මිලින්ද ප්‍රශ්නය ඇතුළු බෞද්ධ පොත් ${bookList.length} ක් නොමිලේ කියවන්න.`,
        ld: [{ '@type': 'WebSite', name: siteName, alternateName: 'Buddhist Books', url: baseUrl, inLanguage: 'si' },
            { '@type': 'ItemList', name: siteName, itemListElement: bookList.map((b, i) => ({ '@type': 'ListItem', position: i + 1, url: bookUrl(b), name: b.name })) }],
    });
    write('index.html', pageHtml({ headHtml, body, root: '' }));
}

function writeBookmarks() {
    const body = `${appbar({ left: linkButton('index.html', 'home', 'මුල් පිටුව'), title: 'තරු යෙදූ මාතෘකා' })}
<main class="page">
<h1 class="sr-only">තරු යෙදූ මාතෘකා</h1>
<ul class="bookmark-list" id="bookmark-list"></ul>
<p class="lead" id="no-bookmarks" hidden>තවම තරු යොදා නැත. පසුව කියවීමට මාතෘකාවක් ඉදිරියෙන් ඇති ${icon('star_outline')} මත ඔබන්න.</p>
<template id="star-icon">${icon('star')}</template>
</main>`;
    const headHtml = pageHead({
        root: '', url: baseUrl + 'bookmarks.html',
        title: `තරු යෙදූ මාතෘකා | ${siteName}`,
        description: 'ඔබ තරු යෙදූ පොත් මාතෘකා.',
        extra: '\n    <meta name="robots" content="noindex">',
    });
    fs.writeFileSync(path.join(outRoot, 'bookmarks.html'), pageHtml({ headHtml, body, root: '' }));
}

function writeSearchPage() {
    const names = Object.fromEntries(bookList.map(b => [b.folder, b.name]));
    const scope = `<div class="search-scope" id="scope" data-books="${esc(JSON.stringify(names))}"><label><input type="radio" name="scope" value="book" checked> <span><span class="book-name"></span> තුළ පමණක්</span></label><label><input type="radio" name="scope" value="all"> සියලු පොත්</label></div>`;
    const body = searchBody({ left: linkButton('index.html', 'home', 'මුල් පිටුව'), scope });
    const headHtml = pageHead({
        root: '', url: baseUrl + 'search.html',
        title: `සොයන්න | ${siteName}`, description: `බෞද්ධ පොත් ${bookList.length} තුළ වචන සොයන්න.`,
        extra: '\n    <meta name="robots" content="noindex">',
    });
    fs.writeFileSync(path.join(outRoot, 'search.html'), pageHtml({ headHtml, body, root: '' }).replace('</body>', '<script type="module" src="common/search.js"></script>\n</body>'));
}

// ---- build
const only = process.argv.slice(2);
only.forEach(f => assert(bookList.some(b => b.folder == f), `unknown book ${f}`));
let pages = 0;
for (const book of bookList) {
    if (only.length && !only.includes(book.folder)) continue;
    pages += writeBook(book);
}
writeTopIndex();
writeBookmarks();
writeSearchPage();
writeAssets(path.join(outRoot, 'common'), 'book', `${__dirname}/book.css`, `${__dirname}/book.js`);
writeSearchIndex(outRoot);
if (!only.length) { // the sitemap needs all the pages
    const n = writeSitemap(`${outRoot}/sitemap.xml`, written, `${__dirname}/sitemap-lastmod.json`);
    console.log(`${pages} pages, sitemap with ${n} urls`);
}
