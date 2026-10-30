// Page text in Sinhala and English. Elements with data-t="key" get the text, data-t-placeholder the placeholder.
export const strings = {
    site: { si: 'පිටක.lk සිංහල යුනිකේත', en: 'pitaka.lk Sinhala Unicode' },
    navConvert: { si: 'යුනිකේත පරිවර්තකය', en: 'Unicode converter' },
    navBandi: { si: 'පාලි බැඳි අකුරු', en: 'Pali touching letters' },
    navFonts: { si: 'යුනිකේත අකුරු', en: 'Unicode fonts' },
    footer: { si: 'පරිවර්තන දෝෂ pathnirvana@gmail.com වෙත දන්වන්න', en: 'Report conversion errors to pathnirvana@gmail.com' },
    copy: { si: 'කොපි කරන්න', en: 'Copy' },
    themeLight: { si: 'දීප්තිමත් පසුබිම', en: 'Light theme' },
    themeDark: { si: 'අඳුරු පසුබිම', en: 'Dark theme' },
    copied: { si: 'කොපි විය', en: 'Copied' },
    clear: { si: 'මකන්න', en: 'Clear' },
    font: { si: 'අකුරු', en: 'Font' },

    // converter
    convertTitle: { si: 'FM, ඉසි අකුරු යුනිකේත බවට හරවන්න', en: 'Convert FM and Isi text to Unicode' },
    convertLead: {
        si: 'FM හෝ ඉසි අකුරින් ලියූ පෙළ මෙහි අලවන්න, නැත්නම් Word (.docx) ගොනුවක් දමන්න. සියල්ල ඔබේ පරිගණකයේ ම සිදු වේ - කිසිවක් අන්තර්ජාලයට නොයයි.',
        en: 'Paste text typed in FM or Isi fonts, or drop a Word (.docx) file. Everything happens on your computer - nothing is uploaded.',
    },
    fileTitle: { si: 'Word, PDF ගොනුවක් හෝ පින්තූරයක් හරවන්න', en: 'Convert a Word file, PDF or image' },
    dropHere: { si: '.docx, .pdf ගොනුවක් හෝ පින්තූරයක් මෙහි දමන්න, නැත්නම්', en: 'Drop a .docx, .pdf or image here, or' },
    fileKinds: {
        si: 'Word ගොනුවල හැඩතල නොවෙනස්ව අකුරු පමණක් යුනිකේත වේ. PDF ගොනුවල පෙළ කියවා යුනිකේත කරයි; ස්කෑන් කළ පිටු සහ පින්තූර OCR මගින් කියවයි.',
        en: 'Word files keep their formatting; only the text and fonts change. PDFs: the text is read and converted; scanned pages and images are read with OCR.',
    },
    pdfReading: { si: 'පිටු {i} / {n} කියවමින්...', en: 'Reading page {i} of {n}...' },
    pdfDone: { si: 'පිටු {n} කියවා අවසන්.', en: 'Read {n} pages.' },
    pdfNote: { si: 'PDF හි පිටු සැකැස්ම (තීරු, වගු) නොරැකේ - පෙළ පමණක් ලැබේ.', en: 'The layout (columns, tables) is not kept - only the text.' },
    scannedPages: { si: 'පෙළ නැති (ස්කෑන් කළ) පිටු {n}ක් ඇත.', en: '{n} pages have no text (scanned).' },
    ocrScanned: { si: 'ඒවා OCR මගින් කියවන්න', en: 'Read them with OCR' },
    ocrRange: { si: 'පිටු පින්තූර ලෙස කියවන්න (OCR)', en: 'Read pages as images (OCR)' },
    ocrRangeHint: {
        si: 'පෙළ නිවැරදිව නොඑන PDF සඳහා. පළමු වරට 5MB පමණ බාගත වේ; පිටුවකට තත්පර කිහිපයක් ගත වේ.',
        en: 'For PDFs whose text comes out wrong. About 5 MB downloads the first time; each page takes a few seconds.',
    },
    pageFrom: { si: 'පිටු', en: 'Pages' },
    pageTo: { si: 'සිට', en: 'to' },
    pageUntil: { si: 'දක්වා', en: '' },
    ocrGo: { si: 'කියවන්න', en: 'Read' },
    ocrLoading: { si: 'OCR ආකෘතිය පූරණය වෙමින් {p}%...', en: 'Loading the OCR model {p}%...' },
    ocrPage: { si: 'පිටුව {i} OCR මගින් කියවමින් ({k} / {n})...', en: 'Reading page {i} with OCR ({k} of {n})...' },
    ocrImage: { si: 'පින්තූරය කියවමින්...', en: 'Reading the image...' },
    ocrDone: { si: 'කියවා අවසන්.', en: 'Done.' },
    ocrNote: { si: 'OCR මගින් කියවූ පෙළෙහි වැරදි තිබිය හැක - කියවා බලන්න.', en: 'Text read by OCR may have mistakes - please check it.' },
    stop: { si: 'නවත්වන්න', en: 'Stop' },
    downloadTxt: { si: '.txt බාගන්න', en: 'Download .txt' },
    downloadDocx: { si: '.docx බාගන්න', en: 'Download .docx' },
    chooseFile: { si: 'ගොනුවක් තෝරන්න', en: 'choose a file' },
    fileStays: { si: 'ගොනුව ඔබේ පරිගණකයෙන් පිට නොයයි.', en: 'The file never leaves your computer.' },
    docOld: { si: 'පැරණි .doc ගොනු කියවිය නොහැක. Word හි "Save As" මගින් .docx ලෙස සුරකින්න.', en: 'Old .doc files can\'t be read. Save the file as .docx in Word ("Save As") first.' },
    notDocx: { si: 'මෙය .docx ගොනුවක් නොවේ.', en: 'This is not a .docx file.' },
    notPdf: { si: 'මෙම PDF ගොනුව විවෘත කළ නොහැක.', en: 'This PDF could not be opened.' },
    noLegacy: { si: 'මෙම ගොනුවේ FM හෝ ඉසි අකුරු හමු නොවීය.', en: 'No FM or Isi fonts were found in this file.' },
    legacyFont: { si: 'පැරණි අකුරු', en: 'Old font' },
    encoding: { si: 'වර්ගය', en: 'Type' },
    letters: { si: 'අකුරු ගණන', en: 'Characters' },
    newFont: { si: 'නව යුනිකේත අකුරු', en: 'New Unicode font' },
    embed: { si: 'අකුරු ගොනුව තුළට ඇතුළත් කරන්න (අකුරු නැති පරිගණකවලත් පෙනේ)', en: 'Embed the fonts in the file (shows on computers without them)' },
    convertDownload: { si: 'හරවා බාගන්න', en: 'Convert and download' },
    working: { si: 'හරවමින්...', en: 'Converting...' },
    fileDone: { si: 'නිමයි. පරිවර්තිත ගොනුව බාගත විය.', en: 'Done. The converted file has been downloaded.' },
    macNote: {
        si: 'Mac සඳහා Word හා ඔන්ලයින් Word ඇතුළත් කළ අකුරු නොසලකා හැරිය හැක. එවිට පෙළ වෙනත් සිංහල අකුරකින් පෙනුණත් එය නිවැරදි යුනිකේත වේ.',
        en: 'Word for Mac and online viewers may ignore embedded fonts. The text then shows in another Sinhala font, but it is still correct Unicode.',
    },
    textTitle: { si: 'පෙළ හරවන්න', en: 'Convert text' },
    legacyText: { si: 'FM / ඉසි පෙළ', en: 'FM / Isi text' },
    pastePlaceholder: { si: 'FM හෝ ඉසි පෙළ මෙහි අලවන්න', en: 'Paste FM or Isi text here' },
    auto: { si: 'ස්වයංක්‍රීය', en: 'Automatic' },
    unicodeText: { si: 'යුනිකේත පෙළ', en: 'Unicode text' },
    alreadyUnicode: { si: 'මෙය දැනටමත් යුනිකේත ය', en: 'This is Unicode already' },
    applyBandi: { si: 'පාලි පෙළ: බැඳි අකුරු යොදන්න', en: 'Pali text: use touching letters' },
    clickToKeep: { si: 'ඉංග්‍රීසි වචනයක් වෙනස් නොවී තබා ගැනීමට එය ක්ලික් කරන්න.', en: 'Click an English word to keep it as typed.' },
    noIssues: { si: 'දෝෂ හමු නොවීය', en: 'No problems found' },
    issuesFound: { si: 'දෝෂ විය හැකි තැන්', en: 'possible problems' },
    'issue_no-letter': { si: 'අකුරක් නැති පිල්ල', en: 'vowel sign without a letter' },
    'issue_two-signs': { si: 'පිලි දෙකක්', en: 'two vowel signs' },
    'issue_stray-zwj': { si: 'අනවශ්‍ය ZWJ', en: 'stray joiner' },
    issue_leftover: { si: 'නොහැරුණු අකුරු', en: 'unconverted character' },

    // bandi
    bandiTitle: { si: 'පාලි බැඳි අකුරු', en: 'Pali touching letters' },
    bandiLead: {
        si: 'පාලි පෙළේ හල් අකුරු බැඳි අකුරු ලෙසත්, විශේෂ පාලි බැඳි අකුරු ලෙසත් ලියයි. විශේෂ බැඳි අකුරු ඇත්තේ මෙහි ඇති අකුරු මුහුණත්වල පමණි.',
        en: 'Writes the consonant clusters of Pali text as touching letters and the special Pali conjuncts. The special conjuncts are only in the fonts offered here.',
    },
    yourText: { si: 'ඔබ ඇතුළු කළ අකුරු', en: 'Your text' },
    withBandi: { si: 'පාලි බැඳි අකුරු සහිතව', en: 'With touching letters' },
    commonSpecials: { si: 'සුලබ විශේෂ බැඳි අකුරු (common conjuncts) යොදන්න', en: 'Use the common conjuncts' },
    rareSpecials: { si: 'දුලබ විශේෂ බැඳි අකුරු (rare conjuncts) යොදන්න', en: 'Use the rare conjuncts' },
    repaya: { si: 'රේඵය යොදන්න', en: 'Use repaya' },
    eoTitle: { si: '‘එ’ සහ ‘ඔ’', en: 'e and o' },
    eoKeep: { si: 'වෙනස් නොකරන්න', en: 'Leave as typed' },
    eoShort: { si: 'හල් කිරීම් ඉවත් කරන්න (ඒ → එ, කෝ → කො)', en: 'Write without hal (ඒ → එ, කෝ → කො)' },
    eoLong: { si: 'දීර්ඝ කරන්න (හල් අකුරකට පෙර හැර)', en: 'Make long (except before a consonant with hal)' },
    eoLongExample: { si: 'උදා: තෙන → තේන, නමො → නමෝ, සොත්ථි වෙනස් නොවේ', en: 'e.g. තෙන → තේන, නමො → නමෝ, සොත්ථි stays' },
    eoExplain: {
        si: 'පාලි භාෂාවේ ‘එ’ සහ ‘ඔ’ ශබ්ද වන්නේ ‘ඒ’ සහ ‘ඕ’ ලෙසයි. ඒවා හල් සලකුණ නැතිව ලිවීම හෝ, හල් අකුරකට පෙර හැර සෑම තැනම දීර්ඝ ලෙස ලිවීම මෙහිදී තෝරාගත හැක.',
        en: 'In Pali, e and o are pronounced long. They can be written without the hal mark, or written long everywhere except before a consonant with hal.',
    },
    specialsTitle: { si: 'විශේෂ පාලි බැඳි අකුරු', en: 'Special Pali conjuncts' },
    specialsExplain: {
        si: 'පැරණි පාලි පොත්වල භාවිතා වන විශේෂ බැඳි අකුරු.',
        en: 'The special conjuncts of old Pali books.',
    },
    commonHeading: { si: 'සුලබ අකුරු (common conjuncts)', en: 'Common conjuncts' },
    rareHeading: { si: 'දුලබ අකුරු (rare conjuncts)', en: 'Rare conjuncts' },

    // fonts
    fontsTitle: { si: 'සිංහල යුනිකේත අකුරු මුහුණත්', en: 'Sinhala Unicode fonts' },
    fontsLead: {
        si: 'රේඵය, රකාරාංශය, යංසය, විශේෂ පාලි අකුරු හා බැඳි අකුරු ඇතුළුව සියලුම සිංහල අක්ෂර පහත අකුරු මුහුණත්වලින් පෙන්විය හැක. මේවා FM හෝ ඉසි නොව යුනිකේත අකුරු බැවින් Word, Photoshop වැනි මෘදුකාංගවල සහ වෙබ් අඩවිවල භාවිතා කළ හැක.',
        en: 'These fonts show every Sinhala letter, including repaya, rakaransaya, yansaya, the special Pali conjuncts and touching letters. They are Unicode fonts, not FM or Isi, so they work in Word, Photoshop and on websites.',
    },
    credit: {
        si: 'FM/ඉසි අකුරු නිර්මාණය කළ පුෂ්පානන්ද ඒකනායක මහතා මේ අකුරු මෙහි පළ කිරීමට කාරුණිකව අවසර දුන්නේ ය. වාණිජ කටයුතු සඳහා භාවිතා කිරීමට fontmaster @ sltnet වෙතින් බලපත්‍රයක් ලබා ගන්න.',
        en: 'Much thanks to Mr. Pushpananda Ekanayake, the designer of the FM/Isi fonts, who kindly gave permission to publish these fonts. For commercial use, please obtain a licence from fontmaster @ sltnet.',
    },
    downloadAll: { si: 'සියලු අකුරු බාගන්න (zip)', en: 'Download all fonts (zip)' },
    installNote: { si: 'zip ගොනුව විවෘත කර අකුරු install කරන්න. Abhaya සඳහා සාමාන්‍ය ගොනු හෝ variable ගොනුව පමණක් install කරන්න, දෙකම නොවේ.', en: 'Open the zip and install the fonts. For Abhaya install either the separate styles or the variable font, not both.' },
    tester: { si: 'අකුරු පරීක්ෂකය', en: 'Type tester' },
    testerPlaceholder: { si: 'ඔබේ පෙළ මෙහි ලියන්න', en: 'Type your text here' },
    size: { si: 'ප්‍රමාණය', en: 'Size' },
    weight: { si: 'ඝනකම', en: 'Weight' },
    width: { si: 'පළල', en: 'Width' },
    lineHeight: { si: 'පේළි පරතරය', en: 'Line height' },
    colour: { si: 'වර්ණය', en: 'Colour' },
    align: { si: 'පෙළගැස්ම', en: 'Align' },
    copyImage: { si: 'පින්තූරයක් ලෙස කොපි කරන්න', en: 'Copy as image' },
    downloadPng: { si: 'PNG බාගන්න', en: 'Download PNG' },
    downloadSvg: { si: 'SVG බාගන්න', en: 'Download SVG' },
    imageNote: { si: 'Word, PowerPoint, WhatsApp වැනි තැනක අලවන්න. SVG ගොනුව ඕනෑම ප්‍රමාණයකට විශාල කළ හැක.', en: 'Paste into Word, PowerPoint, WhatsApp and so on. The SVG scales to any size.' },
    download: { si: 'බාගන්න', en: 'Download' },
    variable: { si: 'variable', en: 'variable' },
    imageCopied: { si: 'පින්තූරය කොපි විය', en: 'Image copied' },
    imageFailed: { si: 'මෙම බ්‍රව්සරයට පින්තූර කොපි කළ නොහැක - PNG බාගන්න', en: 'This browser can\'t copy images - download the PNG instead' },
}

const params = new URLSearchParams(location.search)
let stored = null
try { stored = localStorage.getItem('unicode-tools-lang') } catch {}
export let lang = params.get('lang') === 'en' || (!params.get('lang') && stored === 'en') ? 'en' : 'si'

export const t = (key) => (strings[key] || {})[lang] ?? key

export function setLang(l) {
    lang = l
    try { localStorage.setItem('unicode-tools-lang', l) } catch {}
    const url = new URL(location.href)
    if (l === 'en') url.searchParams.set('lang', 'en'); else url.searchParams.delete('lang')
    history.replaceState(null, '', url)
    applyLang()
}

export function applyLang(root = document) {
    document.documentElement.lang = lang
    for (const el of root.querySelectorAll('[data-t]')) el.textContent = t(el.dataset.t)
    for (const el of root.querySelectorAll('[data-t-placeholder]')) el.placeholder = t(el.dataset.tPlaceholder)
    document.dispatchEvent(new CustomEvent('langchange'))
}
