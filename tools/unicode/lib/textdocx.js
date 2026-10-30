// A plain Word file from converted text: one paragraph per paragraph, a page break between pages, all in one Uni
// font, which can be embedded.
import { zipSync, strToU8 } from './vendor/fflate.js'
import { embedFonts } from './docx.js'
import { familyById } from './fonts.js'

const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'
const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\r\n'
const esc = (s) => s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c])

// pages: [[paragraph text]]
export async function textToDocx(pages, { fontId = 'abhaya', embed = true, fetchFont, ...opts } = {}) {
    const family = familyById(fontId).family
    const fonts = `<w:rFonts w:ascii="${family}" w:hAnsi="${family}" w:cs="${family}" w:eastAsia="${family}"/>`
    const body = pages.map((paras, i) => paras.map((p, k) => {
        const pageBreak = i && !k ? '<w:r><w:br w:type="page"/></w:r>' : ''
        return `<w:p>${pageBreak}<w:r><w:t xml:space="preserve">${esc(p)}</w:t></w:r></w:p>`
    }).join('')).join('')
    const files = {
        '[Content_Types].xml': `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`,
        '_rels/.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${R}/officeDocument" Target="word/document.xml"/></Relationships>`,
        'word/_rels/document.xml.rels': `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="${R}/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="${R}/settings" Target="settings.xml"/></Relationships>`,
        'word/settings.xml': `<w:settings xmlns:w="${W}"/>`,
        'word/styles.xml': `<w:styles xmlns:w="${W}"><w:docDefaults><w:rPrDefault><w:rPr>${fonts}<w:sz w:val="24"/><w:szCs w:val="24"/><w:lang w:bidi="si-LK"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="160" w:line="300" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`,
        'word/document.xml': `<w:document xmlns:w="${W}" xmlns:r="${R}"><w:body>${body}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/></w:sectPr></w:body></w:document>`,
    }
    const u8 = {}
    for (const [k, v] of Object.entries(files)) u8[k] = strToU8(DECL + v)
    if (embed) {
        const parser = new (opts.DOMParser || globalThis.DOMParser)()
        const serializer = new (opts.XMLSerializer || globalThis.XMLSerializer)()
        await embedFonts(u8, new Map([[fontId, new Set(['Regular'])]]), parser, serializer, fetchFont)
    }
    return zipSync(u8, { level: 6 })
}
