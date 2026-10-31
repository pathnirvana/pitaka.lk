// Replaces the App Store screenshots of the editable version of "Sinhala Buddhist Books" (1516496078) with
// build/store-screenshots/apple-* (store-screenshots.js), and sets that version's number (VERSION, default 3.0):
//   node dev/apple/asc-screenshots.mjs
// The sets of the older display sizes are removed: the store scales the 6.9" and 13" ones down for those devices.
// Uses asc.mjs. Screenshots are locked while a version is in review.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { api, editableVersion } from './asc.mjs'

const LOCALE = 'en-US', VERSION = process.env.VERSION || '3.0'
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'build/store-screenshots')
const SETS = [['APP_IPHONE_67', 'apple-iphone-6.9'], ['APP_IPAD_PRO_3GEN_129', 'apple-ipad-13']]

const version = await editableVersion()
if (version.attributes.versionString !== VERSION) {
  await api('PATCH', `/v1/appStoreVersions/${version.id}`, { data: { type: 'appStoreVersions', id: version.id, attributes: { versionString: VERSION } } })
  console.log(`version ${version.attributes.versionString} -> ${VERSION}`)
}
const loc = (await api('GET', `/v1/appStoreVersions/${version.id}/appStoreVersionLocalizations`)).data.find(l => l.attributes.locale === LOCALE)
if (!loc) throw new Error(`no ${LOCALE} localization`)

const sets = (await api('GET', `/v1/appStoreVersionLocalizations/${loc.id}/appScreenshotSets`)).data
for (const s of sets.filter(s => !SETS.some(([type]) => type === s.attributes.screenshotDisplayType))) {
  await api('DELETE', `/v1/appScreenshotSets/${s.id}`)
  console.log('removed', s.attributes.screenshotDisplayType)
}
for (const [type, folder] of SETS) {
  const set = sets.find(s => s.attributes.screenshotDisplayType === type) ?? (await api('POST', '/v1/appScreenshotSets', { data: { type: 'appScreenshotSets',
    attributes: { screenshotDisplayType: type }, relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: loc.id } } } } })).data
  for (const s of (await api('GET', `/v1/appScreenshotSets/${set.id}/appScreenshots`)).data) await api('DELETE', `/v1/appScreenshots/${s.id}`)
  for (const fileName of readdirSync(join(DIR, folder)).filter(f => f.endsWith('.png')).sort()) {
    const bytes = readFileSync(join(DIR, folder, fileName))
    const shot = (await api('POST', '/v1/appScreenshots', { data: { type: 'appScreenshots', attributes: { fileName, fileSize: bytes.length },
      relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: set.id } } } } })).data
    for (const op of shot.attributes.uploadOperations) {
      const r = await fetch(op.url, { method: op.method, headers: Object.fromEntries(op.requestHeaders.map(h => [h.name, h.value])),
        body: bytes.subarray(op.offset, op.offset + op.length) })
      if (!r.ok) throw new Error(`upload ${fileName}: ${r.status}`)
    }
    await api('PATCH', `/v1/appScreenshots/${shot.id}`, { data: { type: 'appScreenshots', id: shot.id,
      attributes: { uploaded: true, sourceFileChecksum: createHash('md5').update(bytes).digest('hex') } } })
    console.log(' ', type, fileName)
  }
}
