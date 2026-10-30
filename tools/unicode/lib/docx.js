// Converts the legacy-font text of a .docx to Unicode, in the browser. Only runs set in an FM or Isi font change:
// their text is converted, their font becomes the matching Uni font, and the formatting stays. The Uni fonts can be
// embedded so that Word and LibreOffice show them on computers that don't have them.
import { unzipSync, zipSync, strFromU8, strToU8 } from './vendor/fflate.js'
import { toUnicode, KOMBU, HAL, ZWJ } from './convert.js'
import { encodingOfFont } from './detect.js'
import { findIssues } from './validate.js'
import { familyById } from './fonts.js'
import { uniFontFor } from './font-map.js'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const PKG = 'http://schemas.openxmlformats.org/package/2006/relationships'
const CT = 'http://schemas.openxmlformats.org/package/2006/content-types'
const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
const TEXT_PARTS = /^word\/(document|header\d*|footer\d*|footnotes|endnotes|comments)\.xml$/

const dom = (opts) => {
    const S = opts.XMLSerializer || globalThis.XMLSerializer
    return { parser: new (opts.DOMParser || globalThis.DOMParser)(), serializer: S && new S() }
}
const child = (el, name) => { for (const c of el.childNodes) if (c.namespaceURI === W && c.localName === name) return c; return null }
const wattr = (el, name) => el.getAttributeNS(W, name) || el.getAttribute('w:' + name) || ''

// the fonts of the document's styles, defaults and theme, to find the font each run is shown in
function fontContext(files, parser) {
    const xml = (p) => files[p] && parser.parseFromString(strFromU8(files[p]), 'application/xml')
    const theme = {}
    const th = xml('word/theme/theme1.xml')
    if (th) {
        for (const [tag, key] of [['majorFont', 'major'], ['minorFont', 'minor']]) {
            const f = th.getElementsByTagNameNS('*', tag)[0]
            const latin = f && f.getElementsByTagNameNS('*', 'latin')[0]
            if (latin) theme[key] = latin.getAttribute('typeface')
        }
    }
    const styles = new Map()
    let defaultFont = '', defaultPara = ''
    const st = xml('word/styles.xml')
    if (st) {
        const rpd = st.getElementsByTagNameNS(W, 'rPrDefault')[0]
        if (rpd) defaultFont = fontOf(rpd.getElementsByTagNameNS(W, 'rFonts')[0], theme)
        for (const s of st.getElementsByTagNameNS(W, 'style')) {
            const id = wattr(s, 'styleId'), basedOn = child(s, 'basedOn'), rPr = child(s, 'rPr')
            styles.set(id, { basedOn: basedOn && wattr(basedOn, 'val'), font: rPr && fontOf(child(rPr, 'rFonts'), theme) })
            if (wattr(s, 'type') === 'paragraph' && ['1', 'true'].includes(wattr(s, 'default'))) defaultPara = id
        }
    }
    const styleFont = (id, depth = 0) => {
        const s = id && styles.get(id)
        if (!s || depth > 20) return ''
        return s.font || styleFont(s.basedOn, depth + 1)
    }
    return { theme, styleFont, defaultFont, defaultPara }
}

// legacy text is ASCII, so the ascii (or hAnsi) slot names its font
function fontOf(rFonts, theme) {
    if (!rFonts) return ''
    const name = wattr(rFonts, 'ascii') || wattr(rFonts, 'hAnsi')
    if (name) return name
    const t = wattr(rFonts, 'asciiTheme') || wattr(rFonts, 'hAnsiTheme')
    return t ? theme[t.startsWith('major') ? 'major' : 'minor'] || '' : ''
}

