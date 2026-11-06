/**
 * the Buddha Jayanthi Tipitaka page viewer, pitaka.lk/bjt: the scanned pages of the 57 volumes (pali and sinhala on facing
 * pages) with their table of contents, searchable by title
 *   node bjt/build.js      (from dev/)
 * data.json: books {id: {name, offset, first, max, prefix}} - the page image of printed page p is
 *   newbooks/<id>/<prefix><offset + p, 3 digits>.jpg (first..max are the image numbers; pali on even pages, sinhala on odd)
 * and toc [[book, name, parent index, page, end page?], ...] - the titles of the volumes' contents, a tree under the three
 * pitakas (parent -1). The stars of the old viewer are kept as toc indexes (localStorage bjt-bookmarks), so keep the order.
 * The page images (bjt/newbooks, 3.9 GB) are only on the server.
 * Writes bjt/index.html (the contents, search and stars; the pages at ?b=<book>&p=<page>), bjt/intro.html (about,
 * help, downloads: ?goto=about|usage|download, the old addresses), bjt/sitemap.xml and bjt/common/
 */
const fs = require('fs'), path = require('path');
const { SITE, esc, icon, iconSprite, head, appbar, linkButton, writeAssets, breadcrumbLd, writeSitemap } = require('../site-lib');

const root = path.join(__dirname, '../../bjt'), common = path.join(root, 'common');
const { books, toc } = JSON.parse(fs.readFileSync(path.join(__dirname, 'data.json'), 'utf8'));
const siteName = 'බුද්ධ ජයන්ති ත්‍රිපිටකය', baseUrl = `${SITE}/bjt/`;
fs.mkdirSync(common, { recursive: true });

// the data for the page script, named by its content like the css and js
const data = JSON.stringify({ books, toc });
const dataName = `toc.${require('crypto').createHash('md5').update(data).digest('hex').slice(0, 8)}.json`;
for (const f of fs.readdirSync(common)) if (/^toc\.[0-9a-f]{8}\.json$/.test(f) && f != dataName) fs.unlinkSync(path.join(common, f));
fs.writeFileSync(path.join(common, dataName), data);
const assets = writeAssets(common, 'bjt', path.join(__dirname, 'bjt.css'), path.join(__dirname, 'bjt.js'));
fs.unlinkSync(path.join(common, assets.search)); // the pagefind search of the other sites: not used here
for (const f of ['favicon-96x96.png', 'app-logo.png']) fs.copyFileSync(path.join(__dirname, '../../books/common', f), path.join(common, f));
fs.copyFileSync(path.join(__dirname, 'og-bjt-500x300.png'), path.join(common, 'og-bjt-500x300.png'));

const image = { url: `${baseUrl}common/og-bjt-500x300.png`, width: 500, height: 300, type: 'image/png', alt: siteName };
const pageHead = (opts) => head({ siteName, root: '', image, css: [assets.css], themeColor: '#f6f0e6', type: 'website', ...opts,
    extra: `<meta name="google-site-verification" content="3q30uQ1_gO_dEVjUO6EsTgpovt8MHTyY75774HmTSb0">${opts.extra || ''}` });
const pageHtml = (headHtml, body) => `<!DOCTYPE html>
<html lang="si">
${headHtml}
<body>
${iconSprite(body)}
${body}
<div id="toast" role="status" aria-live="polite"></div>
<script src="common/${assets.js}"></script>
</body>
</html>
`;
const href = (e) => `./?b=${e[0]}&amp;p=${e[3]}`;
const children = toc.map(() => []);
toc.forEach((e, i) => { if (e[2] >= 0) children[e[2]].push(i); });

