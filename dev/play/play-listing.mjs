// The Google Play listing of the books app (lk.pitaka.books): the en-US texts (the book list from dev/books/books.json),
// and the images of dev/apple/store-screenshots.js (play-phone -> phone, play-tablet-10 -> 7" and 10" tablets,
// play-feature.png -> feature graphic), all in one edit:
//   node dev/play/play-listing.mjs [--dry]     (--dry prints the texts only)
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(here, '../apple/build/store-screenshots')
const LANG = 'en-US'
const books = JSON.parse(readFileSync(join(here, '../books/books.json')))
const groupNames = ['ත්‍රිපිටකය ආශ්‍රිත පොත්', 'රේරුකානේ චන්දවිමල හිමි', 'වෙනත් පොත්'] // as on the books index

const listing = {
  language: LANG,
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
}
if (listing.shortDescription.length > 80 || listing.fullDescription.length > 4000)
  throw new Error(`too long: ${listing.shortDescription.length}/80, ${listing.fullDescription.length}/4000`)
if (process.argv.includes('--dry')) {
  console.log(listing.shortDescription, '\n\n' + listing.fullDescription, '\n\n', listing.fullDescription.length, 'chars')
  process.exit(0)
}

const { api } = await import('./play.mjs')
const IMAGES = [['phoneScreenshots', 'play-phone'], ['sevenInchScreenshots', 'play-tablet-10'], ['tenInchScreenshots', 'play-tablet-10'], ['featureGraphic', 'play-feature.png']]
const e = `/edits/${(await api('POST', '/edits')).id}`
try {
  await api('PUT', `${e}/listings/${LANG}`, listing)
  console.log('listing', LANG)
  for (const [type, from] of IMAGES) {
    await api('DELETE', `${e}/listings/${LANG}/${type}`)
    const files = from.endsWith('.png') ? [join(SHOTS, from)] : readdirSync(join(SHOTS, from)).filter(f => f.endsWith('.png')).sort().map(f => join(SHOTS, from, f))
    for (const f of files) await api('POST', `${e}/listings/${LANG}/${type}`, { bytes: readFileSync(f), type: 'image/png' })
    console.log(type, files.length)
  }
  await api('POST', `${e}:commit`)
  console.log('committed')
} catch (err) {
  await api('DELETE', e).catch(() => {})
  throw err
}
