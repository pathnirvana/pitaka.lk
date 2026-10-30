// Reads the text of a PDF with pdf.js and converts the text set in FM or Isi fonts to Unicode, font by font.
// PDFs made from FM documents keep the typed keys (WinAnsi text), so no OCR is needed for them. Pages with no text
// (scans) are reported so they can be OCR'd.
import { toUnicode } from './convert.js'
import { encodingOfFont } from './detect.js'

const VENDOR = new URL('./vendor/pdfjs/', import.meta.url).href
let pdfjsPromise
export const loadPdfjs = () => pdfjsPromise ||= import(VENDOR + 'pdf.min.mjs').then((m) => {
    m.GlobalWorkerOptions.workerSrc = VENDOR + 'pdf.worker.min.mjs'
    return m
})

export async function openPdf(data) {
    const pdfjs = await loadPdfjs()
    return pdfjs.getDocument({ data, isEvalSupported: false }).promise
}

// font names carry a subset prefix: "JLNPIV+FMAbhaya"
const realName = (name) => (name || '').replace(/^[A-Z]{6}\+/, '')

// { paragraphs: [string], fonts: Map name -> { enc, chars }, chars } for one page
export async function pageText(doc, number) {
    const page = await doc.getPage(number)
    await page.getOperatorList() // loads the fonts, so their names are known
    const { items } = await page.getTextContent()
    const fonts = new Map()
    const runs = []
    for (const it of items) {
        if (!it.str) continue
        const name = realName(page.commonObjs.has(it.fontName) ? page.commonObjs.get(it.fontName).name : '')
        const enc = encodingOfFont(name)
        const size = Math.hypot(it.transform[2], it.transform[3]) || 10
        runs.push({ str: it.str, name, enc, x: it.transform[4], y: it.transform[5], w: it.width, size })
        const f = fonts.get(name) || { enc, chars: 0 }
        f.chars += it.str.length
        fonts.set(name, f)
    }
    // lines: runs at the same height, left to right
    runs.sort((a, b) => b.y - a.y || a.x - b.x)
    const lines = []
    for (const r of runs) {
        const line = lines[lines.length - 1]
        if (line && Math.abs(line.y - r.y) < line.size * 0.5) line.runs.push(r)
        else lines.push({ y: r.y, size: r.size, runs: [r] })
    }
    for (const line of lines) {
        line.runs.sort((a, b) => a.x - b.x)
        line.text = lineText(line.runs)
    }
    // paragraphs: a gap clearly larger than the usual line spacing starts a new one
    const gaps = lines.slice(1).map((l, i) => lines[i].y - l.y).filter((g) => g > 0).sort((a, b) => a - b)
    const usual = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0
    const paragraphs = []
    let current = ''
    lines.forEach((line, i) => {
        const gap = i ? lines[i - 1].y - line.y : 0
        if (i && (gap > usual * 1.45 || gap < 0)) { paragraphs.push(current); current = '' }
        current = current ? current + ' ' + line.text : line.text
    })
    if (current) paragraphs.push(current)
    page.cleanup()
    const chars = runs.reduce((n, r) => n + r.str.trim().length, 0)
    return { paragraphs: paragraphs.map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean), fonts, chars }
}

// joins the runs of a line: neighbouring runs in one legacy font are converted together, so a kombuva that ends
// one run still finds its consonant
function lineText(runs) {
    let out = '', group = null
    const flush = () => {
        if (!group) return
        out += group.enc ? toUnicode(group.str, group.enc, { fontName: group.name }) : group.str
        group = null
    }
    let prev = null
    for (const r of runs) {
        const gap = prev ? r.x - (prev.x + prev.w) : 0
        const space = prev && gap > r.size * 0.2 && !/\s$/.test(prev.str) && !/^\s/.test(r.str) ? ' ' : ''
        if (group && group.enc === r.enc && group.name === r.name) group.str += space + r.str
        else {
            flush()
            out += space
            group = { enc: r.enc, name: r.name, str: r.str }
        }
        prev = r
    }
    flush()
    return out
}
