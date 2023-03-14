/* Mapping between sinhala consos, vowels and independent vowels
 * Roman letters are shown only for info purposes
 * Non pali mapping is based on the sound and might be wrong
 */

// sinhala, thai, one-way direction (0:si->th 1:th->si)
var th_specials = [
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
    // ['ඒ', 'ē', '??'], //normal thai uses the short form
    ['ඔ', 'โอ'],
    //['ඕ', 'ō', '??'] //normal thai uses the short form

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


var th_consonants = [
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
var th_combinations = [
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
    // ['เ', '', 'ේ'], //කේ - non pali
    ['โ', '', 'ො'], //කො
    // ['โ', '', 'ෝ'], //කෝ - non pali
	['ไ', '', 'ෛ'], ['ใ', '', 'ෛ'], //කෛ - only 20 thai words use ใ

    ['เ', 'า', 'ෞ'],  // non pali begin  
    ['', 'ฤ', 'ෘ'],  
    ['', 'ฤๅ', 'ෲ'],
    ['', 'ฦ', 'ෟ'], // not used in thai, but used in sinh
    ['', 'ฦๅ', 'ෳ'] // not used in thai nor sinh - non pali end
];

var th_conso_combi = createConsoCombi(th_combinations, th_consonants);

function thaiToSinhalaConvert() {
    genericConvert(1, th_conso_combi, th_specials);
    // add zwj for yansa and rakaransa
    replaceRe('්ර','්‍ර'); // rakar
    replaceRe('්ය','්‍ය'); // yansa
}

function sinhalaToThaiConvert() {
    // remove zwj since it does not occur in thai
    replaceRe('\u200D', '');
    genericConvert(0, th_conso_combi, th_specials);
}

