// the pali script converter (tools/converter.html): sinhala, roman (IAST) and thai, through sinhala
// [sinhala, other, one way only (0: from sinhala, 1: to sinhala)] - the longest letters are replaced first
(() => {
// all letter pairs of a script: each consonant with each vowel sign
function createConsoCombi(combinations, consonants) {
    const out = [];
    for (const combi of combinations) for (const conso of consonants) {
        const cc = [conso[0] + combi[2], combi[0] + conso[1] + combi[1]];
        if (conso.length > 2) cc.push(conso[2]);
        else if (combi.length > 3) cc.push(combi[3]); // a vowel sign converted one way only
        out.push(cc);
    }
    return out;
}
// dir 0: sinhala to the other script, 1: the other script to sinhala
function convert(text, dir, conso_combi, specials) {
    const replace = (list) => {
        for (const pair of [...list].sort((a, b) => b[dir].length - a[dir].length))
            if (pair.length < 3 || pair[2] == dir) text = text.replace(new RegExp(pair[dir], 'gi'), pair[+!dir]);
    };
    if (dir == 0) text = text.replace(/\u200D/g, ''); // no joiners in roman and thai
    replace(conso_combi);
    replace(specials);
    if (dir == 1) text = text.replace(/්ර/g, '්\u200Dර').replace(/්ය/g, '්\u200Dය'); // rakaransa and yansa
    return text;
}

// roman (IAST): sinhala unicode, roman
const ro_specials = [
    /* VOWELS */
    ['ඓ', 'ai'], // sinhala only begin - only kai and ai occurs in reality
    ['ඖ', 'au'], // ambiguous conversions e.g. k+au = ka+u = kau, a+u = au but only kau and au occurs in reality
    ['ඍ', 'ṛ'],
    ['ඎ', 'ṝ'],
    //['ඏ', 'ḷ'], // removed because conflicting with ළ් and very rare
    ['ඐ', 'ḹ'], // sinhala only end
        
    ['අ', 'a'],
    ['ආ', 'ā'],
    ['ඇ', 'æ'], ['ඇ', 'Æ', 1],
    ['ඈ', 'ǣ'],
    ['ඉ', 'i'],
    ['ඊ', 'ī'],
    ['උ', 'u'],
    ['ඌ', 'ū'],
    ['එ', 'e'],
    ['ඒ', 'ē'],
    ['ඔ', 'o'],
    ['ඕ', 'ō'],

    /* SPECIALS */
    ['ඞ්', 'ṅ'], // not used in combi
    ['ං', 'ṁ'], ['ං', 'ṃ', 1], // IAST, use both
    ['ඃ', 'ḥ'], ['ඃ', 'Ḥ', 1] // sinhala only
];

const ro_consonants = [
    ['ඛ', 'kh'],
    ['ඨ', 'ṭh'],
    ['ඝ', 'gh'],
    ['ඡ', 'ch'],
    ['ඣ', 'jh'],
    ['ඦ', 'ñj', 0], //ඤ්ජ
    ['ඪ', 'ḍh'],
    ['ඬ', 'ṇḍ'], ['ඬ', 'dh', 1], //ණ්ඩ
    ['ථ', 'th'],
    ['ධ', 'dh'],
    ['ඵ', 'ph'],    
    ['භ', 'bh'],    
    ['ඹ', 'mb', 0], // non pali
    ['ඳ', 'ṉd'], ['ඳ', 'd', 1], // non pali
    ['ඟ', 'ṉg'], ['ඟ', 'g', 1], // non pali
    ['ඥ', 'gn'], // non pali
    
    ['ක', 'k'],
    ['ග', 'g'],    
    ['ච', 'c'],    
    ['ජ', 'j'],    
    ['ඤ', 'ñ'],        
    ['ට', 'ṭ'],    
    ['ඩ', 'ḍ'],    
    ['ණ', 'ṇ'],    
    ['ත', 't'],    
    ['ද', 'd'],
    ['න', 'n'],
    ['ප', 'p'],
    ['බ', 'b'],
    ['ම', 'm'],
    ['ය', 'y'],
    ['ර', 'r'],
    ['ල', 'l'],
    ['ව', 'v'],
    ['ශ', 'ś'],
    ['ෂ', 'ş'], ['ෂ', 'Ṣ', 1], ['ෂ', 'ṣ', 1],
    ['ස', 's'],
    ['හ', 'h'],
    ['ළ', 'ḷ'],
    ['ෆ', 'f']  
];

// sinh before, sinh after, roman after
const ro_combinations = [
    ['', '', '්'], //ක්
    ['', 'a', ''], //ක
    ['', 'ā', 'ා'], //කා
    ['', 'æ', 'ැ'], // non pali
    ['', 'ǣ', 'ෑ'], // non pali
    ['', 'i', 'ි'],
    ['', 'ī', 'ී'],
    ['', 'u', 'ු'],
    ['', 'ū', 'ූ'],
    ['', 'e', 'ෙ'],
    ['', 'ē', 'ේ'], // non pali
    ['', 'ai', 'ෛ'], // non pali
    ['', 'o', 'ො'],
    ['', 'ō', 'ෝ'], // non pali
    
    ['', 'ṛ', 'ෘ'],  // sinhala only begin
    ['', 'ṝ', 'ෲ'],
    ['', 'au', 'ෞ'],
    //['', 'ḷ', 'ෟ'], // conflicting with ළ් - might cause bugs - removed bcs very rare
    ['', 'ḹ', 'ෳ'] // sinhala only end
];


const ro_conso_combi = createConsoCombi(ro_combinations, ro_consonants);

// thai: sinhala, thai
const th_specials = [
    /* VOWELS */
	['ඇ', 'แอะ'], // non pali begin
	['ඈ', 'แอ'],
    ['ඓ', 'ไอ'], // ใอ does not occur in thai
    ['ඖ', 'เอา'],
    ['ඍ', 'ฤ'],
    ['ඎ', 'ฤๅ'],
    ['ඏ', 'ฦ'],
    ['ඐ', 'ฦๅ'], // non pali end
        
    ['අ', 'อ'],
    ['ආ', 'อา'],
    ['ඉ', 'อิ'],
    ['ඊ', 'อี'],
    ['උ', 'อุ'],
    ['ඌ', 'อู'],
    ['එ', 'เอ'],
    ['ඒ', 'เอ', 0], // thai uses the short form
    ['ඔ', 'โอ'],
    ['ඕ', 'โอ', 0], // thai uses the short form

    /* special replacements */
    ['ඞ්', 'งฺ'], // not used in combi
    ['ඞ‌', 'ง'], // non pali
    ['ිං', 'ึ', 1], // කිං - single char in thai side
    ['ං', 'ํ'],
    ['.', 'ฯ', 1], // used in old thai tipitaka as a fullstop
    // ['ඃ', 'ḥ, Ḥ'] // non pali - cant find in thai
    // numerals
    ['0', '๐'], ['1', '๑'], ['2', '๒'], ['3', '๓'], ['4', '๔'], ['5', '๕'], ['6', '๖'], ['7', '๗'], ['8', '๘'], ['9', '๙']
];


const th_consonants = [
    ['ඛ', 'ข'],
    ['ඨ', 'ฐ'], ['ඨ', '', 1], // budsir uses some letters that are not in the thai unicode space
    ['ඝ', 'ฆ'],
    ['ඡ', 'ฉ'],
    ['ඣ', 'ฌ'],
    ['ඦ', 'ญฺช', 0], //ඤ්ජ
    ['ඪ', 'ฒ'],
    ['ඬ', 'ณฺฑ', 0], //ණ්ඩ
    ['ථ', 'ถ'],
    ['ධ', 'ธ'],
    ['ඵ', 'ผ'],
    ['භ', 'ภ'],
    ['ඹ', 'มฺพ', 0],	//ම්බ
	//['ඳ', 'ṉd'], ['ඳ', 'd'],   //non pali - cant find thai conso for these
	//['ඟ', 'ṉg'], ['ඟ', 'g'], //non pali
    //['ඥ', 'gn'], // non pali
    
    ['ක', 'ก'],
    ['ග', 'ค'],
    ['ච', 'จ'],
    ['ජ', 'ช'],
    ['ඤ', 'ญ'], ['ඤ', '', 1], // budsir
    ['ට', 'ฎ'], ['ට', 'ฏ', 1], // budsir
    ['ඩ', 'ฑ'],
    ['ණ', 'ณ'],
    ['ත', 'ต'],
    ['ද', 'ท'],
    ['න', 'น'],
    ['ප', 'ป'],
    ['බ', 'พ'],
    ['ම', 'ม'],
    ['ය', 'ย'],
    ['ර', 'ร'],
    ['ල', 'ล'],
    ['ව', 'ว'],
    ['ශ', 'ศ'],
    ['ෂ', 'ษ'],
    ['ස', 'ส'],
    ['හ', 'ห'],
    ['ළ', 'ฬ'],
    ['ෆ', 'ฟ']  // non pali
];

// thai before, thai after, sinh after
const th_combinations = [
    ['', 'ฺ', '්'], //ක්    กฺ
    ['', '', ''], //ක ก
    ['', 'า', 'ා'], //කා กา
    ['แ', 'ะ', 'ැ'], //කැ  - non pali
    ['แ', '', 'ෑ'], //කෑ - non pali
    ['', 'ิ', 'ි'], //කි
    ['', 'ี', 'ී'], //කී
    ['', 'ุ', 'ු'], //කු
    ['', 'ู', 'ූ'], //කූ
    ['เ', '', 'ෙ'], //කෙ
    ['เ', '', 'ේ', 0], //කේ - non pali: thai has one e, so only from sinhala
    ['โ', '', 'ො'], //කො
    ['โ', '', 'ෝ', 0], //කෝ - non pali: thai has one o, so only from sinhala
	['ไ', '', 'ෛ'], ['ใ', '', 'ෛ'], //කෛ - only 20 thai words use ใ

    ['เ', 'า', 'ෞ'],  // non pali begin  
    ['', 'ฤ', 'ෘ'],  
    ['', 'ฤๅ', 'ෲ'],
    ['', 'ฦ', 'ෟ'], // not used in thai, but used in sinh
    ['', 'ฦๅ', 'ෳ'] // not used in thai nor sinh - non pali end
];

const th_conso_combi = createConsoCombi(th_combinations, th_consonants);

const scripts = { ro: [ro_conso_combi, ro_specials], th: [th_conso_combi, th_specials] };
const toSinhala = (text, from) => from == 'si' ? text : convert(text, 1, ...scripts[from]);
const fromSinhala = (text, to) => to == 'si' ? text : convert(text, 0, ...scripts[to]);

const $ = (id) => document.getElementById(id), input = $('input'), output = $('output');
const chosen = (name) => document.querySelector(`input[name="${name}"]:checked`).value;
function update() {
    const from = chosen('from'), to = chosen('to');
    output.value = fromSinhala(toSinhala(input.value, from), to);
    output.lang = { si: 'si', ro: 'pi-Latn', th: 'th' }[to];
    input.lang = { si: 'si', ro: 'pi-Latn', th: 'th' }[from];
}
input.addEventListener('input', update);
document.querySelectorAll('input[type="radio"]').forEach(r => r.addEventListener('change', update));
$('swap').addEventListener('click', () => {
    const from = chosen('from'), to = chosen('to');
    input.value = output.value;
    document.querySelector(`input[name="from"][value="${to}"]`).checked = true;
    document.querySelector(`input[name="to"][value="${from}"]`).checked = true;
    update();
});
$('copy').addEventListener('click', () => {
    navigator.clipboard.writeText(output.value).then(() => { $('copy').textContent = 'Copied'; setTimeout(() => $('copy').textContent = 'Copy', 1500); });
});
$('test').addEventListener('click', () => { // every letter pair of the roman table, to check the conversions
    input.value = [...ro_conso_combi, ...ro_specials].filter(p => p.length < 3 || p[2] == 0).map(p => p[0]).join(' ');
    document.querySelector('input[name="from"][value="si"]').checked = true;
    update();
});
update();
})();
