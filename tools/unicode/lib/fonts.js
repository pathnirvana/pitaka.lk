// The published Sinhala Unicode fonts. Pages, the .docx converter and dev/unicode/sync-fonts.mjs all read this list.
// Files are in ../fonts/: each TTF for download, each WOFF2 for the pages.
export const VERSION = '2.000'

export const families = [
    {
        id: 'abhaya', family: 'Abhaya Uni', si: 'අභය', bandi: true,
        styles: [
            { name: 'Regular', file: 'AbhayaUni-Regular', weight: 400 },
            { name: 'Bold', file: 'AbhayaUni-Bold', weight: 700 },
            { name: 'Condensed', file: 'AbhayaUniCondensed-Regular', weight: 400, family: 'Abhaya Uni Condensed' },
            { name: 'Condensed Bold', file: 'AbhayaUniCondensed-Bold', weight: 700, family: 'Abhaya Uni Condensed' },
        ],
        // [wdth,wght] in the build, renamed because brackets break download links
        variable: { file: 'AbhayaUni-Variable', weight: [400, 700], stretch: [75, 100] },
    },
    { id: 'malithi', family: 'Malithi Uni', si: 'මලිති', bandi: true, styles: [{ name: 'Regular', file: 'MalithiUni-Regular', weight: 400 }] },
    { id: 'bindumathi', family: 'Bindumathi Uni', si: 'බින්ඳුමතී', bandi: true, styles: [{ name: 'Regular', file: 'BindumathiUni-Regular', weight: 400 }] },
    { id: 'imanee', family: 'Imanee Uni', si: 'ඉමාණී', styles: [{ name: 'Regular', file: 'ImaneeUni-Regular', weight: 400 }] },
    { id: 'ganganee', family: 'Ganganee Uni', si: 'ගංඟානී', styles: [{ name: 'Regular', file: 'GanganeeUni-Regular', weight: 400 }] },
    { id: 'samantha', family: 'Samantha Uni', si: 'සමන්තා', styles: [{ name: 'Regular', file: 'SamanthaUni-Regular', weight: 400 }] },
    { id: 'gurulugomi', family: 'Gurulugomi Uni', si: 'ගුරුළුගෝමි', styles: [{ name: 'Regular', file: 'GurulugomiUni-Regular', weight: 400 }] },
    { id: 'arundathee', family: 'Arundathee Uni', si: 'අරුන්‍දතී', styles: [{ name: 'Regular', file: 'ArundatheeUni-Regular', weight: 400 }] },
    { id: 'alakamanda', family: 'Alakamanda Uni', si: 'ආලකමන්‍දා', styles: [{ name: 'Regular', file: 'AlakamandaUni-Regular', weight: 400 }] },
    { id: 'davasa', family: 'Davasa Uni', si: 'දවස', styles: [{ name: 'Regular', file: 'DavasaUni-Regular', weight: 400 }] },
]

export const familyById = (id) => families.find((f) => f.id === id)

// loads a family's static styles for this page (once). base: path to the fonts folder from the page
const loaded = new Map()
export function loadFamily(fam, base = '../fonts/') {
    if (!loaded.has(fam.id)) {
        loaded.set(fam.id, Promise.all(fam.styles.map((s) => {
            const face = new FontFace(s.family || fam.family, `url(${base}${s.file}.woff2) format('woff2')`,
                { weight: String(s.weight), stretch: s.stretch || '100%', display: 'swap' })
            document.fonts.add(face)
            return face.load()
        })))
    }
    return loaded.get(fam.id)
}

// the variable Abhaya, under its own family name so sliders can reach every weight and width
export function loadVariable(fam, base = '../fonts/') {
    const key = fam.id + ':var'
    if (!loaded.has(key)) {
        const v = fam.variable
        const face = new FontFace(fam.family + ' Variable', `url(${base}${v.file}.woff2) format('woff2')`,
            { weight: v.weight.join(' '), stretch: v.stretch.map((x) => x + '%').join(' '), display: 'swap' })
        document.fonts.add(face)
        loaded.set(key, face.load())
    }
    return loaded.get(key)
}
