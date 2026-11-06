// the Buddha Jayanthi Tipitaka viewer (bjt/index.html, made by dev/bjt/build.js): the contents tree, search by title, the
// stars, and the pages of a volume at ?b=<book>&p=<printed page> - pali on the even pages, sinhala on the odd ones
(() => {
const dataEl = document.getElementById('bjt-data');
if (!dataEl) return;
const $ = (id) => document.getElementById(id);
const escHtml = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const BOOK = 0, NAME = 1, PARENT = 2, PAGE = 3; // toc entry: [book, name, parent, page, end page?]
let books, toc, children;

// stars: toc indexes, as kept by the old viewer
const starsKey = 'bjt-bookmarks';
const stars = (() => { try { return (JSON.parse(storage.get(starsKey) || '[]') || []).map(Number); } catch (e) { return []; } })();
const starred = (i) => stars.includes(i);
function toggleStar(i) {
    const at = stars.indexOf(i);
    if (at >= 0) stars.splice(at, 1); else stars.push(i);
    storage.set(starsKey, JSON.stringify(stars));
    document.querySelectorAll(`.bjt-star[data-i="${i}"]`).forEach(b => b.classList.toggle('active', at < 0));
    showToast(at < 0 ? 'තරුවක් යෙදුවා. මුල් පිටුවේ තරු යෙදූ මාතෘකා අතර ඇත.' : 'තරුව ඉවත් කළා.');
    renderStars();
}
const starButton = (i) => `<button type="button" class="icon-btn bjt-star${starred(i) ? ' active' : ''}" data-i="${i}" aria-label="තරුවක් යොදන්න">${$('star-icons').innerHTML}</button>`;

const parents = (i) => { const out = []; while ((i = toc[i][PARENT]) >= 0) out.unshift(i); return out; };
const pageHref = (b, p) => `./?b=${b}&p=${p}`;
const entryHref = (i) => pageHref(toc[i][BOOK], toc[i][PAGE]);
// a title in the search results and the stars: name, star, then the volume, page and the titles above it
const listItem = (i) => `<li><div class="toc-item"><a href="${entryHref(i)}">${escHtml(toc[i][NAME])}</a>${starButton(i)}</div>` +
    `<div class="where">${escHtml(books[toc[i][BOOK]].name)}, පිටුව ${toc[i][PAGE]}${parents(i).slice(1).map(j => ' › ' + escHtml(toc[j][NAME])).join('')}</div></li>`;

function renderStars() {
    if (!toc) return;
    const list = stars.filter(i => toc[i]);
    $('stars').hidden = !list.length;
    $('star-list').innerHTML = list.map(listItem).join('');
}

// the contents tree: the levels below the works are added when opened
function treeItem(i) {
    const kids = children[i].length ? `<button type="button" class="icon-btn toggle" aria-expanded="false" aria-label="ඇතුළත">${$('expand-icon').innerHTML}</button>` : '<span class="toggle-space"></span>';
    return `<li data-i="${i}"><div class="toc-item">${kids}<a href="${entryHref(i)}">${escHtml(toc[i][NAME])}</a><span class="page-no">${toc[i][PAGE]}</span>${starButton(i)}</div></li>`;
}
function toggleBranch(li, open) {
    const btn = li.querySelector(':scope > .toc-item > .toggle');
    open = open === undefined ? btn.getAttribute('aria-expanded') != 'true' : open;
    let ul = li.querySelector(':scope > ul');
    if (open && !ul) {
        ul = document.createElement('ul');
        ul.className = 'toc-tree';
        ul.innerHTML = children[+li.dataset.i].map(treeItem).join('');
        li.appendChild(ul);
    }
    if (ul) ul.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
}

// search by title: sinhala as typed, singlish as the sinhala spellings it may stand for (the singlish library of the
// books search); the names are compared without the joiners, which are typed or not
const plain = (s) => s.replace(/[‌‍]/g, '').toLowerCase();
let names, singlish, latest = 0;
async function search() {
    const q = plain($('q').value.trim()), scope = $('scope').value, token = ++latest;
    $('search-area').hidden = !q;
    $('contents').hidden = !!q;
    if (!q) return;
    if (q.length < 2) { $('search-status').textContent = 'අවම වශයෙන් අකුරු දෙකක් ලියන්න.'; $('results').innerHTML = ''; return; }
    let words = [q];
    if (/[a-z]/.test(q)) {
        singlish = singlish || import('/static/singlish-search/singlish.js');
        const lib = await singlish;
        const typed = q.replace(/\s+/g, ' '), loose = typed.replace(/(?<!t)t(?![th])/g, 'th').replace(/(?<!d)d(?![dh])/g, 'dh'); // 'sati' for සති (tt: ට්ඨ)
        words = [...new Set([typed, loose].flatMap(w => lib.getPossibleMatches(w, { maxMatches: 200 })).map(w => plain(w)))];
        if (token != latest) return;
    }
    names = names || toc.map(e => plain(e[NAME]));
    const found = [];
    for (let i = 0; i < toc.length && found.length < 200; i++) {
        if (scope && !parents(i).includes(+scope)) continue;
        if (words.some(w => names[i].includes(w))) found.push(i);
    }
    $('search-status').textContent = found.length ? `“${$('q').value.trim()}” ගැළපෙන මාතෘකා ${found.length >= 200 ? '200 කට වඩා' : found.length}` :
        `“${$('q').value.trim()}” ගැළපෙන මාතෘකා හමු නොවුණි. වෙනත් අකුරු වලින් උත්සාහ කරන්න.`;
    $('results').innerHTML = found.map(listItem).join('');
}

// the pages: a spread is an even (pali) page and the odd (sinhala) one after it
// wide screens show both pages unless one is chosen; phones show the side of the address (an odd page: sinhala)
const sideKey = 'bjt-side'; // 'both' or 'one' (on wide screens)
let view = null; // {b, p (even), side: 'pali' | 'sinh'}
const wide = () => window.matchMedia('(min-width: 50rem)').matches;
const imageNo = (b, p) => books[b].offset + p;
const pageExists = (b, p) => imageNo(b, p) >= 1 && imageNo(b, p) <= books[b].max;
const imageSrc = (b, p) => `newbooks/${b}/${books[b].prefix}${String(imageNo(b, p)).padStart(3, '0')}.jpg`;
// the title the page is in: the last one that starts at or before it in the volume
function entryAt(b, p) {
    let best = -1;
    for (let i = 0; i < toc.length; i++) if (toc[i][BOOK] == b && toc[i][PAGE] <= p + 1 && (best < 0 || toc[i][PAGE] >= toc[best][PAGE])) best = i;
    return best;
}
function showSides() {
    const side = wide() && storage.get(sideKey) != 'one' ? 'both' : view.side;
    $('spread').dataset.side = side;
    document.querySelectorAll('.sides button').forEach(btn => btn.setAttribute('aria-pressed', String(btn.dataset.side == side)));
}
function chooseSide(side) {
    if (wide()) storage.set(sideKey, side == 'both' ? 'both' : 'one');
    if (side != 'both') view.side = side;
    const p = view.p + (view.side == 'sinh' ? 1 : 0);
    history.replaceState(null, '', pageHref(view.b, p));
    showPages(view.b, p, false, true);
}
function showPages(b, p, push, keepScroll) {
    const even = p - (((p % 2) + 2) % 2);
    view = { b, p: even, side: p % 2 ? 'sinh' : 'pali' };
    if (push) history.pushState(null, '', pageHref(b, p));
    const book = books[b], e = entryAt(b, even);
    const figure = (pg, cls, label) => pageExists(b, pg) ? `<figure class="bjt-page ${cls}"><img src="${imageSrc(b, pg)}" alt="${escHtml(book.name)}, ${label} පිටුව ${pg}" width="1693" height="2814"><figcaption>${label} ${pg}</figcaption></figure>` : `<figure class="bjt-page ${cls} empty"></figure>`;
    $('spread').innerHTML = figure(even, 'pali', 'පාළි') + figure(even + 1, 'sinh', 'සිංහල');
    $('page-nums').textContent = `${book.name}, පිටු ${even}-${even + 1}`;
    const step = view.side == 'sinh' ? 1 : 0;
    const prev = pageExists(b, even - 2) || pageExists(b, even - 1), next = pageExists(b, even + 2) || pageExists(b, even + 3);
    document.querySelectorAll('.spread-pager .prev').forEach(a => { a.classList.toggle('off', !prev); a.href = pageHref(b, even - 2 + step); });
    document.querySelectorAll('.spread-pager .next').forEach(a => { a.classList.toggle('off', !next); a.href = pageHref(b, even + 2 + step); });
    const trail = e >= 0 ? [...parents(e), e] : [];
    $('where').innerHTML = ['<a href="./">පටුන</a>', ...trail.map(i => `<a href="${entryHref(i)}">${escHtml(toc[i][NAME])}</a>`)].join(' › ');
    const star = $('reader-star');
    star.hidden = e < 0;
    if (e >= 0) { star.dataset.i = e; star.classList.toggle('active', starred(e)); }
    const title = `${e >= 0 ? toc[e][NAME] + ' – ' : ''}${book.name} ${even}-${even + 1} | බුද්ධ ජයන්ති ත්‍රිපිටකය`;
    $('reader-share').dataset.url = `${location.origin}${location.pathname}?b=${b}&p=${even + step}`;
    $('reader-share').dataset.title = document.title = title;
    $('reader-title').textContent = title;
    $('home').hidden = true;
    $('reader').hidden = false;
    showSides();
    if (!keepScroll) window.scrollTo(0, 0);
    for (const pg of [even + 2, even + 3]) if (pageExists(b, pg)) new Image().src = imageSrc(b, pg); // the next spread, ahead
}
const homeTitle = document.title;
function showHome() {
    view = null;
    document.title = homeTitle;
    $('reader').hidden = true;
    $('home').hidden = false;
}
function route(push) {
    const params = new URLSearchParams(location.search), b = +params.get('b'), p = +params.get('p');
    if (books[b] && Number.isInteger(p) && p > -1000) showPages(b, p, push); else showHome();
}

// clicks: the tree, the stars, the sides, and the links within the viewer (no page load)
document.addEventListener('click', (ev) => {
    const btn = ev.target.closest('button');
    if (btn && btn.classList.contains('toggle')) return toggleBranch(btn.closest('li'));
    if (btn && btn.classList.contains('bjt-star')) return toggleStar(+btn.dataset.i);
    if (btn && btn.dataset.side) return view && chooseSide(btn.dataset.side);
    const a = ev.target.closest('a');
    if (!a || ev.ctrlKey || ev.metaKey || ev.shiftKey || ev.button) return;
    const url = new URL(a.href, location.href);
    if (url.pathname != location.pathname || url.origin != location.origin) return;
    ev.preventDefault();
    history.pushState(null, '', url.search ? url.search : './');
    route(false);
});
window.addEventListener('popstate', () => route(false));
window.addEventListener('resize', () => { if (view) showSides(); });

const q = $('q');
q.addEventListener('input', () => { clearTimeout(search.timer); search.timer = setTimeout(search, 200); });
q.addEventListener('focus', () => { if (view) { history.pushState(null, '', './'); showHome(); } });
$('scope').addEventListener('change', search);

fetch(dataEl.dataset.src).then(r => r.json()).then(d => {
    ({ books, toc } = d);
    children = toc.map(() => []);
    toc.forEach((e, i) => { if (e[PARENT] >= 0) children[e[PARENT]].push(i); });
    renderStars();
    route(false);
    if (q.value) search();
}).catch(() => showToast('පටුන ලබා ගැනීමට නොහැකි විය. පිටුව නැවත load කරන්න.'));
})();
