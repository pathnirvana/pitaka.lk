// The store texts of the books app, for Google Play (play-listing.mjs, play-release.mjs) and the App Store
// (dev/apple/asc-submit.mjs, in English: the App Store allows no Sinhala letters in the en-US texts, and has no Sinhala
// locale): the book list comes from dev/books/books.json.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const books = JSON.parse(readFileSync(join(here, '../books/books.json')))
const groupNames = ['ත්‍රිපිටකය ආශ්‍රිත පොත්', 'රේරුකානේ චන්දවිමල හිමි', 'වෙනත් පොත්'] // as on the books index

export const store = {
  title: 'Sinhala Buddhist Books',
  shortDescription: `${books.length} Sinhala Buddhist books, with the Dhammapada and Jathaka stories, offline`,
  fullDescription: `බෞද්ධයන් විසින් දැනගත යුතුම කරුණු සහ රසවත් බෞද්ධ කතා ඇතුලත් පහසුවෙන් කියවිය හැකි පොත් ${books.length} ක්.

 - ධම්මපද කතා දැන් මෙහිම – ගාථා 423 සිංහල තේරුම, සජ්ඣායනය සහ සිතුවම් සමඟ
 - පින්තූර සහිත පන්සිය පණස් ජාතකය
 - සියලු පොත් තුළ සොයන්න – සිංහල හෝ singlish අකුරෙන්
 - නැවතුණු තැනින් කියවන්න, කැමති මාතෘකා තරුවකින් සුරකින්න
 - සුදු, පුස්කොළ සහ අඳුරු පසුබිම්, අකුරු ප්‍රමාණය ඔබට ගැලපෙන ලෙස

${groupNames.map((name, gi) => `${name}\n${books.filter(b => b.group == gi + 1)
    .map(b => ` - ${b.name}${gi != 1 && b.author ? ` – ${b.author}` : ''}`).join('\n')}`).join('\n\n')}

අන්තර්ජාලය නැතිවම offline භාවිතා කරන්න. මෙම පොත් https://pitaka.lk/books/ හි ද කියවිය හැක.

තරු පහක rating එකක් දී අපව උනන්දු කරන්න.

ධර්ම දානය පිණිස හැකිතාක් බෙදා හරින්න. ඔබගේ දෙමාපියන් සහ දරුවන්ටද කියවන්නට සලස්වන්න. භික්ෂූන් වහන්සේලාගේ ජංගම දුරකථන වලද ස්ථාපනය කර දෙන්න. අලුතෙන් එකතු කල යුතු පොත් පිලිබඳ යෝජනා pathnirvana@gmail.com වෙත එවන්න`,
  releaseNotes: `ධම්මපද කතා දැන් මෙහිම – ගාථා, සිංහල තේරුම, සජ්ඣායනය සහ සිතුවම් සමඟ
සියලු පොත් තුළ සොයන්න – සිංහල හෝ singlish අකුරෙන්, අන්තර්ජාලය නැතිවත්
පින්තූර සහිත පන්සිය පණස් ජාතකය
නැවතුණු තැනින් කියවන්න, කැමති මාතෘකා තරුවකින් සුරකින්න
සුදු, පුස්කොළ සහ අඳුරු පසුබිම්`,
}

export const appleStore = {
  promotionalText: `${books.length} Sinhala Buddhist books, now with the Dhammapada stories: verses, meaning, recitations and paintings.`,
  description: `${books.length} easy to read Sinhala Buddhist books with the topics every Buddhist should know, and the stories loved by all, offline.

- Dhammapada stories, now in this app: all 423 verses with their Sinhala meaning, recitations and paintings, and 305 stories
- The illustrated Pansiya Panas Jathakaya (550 Jathaka stories)
- Search all the books, in Sinhala or Singlish letters, without an internet connection
- Continue reading where you stopped, and star the chapters you like
- White, sepia and dark themes, and the text size that suits you

Books related to the Thripitaka: Pansiya Panas Jathakaya, Dhammapada stories, Mahavanshaya, Pareni Budusiritha, Gauthama Buddha Charithaya, Vishuddhi Margaya, Sinhala Milinda Prashnaya, Atuwakathavasthu and more.

Rev. Rerukane Chandavimala: Bauddhayage Athpotha, Dharma Vinishchaya, Paramitha Prakaranaya, Suvisi Maha Gunaya, Abhidharmaye Mulika Karunu, Abhidharma Margaya, Chathurarya Sathya, Punyopadeshaya, Shasanavatharanaya, Patichcha Samuppada Vivaranaya, Bodhi Poojawa, Nirvana Vinishchaya and more.

Other books: Karma Vipaka, Rasavahini, Sihalavatthu, Amawathura, Pujawaliya, Saddharma Rathnavaliya, Kunala Jathakaya and more.

The same books can be read at https://pitaka.lk/books/

Give a five star rating and encourage us.

Distribute as much as possible. Let your parents and children read. Also install on the phones of the Bhikkhus if possible. Send suggestions for new books to pathnirvana@gmail.com

"Sabba Danam Dhamma Danam Jinathi"`,
  whatsNew: `- The Dhammapada stories are now in this app: verses, Sinhala meaning, recitations and paintings
- Search all the books in Sinhala or Singlish, offline
- The illustrated Pansiya Panas Jathakaya
- Continue reading where you stopped, and star the chapters you like
- White, sepia and dark themes`,
  keywords: 'Buddhist,Sinhala,Dhammapada,Jathaka,Abhidharma,Dhamma,Tripitaka,Sri Lanka,pitaka.lk,meditation',
}
