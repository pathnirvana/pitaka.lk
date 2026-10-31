/**
 * shared helpers for the static site generators (books, dhammapada)
 * page <head> with seo/social tags and json-ld, inline svg icons, sitemaps, image variants
 */

const fs = require('fs'), path = require('path');
const { execFileSync } = require('child_process');

const SITE = 'https://pitaka.lk';

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// collapse whitespace, cut at a word boundary
function shorten(text, max = 155) {
    const s = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max), sp = cut.lastIndexOf(' ');
    return (sp > max * 0.6 ? cut.slice(0, sp) : cut) + '…';
}

// material icons (apache 2.0) inlined as svg - no icon font to download, no ligature text shown while loading
const iconPaths = {
    home: 'M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z',
    arrow_back: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
    arrow_forward: 'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z',
    arrow_upward: 'M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z',
    share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
    star_outline: 'M22 9.24l-7.19-.62L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.63-7.03L22 9.24zM12 15.4l-3.76 2.27 1-4.28-3.32-2.88 4.38-.38L12 6.1l1.71 4.04 4.38.38-3.32 2.88 1 4.28L12 15.4z',
    star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    navigate_next: 'M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
    expand_less: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z',
    expand_more: 'M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    search: 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z',
    toc: 'M3 9h14V7H3v2zm0 4h14v-2H3v2zm0 4h14v-2H3v2zm16 0h2v-2h-2v2zm0-10v2h2V7h-2zm0 6h2v-2h-2v2z',
    dark_mode: 'M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-2.98 0-5.4-2.42-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z',
    link: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
    get_app: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z',
    cloud_off: 'M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z',
    android: 'M17.6 9.48l1.84-3.18c.16-.31.04-.69-.26-.85-.29-.15-.65-.06-.83.22l-1.88 3.24c-2.86-1.21-6.08-1.21-8.94 0L5.65 5.67c-.19-.29-.58-.38-.87-.2-.28.18-.37.54-.22.83L6.4 9.48C3.3 11.25 1.28 14.44 1 18h22c-.28-3.56-2.3-6.75-5.4-8.52zM7 15.25c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25zm10 0c-.69 0-1.25-.56-1.25-1.25s.56-1.25 1.25-1.25 1.25.56 1.25 1.25-.56 1.25-1.25 1.25z',
    library_books: 'M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 9H9V9h10v2zm-4 4H9v-2h6v2zm4-8H9V5h10v2z',
    picture_as_pdf: 'M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z',
};
function icon(name, cls = '') {
    if (!iconPaths[name]) throw new Error(`unknown icon ${name}`);
    return `<svg class="icon${cls ? ' ' + cls : ''}" aria-hidden="true" focusable="false"><use href="#i-${name}"/></svg>`;
}
// the icons used in a page, defined once at the top of its body
function iconSprite(html) {
    const names = [...new Set([...html.matchAll(/<use href="#i-(\w+)"/g)].map(m => m[1]))];
    if (!names.length) return '';
    return `<svg class="icon-sprite" aria-hidden="true" style="position:absolute;width:0;height:0;overflow:hidden">${names.map(n => `<symbol id="i-${n}" viewBox="0 0 24 24"><path d="${iconPaths[n]}"/></symbol>`).join('')}</svg>`;
}

const jsonLd = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;
const breadcrumbLd = (items) => ({ // items: [[name, absUrl], ...]
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});

/**
 * <head> for a page. url: absolute canonical url, root: relative path to the site folder (for common/),
 * image: {url, width, height, type, alt}, ld: array of json-ld nodes (put in one @graph)
 */
