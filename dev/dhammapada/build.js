/**
 * builds the dhammapada site (pitaka.lk/dhammapada) from
 *   gatha.txt - the 423 gathas: '@' vagga name, 'k' new katha, 'g' another gatha of the same katha, '#' pali/sinhala separator
 *   ss/ss1-3.html - saddharma sagara stories (h1 vagga, h2 katha) -> dhammapada/ss/, the main index.html
 *   dhammapada_full.html - dhammapada atuwa stories (h1 katha) -> dhammapada/katha-*, vagga-*, index-old.html
 *   about.html - body of the about page
 * the html sources have been hand corrected - do not regenerate them from the docx files
 *
 * run "node dev/dhammapada/build.js" (or npm run build:dhammapada in dev/)
 * katha numbers are taken from the position in gatha.txt, mismatching numbers in the story sources are reported
 * paintings: 1000px jpgs in dhammapada/paintings, their webp versions are made here (needs cwebp)
 */

const fs = require('fs'), path = require('path');
const assert = require('assert');
const { JSDOM } = require('jsdom');
const { SITE, esc, shorten, icon, iconSprite, breadcrumbLd, head, writeSitemap, webpVersion, imageSize,
    linkButton, shareButton, appbar, pager, crumbs, writeAssets, splitPadas, searchLink, searchBody, writeSearchIndex, continueBox } = require('../site-lib');

const outRoot = path.join(__dirname, '../../dhammapada');
const assets = writeAssets(path.join(outRoot, 'common'), 'dhammapada', `${__dirname}/dhammapada.css`, `${__dirname}/dhammapada.js`); // hashed names
const baseUrl = `${SITE}/dhammapada/`;
const siteName = 'ධම්මපද කතා';

// ---- gathas, kathas and vaggas from gatha.txt
let gathaChecker = 0, kathaCount = 0;
const vaggas = fs.readFileSync(__dirname + '/gatha.txt', 'utf8').split('@').map(s => s.trim()).filter(s => s)
    .map((vaggaStr, vi) => {
        const [heading, ...kathaStrs] = vaggaStr.split('k').map(s => s.trim()).filter(s => s);
        assert(!heading.includes('\n'), `multiline vagga heading ${heading}`);
        const name = heading.replace(/^[\d.\s]+/, '');
        return { num: vi + 1, name, kathas: kathaStrs.map((ks, ki) => ({ local: ki + 1, gathas: ks.split('g').map(parseGatha) })) };
    });
function parseGatha(str) {
    const parts = str.split('#').map(s => s.trim()).filter(s => s);
    assert(parts.length == 2, `gatha ${str} should have 2 parts but has ${parts.length}`);
    const [numLine, ...paliLines] = parts[0].split(/\r?\n/);
    assert(/^\d+$/.test(numLine), `pali gatha part ${parts[0]} does not start with a number`);
    const num = Number(numLine);
    assert(num == ++gathaChecker, `incorrect gatha number ${num}. Should be ${gathaChecker}`);
    const lines = (s) => s.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    return { num, pali: lines(paliLines.join('\n')), sinhala: lines(parts[1]) };
}
vaggas.forEach(v => v.kathas.forEach(k => {
    k.index = ++kathaCount; k.vagga = v; k.label = `${v.num}-${k.local}`;
}));
const allKathas = vaggas.flatMap(v => v.kathas);
const NUM_KATHAS = allKathas.length, NUM_VAGGAS = vaggas.length, NUM_GATHAS = gathaChecker;
console.log(`${NUM_VAGGAS} vaggas, ${NUM_KATHAS} kathas, ${NUM_GATHAS} gathas`);

// ---- the two story editions
const editions = {
    ss: {
        key: 'ss', dir: 'ss/', root: '../', name: 'සද්ධර්ම සාගරය', from: 'සද්ධර්ම සාගරයෙන්',
        index: 'index.html', indexFromEd: '../index.html', indexUrl: baseUrl, // the main index of the site
        loadStories: loadSsStories,
    },
    atuwa: {
        key: 'atuwa', dir: '', root: '', name: 'ධම්මපද අටුවාව', from: 'ධම්මපද අටුවාවෙන්',
        index: 'index-old.html', indexFromEd: 'index-old.html', indexUrl: baseUrl + 'index-old.html',
        loadStories: loadAtuwaStories,
    },
};
const otherEdition = (ed) => ed.key == 'ss' ? editions.atuwa : editions.ss;

