import { initSite, toast, download, escapeHtml } from '../lib/site.js'
import { t } from '../lib/i18n.js'
import { families, loadFamily, loadVariable, VERSION } from '../lib/fonts.js'

initSite()
const $ = (id) => document.getElementById(id)
$('zip').href = `../fonts/SinhalaUniFonts-${VERSION}.zip`

// ---- font cards, each loaded when it comes into view
const SAMPLES = [
    'ආර්‍ය්‍ය. වජ්‍රාසන ආරූඪ වූ ශ්‍රී ශක්‍ර දිව්‍ය',
    'බුද්‍ධි “සම‍්මා සම‍්බුද‍්ධස‍්ස” · සීගිරි පර්‍වත මස්තකාරූඪ මනුෂ්‍යයෙකුට සෝදාහරණ සහිත ව හෙළයා ගේ ශෛල, වාරි, ගෘහ නිර්මාණ ශක්‍යතාව · Sinhala Unicode 0123456789',
]
const link = (file, label) => `<a class="button quiet" href="../fonts/${file}.ttf" download>${escapeHtml(label)} ↓</a>`
$('cards').innerHTML = families.map((f) => `
    <article class="card" data-id="${f.id}">
        <div class="top">
            <div class="name" data-font>${f.si}</div>
            <div class="files">${f.styles.map((s) => link(s.file, s.name)).join('')}${f.variable ? link(f.variable.file, 'Variable') : ''}</div>
        </div>
        <div class="hint">${f.family}</div>
        <div class="s1" data-font>${SAMPLES[0]}</div>
        <div class="s2" data-font>${SAMPLES[1]}</div>
    </article>`).join('')
const observer = new IntersectionObserver((entries) => {
    for (const e of entries) {
        if (!e.isIntersecting) continue
        observer.unobserve(e.target)
        const fam = families.find((f) => f.id === e.target.dataset.id)
        for (const el of e.target.querySelectorAll('[data-font]')) el.style.fontFamily = `'${fam.family}'`
        loadFamily(fam).then(() => e.target.classList.add('loaded'), () => e.target.classList.add('loaded'))
    }
}, { rootMargin: '200px' })
document.querySelectorAll('.card').forEach((c) => observer.observe(c))

// ---- type tester
const text = $('text'), preview = $('preview'), fontSel = $('t-font')
fontSel.innerHTML = families.map((f) => `<option value="${f.id}">${f.si} · ${f.family}${f.variable ? ' (variable)' : ''}</option>`).join('')

function state() {
    const fam = families.find((f) => f.id === fontSel.value)
    return {
        fam, variable: !!fam.variable,
        family: fam.variable ? fam.family + ' Variable' : fam.family,
        size: +$('t-size').value, weight: fam.variable ? +$('t-weight').value : 400, width: fam.variable ? +$('t-width').value : 100,
        lh: +$('t-lh').value, colour: $('t-colour').value, align: $('t-align').value, text: text.value,
    }
}

let ready = Promise.resolve()
function update() {
    const s = state()
    ready = s.variable ? loadVariable(s.fam) : loadFamily(s.fam)
    for (const el of document.querySelectorAll('.var')) el.hidden = !s.variable
    Object.assign(preview.style, {
        fontFamily: `'${s.family}'`, fontSize: s.size + 'px', fontWeight: s.weight, fontStretch: s.width + '%',
        lineHeight: s.lh, color: s.colour, textAlign: s.align,
    })
    preview.textContent = s.text
    $('o-size').textContent = s.size + 'px'
    $('o-weight').textContent = s.weight
    $('o-width').textContent = s.width + '%'
    $('o-lh').textContent = s.lh
}
for (const el of [text, fontSel, $('t-size'), $('t-weight'), $('t-width'), $('t-lh'), $('t-colour'), $('t-align')]) el.addEventListener('input', update)
update()

// the preview's text box width, in CSS pixels
const boxWidth = () => preview.clientWidth - 24

// greedy word wrap with a width function
function wrap(paragraph, width, measure) {
    const lines = []
    let line = ''
    for (const word of paragraph.split(/(?<= )/)) {
        if (line && measure(line + word.trimEnd()) > width) { lines.push(line.trimEnd()); line = word.trimStart() } else line += word
    }
    lines.push(line.trimEnd())
    return lines
}

// canvas only knows width keywords
const stretchKeyword = (w) => w <= 81 ? 'condensed' : w <= 94 ? 'semi-condensed' : 'normal'