function head({ title, description, url, root, siteName, themeColor = "#ffa07a", image, type = 'article', ld = [], css = [], extra = '', appTitle }) {
    const lines = [
        `<meta charset="UTF-8">`,
        `<title>${esc(title)}</title>`,
        `<meta name="description" content="${esc(description)}">`,
        `<link rel="canonical" href="${esc(url)}">`,
        `<meta name="viewport" content="width=device-width, initial-scale=1">`,
        `<meta name="theme-color" content="${themeColor}">`,
        `<meta property="og:type" content="${type}">`,
        `<meta property="og:site_name" content="${esc(siteName)}">`,
        `<meta property="og:locale" content="si_LK">`,
        `<meta property="og:title" content="${esc(title)}">`,
        `<meta property="og:description" content="${esc(description)}">`,
        `<meta property="og:url" content="${esc(url)}">`,
    ];
    if (image) lines.push(
        `<meta property="og:image" content="${esc(image.url)}">`,
        `<meta property="og:image:type" content="${image.type}">`,
        `<meta property="og:image:width" content="${image.width}">`,
        `<meta property="og:image:height" content="${image.height}">`,
        image.alt ? `<meta property="og:image:alt" content="${esc(image.alt)}">` : '',
        `<meta name="twitter:card" content="${image.width >= 600 ? 'summary_large_image' : 'summary'}">`,
    );
    lines.push(
        `<meta name="mobile-web-app-capable" content="yes">`,
        `<meta name="apple-mobile-web-app-capable" content="yes">`,
        appTitle ? `<meta name="apple-mobile-web-app-title" content="${esc(appTitle)}">` : '',
        `<link rel="apple-touch-icon" href="${root}common/app-logo.png">`,
        `<link rel="icon" type="image/png" sizes="96x96" href="${root}common/favicon-96x96.png">`,
        `<link rel="preload" href="/tools/unicode/fonts/web/AbhayaUni-Regular.woff2" as="font" type="font/woff2" crossorigin>`,
        ...css.map(f => `<link rel="stylesheet" href="${root}common/${f}">`),
        themeScript,
        extra,
        ld.length ? jsonLd({ '@context': 'https://schema.org', '@graph': ld }) : '',
    );
    return '<head>\n    ' + lines.filter(l => l).join('\n    ') + '\n</head>';
}

// the reading settings are applied before the first paint: light unless chosen in the settings (the old books app
// theme switch is not carried over), the old books app font size is
const themeScript = `<script>try{var d=document.documentElement,s=localStorage,t=s.getItem('pitaka-theme'),f=s.getItem('pitaka-font-scale')||s.getItem('books-font-scale');if(t&&t!='light')d.dataset.theme=t;if(f)d.style.setProperty('--font-scale',f)}catch(e){}if(location.protocol=='file:')d.classList.add('local')</script>`; // local: inside the apps

// ---- page parts shared by the sites (styles in reader.css, behaviour in reader.js)
const linkButton = (href, iconName, label) => `<a class="icon-btn" href="${href}" aria-label="${esc(label)}">${icon(iconName)}</a>`;
const shareButton = (url, title) =>
    `<button type="button" class="icon-btn share" data-url="${esc(url)}" data-title="${esc(title)}" aria-label="link එක බෙදාගන්න">${icon('share')}</button>`;
