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

async function search() {
    const q = input.value.trim();
    const url = new URL(location.href);
    q ? url.searchParams.set('q', q) : url.searchParams.delete('q');
    history.replaceState(null, '', url);
    if (q.length < 2) { list.innerHTML = ''; status.textContent = ''; more.hidden = true; return; }
    status.textContent = 'සොයමින්…';
    const pf = await loadPagefind();
    const res = await pf.debouncedSearch(q, { filters: filters() }, 250);
    if (res === null) return; // a newer search replaced this one
    results = res.results; shown = 0; list.innerHTML = '';
    const where = Object.keys(filters()).length ? `${bookName} තුළ ` : '';
    status.textContent = results.length ? `${where}ප්‍රතිඵල ${results.length}`
        : /[a-z]/i.test(q) ? 'පොත් සිංහල අකුරෙන් ඇති නිසා සිංහල අකුරෙන් ලියන්න (උදා: නිර්වාණ).'
        : `${where}ප්‍රතිඵල නැත. වෙනත් වචනයක් හෝ වචනයේ මුල් කොටස පමණක් ලියා බලන්න.`;
    await showMore();
}
async function showMore() {
    const page = await Promise.all(results.slice(shown, shown + PAGE).map(r => r.data()));
    const esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
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
else input.focus();