const parseHtml = (file) => new JSDOM(fs.readFileSync(file, 'utf8')).window.document;
const isEmptyP = (el) => el.tagName == 'P' && !el.textContent.trim() && !el.querySelector('img');
function siblingsUntil(el, stopSelector) {
    const items = [];
    for (let n = el.nextElementSibling; n && !n.matches(stopSelector); n = n.nextElementSibling) items.push(n);
    return items;
}
const kathaNumRe = /^\s*(\d+)\s*[-–.]\s*(\d+)/;
function checkNumber(text, katha, ed) {
    const m = kathaNumRe.exec(text);
    if (!m || `${m[1]}-${m[2]}` != katha.label) console.log(`${ed}: katha ${katha.index} is numbered '${text.trim().slice(0, 12)}' in the source, should be ${katha.label}`);
}

// atuwa: h1 per katha, '1.1 title' or '1-1 title'
function loadAtuwaStories() {
    const h1s = [...parseHtml(__dirname + '/dhammapada_full.html').querySelectorAll('h1')];
    assert(h1s.length == NUM_KATHAS, `atuwa has ${h1s.length} kathas, gatha.txt has ${NUM_KATHAS}`);
    return h1s.map((h1, i) => {
        checkNumber(h1.textContent, allKathas[i], 'atuwa');
        const items = siblingsUntil(h1, 'h1').filter(el => !isEmptyP(el));
        return { title: h1.textContent.replace(kathaNumRe, '').replace(/\s+/g, ' ').trim(), items, footnotes: [] };
    });
}

// saddharma sagara: h1 vagga, h2 katha followed by div.katha-ending with the number, footnotes at the end of each file
function loadSsStories() {
    const stories = [];
    for (const file of ['ss1', 'ss2', 'ss3']) {
        const doc = parseHtml(`${__dirname}/ss/${file}.html`);
        const footnotes = [...doc.querySelectorAll("li[id^='footnote-']")], used = new Set();
        new Set(footnotes.map(li => li.parentElement)).forEach(list => list.remove()); // the notes go to the kathas that refer to them
        doc.querySelectorAll('h2').forEach(h2 => {
            const katha = allKathas[stories.length], numDiv = h2.nextElementSibling;
            assert(katha, `more kathas in ss than in gatha.txt`);
            if (numDiv && numDiv.matches('.katha-ending')) {
                checkNumber(numDiv.textContent, katha, 'ss');
                numDiv.remove();
            } else console.log(`ss: katha number missing for ${h2.textContent}`);
            const items = siblingsUntil(h2, 'h1,h2').filter(el => !isEmptyP(el));
            if (!items.length || !items[items.length - 1].matches('.katha-ending')) console.log(`ss: last of the katha items is not an ending for ${katha.label}`);
            // renumber the footnotes from 1 in each katha
            const notes = [];
            items.forEach(el => el.querySelectorAll("a[id^='footnote-ref-']").forEach(ref => {
                const id = Number(ref.textContent.slice(1, -1));
                assert(id >= 1 && id <= footnotes.length, `footnote ${id} is out of range in ${file}`);
                notes.push(footnotes[id - 1]); used.add(id);
                ref.textContent = `[${notes.length}]`;
                ref.classList.add('footnote-ref');
            }));
            items.forEach(el => splitPadas(el, '.pali-gatha > p, .sinhala-kavi > p'));
            stories.push({ title: h2.textContent.replace(/\s+/g, ' ').trim(), items, footnotes: notes });
        });
        const unused = footnotes.map((li, i) => i + 1).filter(id => !used.has(id));
        if (unused.length) console.log(`ss: footnotes ${unused.join(', ')} of ${file} are not referred to`);
    }
    assert(stories.length == NUM_KATHAS, `ss has ${stories.length} kathas, gatha.txt has ${NUM_KATHAS}`);
    return stories;
}

// ---- page parts
const kathaFile = (k) => `katha-${k.index}.html`;
const vaggaFile = (v) => `vagga-${v.num}.html`;
const kathaHeading = (k, story) => `${k.label} ${story.title}`;

