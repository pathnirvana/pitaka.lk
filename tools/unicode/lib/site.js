// Header, menu, footer and small helpers shared by the tool pages.
// <body data-page="convert|bandi|fonts"> picks the menu item (keyboard.html is not in the menu).
import { t, lang, setLang, applyLang } from './i18n.js'

const pages = [
    ['convert', '/tools/unicode/fm-to-unicode/', 'navConvert'],
    ['bandi', '/tools/unicode/pali-bandi/', 'navBandi'],
    ['fonts', '/tools/unicode/sinhala-unicode-fonts/', 'navFonts'],
]

// light or dark as the reader picked it last; until then the system setting decides
let theme = null
try { theme = localStorage.getItem('unicode-tools-theme') } catch {}
if (theme) document.documentElement.dataset.theme = theme
const isDark = () => (document.documentElement.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')) === 'dark'

export function initSite() {
    const page = document.body.dataset.page
    const header = document.createElement('header')
    header.className = 'site-header'
    header.innerHTML = `<div class="bar">
        <a class="home" href="https://pitaka.lk/" data-t="site"></a>
        <nav>${pages.map(([id, href, key]) => `<a href="${href}" data-t="${key}"${id === page ? ' aria-current="page"' : ''}></a>`).join('')}</nav>
        <button class="theme" type="button"></button>
        <button class="lang" type="button"></button>
    </div>`
    document.body.prepend(header)
    const footer = document.createElement('footer')
    footer.className = 'site-footer'
    footer.innerHTML = `<div>© <a href="https://pitaka.lk/">pitaka.lk</a> · <a href="https://www.facebook.com/pitaka.lk">facebook.com/pitaka.lk</a></div><div data-t="footer"></div>`
    document.body.append(footer)
    const toggle = header.querySelector('.lang'), themeButton = header.querySelector('.theme')
    const label = () => {
        toggle.textContent = lang === 'en' ? 'සිංහල' : 'English'
        themeButton.textContent = isDark() ? '☀' : '☾'
        themeButton.title = t(isDark() ? 'themeLight' : 'themeDark')
    }
    toggle.addEventListener('click', () => { setLang(lang === 'en' ? 'si' : 'en'); label() })
    themeButton.addEventListener('click', () => {
        const next = isDark() ? 'light' : 'dark'
        document.documentElement.dataset.theme = next
        try { localStorage.setItem('unicode-tools-theme', next) } catch {}
        label()
    })
    label()
    applyLang()
}

let toastTimer
export function toast(message) {
    let el = document.querySelector('.toast')
    if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el) }
    el.textContent = message
    el.classList.add('show')
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => el.classList.remove('show'), 1800)
}

export async function copyText(text) {
    try {
        await navigator.clipboard.writeText(text)
    } catch {
        const ta = Object.assign(document.createElement('textarea'), { value: text })
        document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove()
    }
    toast(t('copied'))
}

export function download(name, blob) {
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: name })
    document.body.append(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 10000)
}

// remembers a control's value for this viewer
export function remember(el, key) {
    try { const v = localStorage.getItem('unicode-tools-' + key); if (v !== null) el.type === 'checkbox' ? (el.checked = v === '1') : (el.value = v) } catch {}
    el.addEventListener('change', () => {
        try { localStorage.setItem('unicode-tools-' + key, el.type === 'checkbox' ? (el.checked ? '1' : '0') : el.value) } catch {}
    })
}

export const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
