// Uploads the signed bundle of the books app (/Volumes/2TB/Android/Books, ./gradlew bundleRelease) and releases it on
// a track (TRACK, default production) with the notes of store-text.mjs; the Play review follows the commit:
//   node dev/play/play-release.mjs [--dry]     (--dry uploads, then drops the edit: nothing is released)
import { readFileSync } from 'node:fs'
import { api } from './play.mjs'
import { store } from './store-text.mjs'

const AAB = process.env.AAB || '/Volumes/2TB/Android/Books/app/build/outputs/bundle/release/app-release.aab'
const TRACK = process.env.TRACK || 'production'

const e = `/edits/${(await api('POST', '/edits')).id}`
try {
  const bundle = await api('POST', `${e}/bundles`, { bytes: readFileSync(AAB), type: 'application/octet-stream' })
  console.log('bundle', bundle.versionCode)
  await api('PUT', `${e}/tracks/${TRACK}`, { track: TRACK, releases: [{ status: 'completed', versionCodes: [String(bundle.versionCode)],
    releaseNotes: [{ language: 'en-US', text: store.releaseNotes }] }] })
  if (process.argv.includes('--dry')) {
    await api('DELETE', e)
    console.log('dry run: edit dropped')
  } else {
    // Play sometimes refuses to send an edit for review itself: it is then sent from the console (Publishing overview)
    await api('POST', `${e}:commit`).catch(err => {
      if (!/changesNotSentForReview/.test(err.message)) throw err
      return api('POST', `${e}:commit?changesNotSentForReview=true`).then(() => console.log('not sent for review: send it in the Play console'))
    })
    console.log(TRACK, 'committed')
  }
} catch (err) {
  await api('DELETE', e).catch(() => {})
  throw err
}