function paintingFigure(g, root, katha, { lazy = true } = {}) {
    const jpg = `${outRoot}/paintings/${g.num}.jpg`;
    const { width, height } = paintingSize(g);
    const webp = path.basename(webpVersion(jpg));
    return `<figure class="painting">
    <picture>
        <source type="image/webp" srcset="${root}paintings/${webp}">
        <img src="${root}paintings/${g.num}.jpg" width="${width}" height="${height}" alt="${esc(paintingAlt(g, katha))}"${lazy ? ' loading="lazy"' : ''} decoding="async">
    </picture>
</figure>`;
}
const sizes = {};
const paintingSize = (g) => sizes[g.num] ||= imageSize(`${outRoot}/paintings/${g.num}.jpg`);
const paintingAlt = (g, katha) => `ධම්මපද ගාථා ${g.num} සිතුවම - ${katha.vagga.name}`;
const audioTag = (g, root) => `<audio controls preload="none" data-gatha="${g.num}" src="${root}recordings/${g.num}.mp3" aria-label="ගාථා ${g.num} සජ්ඣායනය"></audio>`;
const gathaText = (g) => `<div class="pali" lang="pi" data-pagefind-weight="3">\n${g.pali.map(l => `<p>${esc(l)}</p>`).join('\n')}\n</div>
<div class="sinhala">\n${g.sinhala.map(l => `<p>${esc(l)}</p>`).join('\n')}\n</div>`;

const gathaRange = (v) => {
    const nums = v.kathas.flatMap(k => k.gathas.map(g => g.num));
    return [nums[0], nums[nums.length - 1]];
};

const IOS_APP = 1517198274;
function pageHtml({ headHtml, body, root, bodyClass = '', progress }) {
    const data = progress ? ` data-progress="dhammapada/${progress.key}" data-progress-path="${progress.path}" data-progress-title="${esc(progress.title)}" data-progress-label="${esc(progress.label)}"` : '';
    return `<!DOCTYPE html>
<html lang="si">
${headHtml}
<body${bodyClass ? ` class="${bodyClass}"` : ''}${data}>
${iconSprite(body)}
${body}
<div id="toast" role="status" aria-live="polite"></div>
<script src="${root}common/${assets.js}"></script>
</body>
</html>
`;
}
const footer = (extra = '') => `<footer class="note">
    ${extra}ධර්ම දානය පිණිස බෙදාහැරීමට ${icon('share')} මත click කර link එක ලබා ගන්න.
    <br>
    අන්තර්ජාලය නැතිව කියවීමට: <a href="https://play.google.com/store/apps/details?id=lk.pitaka.dhammapada">${icon('android')} Android</a>
    · <a href="https://apps.apple.com/app/id${IOS_APP}">iPhone / iPad</a>
    · <a href="https://tipitaka.lk/library/458">${icon('cloud_off')} පරිගණකයට</a>
    <br>
    <a href="${'ROOT'}about.html">ධම්මපදය ගැන</a> · <a href="${'ROOT'}about.html#privacy">Privacy Policy</a>
</footer>`;
const pageFooter = (root, extra) => footer(extra).replace(/ROOT/g, root);
const imageMeta = (g, katha) => {
    const { width, height } = paintingSize(g);
    return { url: `${baseUrl}paintings/${g.num}.jpg`, width, height, type: 'image/jpeg', alt: paintingAlt(g, katha) };
};
const logoImage = { url: `${baseUrl}common/logo.png`, width: 1000, height: 500, type: 'image/png' };
const commonHead = { siteName, themeColor: '#f6f0e6', css: [assets.css], appTitle: 'Dhammapada', extra: `<meta name="apple-itunes-app" content="app-id=${IOS_APP}">` };

// ---- writers
const written = []; // [{loc, file}] for the sitemap
function write(relPath, html) {
    const file = path.join(outRoot, relPath);
    fs.writeFileSync(file, html);
    written.push({ loc: baseUrl + relPath.replace(/(^|\/)index\.html$/, '$1'), file });
}