function runFont(run, ctx) {
    const rPr = child(run, 'rPr')
    const direct = rPr && fontOf(child(rPr, 'rFonts'), ctx.theme)
    if (direct) return direct
    const rStyle = rPr && child(rPr, 'rStyle')
    const fromRunStyle = rStyle && ctx.styleFont(wattr(rStyle, 'val'))
    if (fromRunStyle) return fromRunStyle
    let p = run.parentNode
    while (p && !(p.namespaceURI === W && p.localName === 'p')) p = p.parentNode
    const pPr = p && child(p, 'pPr'), pStyle = pPr && child(pPr, 'pStyle')
    return ctx.styleFont(pStyle ? wattr(pStyle, 'val') : ctx.defaultPara) || ctx.styleFont(ctx.defaultPara) || ctx.defaultFont || ctx.theme.minor || ''
}

// the legacy fonts in a .docx and how much text each has: [{ name, enc, runs, chars }]
export function scanDocx(bytes, opts = {}) {
    const files = unzipSync(bytes)
    const { parser } = dom(opts)
    const ctx = fontContext(files, parser)
    const found = new Map()
    for (const path of Object.keys(files).filter((p) => TEXT_PARTS.test(p))) {
        const doc = parser.parseFromString(strFromU8(files[path]), 'application/xml')
        for (const run of [...doc.getElementsByTagNameNS(W, 'r')]) {
            const name = runFont(run, ctx), enc = encodingOfFont(name)
            if (!enc) continue
            const text = [...run.childNodes].filter((n) => n.localName === 't').map((t) => t.textContent).join('')
            if (!text) continue
            const f = found.get(name) || { name, enc, runs: 0, chars: 0 }
            f.runs++; f.chars += text.length
            found.set(name, f)
        }
    }
    return [...found.values()].sort((a, b) => b.chars - a.chars)
}

// choices: Map of legacy font name -> { id, bold } (uniFontFor() for the rest)
// fetchFont(file) -> Uint8Array of fonts/<file>.ttf, needed when embed is on
export async function convertDocx(bytes, { choices = new Map(), embed = true, fetchFont, ...opts } = {}) {
    const files = unzipSync(bytes)
    const { parser, serializer } = dom(opts)
    const ctx = fontContext(files, parser)
    const used = new Map() // family id -> Set of 'Regular' | 'Bold'
    const report = { runs: 0, chars: 0, issues: [] }
    const choose = (name) => choices.get(name) || uniFontFor(name)

    for (const path of Object.keys(files).filter((p) => TEXT_PARTS.test(p))) {
        const doc = parser.parseFromString(strFromU8(files[path]), 'application/xml')
        // runs grouped by paragraph, so a syllable split over two runs can be put back together
        const groups = []
        let last = null
        for (const run of [...doc.getElementsByTagNameNS(W, 'r')]) {
            const name = runFont(run, ctx), enc = encodingOfFont(name)
            const ts = [...run.childNodes].filter((n) => n.namespaceURI === W && n.localName === 't')
            if (!enc || !ts.length || ts.some((t) => /[\u0D80-\u0DFF]/.test(t.textContent))) { last = null; continue }
            const para = closestPara(run)
            if (!last || last.para !== para || last.enc !== enc || !adjacent(last.runs[last.runs.length - 1].run, run)) {
                last = { para, enc, runs: [] }
                groups.push(last)
            }
            last.runs.push({ run, name, ts })
        }
        for (const g of groups) convertGroup(g, report)
        for (const g of groups) for (const r of g.runs) {
            const choice = choose(r.name), fam = familyById(choice.id)
            setRunFont(r.run, fam.family, choice.bold, doc)
            const bold = choice.bold || hasOn(child(r.run, 'rPr'), 'b')
            if (!used.has(fam.id)) used.set(fam.id, new Set())
            used.get(fam.id).add(bold && fam.styles.some((s) => s.name === 'Bold') ? 'Bold' : 'Regular')
        }
        // the paragraph mark keeps a legacy font too: new text typed there would be legacy
        for (const rPr of [...doc.getElementsByTagNameNS(W, 'rPr')]) {
            if (rPr.parentNode.localName !== 'pPr') continue
            const name = fontOf(child(rPr, 'rFonts'), ctx.theme)
            if (encodingOfFont(name)) setFonts(rPr, familyById(choose(name).id).family, doc)
        }
        files[path] = strToU8(XML_DECL + serializer.serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, ''))
    }
    replaceStyleFonts(files, parser, serializer, choose)
    if (embed && used.size) await embedFonts(files, used, parser, serializer, fetchFont)
    return { bytes: zipSync(files, { level: 6 }), report, used: [...used].map(([id, s]) => ({ id, styles: [...s] })) }
}

