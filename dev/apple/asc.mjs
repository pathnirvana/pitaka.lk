// App Store Connect API with the key of build-ios.sh (ASC_* override it): api(method, path, body), and the app's id
import { createPrivateKey, createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const KEY_ID = process.env.ASC_KEY_ID || 'CNJQZ82QCH'
const ISSUER = process.env.ASC_ISSUER_ID || '177929b9-56d5-4755-88a7-b8a4a017d089'
const KEY_PATH = process.env.ASC_KEY_PATH || '/Volumes/2TB/Android/AuthKey_CNJQZ82QCH.p8'
export const APP = '1516496078'
export const EDITABLE = ['PREPARE_FOR_SUBMISSION', 'REJECTED', 'DEVELOPER_REJECTED', 'METADATA_REJECTED']

const b64 = o => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url')
function token() {
  const now = Math.floor(Date.now() / 1000)
  const head = b64({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' }), body = b64({ iss: ISSUER, iat: now, exp: now + 1200, aud: 'appstoreconnect-v1' })
  const sig = createSign('SHA256').update(`${head}.${body}`).sign({ key: createPrivateKey(readFileSync(KEY_PATH)), dsaEncoding: 'ieee-p1363' })
  return `${head}.${body}.${sig.toString('base64url')}`
}
export async function api(method, path, body) {
  const r = await fetch('https://api.appstoreconnect.apple.com' + path, {
    method, headers: { Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
  })
  const text = await r.text()
  const json = text ? JSON.parse(text) : {}
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${JSON.stringify(json.errors ?? json).slice(0, 1500)}`)
  return json
}

/** the version that can be edited (not in review or released) */
export async function editableVersion() {
  const versions = await api('GET', `/v1/apps/${APP}/appStoreVersions?filter[platform]=IOS&fields[appStoreVersions]=versionString,appVersionState`)
  const version = versions.data.find(v => EDITABLE.includes(v.attributes.appVersionState))
  if (!version) throw new Error(`no editable version: ${versions.data.map(v => `${v.attributes.versionString} ${v.attributes.appVersionState}`).join(', ')}`)
  return version
}