function writeKatha(ed, k, story) {
    const root = ed.root, v = k.vagga, heading = kathaHeading(k, story);
    const prev = allKathas[k.index - 2], next = allKathas[k.index];
    const url = baseUrl + ed.dir + kathaFile(k);
    const storyText = story.items.map(el => el.textContent).join(' ');
    const body = `${appbar({ left: linkButton(`${vaggaFile(v)}#katha-${k.index}`, 'arrow_upward', v.name), title: v.name, titleHref: `${vaggaFile(v)}#katha-${k.index}`, search: { action: root + 'search.html' } })}
${crumbs([[ed.key == 'ss' ? siteName : ed.name, `${ed.indexFromEd}#vagga-${v.num}`], [`${v.num}. ${v.name}`, `${vaggaFile(v)}#katha-${k.index}`]])}
<main class="page" data-pagefind-body data-pagefind-filter="edition:${ed.key}">
<div class="page-title"><h1>${esc(heading)}</h1>${shareButton(url, heading)}</div>
<p class="other-edition" data-pagefind-ignore>මෙම කතාව <a href="${root}${otherEdition(ed).dir}${kathaFile(k)}">${otherEdition(ed).from}</a> ද කියවන්න.</p>
${k.gathas.map((g, i) => `<section class="gatha-card" data-gatha="${g.num}">
<div class="gatha-num" data-pagefind-ignore>ගාථා ${g.num}</div>
${audioTag(g, root)}
${gathaText(g)}
${paintingFigure(g, root, k, { lazy: i > 0 })}
</section>`).join('\n')}
<div class="story prose">
${story.items.map(el => el.outerHTML).join('\n')}
${story.footnotes.length ? `<ol class="footnotes">\n${story.footnotes.map(li => li.outerHTML).join('\n')}\n</ol>` : ''}
</div>
${pager(prev && { href: kathaFile(prev), title: kathaHeading(prev, ed.stories[prev.index - 1]) }, next && { href: kathaFile(next), title: kathaHeading(next, ed.stories[next.index - 1]) })}
</main>
<span hidden data-pagefind-meta="book">${siteName} - ${ed.name}</span>
${pageFooter(root)}`;
    const headHtml = head({
        ...commonHead, root, url,
        title: `${heading} | ${siteName} - ${ed.name}`,
        description: shorten(storyText, 155),
        image: imageMeta(k.gathas[0], k),
        ld: [
            {
                '@type': 'Article', headline: heading, inLanguage: 'si', url,
                image: `${baseUrl}paintings/${k.gathas[0].num}.jpg`,
                isPartOf: { '@type': 'Book', name: ed.name, url: ed.indexUrl },
                audio: k.gathas.map(g => ({ '@type': 'AudioObject', name: `ධම්මපද ගාථා ${g.num}`, contentUrl: `${baseUrl}recordings/${g.num}.mp3`, encodingFormat: 'audio/mpeg' })),
            },
            breadcrumbLd([[ed.name, ed.indexUrl], [v.name, baseUrl + ed.dir + vaggaFile(v)], [heading, url]]),
        ],
    });
    write(ed.dir + kathaFile(k), pageHtml({ headHtml, body, root, bodyClass: 'katha-page',
        progress: { key: ed.key, path: ed.dir + kathaFile(k), title: heading, label: `${siteName} - ${ed.name}` } }));
}

function writeVagga(ed, v, stories) {
    const root = ed.root, [g1, g2] = gathaRange(v);
    const prev = vaggas[v.num - 2], next = vaggas[v.num];
    const url = baseUrl + ed.dir + vaggaFile(v);
    const kathas = v.kathas.map(k => {
        const heading = kathaHeading(k, stories[k.index - 1]);
        return `<section class="katha" id="katha-${k.index}">
<h2 class="katha-title"><a href="${kathaFile(k)}">${esc(heading)}</a></h2>
${k.gathas.map(g => `<div class="gatha" data-gatha="${g.num}">
${audioTag(g, root)}
<a class="gatha-link" href="${kathaFile(k)}">
<div class="gatha-text">${gathaText(g)}</div>
<img class="thumb" src="${root}thumbs/${g.num}.jpg" width="139" height="150" alt="" loading="lazy" decoding="async">
</a>
</div>`).join('\n')}
</section>`;
    }).join('\n');
    const body = `${appbar({ left: linkButton(`${ed.indexFromEd}#vagga-${v.num}`, 'home', 'මුල් පිටුව'), title: ed.key == 'ss' ? siteName : ed.name, titleHref: `${ed.indexFromEd}#vagga-${v.num}`, search: { action: root + 'search.html' } })}
<main class="page">
<div class="page-title"><h1 id="vagga-${v.num}">${v.num}. ${esc(v.name)}</h1>${shareButton(url, v.name)}</div>
<p class="lead">ගාථා ${g1}–${g2} · කතා ${v.kathas.length} · කතාව කියවීමට සහ සිතුවම් බැලීමට ගාථාව මත ඔබන්න.</p>
${kathas}
${pager(prev && { href: vaggaFile(prev), title: `${prev.num}. ${prev.name}` }, next && { href: vaggaFile(next), title: `${next.num}. ${next.name}` })}
</main>
${pageFooter(root)}`;
    const headHtml = head({
        ...commonHead, root, url,
        title: `${v.name} | ${siteName} - ${ed.name}`,
        description: `ධම්මපදයේ ${v.num} වන ${v.name}: ගාථා ${g1}-${g2} පාලියෙන් හා සිංහල තේරුම සමඟ, ගාථා සජ්ඣායනය, සිතුවම් සහ කතා ${v.kathas.length}.`,
        image: imageMeta(v.kathas[0].gathas[0], v.kathas[0]),
        ld: [breadcrumbLd([[ed.name, ed.indexUrl], [v.name, url]])],
    });
    write(ed.dir + vaggaFile(v), pageHtml({ headHtml, body, root, bodyClass: 'vagga-page' }));
}

const vaggaGrid = (dir) => `<div class="vagga-grid">
${vaggas.map(v => { const [g1, g2] = gathaRange(v); return `<a class="vagga-card" id="vagga-${v.num}" href="${dir}${vaggaFile(v)}"><span class="vagga-num">${v.num}</span><span class="vagga-text"><span class="vagga-name">${esc(v.name)}</span><span class="vagga-range">ගාථා ${g1}–${g2}</span></span></a>`; }).join('\n')}
</div>`;
const countsText = `ධම්මපදයේ වර්ග ${NUM_VAGGAS} ක් යටතේ ගාථා ${NUM_GATHAS} ක් ඇත. ඒ ගාථා ${NUM_GATHAS} කට අදාළ පාලියද, ඒවායේ සිංහල පරිවර්තනයන්ද,
    ඒ ගාථා වල අර්ථය ඉස්මතු වන පරිදි අඳින ලද චිත්‍ර ${NUM_GATHAS} ක් ද, ඒ ඒ ගාථා වලට අදාළ කතා වස්තුන් ${NUM_KATHAS} ක් ද මේ වෙබ් අඩවියේ මැනවින් පෙළ ගස්වා ඇත.`;

function writeMainIndex() { // saddharma sagara edition
    const url = baseUrl;
    const body = `${appbar({ title: siteName, brand: true, search: { action: 'search.html' } })}
<main class="page">
<h1 class="sr-only">${siteName}</h1>
<p class="lead">ගාථා ${NUM_GATHAS}, ඒවායේ සිංහල තේරුම, සජ්ඣායනය, සිතුවම් සහ කතා ${NUM_KATHAS}. දිනපතා එක කතාව බැගින් කියවන්න.</p>
${continueBox('dhammapada/')}
${vaggaGrid('ss/')}
<p class="edition-switch">මෙම කතා සද්ධර්ම සාගර පොතෙනි. පැරණි <a href="index-old.html">ධම්මපද අටුවාවේ කතා</a> ද කියවන්න.</p>
</main>
${pageFooter('', `${countsText}
    ගාථා වලට අදාළ කතා වස්තු ඛුද්දක නිකායේ ධම්මපද අටුවාව ඇසුරෙන් රචිත සද්ධර්ම සාගර කෘතියෙන් උපුටා ගන්නා ලදී.
    එම කෘතියේ පිටපතක් <a href="https://tipitaka.lk/library/656">මෙතැනින්</a> භාගත කරගන්න.
    <br>
    `)}`;
    const headHtml = head({
        ...commonHead, root: '', url, type: 'website',
        title: 'ධම්මපද කතා - ගාථා, සිංහල තේරුම, කතා සහ සිතුවම් | Dhammapada Stories',
        description: `ධම්මපදයේ ගාථා ${NUM_GATHAS} පාලියෙන් හා සිංහල තේරුම සමඟ, ගාථා සජ්ඣායනය, සිතුවම් ${NUM_GATHAS} ක් සහ සද්ධර්ම සාගරයෙන් කතා වස්තු ${NUM_KATHAS}.`,
        image: logoImage,
        ld: [{ '@type': 'WebSite', name: siteName, alternateName: 'Dhammapada Stories', url, inLanguage: 'si' },
            { '@type': 'Book', name: 'ධම්මපදය', inLanguage: ['si', 'pi'], url, hasPart: vaggas.map(v => ({ '@type': 'Chapter', name: v.name, url: `${baseUrl}ss/${vaggaFile(v)}` })) }],
    });
    write('index.html', pageHtml({ headHtml, body, root: '', bodyClass: 'index-page' }));
}

function writeAtuwaIndex() {
    const url = baseUrl + 'index-old.html';
    const body = `${appbar({ left: linkButton('index.html', 'home', siteName), title: 'ධම්මපද අටුවා කතා', brand: true, search: { action: 'search.html' } })}
<main class="page">
<h1 class="sr-only">ධම්මපද අටුවා කතා</h1>
<p class="lead">ගාථා ${NUM_GATHAS} සහ ඛුද්දක නිකායේ ධම්මපද අටුවාවෙන් උපුටා ගත් කතා ${NUM_KATHAS}. ඒ පිළිබඳ වැඩි විස්තර <a href="about.html">මෙතැනින්</a>.</p>
${continueBox('dhammapada/')}
${vaggaGrid('')}
<p class="edition-switch">අලුතින් එකතු කළ <a href="index.html">සද්ධර්ම සාගර පොතේ කතා</a> ද කියවන්න.</p>
</main>
${pageFooter('', countsText + '\n    <br>\n    ')}`;
    const headHtml = head({
        ...commonHead, root: '', url, type: 'website',
        title: 'ධම්මපද අටුවා කතා - ගාථා, සිංහල තේරුම සහ සිතුවම් | ධම්මපද කතා',
        description: `ධම්මපදයේ ගාථා ${NUM_GATHAS} පාලියෙන් හා සිංහල තේරුම සමඟ, ගාථා සජ්ඣායනය, සිතුවම් සහ ධම්මපද අටුවාවේ කතා වස්තු ${NUM_KATHAS}.`,
        image: logoImage,
        ld: [breadcrumbLd([[siteName, baseUrl], ['ධම්මපද අටුවාව', url]])],
    });
    write('index-old.html', pageHtml({ headHtml, body, root: '', bodyClass: 'index-page' }));
}

function writeAbout() {
    const url = baseUrl + 'about.html';
    const body = `${appbar({ left: linkButton('index.html', 'home', siteName), title: 'ධම්මපදය ගැන', search: { action: 'search.html' } })}
<main class="page prose about-page">
<h1>ධම්මපදය ගැන</h1>
${fs.readFileSync(__dirname + '/about.html', 'utf8').trim()}
</main>`;
    const headHtml = head({
        ...commonHead, root: '', url,
        title: 'ධම්මපදය ගැන - ප්‍රස්තාවනාව | ධම්මපද කතා',
        description: 'ධම්මපද අටුවා කතා උපුටා ගත් සිංහල අටුවා පරිවර්තන පොත් දෙකෙහි ප්‍රස්තාවනාව සහ සංඥාපනය.',
        image: logoImage,
        ld: [breadcrumbLd([[siteName, baseUrl], ['ධම්මපදය ගැන', url]])],
    });
    write('about.html', pageHtml({ headHtml, body, root: '', bodyClass: 'about' }));
}

function writeSearchPage() {
    const body = searchBody({ left: linkButton('index.html', 'home', siteName) });
    const headHtml = head({
        ...commonHead, root: '', url: baseUrl + 'search.html',
        title: `සොයන්න | ${siteName}`, description: 'ධම්මපද ගාථා සහ කතා තුළ වචන සොයන්න.',
        extra: commonHead.extra + '\n    <meta name="robots" content="noindex">',
    });
    fs.writeFileSync(path.join(outRoot, 'search.html'), pageHtml({ headHtml, body, root: '' }).replace('</body>', `<script type="module" src="common/${assets.search}"></script>\n</body>`));
}

// ---- build
for (const ed of Object.values(editions)) {
    const stories = ed.stories = ed.loadStories();
    allKathas.forEach((k, i) => writeKatha(ed, k, stories[i]));
    vaggas.forEach(v => writeVagga(ed, v, stories));
    console.log(`${ed.name}: wrote ${NUM_KATHAS} kathas and ${NUM_VAGGAS} vaggas`);
}
writeMainIndex();
writeAtuwaIndex();
writeAbout();
writeSearchPage();
writeSearchIndex(outRoot);
// the old saddharma sagara index, now the main index
fs.writeFileSync(`${outRoot}/ss/index.html`, `<!DOCTYPE html>
<html lang="si"><head><meta charset="UTF-8"><title>${siteName}</title><link rel="canonical" href="${baseUrl}">
<meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=../index.html"></head>
<body><a href="../index.html">${siteName}</a></body></html>
`);
const n = writeSitemap(`${outRoot}/sitemap.xml`, written, `${__dirname}/sitemap-lastmod.json`);
console.log(`sitemap with ${n} urls`);
