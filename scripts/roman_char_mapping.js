
// sinhala unicode, roman
var ro_specials = [
    /* VOWELS */
    ['ඓ', 'ai'], // sinhala only begin - only kai and ai occurs in reality
    ['ඖ', 'au'], // ambiguous conversions e.g. f+au = ka+u = kau, a+u = au but only kau and au occurs in reality
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
    ['ඞ්‌', 'ṅ'], // not used in combi
    ['ං', 'ṁ'], ['ං', 'ṃ', 1], // IAST, use both
    ['ඃ', 'ḥ'], ['ඃ', 'Ḥ', 1] // sinhala only
];

var ro_consonants = [
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
    ['ඹ', 'mb', 0],
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
var ro_combinations = [
    ['', '', '්'], //ක්
    ['', 'a', ''], //ක
    ['', 'ā', 'ා'], //කා
    ['', 'æ', 'ැ'],
    ['', 'ǣ', 'ෑ'],
    ['', 'i', 'ි'],
    ['', 'ī', 'ී'],
    ['', 'u', 'ු'],
    ['', 'ū', 'ූ'],
    ['', 'e', 'ෙ'],
    ['', 'ē', 'ේ'],
    ['', 'ai', 'ෛ'],
    ['', 'o', 'ො'],
    ['', 'ō', 'ෝ'],
    
    ['', 'ṛ', 'ෘ'],  // sinhala only begin
    ['', 'ṝ', 'ෲ'],
    ['', 'au', 'ෞ'],
    //['', 'ḷ', 'ෟ'], // conflicting with ළ් - might cause bugs - removed bcs very rare
    ['', 'ḹ', 'ෳ'] // sinhala only end
];


var ro_conso_combi = createConsoCombi(ro_combinations, ro_consonants);

function romanToSinhalaConvert() {
    genericConvert(1, ro_conso_combi, ro_specials);
    // add zwj for yansa and rakaransa
    replaceRe('්ර','්‍ර'); // rakar
    replaceRe('්ය','්‍ය'); // yansa
}

function sinhalaToRomanConvert() {
    // remove zwj since it does not occur in roman
    replaceRe('\u200D', '');
    genericConvert(0, ro_conso_combi, ro_specials);
}

function genTestPattern() {
    var testSinh = '';
    $.each(ro_conso_combi, function(_1, cc) {
        if (cc.length < 3 || cc[2] == 0) {
            testSinh += cc[0] + ' ';
        }
    });

    $.each(ro_specials, function(_1, v) {
        if (v.length < 3 || v[2] == 0) {
            testSinh += v[0] + ' ';
        }
    });
    return testSinh;
}