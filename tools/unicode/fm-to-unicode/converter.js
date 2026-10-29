import { initSite, copyText, download, remember, escapeHtml } from '../lib/site.js'
import { t } from '../lib/i18n.js'
import { families, familyById, loadFamily } from '../lib/fonts.js'
import { detect, encodings } from '../lib/detect.js'
import { convertText } from '../lib/text.js'
import { findIssues } from '../lib/validate.js'
import { convertPali } from '../lib/pali.js'
import { uniFontFor } from '../lib/font-map.js'

initSite()
const $ = (id) => document.getElementById(id)
const input = $('input'), output = $('output'), encSel = $('enc'), fontSel = $('font'), bandi = $('bandi')
const fontOptions = families.map((f) => `<option value="${f.id}">${f.si} · ${f.family}</option>`).join('')
fontSel.innerHTML = fontOptions
remember(encSel, 'enc')
remember(fontSel, 'font')
remember(bandi, 'bandi')

// ---- text
let keep = new Set(), last = { text: '' }
const MAX_SPANS = 20000

function setFont() {
    const fam = familyById(fontSel.value) || families[0]
    loadFamily(fam)
    output.style.fontFamily = `'${fam.family}', 'Abhaya Uni UI', sans-serif`
}

function render() {
    const text = input.value
    const badge = $('detected')
    let enc = encodings.find((e) => e.id === encSel.value)
    if (!enc && text.trim()) {
        const best = detect(text)[0]
        enc = best.enc
        badge.textContent = enc ? `${enc.label} ${Math.round(best.score * 100)}%` : t('alreadyUnicode')
        badge.hidden = false
    } else badge.hidden = !text.trim() || !!enc && encSel.value !== 'auto'
    const r = convertText(text, enc, { keep })
    let out = r.text, words = r.words
    if (bandi.checked) {
        // per word, so that the word positions stay right
        let pos = 0
        words = words.map((w) => {
            const u = convertPali(out.slice(w.outFrom, w.outTo))
            const nw = { ...w, outFrom: pos, outTo: pos + u.length, text: u }
            pos += u.length
            return nw
        })
        out = words.map((w) => w.text).join('')
    }
    last = { text: out, words }
    const issues = findIssues(out)
    output.innerHTML = words.length > MAX_SPANS ? markIssues(out, 0, out.length, issues) : words.map((w, i) => {
        const inner = markIssues(out, w.outFrom, w.outTo, issues)
        const lead = inner.match(/^\s*/)[0]
        return `${lead}<span class="w${w.kept && enc ? ' kept' : ''}" data-i="${i}">${inner.slice(lead.length)}</span>`
    }).join('')
    const status = $('status')
    status.className = 'badge ' + (issues.length ? 'bad' : 'ok')
    status.textContent = !out.trim() ? '' : issues.length ? `${issues.length} ${t('issuesFound')}` : t('noIssues')
    $('issues').innerHTML = issues.slice(0, 60).map((x, k) =>
        `<button type="button" data-k="${k}" title="${escapeHtml(t('issue_' + x.kind))}">${escapeHtml(out.slice(Math.max(0, x.start - 6), x.end + 6).trim())}</button>`).join('')
}

// html of out[from, to) with the issues inside it marked
function markIssues(out, from, to, issues) {
    let html = '', pos = from
    for (let k = 0; k < issues.length; k++) {
        const x = issues[k]
        if (x.end <= from || x.start >= to) continue
        const s = Math.max(x.start, from), e = Math.min(x.end, to)
        html += escapeHtml(out.slice(pos, s)) + `<span class="issue" data-k="${k}" title="${escapeHtml(t('issue_' + x.kind))}">${escapeHtml(out.slice(s, e))}</span>`
        pos = e
    }
    return html + escapeHtml(out.slice(pos, to))
}