// index.html: the contents (the pitakas and their works here, deeper levels added by bjt.js), search results, stars,
// and the page view; bjt.js shows one or the other by the address
const tree = toc.map((e, i) => i).filter(i => toc[i][2] == -1).map(p => `<section class="pitaka">
<h2>${esc(toc[p][1])}</h2>
<ul class="toc-tree">${children[p].map(i => `<li data-i="${i}"><div class="toc-item"><button type="button" class="icon-btn toggle" aria-expanded="false" aria-label="ඇතුළත">${icon('expand_more')}</button><a href="${href(toc[i])}">${esc(toc[i][1])}</a></div></li>`).join('')}</ul>
</section>`).join('\n');
const searchBox = { action: './', page: true, placeholder: 'සූත්‍රයක නම සොයන්න' };
const indexBody = `${appbar({ left: linkButton('./', 'home', 'පටුන'), title: siteName, search: searchBox })}
<main class="page" id="home">
<h1>${siteName}</h1>
<p class="lead">ස්කෑන් කළ බුද්ධ ජයන්ති ත්‍රිපිටක වෙළුම් 57, පාළි සහ සිංහල පිටු පසෙක් පසෙක. සූත්‍රයක හෝ කොටසක නම ඉහළින් සොයන්න, නැතහොත් පහත පටුනෙන් තෝරන්න.</p>
<div id="search-area" hidden>
<div class="search-scope"><label for="scope">සොයන්නේ</label> <select id="scope"><option value="">සියලු පිටක</option>${toc.map((e, i) => i).filter(i => toc[i][2] == -1).map(p => `<option value="${p}">${esc(toc[p][1])}</option>`).join('')}</select></div>
<p id="search-status" class="lead" role="status"></p>
<ol id="results" class="bjt-list"></ol>
</div>
<section id="stars" hidden>
<h2>තරු යෙදූ මාතෘකා</h2>
<ol id="star-list" class="bjt-list"></ol>
</section>
<div id="contents">
${tree}
</div>
<nav class="bjt-links" aria-label="තවත්">
<a href="intro.html?goto=usage">භාවිතයට උපදෙස්</a>
<a href="intro.html?goto=download">PDF සහ app භාගත කරන්න</a>
<a href="intro.html?goto=about">මේ ගැන</a>
<a href="https://tipitaka.lk">tipitaka.lk – අකුරු වලින් ත්‍රිපිටකය</a>
<a href="../books/">බෞද්ධ පොත්</a>
</nav>
</main>
<main class="reader" id="reader" hidden>
<div class="reader-bar">
<nav class="crumbs" id="where" aria-label="පිහිටීම"></nav>
<div class="reader-tools">
<div class="sides" role="group" aria-label="පෙන්වන පිටු"><button type="button" data-side="pali" aria-pressed="false">පාළි</button><button type="button" data-side="both" aria-pressed="true">දෙකම</button><button type="button" data-side="sinh" aria-pressed="false">සිංහල</button></div>
<button type="button" class="icon-btn bjt-star" id="reader-star" aria-label="තරුවක් යොදන්න" hidden>${icon('star_outline', 'off')}${icon('star', 'on')}</button>
<button type="button" class="icon-btn share" id="reader-share" aria-label="link එක බෙදාගන්න">${icon('share')}</button>
</div>
</div>
<div class="sr-only" id="reader-title" role="heading" aria-level="1">${siteName}</div>
<nav class="pager spread-pager" aria-label="පිටු අතර යාම"><a class="prev" rel="prev" href="./">${icon('arrow_back')}පෙර පිටුව</a><span class="page-nums" id="page-nums"></span><a class="next" rel="next" href="./">ඊළඟ පිටුව${icon('arrow_forward')}</a></nav>
<div class="spread" id="spread"></div>
<nav class="pager spread-pager" aria-label="පිටු අතර යාම"><a class="prev" href="./">${icon('arrow_back')}පෙර පිටුව</a><span></span><a class="next" href="./">ඊළඟ පිටුව${icon('arrow_forward')}</a></nav>
</main>
<template id="star-icons">${icon('star_outline', 'off')}${icon('star', 'on')}</template>
<template id="expand-icon">${icon('expand_more')}</template>
<div id="bjt-data" data-src="common/${dataName}" hidden></div>`;
const description = 'බුද්ධ ජයන්ති ත්‍රිපිටකයේ ස්කෑන් කළ වෙළුම් 57, පාළි සහ සිංහල පිටු පසෙක් පසෙක, පටුනෙන් හෝ සූත්‍රයේ නමින් සොයා කියවන්න. Buddha Jayanthi Tripitaka online.';
fs.writeFileSync(path.join(root, 'index.html'), pageHtml(pageHead({ title: `${siteName} | Buddha Jayanthi Tripitaka`, description, url: baseUrl,
    ld: [{ '@type': 'WebSite', name: siteName, alternateName: 'Buddha Jayanthi Tripitaka', url: baseUrl, inLanguage: ['si', 'pi'] }] }), indexBody));

