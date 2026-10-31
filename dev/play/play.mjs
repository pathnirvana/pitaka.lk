// Google Play Developer API (androidpublisher v3) with the service account key of the Play console (PLAY_KEY):
// a token, and api(method, path, body) relative to /androidpublisher/v3/applications/<PACKAGE>
import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

export const PACKAGE = process.env.PACKAGE || 'lk.pitaka.books'
const KEY = JSON.parse(readFileSync(process.env.PLAY_KEY || '/Volumes/2TB/node/misc-projects/sinhala-ocr/play-console-api-key.json'))
const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url')

let token
async function auth() {
  if (token) return token
  const now = Math.floor(Date.now() / 1000)
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({ iss: KEY.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: KEY.token_uri, iat: now, exp: now + 3600 })}`
  const jwt = `${unsigned}.${createSign('RSA-SHA256').update(unsigned).sign(KEY.private_key).toString('base64url')}`
  const r = await fetch(KEY.token_uri, { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })
  const json = await r.json()
  if (!r.ok) throw new Error(`token: ${JSON.stringify(json)}`)
  return token = json.access_token
}

/** body: an object (json) or { bytes, type } (an upload, path then goes to the upload endpoint) */
export async function api(method, path, body) {
  const upload = body?.bytes
  const url = `https://androidpublisher.googleapis.com/${upload ? 'upload/' : ''}androidpublisher/v3/applications/${PACKAGE}${path}${upload ? '?uploadType=media' : ''}`
  const r = await fetch(url, { method, body: upload ? body.bytes : body && JSON.stringify(body),
    headers: { Authorization: `Bearer ${await auth()}`, 'Content-Type': upload ? body.type : 'application/json' } })
  const text = await r.text()
  if (!r.ok) throw new Error(`${method} ${path} -> ${r.status} ${text.slice(0, 1500)}`)
  return text ? JSON.parse(text) : {}
}
