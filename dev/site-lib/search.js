// the search page of a site (search.html): the pagefind index in pagefind/, made by the build after the pages
// result urls come with the site path (pagefind finds it from where pagefind.js is). ?q= the words, ?book= limits the books site to one book (pagefind filter 'book')
const input = document.getElementById('q'), list = document.getElementById('results');
const status = document.getElementById('search-status'), more = document.getElementById('more'), scope = document.getElementById('scope');
const params = new URLSearchParams(location.search);
const PAGE = 20;
const bookName = scope && params.get('book') && JSON.parse(scope.dataset.books || '{}')[params.get('book')];
if (scope && !bookName) scope.remove();
else if (scope) scope.querySelector('.book-name').textContent = bookName; // searching in one book: say which
let pagefind, shown = 0, results = [];

const loadPagefind = async () => {
    if (!pagefind) {
        pagefind = await import(new URL('pagefind/pagefind.js', document.baseURI).href);
        await pagefind.options({ excerptLength: 26 });
        pagefind.init();
    }
    return pagefind;
};
const filters = () => bookName && scope.querySelector('input:checked').value == 'book' ? { book: params.get('book') } : {};

// singlish (sinhala typed in english letters, 'jaya piritha'): as on tipitaka.lk, @pnfo/singlish-search gives the
// likely sinhala spellings of each word and the ones that are words of the texts are used, the most frequent first;
// the words with their counts are in search-words/<hex of the first letter>.txt, made by the build
let singlish, latest = 0;
const shards = {};
const isSinglish = (w) => /[a-z]/i.test(w);
const loadShard = (letter) => shards[letter] = shards[letter] ||
    fetch(new URL(`search-words/${letter.codePointAt(0).toString(16)}.txt`, document.baseURI)).then(r => r.ok ? r.text() : '').catch(() => '')
        .then(t => t.split('\n').filter(l => l).map(l => { const i = l.lastIndexOf(' '); return [l.slice(0, i), +l.slice(i + 1)]; }));
async function toSinhala(q) {
    singlish = singlish || import('/static/singlish-search/singlish.js');
    const lib = await singlish;
    return Promise.all(q.split(/\s+/).map(async (w) => {
        if (!isSinglish(w)) return { w, best: w, alts: [] };
        const lookup = async (spelling) => {
            const cands = lib.getPossibleMatches(spelling, { maxMatches: 150 }); // 1.4.2+ ignores the capitals of phone keyboards
            const words = new Map((await Promise.all([...new Set(cands.map(c => c[0]))].map(loadShard))).flat());
            return { cands, words, found: cands.filter(c => words.has(c)).sort((a, b) => words.get(b) - words.get(a)) };
        };
        let { cands, words, found } = await lookup(w);
        const loose = w.replace(/t(?!h)/gi, 'th').replace(/d(?!h)/gi, 'dh'); // 'ratana' for රතන: t and d typed for ත and ද
        if (loose != w) { // offered after the strict spellings; the phrase in the most pages is chosen below
            const more = await lookup(loose);
            if (!found.length && more.found.length) ({ cands, words } = more);
            found = [...new Set([...found.slice(0, 2), ...more.found.slice(0, 2), ...found.slice(2)])];
        }
        if (!found.length) { // only the start of a word typed: the candidates that begin the most frequent words
            const begins = new Map();
            for (const [word, n] of words) for (const c of cands) if (word.startsWith(c)) begins.set(c, Math.max(begins.get(c) || 0, n));
            found = [...begins.keys()].sort((a, b) => begins.get(b) - begins.get(a));
        }
        if (!found.length) found = cands.slice(0, 3); // not a word of the indexed texts: the library's best guesses
        return { w, best: found[0], alts: found.slice(1, 4) };
    }));
}
// the spellings to choose from: the most frequent of each word first, then the other ones (at most 12 phrases)
function phrases(words) {
    let out = [[]];
    for (const x of words) out = out.flatMap(p => [x.best, ...x.alts].filter(Boolean).map(s => [...p, s]));
    return [...new Set(out.map(p => p.join(' ')))].slice(0, 12);
}
const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const note = document.createElement('p');
note.className = 'singlish-note';
status.after(note);

async function search() {
    const q = input.value.trim(), token = ++latest;
    const url = new URL(location.href);
    q ? url.searchParams.set('q', q) : url.searchParams.delete('q');
    history.replaceState(null, '', url);
    note.innerHTML = '';
    if (q.length < 2) { list.innerHTML = ''; status.textContent = ''; more.hidden = true; return; }
    await new Promise(r => setTimeout(r, 250)); // wait for the typing to stop
    if (token != latest) return;
    status.textContent = 'සොයමින්…';
    const pf = await loadPagefind();
    let query = q;
    if (isSinglish(q)) {
        const words = await toSinhala(q);
        if (token != latest) return;
        const missing = words.filter(x => !x.best), tries = phrases(words.filter(x => x.best));
        // of these phrases of real words, the one in the most pages (the words used together, as in 'කරණීය මෙත්ත')
        const counts = tries.length > 1 ? await Promise.all(tries.map(async t => (await pf.search(t, { filters: filters() })).results.length)) : [1];
        if (token != latest) return;
        query = tries.length ? tries[counts.indexOf(Math.max(...counts))] : '';
        const alts = tries.filter(t => t != query);
        note.innerHTML = (query ? `සෙවූයේ: <b>${esc(query)}</b>` : '') +
            (missing.length ? ` · «${esc(missing.map(x => x.w).join(' '))}» ට ගැළපෙන වචනයක් හමු නොවීය` : '') +
            (alts.length ? `<br>මෙයද විය හැක: ${alts.slice(0, 4).map(a => `<button type="button" class="alt-btn">${esc(a)}</button>`).join('')}` : '');
        if (!query) { list.innerHTML = ''; more.hidden = true; status.textContent = 'ප්‍රතිඵල නැත. සිංහල අකුරෙන් ලියා බලන්න.'; return; }
    }
    const res = await pf.search(query, { filters: filters() });
    if (token != latest) return; // a newer search replaced this one
    results = res.results; shown = 0; list.innerHTML = '';
    const where = Object.keys(filters()).length ? `${bookName} තුළ ` : '';
    status.textContent = results.length ? `${where}ප්‍රතිඵල ${results.length}` : `${where}ප්‍රතිඵල නැත. වෙනත් වචනයක් හෝ වචනයේ මුල් කොටස පමණක් ලියා බලන්න.`;
    await showMore();
}
note.addEventListener('click', (e) => { // an other spelling of a singlish word
    const btn = e.target.closest('.alt-btn');
    if (btn) { input.value = btn.textContent; search(); }
});
async function showMore() {
    const page = await Promise.all(results.slice(shown, shown + PAGE).map(r => r.data()));
    list.insertAdjacentHTML('beforeend', page.map(d => `<li><a href="${esc(d.url)}">
        <span class="result-title">${esc(d.meta.title)}</span>${d.meta.book ? `<span class="result-book">${esc(d.meta.book)}</span>` : ''}
        <span class="result-excerpt">${d.excerpt}</span></a></li>`).join(''));
    shown += page.length;
    more.hidden = shown >= results.length;
}

input.value = params.get('q') || '';
input.addEventListener('input', search);
more.addEventListener('click', showMore);
if (scope) scope.addEventListener('change', search);
if (input.value) search();
else input.focus(); // the field in the top bar
