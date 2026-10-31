// ---- books site (after dev/site-lib/reader.js) ----

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
    if (btn.classList.contains('toc-toggle')) { const item = btn.closest('.toc-item'); setOpen(item, item.classList.contains('closed')); }
});
