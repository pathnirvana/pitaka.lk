// Which published Unicode font replaces a legacy font in a converted .docx. A legacy font of the same design maps
// to its own Uni font. The others go to the published font closest in style (a draft, to be reviewed).
const sameDesign = [
    [/abhaya|abaya|^fm\W?aba/i, 'abhaya'], [/malithi|malit|malathi/i, 'malithi'], [/bindu/i, 'bindumathi'], [/imanee|imani/i, 'imanee'],
    [/gangan/i, 'ganganee'], [/gurulu/i, 'gurulugomi'], [/arund/i, 'arundathee'], [/alakamanda/i, 'alakamanda'], [/davas/i, 'davasa'],
]
const closestStyle = [
    [/agni|gemunu|rajantha|indee/i, 'davasa'], // bold or condensed square shapes
    [/basuru|dharan/i, 'ganganee'], // heavy, round
    [/isiwara|siwa|deran|disapamok/i, 'alakamanda'], // slanted, light
    [/rashmi/i, 'bindumathi'], // light, round
    [/samantha|saman|sandhy|emanee/i, 'imanee'],
]

// { id, bold }: legacy bolds are separate fonts (FM AbaBld), so their runs get bold set instead
export function uniFontFor(legacyName) {
    const bold = /bld|bold/i.test(legacyName)
    for (const [re, id] of [...sameDesign, ...closestStyle]) if (re.test(legacyName)) return { id, bold }
    return { id: 'abhaya', bold }
}
