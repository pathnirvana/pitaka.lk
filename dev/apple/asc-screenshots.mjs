// Replaces the App Store screenshots of the editable version of "Sinhala Buddhist Books" (1516496078) with
// build/store-screenshots/apple-* (store-screenshots.js), and sets that version's number (VERSION, default 3.0):
//   node dev/apple/asc-screenshots.mjs
// The sets of the older display sizes are removed: the store scales the 6.9" and 13" ones down for those devices.
// Uses the App Store Connect API key of build-ios.sh (ASC_* override it). Screenshots are locked while a version is in review.
import { createHash, createPrivateKey, createSign } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const KEY_ID = process.env.ASC_KEY_ID || 'CNJQZ82QCH'
const ISSUER = process.env.ASC_ISSUER_ID || '177929b9-56d5-4755-88a7-b8a4a017d089'
const KEY_PATH = process.env.ASC_KEY_PATH || '/Volumes/2TB/Android/AuthKey_CNJQZ82QCH.p8'
const APP = '1516496078', LOCALE = 'en-US', VERSION = process.env.VERSION || '3.0'
const DIR = join(dirname(fileURLToPath(import.meta.url)), 'build/store-screenshots')
const SETS = [['APP_IPHONE_67', 'apple-iphone-6.9'], ['APP_IPAD_PRO_3GEN_129', 'apple-ipad-13']]
const EDITABLE = ['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED', 'METADATA_REJECTED']

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
function token() {
  const now = Math.floor(Date.now() / 1000)
  const head = b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }), body = b64({ iss: ISSUER, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })
  const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key: createPrivateKey(readFileSync(KEY_PATH)), dsaEncoding: 'ieee-p1363' })
  return `${head}.${body}.${sig.toString('base64url')}`
}
async function api(method, path, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + path, {
    method, headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  const json = text ? JSON.parse(text) : {}
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(json.errors ?? json).slice(0, 1500)}`)
  return json
}

const versions = await api('GET', `/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&fields[appStoreVersions]=versionString,appVersionState`)
const version = versions.data.find(v => EDITABLE.includes(v.attributes.appVersionState))
if (!version) throw new Error(`no editable version: ${versions.data.map(v => `${v.attributes.versionString} ${v.attributes.appVersionState}`).join(', ')}`)
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
