// The farewell release of the old Dhammapada app (lk.pitaka.dhammapada, /Volumes/2TB/Android/Dhammapada, 3.0): the
// Dhammapada is now in the books app. In one edit: the si-LK listing gets a notice at the top (and the privacy policy of
// PRIVACY.md), and the bundle goes to production:
//   node dev/play/dhammapada-farewell.mjs [--dry]     (--dry uploads, then drops the edit)
process.env.PACKAGE = 'lk.pitaka.dhammapada'
import { readFileSync } from 'node:fs'
const { api } = await import('./play.mjs')

const AAB = '/Volumes/2TB/Android/Dhammapada/app/build/outputs/bundle/release/app-release.aab'
const LANG = 'si-LK', BOOKS = 'https://play.google.com/store/apps/details?id=lk.pitaka.books'
const NOTICE = `ධම්මපද කතා දැන් “බෞද්ධ පොත්” යෙදුමේ, තවත් පොත් 45 ක් සමඟ ඇත: ${BOOKS}
එහි සියලු පොත් තුළ සොයන්න, කැමති කතා තරුවකින් සුරකින්න සහ නැවතුණු තැනින් කියවන්න. මෙම යෙදුම තවදුරටත් යාවත්කාලීන නොකෙරේ.`
const NOTES = `ධම්මපද කතා දැන් “බෞද්ධ පොත්” යෙදුමේ, තවත් පොත් 45 ක් සමඟ – සෙවීම, තරු සහ නැවතුණු තැනින් කියවීම සමඟ.
මෙම යෙදුම තවදුරටත් යාවත්කාලීන නොකෙරේ.`

const e = `/edits/${(await api('POST', '/edits')).id}`
try {
  const listing = await api('GET', `${e}/listings/${LANG}`)
  const body = listing.fullDescription.includes('බෞද්ධ පොත්” යෙදුමේ') ? listing.fullDescription.split('\n\n').slice(1).join('\n\n') : listing.fullDescription
  const fullDescription = `${NOTICE}\n\n${body.replace(/our privacy policy \S+/, 'Privacy policy: https://github.com/pathnirvana/pitaka.lk/blob/master/PRIVACY.md')}`
  const shortDescription = 'ධම්මපද කතා දැන් “බෞද්ධ පොත්” යෙදුමේ. මෙම යෙදුම තවදුරටත් යාවත්කාලීන නොකෙරේ.'
  if (shortDescription.length > 80 || fullDescription.length > 4000) throw new Error(`too long: ${shortDescription.length}/80, ${fullDescription.length}/4000`)
  await api('PUT', `${e}/listings/${LANG}`, { ...listing, shortDescription, fullDescription })
  console.log('listing', LANG)
  const bundle = await api('POST', `${e}/bundles`, { bytes: readFileSync(AAB), type: 'application/octet-stream' })
  console.log('bundle', bundle.versionCode)
  await api('PUT', `${e}/tracks/production`, { track: 'production', releases: [{ status: 'completed', versionCodes: [String(bundle.versionCode)],
    releaseNotes: [{ language: LANG, text: NOTES }] }] })
  if (process.argv.includes('--dry')) {
    await api('DELETE', e)
    console.log('dry run: edit dropped')
  } else {
    await api('POST', `${e}:commit`).catch(err => { // as in play-release.mjs
      if (!/changesNotSentForReview/.test(err.message)) throw err
      return api('POST', `${e}:commit?changesNotSentForReview=true`).then(() => console.log('not sent for review: send it in the Play console'))
    })
    console.log('production committed')
  }
} catch (err) {
  await api('DELETE', e).catch(() => {})
  throw err
}
