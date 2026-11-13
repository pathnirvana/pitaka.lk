// Copies the published fonts from the sinhala-unicode release into tools/unicode/fonts/ and makes the zip of them.
//   node dev/unicode/sync-fonts.mjs [path to SinhalaUniFonts-<version>.zip]
// The families come from tools/unicode/lib/fonts.js; the other families in the release are left out.
import fs from 'node:fs'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { unzipSync, zipSync, strFromU8, strToU8 } from '../../tools/unicode/lib/vendor/fflate.js'
import { families, VERSION } from '../../tools/unicode/lib/fonts.js'

const repo = path.resolve(import.meta.dirname, '../..')
const out = path.join(repo, 'tools/unicode/fonts')
const release = process.argv[2] || path.resolve(repo, `../sinhala-unicode/build-2026/release/SinhalaUniFonts-${VERSION}.zip`)
const top = `SinhalaUniFonts-${VERSION}/`
const src = unzipSync(fs.readFileSync(release))

const files = families.flatMap((f) => [...f.styles.map((s) => s.file), ...(f.variable ? [f.variable.file] : [])])
const keep = (name) => files.includes(path.basename(name).replace(/\.(ttf|woff2)$/, ''))

// the published fonts, for download (TTF) and for the pages (WOFF2)
fs.mkdirSync(out, { recursive: true })
for (const [name, data] of Object.entries(src)) {
    if (/\.(ttf|woff2)$/.test(name) && keep(name)) fs.writeFileSync(path.join(out, path.basename(name)), data)
}

// the zip: the same layout as the release, with only the published families
const zip = {}
for (const [name, data] of Object.entries(src)) {
    const rel = name.slice(top.length)
    if (/\.(ttf|woff2)$/.test(rel)) { if (keep(rel)) zip[name] = data; continue }
    const vcss = rel.match(/^webfonts\/(.+)-variable\.css$/)  // the CSS of a variable font left out
    if (vcss && !keep(`${vcss[1]}-Variable.ttf`)) continue
    if (rel === 'webfonts/fonts.css') {
        // drop the @font-face rules of the families left out
        const css = strFromU8(data).split(/(?=@font-face)/).filter((rule) => !/src: url\("([^"]+)"/.test(rule) || keep(rule.match(/src: url\("([^"]+)"/)[1])).join('')
        zip[name] = strToU8(css)
        continue
    }
    if (rel === 'README.txt') {
        const statics = families.reduce((n, f) => n + f.styles.length, 0)
        const list = families.map((f) => f.family).join(', ')
        const text = strFromU8(data)
            .replace(/Families: [\s\S]*?\.\n/, (m) => wrapText('Families: ' + list + '.') + '\n')
            .replace(/\(\d+ fonts\)/, `(${statics} fonts)`)
            .replace(/^(  variable\/  ).*$/m, (m, lead) => lead + families.filter((f) => f.variable).map((f) => f.variable.file + '.ttf').join(', '))
            // the release's note on its two variable families, when only Abhaya Uni's is published here
            .replace(/  Abhaya Uni and Nayana Uni come two ways:[\s\S]*?variable fonts\.\n/, (m) => families.some((f) => f.id === 'nayana') ? m : [
                '  Abhaya Uni comes two ways: the four static fonts in ttf/ (Regular, Bold, Condensed Regular,',
                '  Condensed Bold) or one variable font in variable/ (weights 400 to 800, and the condensed width).',
                '  Install one or the other, not both: they share the family name. Word and most office software',
                '  work best with the static fonts; design software and websites can use the variable font.',
            ].join('\n') + '\n')
        zip[name] = strToU8(text)
        continue
    }
    if (!rel.endsWith('/')) zip[name] = data
}
const zipName = `SinhalaUniFonts-${VERSION}.zip`
fs.writeFileSync(path.join(out, zipName), zipSync(zip, { level: 9 }))

// fonts no longer published (the old UN- fonts, FMABHAYA.TTF)
const wanted = new Set([...files.flatMap((f) => [f + '.ttf', f + '.woff2']), zipName])
for (const f of fs.readdirSync(out)) if (!wanted.has(f) && f !== 'web') { fs.rmSync(path.join(out, f)); console.log('removed', f) }
console.log(`${files.length} fonts and ${zipName} (${Object.keys(zip).length} files) in ${path.relative(repo, out)}`)

// the cut down web fonts of the books and dhammapada sites (web/), made from these (needs fonttools, see the script)
try {
    execFileSync(path.join(repo, 'dev/site-lib/make-fonts.sh'), { stdio: 'inherit' })
} catch (e) {
    console.log('could not make the web fonts in tools/unicode/fonts/web - run dev/site-lib/make-fonts.sh with fonttools')
}

function wrapText(s, width = 100) {
    const lines = []
    let line = ''
    for (const w of s.split(' ')) { if ((line + ' ' + w).trim().length > width) { lines.push(line.trim()); line = w } else line += ' ' + w }
    return [...lines, line.trim()].join('\n')
}