async function pngBlob() {
    const s = state()
    await ready
    const scale = Math.max(2, devicePixelRatio || 1) * 2
    const width = boxWidth(), lineH = s.size * s.lh
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const setFont = () => { ctx.font = `${s.weight} ${s.size}px '${s.family}'`; if ('fontStretch' in ctx) ctx.fontStretch = stretchKeyword(s.width) }
    setFont()
    const lines = s.text.split('\n').flatMap((p) => wrap(p, width, (x) => ctx.measureText(x).width))
    canvas.width = Math.ceil(width * scale)
    canvas.height = Math.ceil(lines.length * lineH * scale)
    ctx.scale(scale, scale)
    setFont()
    ctx.fillStyle = s.colour
    ctx.textBaseline = 'middle'
    ctx.textAlign = s.align
    const x = s.align === 'center' ? width / 2 : s.align === 'right' ? width : 0
    lines.forEach((line, i) => ctx.fillText(line, x, (i + 0.5) * lineH))
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

$('copy-png').addEventListener('click', async () => {
    try {
        // Safari wants the ClipboardItem made right away, with the image still to come
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': pngBlob() })])
        toast(t('imageCopied'))
    } catch {
        toast(t('imageFailed'))
    }
})
$('png').addEventListener('click', async () => download('sinhala-text.png', await pngBlob()))

// ---- SVG with the glyph outlines, shaped by HarfBuzz
const script = (src) => new Promise((resolve, reject) => {
    const el = Object.assign(document.createElement('script'), { src, onload: resolve, onerror: reject })
    document.head.append(el)
})
let hbPromise
const loadHb = () => hbPromise ||= (async () => {
    await script('../lib/vendor/hb.js')
    await script('../lib/vendor/hbjs.js')
    /* global createHarfBuzz, hbjs */
    return hbjs(await createHarfBuzz({ locateFile: (f) => '../lib/vendor/' + f }))
})()
const ttfs = new Map()
const ttf = (file) => { if (!ttfs.has(file)) ttfs.set(file, fetch(`../fonts/${file}.ttf`).then((r) => r.arrayBuffer())); return ttfs.get(file) }

async function svgText() {
    const s = state()
    const [hb, data] = await Promise.all([loadHb(), ttf(s.variable ? s.fam.variable.file : s.fam.styles[0].file)])
    const blob = hb.createBlob(data), face = hb.createFace(blob, 0), font = hb.createFont(face)
    if (s.variable) font.setVariations({ wght: s.weight, wdth: s.width })
    const k = s.size / face.upem, width = boxWidth(), lineH = s.size * s.lh
    const shape = (str) => {
        const buf = hb.createBuffer()
        buf.addText(str)
        buf.guessSegmentProperties()
        hb.shape(font, buf)
        const glyphs = buf.json()
        buf.destroy()
        return glyphs
    }
    const advance = (str) => shape(str).reduce((x, g) => x + g.ax, 0) * k
    const lines = s.text.split('\n').flatMap((p) => wrap(p, width, advance))
    const outlines = new Map()
    const body = lines.map((line, i) => {
        const glyphs = shape(line)
        const lineWidth = glyphs.reduce((x, g) => x + g.ax, 0) * k
        const x0 = s.align === 'center' ? (width - lineWidth) / 2 : s.align === 'right' ? width - lineWidth : 0
        const baseline = (i + 0.5) * lineH + s.size * 0.32
        let x = 0
        // each glyph as its own path: <use> is not understood by every program that imports SVG
        const paths = glyphs.map((g) => {
            if (!outlines.has(g.g)) outlines.set(g.g, font.glyphToPath(g.g).replace(/-?\d+\.\d+/g, (n) => String(Math.round(n * 10) / 10)))
            const d = outlines.get(g.g)
            const p = d ? `<path transform="translate(${x + g.dx} ${g.dy})" d="${d}"/>` : ''
            x += g.ax
            return p
        }).join('')
        return `<g transform="translate(${x0.toFixed(2)} ${baseline.toFixed(2)}) scale(${k} ${-k})">${paths}</g>`
    }).join('\n')
    font.destroy(); face.destroy(); blob.destroy()
    const h = Math.ceil(lines.length * lineH)
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.ceil(width)}" height="${h}" viewBox="0 0 ${Math.ceil(width)} ${h}">
<title>${escapeHtml(s.text)}</title>
<g fill="${s.colour}">
${body}
</g>
</svg>
`
}

$('svg').addEventListener('click', async () => {
    const button = $('svg')
    button.disabled = true
    try { download('sinhala-text.svg', new Blob([await svgText()], { type: 'image/svg+xml' })) } finally { button.disabled = false }
})