input.addEventListener('input', () => { keep = new Set(); render() })
for (const el of [encSel, bandi]) el.addEventListener('change', render)
fontSel.addEventListener('change', setFont)
document.addEventListener('langchange', render)
output.addEventListener('click', (e) => {
    const w = e.target.closest('.w')
    if (!w || !encSel.value) return
    const i = +w.dataset.i
    keep.has(i) ? keep.delete(i) : keep.add(i)
    render()
})
$('issues').addEventListener('click', (e) => {
    const b = e.target.closest('button')
    if (!b) return
    const span = output.querySelector(`.issue[data-k="${b.dataset.k}"]`)
    if (!span) return
    output.querySelectorAll('.focus').forEach((s) => s.classList.remove('focus'))
    span.classList.add('focus')
    span.scrollIntoView({ block: 'center', behavior: 'smooth' })
})
$('copy').addEventListener('click', () => copyText(last.text))
$('clear').addEventListener('click', () => { input.value = ''; keep = new Set(); render(); input.focus() })
setFont()
render()

// ---- .docx files
const drop = $('drop'), fileInput = $('file')
let current = null // { name, bytes, fonts }

const message = (key) => { const m = $('file-message'); m.hidden = !key; m.textContent = key ? t(key) : '' }

async function openFile(file) {
    message(null)
    $('file-fonts').hidden = true
    $('file-report').hidden = true
    if (/\.doc$/i.test(file.name)) return message('docOld')
    const bytes = new Uint8Array(await file.arrayBuffer())
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) return message('notDocx')
    const { scanDocx } = await import('../lib/docx.js')
    let fonts
    try { fonts = scanDocx(bytes) } catch { return message('notDocx') }
    if (!fonts.length) return message('noLegacy')
    current = { name: file.name, bytes, fonts }
    $('file-name').textContent = file.name
    $('file-fonts').querySelector('tbody').innerHTML = fonts.map((f, i) => {
        const choice = uniFontFor(f.name)
        return `<tr><td>${escapeHtml(f.name)}</td><td>${f.enc.label}</td><td>${f.chars.toLocaleString()}</td>
            <td><select data-i="${i}" data-bold="${choice.bold ? 1 : 0}">${fontOptions.replace(`value="${choice.id}"`, `value="${choice.id}" selected`)}</select></td></tr>`
    }).join('')
    $('file-fonts').hidden = false
}

drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over') })
drop.addEventListener('dragleave', () => drop.classList.remove('over'))
drop.addEventListener('drop', (e) => {
    e.preventDefault()
    drop.classList.remove('over')
    if (e.dataTransfer.files[0]) openFile(e.dataTransfer.files[0])
})
fileInput.addEventListener('change', () => { if (fileInput.files[0]) openFile(fileInput.files[0]); fileInput.value = '' })
remember($('embed'), 'embed')

$('convert-file').addEventListener('click', async () => {
    if (!current) return
    const button = $('convert-file')
    button.disabled = true
    button.textContent = t('working')
    try {
        const { convertDocx } = await import('../lib/docx.js')
        const choices = new Map()
        for (const sel of $('file-fonts').querySelectorAll('select')) {
            choices.set(current.fonts[+sel.dataset.i].name, { id: sel.value, bold: sel.dataset.bold === '1' })
        }
        const fetchFont = async (file) => new Uint8Array(await (await fetch(`../fonts/${file}.ttf`)).arrayBuffer())
        const { bytes, report } = await convertDocx(current.bytes, { choices, embed: $('embed').checked, fetchFont })
        download(current.name.replace(/\.docx$/i, '') + '-unicode.docx',
            new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }))
        const r = $('file-report')
        r.hidden = false
        r.innerHTML = `<p class="badge ok">${escapeHtml(t('fileDone'))}</p>` + (report.issues.length
            ? `<p><span class="badge bad">${report.issues.length}${report.issues.length >= 200 ? '+' : ''} ${escapeHtml(t('issuesFound'))}</span></p>
               <div class="issues">${report.issues.slice(0, 40).map((x) => `<button type="button" title="${escapeHtml(t('issue_' + x.kind))}">${escapeHtml(x.text.slice(Math.max(0, x.start - 10), x.end + 10).trim())}</button>`).join('')}</div>`
            : '')
    } finally {
        button.disabled = false
        button.textContent = t('convertDownload')
    }
})
