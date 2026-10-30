// ---- books site (after dev/site-lib/reader.js) ----

// bookmarks: {"<folder>/<ids>.html": {ids, headings, book: {name, folder}, time}} in localStorage
const bookmarksKeyName = 'books-app-bookmarks';
const bookmarks = JSON.parse(storage.get(bookmarksKeyName) || '{}');
const getBookmarkHref = (folder, ids) => `${folder}/${ids.join('-')}.html`;
function bookmarkInfo(btn) {
    const ids = btn.dataset.ids.split('-').map(Number), body = document.body.dataset;
    const headings = [];
    for (let item = btn.closest('.toc-item'); item; item = item.parentElement.closest('.toc-item')) {
        headings.unshift(item.querySelector('.toc-row > a').textContent.trim());
    }
    const main = document.querySelector('main[data-headings]'); // headings of this page come before its sub headings
    if (main && (btn.closest('.subheadings') || !headings.length)) headings.unshift(...JSON.parse(main.dataset.headings));
    return { ids, headings, book: { name: body.book, folder: body.folder } };
}
function toggleBookmark(btn) {
    const info = btn.dataset.bookmark ? JSON.parse(btn.dataset.bookmark) : bookmarkInfo(btn);
    const key = getBookmarkHref(info.book.folder, info.ids);
    if (bookmarks[key]) {
        delete bookmarks[key];
        btn.classList.remove('active');
        showToast('එම මාතෘකාවේ තරුව ඉවත් කළා.');
        if (btn.closest('.bookmark-list')) btn.closest('li').remove();
    } else {
        bookmarks[key] = { ...info, time: Date.now() };
        btn.classList.add('active');
        showToast('තරුවක් එකතු කළා. ඒවා මුල් පිටුවේ ★ තුළ ඇත.');
    }
    storage.set(bookmarksKeyName, JSON.stringify(bookmarks));
}
function showBookmarkStars() {
    const folder = document.body.dataset.folder;
    document.querySelectorAll('button.star[data-ids]').forEach(btn => {
        if (bookmarks[getBookmarkHref(folder, btn.dataset.ids.split('-'))]) btn.classList.add('active');
    });
}
function renderBookmarksPage(list) { // bookmarks.html, latest first
    const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const star = document.getElementById('star-icon').innerHTML;
    const items = Object.values(bookmarks).sort((a, b) => b.time - a.time || a.book.name.localeCompare(b.book.name));
    list.innerHTML = items.map(b => {
        const path = b.ids.slice(0, -1).map((id, i) => esc(b.headings[i])).join(' › ');
        return `<li><a class="bm-text" href="${getBookmarkHref(b.book.folder, b.ids)}">${esc(b.headings[b.headings.length - 1])}
            <span class="bm-book">${esc(b.book.name)}${path ? ' › ' + path : ''} · <span class="bm-date">${new Date(b.time).toISOString().slice(0, 10)}</span></span></a>
            <button type="button" class="icon-btn star active" aria-label="තරුව ඉවත් කරන්න" data-bookmark="${esc(JSON.stringify(b))}">${star}</button></li>`;
    }).join('\n');
    document.getElementById('no-bookmarks').hidden = items.length > 0;
}

// table of contents: open and close the branches; long books start with only the chapters open
function setOpen(item, open) {
    item.classList.toggle('closed', !open);
    const btn = item.querySelector(':scope > .toc-row > .toc-toggle');
    if (btn) btn.setAttribute('aria-expanded', String(open));
}
const toc = document.querySelector('.toc');
if (toc) {
    toc.classList.add('no-anim');
    if (toc.querySelectorAll('.toc-item').length > 40) {
        toc.querySelectorAll('.toc-item').forEach(item => item.querySelector('.toc-children') && setOpen(item, false));
        const target = location.hash && document.getElementById(decodeURIComponent(location.hash.slice(1)));
        for (let item = target; item; item = item.parentElement.closest('.toc-item')) setOpen(item, true);
        if (target) target.scrollIntoView({ block: 'center' });
    }
    requestAnimationFrame(() => requestAnimationFrame(() => toc.classList.remove('no-anim')));
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.classList.contains('star')) toggleBookmark(btn);
    else if (btn.classList.contains('toc-toggle')) { const item = btn.closest('.toc-item'); setOpen(item, item.classList.contains('closed')); }
});

showBookmarkStars();
const bookmarkList = document.getElementById('bookmark-list');
if (bookmarkList) renderBookmarksPage(bookmarkList);
