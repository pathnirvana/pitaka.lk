// Isi fonts (Isi Abhaya, IsiMalithi ... by Pushpananda Ekanayake). The keymap is generated from the 2020 Isi to
// Unicode conversion by dev/unicode/derive-isi.py and is shared by all Isi fonts.
import table from './isi-table.js'

export default {
    id: 'isi',
    label: 'Isi',
    // not "Isiwara Uni", the new Unicode font
    fontNames: [/^Isi(?!wara)/i],
    map: table,
    // Isi types ආ ඇ ඈ ඌ ඎ ඐ ඖ as a vowel letter plus a sign
    post: [
        [/අා/g, 'ආ'], [/අැ/g, 'ඇ'], [/අෑ/g, 'ඈ'], [/උෟ/g, 'ඌ'], [/ඍෘ/g, 'ඎ'], [/ඏෟ/g, 'ඐ'], [/ඔෟ/g, 'ඖ'],
        [/එ්/g, 'ඒ'], [/ඔ්/g, 'ඕ'],
    ],
    // for fromUnicode()
    unpost: [[/ආ/g, 'අා'], [/ඇ/g, 'අැ'], [/ඈ/g, 'අෑ'], [/ඌ/g, 'උෟ'], [/ඎ/g, 'ඍෘ'], [/ඐ/g, 'ඏෟ'], [/ඖ/g, 'ඔෟ']],
}