// the top bar: on the web a search field (as on pitaka.lk/main) in place of the title, which is shown in the apps
// search: {action: the search.html of the site, book: folder to search in, placeholder, page: true on search.html}
function appbar({ left = '', title, titleHref, brand = false, right = '', search }) {
    const t = titleHref ? `<a href="${titleHref}">${esc(title)}</a>` : esc(title);
    const settingsBtn = `<button type="button" class="icon-btn settings-btn" aria-label="කියවීමේ සැකසුම්" aria-expanded="false" aria-controls="settings">Aa</button>`;
    const field = search ? `<form class="appbar-search" action="${search.action}" role="search"${search.page ? ' onsubmit="return false"' : ''}>${icon('search')}` +
        `${search.book ? `<input type="hidden" name="book" value="${search.book}">` : ''}<input type="search" name="q"${search.page ? ' id="q"' : ''} ` +
        `placeholder="${esc(search.placeholder || 'සොයන්න')}" aria-label="සොයන්න" autocomplete="off" enterkeyhint="search"></form>` : '';
    const titleDiv = `<div class="appbar-title${brand ? ' brand' : ''}${search ? ' app-only' : ''}">${t}</div>`;
    const bar = `<header class="appbar">${left || '<span class="icon-btn"></span>'}${titleDiv}${field}${right}${settingsBtn}</header>`;
    return `${bar}
<div class="settings" id="settings" role="dialog" aria-label="කියවීමේ සැකසුම්" hidden>
<h2>අකුරු ප්‍රමාණය</h2>
<div class="row"><button type="button" class="size-btn smaller" aria-label="අකුරු කුඩා කරන්න">අ</button><output>100%</output><button type="button" class="size-btn larger" aria-label="අකුරු විශාල කරන්න">අ</button></div>
<h2>පසුබිම</h2>
<div class="row"><button type="button" class="theme-choice" data-choice="light" aria-pressed="true">සුදු</button><button type="button" class="theme-choice" data-choice="sepia" aria-pressed="false">පුස්කොළ</button><button type="button" class="theme-choice" data-choice="dark" aria-pressed="false">අඳුරු</button></div>
</div>`;
}
const continueBox = (want, root = '') => `<div class="continue" data-continue="${want}"${root ? ` data-root="${root}"` : ''} hidden><template>${icon('close')}</template></div>`;
const searchLink = (href) => `<a class="icon-btn search-link" href="${href}" aria-label="සොයන්න">${icon('search')}</a>`;
// the search page; scope: label of the 'this book only' choice when the page is opened from a book (?book=)
const searchBody = ({ left, scope = '' }) => `${appbar({ left, title: 'සොයන්න', search: { action: 'search.html', page: true, placeholder: 'සිංහලෙන් හෝ singlish' } })}
<main class="page search-page">
<h1 class="sr-only">සොයන්න</h1>
${scope}
<p id="search-status" class="lead" role="status"></p>
<ol id="results" class="results"></ol>
<button type="button" id="more" class="more-btn" hidden>තවත් ප්‍රතිඵල</button>
</main>`;
// the singlish (sinhala in english letters) library of the search pages, shared by the sites at /static/singlish-search
function writeSinglish() {
    const src = path.join(__dirname, '../node_modules/@pnfo/singlish-search'), out = path.join(__dirname, '../../static/singlish-search');
    fs.mkdirSync(out, { recursive: true });
    for (const f of ['singlish.js', 'singlish-model.js', 'LICENSE']) {
        const from = path.join(src, f), to = path.join(out, f);
        if (!fs.existsSync(to) || !fs.readFileSync(to).equals(fs.readFileSync(from))) fs.copyFileSync(from, to);
    }
}

// the pagefind search index of a built site (pages marked data-pagefind-body)
function writeSearchIndex(siteDir) {
    writeSinglish();
    fs.rmSync(path.join(siteDir, 'pagefind'), { recursive: true, force: true });
    execFileSync(path.join(__dirname, '../node_modules/.bin/pagefind'), ['--site', siteDir, '--output-subdir', 'pagefind'], { stdio: 'pipe' });
    writeSearchWords(siteDir);
}
// the words of the indexed pages (seen twice or more) with their counts, one file per first letter (search-words/<hex>.txt),
// so that a singlish word can be turned into the sinhala words really in the texts, loading only a few small files
function writeSearchWords(siteDir) {
    const counts = new Map();
    const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
        const f = path.join(dir, e.name);
        if (e.isDirectory()) { if (!['pagefind', 'search-words', 'common', 'jathaka-images', 'paintings', 'thumbs', 'recordings', 'Android'].includes(e.name)) walk(f); return; }
        if (!e.name.endsWith('.html')) return;
        const m = /<main[^>]*data-pagefind-body[^>]*>([\s\S]*?)<\/main>/.exec(fs.readFileSync(f, 'utf8'));
        if (m) for (const w of m[1].replace(/<[^>]+>/g, ' ').match(/[\u0D80-\u0DFF\u200C\u200D]+/g) || []) counts.set(w, (counts.get(w) || 0) + 1);
    });
    walk(siteDir);
    const shards = new Map();
    for (const [w, n] of counts) {
        if (n < 2) continue;
        const k = w.codePointAt(0).toString(16);
        if (!shards.has(k)) shards.set(k, []);
        shards.get(k).push([w, n]);
    }
    const out = path.join(siteDir, 'search-words');
    fs.rmSync(out, { recursive: true, force: true });
    fs.mkdirSync(out);
    for (const [k, list] of shards) fs.writeFileSync(path.join(out, `${k}.txt`), list.sort((a, b) => b[1] - a[1]).map(([w, n]) => `${w} ${n}`).join('\n') + '\n');
}

