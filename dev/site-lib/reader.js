// shared by the books and dhammapada sites (the builds put it in front of each site's own script):
// reading settings (theme, font size), share, toast, arrow keys, the top bar that hides on scroll
const themeKey = 'pitaka-theme', fontKey = 'pitaka-font-scale';
const storage = {
    get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); } catch (e) {} },
};
const root = document.documentElement;

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove('show'), 3000);
}

function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    const ta = document.createElement('textarea'); // fallback for older webviews
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok ? Promise.resolve() : Promise.reject();
}
function share(btn) {
    const url = btn.dataset.url, title = btn.dataset.title || document.title;
    if (navigator.share) return navigator.share({ title, url }).catch(() => {});
    copyText(url).then(() => showToast('link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.'), () => showToast(url));
}

// theme and font size
function updateStatusBar() {
    if (window.Android && window.Android.setStatusBarColor) { // the books android app colors its status bar to match
        window.Android.setStatusBarColor(getComputedStyle(root).getPropertyValue('--surface').trim());
    }
}
const currentTheme = () => root.dataset.theme || 'light';
function setTheme(theme) {
    if (theme == 'light') delete root.dataset.theme; else root.dataset.theme = theme;
    storage.set(themeKey, theme);
    updateStatusBar();
    updateSettings();
}
const fontScale = () => parseFloat(getComputedStyle(root).getPropertyValue('--font-scale')) || 1;
function changeFontScale(step) {
    const scale = Math.min(1.6, Math.max(0.8, Math.round((fontScale() + step) * 10) / 10));
    root.style.setProperty('--font-scale', scale);
    storage.set(fontKey, scale);
    updateSettings();
}
function updateSettings() {
    const panel = document.getElementById('settings');
    if (!panel) return;
    panel.querySelector('output').textContent = Math.round(fontScale() * 100) + '%';
    panel.querySelectorAll('.theme-choice').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.choice == currentTheme())));
}
function toggleSettings(open) {
    const panel = document.getElementById('settings'), btn = document.querySelector('.settings-btn');
    if (!panel) return;
    open = open === undefined ? panel.hidden : open;
    panel.hidden = !open;
    btn.setAttribute('aria-expanded', String(open));
    if (open) { updateSettings(); appbar && appbar.classList.remove('hidden'); }
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!e.target.closest('#settings, .settings-btn')) toggleSettings(false);
    if (!btn) return;
    if (btn.classList.contains('share')) share(btn);
    else if (btn.classList.contains('settings-btn')) toggleSettings();
    else if (btn.classList.contains('theme-choice')) setTheme(btn.dataset.choice);
    else if (btn.classList.contains('larger')) changeFontScale(0.1);
    else if (btn.classList.contains('smaller')) changeFontScale(-0.1);
});

document.addEventListener('keydown', (e) => {
    if (e.key == 'Escape') return toggleSettings(false);
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.defaultPrevented) return;
    if (e.target.closest && e.target.closest('input, textarea, select, audio, [contenteditable]')) return;
    const a = document.querySelector({ ArrowLeft: '.pager a[rel=prev]', ArrowRight: '.pager a[rel=next]' }[e.key]);
    if (a) { e.preventDefault(); a.click(); }
});

// the top bar hides while reading down the page and comes back on scrolling up
const appbar = document.querySelector('.appbar');
if (appbar) {
    let lastY = window.scrollY;
    window.addEventListener('scroll', () => {
        const y = window.scrollY;
        if (Math.abs(y - lastY) < 8) return;
        const panel = document.getElementById('settings');
        appbar.classList.toggle('hidden', y > lastY && y > 120 && (!panel || panel.hidden));
        lastY = y;
    }, { passive: true });
}
// continue reading: the page and scroll position last read of each book (or dhammapada edition), shown on the index pages
// pages read: <body data-progress="books/kunala-jathaka" data-progress-path="kunala-jathaka/3.html" data-progress-title data-progress-label>
// index pages: <div class="continue" data-continue="books/" (a prefix) or "books/kunala-jathaka" data-root="../" hidden>
const progressKey = 'pitaka-progress';
const allProgress = () => { try { return JSON.parse(storage.get(progressKey) || '{}'); } catch (e) { return {}; } };
const reading = document.body.dataset.progress ? document.body.dataset : null;
if (reading) {
    const scrollable = () => document.documentElement.scrollHeight - window.innerHeight;
    const save = () => {
        const all = allProgress(), h = scrollable();
        all[reading.progress] = { path: reading.progressPath, title: reading.progressTitle, label: reading.progressLabel,
            time: Date.now(), pos: h > 0 ? Math.round(Math.min(1, Math.max(0, window.scrollY / h)) * 1000) / 1000 : 0 };
        storage.set(progressKey, JSON.stringify(all));
    };
    let timer;
    const start = () => {
        save();
        window.addEventListener('scroll', () => { clearTimeout(timer); timer = setTimeout(save, 400); }, { passive: true });
        window.addEventListener('pagehide', save);
    };
    const saved = allProgress()[reading.progress];
    if (location.hash == '#continue' && saved && saved.path == reading.progressPath) { // back to where the reader stopped
        history.replaceState(null, '', location.pathname + location.search);
        window.addEventListener('load', () => setTimeout(() => { window.scrollTo(0, saved.pos * scrollable()); start(); }, 50));
    } else start();
}
document.querySelectorAll('.continue[data-continue]').forEach(box => {
    const want = box.dataset.continue, esc = (s) => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const items = Object.entries(allProgress()).filter(([k]) => want.endsWith('/') ? k.startsWith(want) : k == want)
        .map(([key, v]) => ({ ...v, key })).sort((a, b) => b.time - a.time).slice(0, 3);
    if (!items.length) return;
    const close = box.querySelector('template').innerHTML;
    box.innerHTML = `<h2>නැවතුණු තැනින් කියවන්න</h2>` + items.map(v => {
        const pct = Math.round(v.pos * 100);
        return `<div class="continue-item"><a class="continue-card" href="${box.dataset.root || ''}${esc(v.path)}#continue"><span class="continue-title">${esc(v.title)}</span>` +
            `<span class="continue-meta">${esc(v.label)}${pct ? ` · ${pct}%` : ''}</span><span class="continue-bar"><span style="width:${Math.max(pct, 2)}%"></span></span></a>` +
            `<button type="button" class="continue-dismiss" data-key="${esc(v.key)}" aria-label="ලැයිස්තුවෙන් ඉවත් කරන්න">${close}</button></div>`;
    }).join('');
    box.hidden = false;
});
document.addEventListener('click', (e) => { // remove a book from the continue reading list
    const btn = e.target.closest('.continue-dismiss');
    if (!btn) return;
    const all = allProgress();
    delete all[btn.dataset.key];
    storage.set(progressKey, JSON.stringify(all));
    const box = btn.closest('.continue');
    btn.closest('.continue-item').remove();
    if (!box.querySelector('.continue-item')) box.hidden = true;
});

updateStatusBar();
