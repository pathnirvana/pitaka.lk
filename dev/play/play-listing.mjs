// The Google Play listing of the books app (lk.pitaka.books): the en-US texts (store-text.mjs),
// and the images of dev/apple/store-screenshots.js (play-phone -> phone, play-tablet-10 -> 7" and 10" tablets,
// play-feature.png -> feature graphic), all in one edit:
//   node dev/play/play-listing.mjs [--dry]     (--dry prints the texts only)
import { readdirSync, readFileSync } from 'node:fs'
import { store } from './store-text.mjs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const SHOTS = join(here, '../apple/build/store-screenshots')
const LANG = 'en-US'
const listing = { language: LANG, title: store.title, shortDescription: store.shortDescription, fullDescription: store.fullDescription }
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