const pager = (prev, next, [prevLabel, nextLabel] = ['පෙර', 'ඊළඟ']) => (prev || next) ? `<nav class="pager" aria-label="පිටු අතර යාම" data-pagefind-ignore>
${prev ? `<a class="prev" rel="prev" href="${prev.href}"><span class="pager-label">${icon('arrow_back')}${prevLabel}</span><span class="pager-title">${esc(prev.title)}</span></a>` : ''}
${next ? `<a class="next" rel="next" href="${next.href}"><span class="pager-label">${nextLabel}${icon('arrow_forward')}</span><span class="pager-title">${esc(next.title)}</span></a>` : ''}
</nav>` : '';
const crumbs = (items) => `<nav class="crumbs" aria-label="පිහිටීම">${items.map(([text, href]) => `<a href="${href}">${esc(text)}</a>`).join(icon('navigate_next'))}</nav>`;

// common/<name>.css and .js of a site: the shared reader files followed by the site's own
// the file names carry a hash of the content (book.3f2a1c.css), so a browser never uses an old copy with new pages:
// the old site was served without cache headers and browsers kept its css for weeks. returns {css, js, search} names
function writeAssets(commonDir, name, siteCss, siteJs) {
    const read = (f) => fs.readFileSync(f, 'utf8');
    const generated = (src) => `/* generated by the build from dev/site-lib/reader.* and ${path.relative(path.join(__dirname, '..'), src)} - edit those */\n`;
    const files = {
        css: [name, 'css', generated(siteCss) + read(path.join(__dirname, 'reader.css')) + '\n' + read(siteCss)],
        js: [name, 'js', generated(siteJs) + read(path.join(__dirname, 'reader.js')) + '\n' + read(siteJs)],
        search: ['search', 'js', generated(path.join(__dirname, 'search.js')) + read(path.join(__dirname, 'search.js'))],
    };
    const names = {};
    for (const [key, [base, ext, text]] of Object.entries(files)) {
        names[key] = `${base}.${require('crypto').createHash('md5').update(text).digest('hex').slice(0, 8)}.${ext}`;
        for (const f of fs.readdirSync(commonDir)) if (new RegExp(`^${base}(\\.[0-9a-f]{8})?\\.${ext}$`).test(f) && f != names[key]) fs.unlinkSync(path.join(commonDir, f));
        if (!fs.existsSync(path.join(commonDir, names[key]))) fs.writeFileSync(path.join(commonDir, names[key]), text);
    }
    return names;
}