function closestPara(n) {
    while (n && !(n.namespaceURI === W && n.localName === 'p')) n = n.parentNode
    return n
}

// two runs are next to each other in the text: no text, tab or break between them
function adjacent(a, b) {
    const after = (x) => { while (x && !x.nextSibling) x = x.parentNode; return x && x.nextSibling }
    for (let n = after(a); n && n !== b; n = n.firstChild || after(n)) {
        if (n.nodeType === 1 && n.namespaceURI === W && ['t', 'tab', 'br', 'cr', 'sym', 'drawing'].includes(n.localName)) return false
    }
    return true
}

// converts the text of a group of runs. A syllable split by a run boundary (a kombuva at the end of one run, its
// consonant in the next; or a vowel sign at the start of a run) moves whole into one run.
function convertGroup({ enc, runs }, report) {
    const pieces = runs.flatMap((r) => r.ts.map((t) => ({ t, s: t.textContent })))
    const opens = (ch) => { const u = enc.map[ch]; return u === KOMBU || (u !== undefined && u.endsWith(ZWJ)) || u === '' || ch === '`' }
    const isMark = (ch) => { const u = enc.map[ch]; return u !== undefined && u !== KOMBU && /^[\u0DCA\u0DCF-\u0DDF\u0D82\u0D83\uE001]/.test(u) }
    for (let i = 0; i + 1 < pieces.length; i++) {
        const a = pieces[i], b = pieces[i + 1]
        let k = a.s.length
        while (k > 0 && opens(a.s[k - 1])) k--
        if (k < a.s.length) { b.s = a.s.slice(k) + b.s; a.s = a.s.slice(0, k) }
        let m = 0
        while (m < b.s.length && isMark(b.s[m])) m++
        if (m && a.s) { a.s += b.s.slice(0, m); b.s = b.s.slice(m) }
    }
    let joined = ''
    for (const p of pieces) {
        const u = toUnicode(p.s, enc, { fontName: runs[0].name })
        p.t.textContent = u
        p.t.setAttribute('xml:space', 'preserve')
        joined += u
    }
    report.chars += joined.length
    // checked as one text, so a syllable over two runs is judged whole and the report shows its context
    for (const x of findIssues(joined)) if (report.issues.length < 200) report.issues.push({ text: joined, ...x })
    report.runs += runs.length
}

const hasOn = (rPr, name) => { const e = rPr && child(rPr, name); return !!e && !['0', 'false', 'off'].includes(wattr(e, 'val')) }

function ensureRPr(run, doc) {
    let rPr = child(run, 'rPr')
    if (!rPr) { rPr = doc.createElementNS(W, 'w:rPr'); run.insertBefore(rPr, run.firstChild) }
    return rPr
}

// w:rPr children must stay in schema order (CT_RPr) or Word calls the file damaged
const RPR_ORDER = ['rStyle', 'rFonts', 'b', 'bCs', 'i', 'iCs', 'caps', 'smallCaps', 'strike', 'dstrike', 'outline', 'shadow', 'emboss',
    'imprint', 'noProof', 'snapToGrid', 'vanish', 'webHidden', 'color', 'spacing', 'w', 'kern', 'position', 'sz', 'szCs', 'highlight',
    'u', 'effect', 'bdr', 'shd', 'fitText', 'vertAlign', 'rtl', 'cs', 'em', 'lang', 'eastAsianLayout', 'specVanish', 'oMath']