// intro.html: one page with the three sections the old menu linked to (?goto= scrolls to one)
const play = 'https://play.google.com/store/apps/details?id=lk.pitaka.buddhajayanthi';
const introBody = `${appbar({ left: linkButton('./', 'home', 'පටුන'), title: siteName })}
<main class="page prose">
<h1>${siteName} – මේ ගැන</h1>
<p class="lead"><a href="#usage">භාවිතයට උපදෙස්</a> · <a href="#download">භාගත කරන්න</a> · <a href="#about">අප ගැන</a></p>
<section id="usage">
<h2>භාවිතයට උපදෙස්</h2>
<ul>
<li>සූත්‍රයක හෝ කොටසක නම ඉහළ කොටුවේ සිංහලෙන් හෝ singlish වලින් (උදා: <i>satipattana</i>) ලියන්න. වෙළුම් 57 හි පටුන් වල ඇති නම් අතරින් ගැළපෙන ඒවා පෙන්වයි.</li>
<li>සෙවීම එක් පිටකයකට සීමා කිරීමට ප්‍රතිඵල වලට ඉහළින් ඇති ලැයිස්තුවෙන් පිටකය තෝරන්න.</li>
<li>පටුනෙන් තෝරා ගැනීමට මුල් පිටුවේ නිකායක හෝ පොතක නම අසල ඇති ${icon('expand_more')} ඔබා ඇතුළත කොටස් බලන්න.</li>
<li>පුළුල් තිරවල පාළි සහ සිංහල පිටු පසෙක් පසෙක පෙන්වයි. දුරකථනයේ එක් පිටුවක් පෙන්වන අතර, පාළි හා සිංහල අතර මාරු වීමට පිටුවට ඉහළින් ඇති බොත්තම් ඔබන්න.</li>
<li>පෙර සහ ඊළඟ පිටුවට යාමට පිටුවට ඉහළින් හා පහළින් ඇති බොත්තම් හෝ යතුරු පුවරුවේ ← → යතුරු භාවිතා කරන්න. පිටුව විශාල කර බැලීමට ඇඟිලි දෙකෙන් දිග හරින්න.</li>
<li>කැමති කොටසකට පසුව නැවත යාමට ${icon('star_outline')} ඔබා තරුවක් යොදන්න. තරු යෙදූ මාතෘකා මුල් පිටුවේ පෙන්වයි.</li>
<li>පිටුවක link එක බෙදා ගැනීමට ${icon('share')} ඔබන්න. අකුරු ප්‍රමාණය, අකුරු වර්ගය සහ අඳුරු තිරය <b>Aa</b> වලින් තෝරන්න.</li>
<li>පටුනේ නමක් වැරදි පිටුවකට යොමු වන බව දුටුවොත් කරුණාකර pathnirvana@gmail.com වෙත දන්වන්න.</li>
</ul>
</section>
<section id="download">
<h2>භාගත කරන්න</h2>
<h3>PDF</h3>
<p>වෙළුම් 57 ම PDF ලෙස <a href="https://tipitaka.lk/library/267">මෙතැනින් භාගත කළ හැක</a> (5.8 GB).</p>
<h3>Android</h3>
<p>Android දුරකථන සහ ටැබ්ලට් සඳහා <a href="${play}">බුද්ධ ජයන්ති ත්‍රිපිටක app එක</a> Google Play වෙතින් ලබා ගන්න.
අන්තර්ජාලය නොමැතිව (offline) භාවිතා කිරීමට පහත zip ගොනු දෙකෙන් එකක අන්තර්ගතය දුරකථනයේ හෝ SD card එකේ "Pictures" ගොනුවට copy කරන්න:</p>
<ol>
<li><a href="https://drive.google.com/open?id=1qiO3gY54cMVhGyCk9K8FPJUhS4AqlnWh">අකුරු වඩා පැහැදිලි පැරණි මුද්‍රණය</a> (3.5 GB)</li>
<li><a href="https://tipitaka.lk/library/456">අකුරු තරමක් අපැහැදිලි නව මුද්‍රණය</a> (2.3 GB)</li>
</ol>
<p>එවිට "Pictures/bjt_books" හෝ "Pictures/bjt_newbooks" ගොනුව තුළ 1 සිට 57 දක්වා නම් ඇති ගොනු 57 ක් තිබිය යුතුය. ඉන්පසු app එකට ඡායාරූප බැලීමට අවසර (permission) දෙන්න.</p>
<h3>Windows, Mac, Linux</h3>
<p>අන්තර්ජාලය නැති පරිගණක වල භාවිතා කළ හැකි පිටපත, පොත් සමඟ: zip ගොනුව දිග හැර "Buddha Jayanthi Tipitaka.html" විවෘත කරන්න.</p>
<ol>
<li><a href="https://tipitaka.lk/library/451">අකුරු වඩා පැහැදිලි පැරණි මුද්‍රණය</a> (3.5 GB)</li>
<li><a href="https://tipitaka.lk/library/453">අකුරු තරමක් අපැහැදිලි නව මුද්‍රණය</a> (2.3 GB)</li>
</ol>
<h3>iPhone, iPad</h3>
<p>App Store හි "Buddha Jayanthi Tripitaka" ලෙස සොයන්න.</p>
<h3>උදව්</h3>
<ul>
<li>මෘදුකාංග පිහිටුවීමට තාක්ෂණික උපදෙස්: පණ්ඩුක – 0771662048 හෝ පසන් – 0772336825</li>
<li>භික්ෂූන් වහන්සේලාට මේ මෘදුකාංග භාගත කිරීමට data රීලෝඩ් අවශ්‍ය නම්: ජනක විතානගේ +14165581617 (janakav@gmail.com)</li>
<li>මෙම මෘදුකාංගය සහිත DVD තැටි: චාමින්ද – 0770769101 හෝ cchaami@gmail.com</li>
</ul>
</section>
<section id="about">
<h2>අප ගැන</h2>
<p>මෙහි ස්කෑන් කළ බුද්ධ ජයන්ති ත්‍රිපිටක පොත් වහන්සේලා පහසුවෙන් පරිශීලනය කළ හැක. සෙවීම පහසු කිරීමට වෙළුම් 57 හි ම පටුන් භාවිතා කර ඇත. පටුන කියවීම පහසු වීමට සුදුසු තැන්වල හල් අකුරු යොදා ඇති අතර ඒ හැර වෙනත් වෙනසක් කර නැත.</p>
<p>බුද්ධ ජයන්ති ත්‍රිපිටකය ලොව පුරා ධර්මය හදාරන ප්‍රවීණයන්ගේ විශ්වසනීය ම ත්‍රිපිටක පිටපත වන අතර එහි සිංහල පරිවර්තනය ශ්‍රී ලංකාවේ වඩාත් ම පිළිගත් පරිවර්තනය වේ. එහි පෙළ අකුරු වලින්, සෙවිය හැකි ලෙස <a href="https://tipitaka.lk">tipitaka.lk</a> හි ඇත.</p>
<h3>පුණ්‍යානුමෝදනා</h3>
<p>ව්‍යක්ත පණ්ඩිත භික්ෂූන් වහන්සේලා විශාල නමකගේ වසර 30 ක 40 ක කැපවීමෙන් බිහිවුණු බුද්ධ ජයන්ති ත්‍රිපිටකයේ මුල් මුද්‍රණය අනුව යමින් එය සංරක්ෂණය කිරීමේ අභිප්‍රායෙන් මසක පමණ කාලයක් වෙහෙස වී මේ PDF පිටපත සකස් කරන ලදී.
This set of PDF files is an authentic recreation of the original Buddha Jayanthi Tipitaka book series of Sri Lanka.</p>
<p>මේ ව්‍යායාමය වසර 30 ගණනක් වෙහෙස මහන්සි වී බුද්ධ ජයන්ති පොත් පෙළ සකස් කළ මහා ථෙරවරුන්ට ද උන්වහන්සේලාගේ ඒ අප්‍රතිහත කැපවීමට ද කරන උපහාරයක් ම වේවා.</p>
<p>කලින් මෙම මෘදුකාංගය සඳහා සමින්ද රණසිංහ මහත්මා විසින් බුද්ධ ජයන්ති ත්‍රිපිටකය නව මුද්‍රණය ස්කෑන් කර aathaapi.org හි ඇතුළත් කළ PDF ගොනු භාවිතා කළ අතර ඒවා නොමිලේ ලබා දීම ගැන සමින්ද රණසිංහ මහත්මාට ගෞරවයෙන් කෘතඥතාව පළ කරමු.</p>
<h3>සහය වන්න | Contribute</h3>
<p>ඔබ පරිගණක කේතනය දන්නා අයෙක් නම්, අපට සහය වීමට අපගේ <a href="https://github.com/pathnirvana/pitaka.lk">github repo</a> වෙත පිවිසෙන්න.
If you are someone with programming knowledge, you can explore our <a href="https://github.com/pathnirvana/pitaka.lk">github repo</a> to contribute.</p>
</section>
</main>
<script>var goto=document.getElementById(new URLSearchParams(location.search).get('goto'));if(goto)goto.scrollIntoView()</script>`;
fs.writeFileSync(path.join(root, 'intro.html'), pageHtml(pageHead({ title: `මේ ගැන, භාවිතය, භාගත කරන්න | ${siteName}`,
    description: 'බුද්ධ ජයන්ති ත්‍රිපිටකය භාවිතයට උපදෙස්, PDF (5.8 GB) සහ Android, පරිගණක, iOS සඳහා offline පිටපත් භාගත කිරීම, සහ මේ ගැන.',
    url: `${baseUrl}intro.html`, ld: [breadcrumbLd([[siteName, baseUrl], ['මේ ගැන', `${baseUrl}intro.html`]])] }), introBody));

writeSitemap(path.join(root, 'sitemap.xml'), [{ loc: baseUrl, file: path.join(root, 'index.html') }, { loc: `${baseUrl}intro.html`, file: path.join(root, 'intro.html') }],
    path.join(__dirname, 'sitemap-lastmod.json'));
console.log(`bjt: ${toc.length} titles of ${Object.keys(books).length} volumes, ${dataName} ${Math.round(data.length / 1024)} KB`);