// lastmod comes from the content hash of each page so it only changes when the page changes
function writeSitemap(file, entries, stateFile) { // entries: [{loc, file}], stateFile: kept in dev/, not deployed
    const crypto = require('crypto');
    const prev = fs.existsSync(stateFile) ? JSON.parse(fs.readFileSync(stateFile, 'utf8')) : {};
    const today = new Date().toISOString().slice(0, 10), next = {};
    const urls = entries.map(({ loc, file: f }) => {
        const hash = crypto.createHash('md5').update(fs.readFileSync(f)).digest('hex').slice(0, 12);
        const lastmod = prev[loc] && prev[loc].hash == hash ? prev[loc].lastmod : today;
        next[loc] = { hash, lastmod };
        return `<url><loc>${esc(loc)}</loc><lastmod>${lastmod}</lastmod></url>`;
    });
    fs.writeFileSync(file, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
    fs.writeFileSync(stateFile, JSON.stringify(next, null, 0).replace(/},/g, '},\n'));
    return urls.length;
}

/**
 * webp version of a jpg/png (<name>.webp next to it, at most maxWidth wide), made only when missing or older than the source
 * one size is enough: a phone at 2-3x pixel density needs ~1000px for a full width image anyway. needs cwebp (brew install webp)
 */
function webpVersion(srcFile, { maxWidth = 1000, quality = 72 } = {}) {
    const out = srcFile.replace(/\.\w+$/, '.webp');
    if (!fs.existsSync(out) || fs.statSync(out).mtimeMs < fs.statSync(srcFile).mtimeMs) {
        const resize = imageSize(srcFile).width > maxWidth ? ['-resize', String(maxWidth), '0'] : [];
        execFileSync('cwebp', ['-quiet', '-q', String(quality), '-m', '6', ...resize, srcFile, '-o', out]);
    }
    return out;
}

/**
 * verse lines typed as two padas 'a b c - d e f' become <span class="pada">..</span><span class="pada-sep"> - </span>
 * <span class="pada pada-2">..</span>, so that narrow screens can show each pada on its own line (reader.css)
 * only balanced lines (2+ words, 8-40 Sinhala letters a side) whose tags do not cross the separator
 */
function splitPadas(root, selector) {
    const letters = (s) => (s.match(/[\u0D80-\u0DFF]/g) || []).length;
    const balanced = (h) => (h.match(/<\w/g) || []).length == (h.match(/<\//g) || []).length;
    let n = 0;
    root.querySelectorAll(selector).forEach(p => {
        const halves = p.textContent.split(/\s+[-–]\s+/);
        if (halves.length != 2 || !halves.every(h => h.trim().split(/\s+/).length >= 2 && letters(h) >= 8 && letters(h) <= 40)) return;
        const parts = p.innerHTML.split(/\s+[-–]\s+/);
        if (parts.length != 2 || !parts.every(balanced)) return;
        p.innerHTML = `<span class="pada">${parts[0].trim()}</span><span class="pada-sep"> - </span><span class="pada pada-2">${parts[1].trim()}</span>`;
        n++;
    });
    return n;
}

// image dimensions of a jpg/png/webp read from the file header (no dependencies)
function imageSize(file) {
    const b = fs.readFileSync(file);
    if (b[0] == 0x89 && b[1] == 0x50) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.toString('ascii', 0, 4) == 'RIFF' && b.toString('ascii', 8, 12) == 'WEBP') {
        const chunk = b.toString('ascii', 12, 16);
        if (chunk == 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
        if (chunk == 'VP8L') { const n = b.readUInt32LE(21); return { width: (n & 0x3fff) + 1, height: ((n >> 14) & 0x3fff) + 1 }; }
        return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    }
    for (let i = 2; i < b.length;) { // jpeg: walk the segments to the SOFn frame header
        if (b[i] != 0xff) { i++; continue; }
        const m = b[i + 1], len = b.readUInt16BE(i + 2);
        if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
        i += 2 + len;
    }
    throw new Error(`can not read the image size of ${file}`);
}

module.exports = { SITE, esc, shorten, icon, iconSprite, jsonLd, breadcrumbLd, head, writeSitemap, webpVersion, imageSize,
    linkButton, shareButton, appbar, pager, crumbs, writeAssets, splitPadas, searchLink, searchBody, writeSearchIndex, continueBox };