function addInOrder(rPr, name, doc, attrsFrom) {
    let e = child(rPr, name)
    if (e) return e
    e = doc.createElementNS(W, 'w:' + name)
    if (attrsFrom) for (const a of attrsFrom.attributes) e.setAttributeNS(a.namespaceURI, a.name, a.value)
    const rank = RPR_ORDER.indexOf(name)
    let ref = null
    for (const c of rPr.childNodes) if (c.nodeType === 1 && RPR_ORDER.indexOf(c.localName) > rank) { ref = c; break }
    rPr.insertBefore(e, ref)
    return e
}

// Word draws Sinhala with the complex-script font, size and bold, so every slot is set
function setFonts(rPr, family, doc) {
    const rf = addInOrder(rPr, 'rFonts', doc)
    for (const a of ['asciiTheme', 'hAnsiTheme', 'eastAsiaTheme', 'cstheme']) { rf.removeAttributeNS(W, a); rf.removeAttribute('w:' + a) }
    for (const a of ['ascii', 'hAnsi', 'cs', 'eastAsia']) rf.setAttributeNS(W, 'w:' + a, family)
    for (const [a, cs] of [['b', 'bCs'], ['i', 'iCs'], ['sz', 'szCs']]) {
        const e = child(rPr, a)
        if (e) addInOrder(rPr, cs, doc, e)
    }
}

function setRunFont(run, family, bold, doc) {
    const rPr = ensureRPr(run, doc)
    setFonts(rPr, family, doc)
    if (bold) { addInOrder(rPr, 'b', doc); addInOrder(rPr, 'bCs', doc) }
}

// styles and defaults that name a legacy font
function replaceStyleFonts(files, parser, serializer, choose) {
    const p = 'word/styles.xml'
    if (!files[p]) return
    const doc = parser.parseFromString(strFromU8(files[p]), 'application/xml')
    let changed = false
    for (const rf of [...doc.getElementsByTagNameNS(W, 'rFonts')]) {
        const name = wattr(rf, 'ascii') || wattr(rf, 'hAnsi')
        if (!encodingOfFont(name)) continue
        setFonts(rf.parentNode, familyById(choose(name).id).family, doc)
        changed = true
    }
    if (changed) files[p] = strToU8(XML_DECL + serializer.serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, ''))
}

// Office font obfuscation (ECMA-376 part 2): the first 32 bytes XOR the GUID key, its bytes in reverse order
export function obfuscateFont(ttf, guid) {
    const hex = guid.replace(/[{}-]/g, '')
    const key = new Uint8Array(16)
    for (let i = 0; i < 16; i++) key[i] = parseInt(hex.substr(30 - i * 2, 2), 16)
    const out = new Uint8Array(ttf)
    for (let i = 0; i < 32; i++) out[i] ^= key[i % 16]
    return out
}

const newGuid = () => {
    const b = crypto.getRandomValues(new Uint8Array(16))
    const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase()
    return `{${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}}`
}

// used: Map of family id -> Set of 'Regular' | 'Bold'
export async function embedFonts(files, used, parser, serializer, fetchFont) {
    const xml = (p, fallback) => parser.parseFromString(files[p] ? strFromU8(files[p]) : fallback, 'application/xml')
    const save = (p, doc) => { files[p] = strToU8(XML_DECL + serializer.serializeToString(doc).replace(/^<\?xml[^>]*\?>\s*/, '')) }
    const ft = xml('word/fontTable.xml', `<w:fonts xmlns:w="${W}" xmlns:r="${R}"/>`)
    const rels = xml('word/_rels/fontTable.xml.rels', `<Relationships xmlns="${PKG}"/>`)
    const relsRoot = rels.documentElement
    let n = Object.keys(files).filter((p) => /^word\/fonts\//.test(p)).length
    for (const [id, styles] of used) {
        const fam = familyById(id)
        let font = [...ft.getElementsByTagNameNS(W, 'font')].find((f) => wattr(f, 'name') === fam.family)
        if (!font) {
            font = ft.createElementNS(W, 'w:font')
            font.setAttributeNS(W, 'w:name', fam.family)
            for (const [tag, val] of [['charset', '00'], ['family', 'auto'], ['pitch', 'variable']]) {
                const e = ft.createElementNS(W, 'w:' + tag); e.setAttributeNS(W, 'w:val', val); font.appendChild(e)
            }
            ft.documentElement.appendChild(font)
        }
        for (const style of ['Regular', 'Bold'].filter((x) => styles.has(x))) { // embedRegular before embedBold
            const file = fam.styles.find((s) => s.name === style).file
            const guid = newGuid(), rid = 'rIdUniFont' + ++n, target = `fonts/font${n}.odttf`
            files['word/' + target] = obfuscateFont(await fetchFont(file), guid)
            const rel = rels.createElementNS(PKG, 'Relationship')
            rel.setAttribute('Id', rid)
            rel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/font')
            rel.setAttribute('Target', target)
            relsRoot.appendChild(rel)
            const tag = style === 'Bold' ? 'embedBold' : 'embedRegular'
            const old = child(font, tag)
            if (old) font.removeChild(old)
            const e = ft.createElementNS(W, 'w:' + tag)
            e.setAttributeNS(R, 'r:id', rid)
            e.setAttributeNS(W, 'w:fontKey', guid)
            font.appendChild(e)
        }
    }
    save('word/fontTable.xml', ft)
    save('word/_rels/fontTable.xml.rels', rels)
    // a new fontTable part needs its own relationship and content type
    if (!files['word/_rels/document.xml.rels'] || !strFromU8(files['word/_rels/document.xml.rels']).includes('fontTable.xml')) {
        const dr = xml('word/_rels/document.xml.rels', `<Relationships xmlns="${PKG}"/>`)
        const rel = dr.createElementNS(PKG, 'Relationship')
        rel.setAttribute('Id', 'rIdUniFontTable')
        rel.setAttribute('Type', 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/fontTable')
        rel.setAttribute('Target', 'fontTable.xml')
        dr.documentElement.appendChild(rel)
        save('word/_rels/document.xml.rels', dr)
    }
    const ct = xml('[Content_Types].xml', `<Types xmlns="${CT}"/>`)
    const types = ct.documentElement
    if (![...types.getElementsByTagNameNS(CT, 'Default')].some((d) => d.getAttribute('Extension') === 'odttf')) {
        const d = ct.createElementNS(CT, 'Default')
        d.setAttribute('Extension', 'odttf')
        d.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.obfuscatedFont')
        types.insertBefore(d, types.firstChild)
    }
    if (![...types.getElementsByTagNameNS(CT, 'Override')].some((o) => o.getAttribute('PartName') === '/word/fontTable.xml')) {
        const o = ct.createElementNS(CT, 'Override')
        o.setAttribute('PartName', '/word/fontTable.xml')
        o.setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.wordprocessingml.fontTable+xml')
        types.appendChild(o)
    }
    save('[Content_Types].xml', ct)
    // Word only uses embedded fonts when the settings say they are there
    if (files['word/settings.xml']) {
        const st = xml('word/settings.xml')
        if (!st.getElementsByTagNameNS(W, 'embedTrueTypeFonts').length) {
            const root = st.documentElement
            const e = st.createElementNS(W, 'w:embedTrueTypeFonts')
            // early in CT_Settings order: after writeProtection/view/zoom/removePersonalInformation/removeDateAndTime
            const after = ['writeProtection', 'view', 'zoom', 'removePersonalInformation', 'removeDateAndTime', 'doNotDisplayPageBoundaries', 'displayBackgroundShape', 'printPostScriptOverText', 'printFractionalCharacterWidth', 'printFormsData']
            let ref = null
            for (const c of root.childNodes) if (c.nodeType === 1 && !after.includes(c.localName)) { ref = c; break }
            root.insertBefore(e, ref)
            save('word/settings.xml', st)
        }
    }
}
