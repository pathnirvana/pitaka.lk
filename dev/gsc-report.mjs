// Google Search Console report for the pitaka.lk sections (read-only service account)
//   GSC_KEY=/path/to/key.json node dev/gsc-report.mjs [section ...] [--days 28]
//   sections default to /books/ /dhammapada/; the key file must stay outside the repo
// the service account is added in Search Console as a restricted user of sc-domain:pitaka.lk
import fs from 'node:fs'
import crypto from 'node:crypto'

const SITE = 'sc-domain:pitaka.lk'
const args = process.argv.slice(2)
const daysAt = args.indexOf('--days'), DAYS = daysAt >= 0 ? Number(args.splice(daysAt, 2)[1]) : 28
const sections = args.length ? args : ['/books/', '/dhammapada/']
if (!process.env.GSC_KEY) { console.log('set GSC_KEY to the service account json key file'); process.exit(2) }

const key = JSON.parse(fs.readFileSync(process.env.GSC_KEY, 'utf8'))
const b64 = (o) => Buffer.from(typeof o == 'string' ? o : JSON.stringify(o)).toString('base64url')
async function token() {
    const now = Math.floor(Date.now() / 1000)
    const unsigned = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({ iss: key.client_email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: key.token_uri, iat: now, exp: now + 3600 })
    const jwt = unsigned + '.' + crypto.sign('RSA-SHA256', Buffer.from(unsigned), key.private_key).toString('base64url')
    const res = await fetch(key.token_uri, { method: 'POST', body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }) })
    const t = await res.json()
    if (!t.access_token) throw new Error('token: ' + JSON.stringify(t))
    return t.access_token
}
const auth = { authorization: 'Bearer ' + await token() }
const api = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(SITE)}`
async function query(body) {
    const res = await fetch(`${api}/searchAnalytics/query`, { method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify(body) })
    const j = await res.json()
    if (j.error) throw new Error(JSON.stringify(j.error))
    return j.rows || []
}

// search data lags ~3 days
const day = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)
const end = day(3), start = day(3 + DAYS - 1), prevEnd = day(3 + DAYS), prevStart = day(3 + 2 * DAYS - 1)
const fmt = (n) => n >= 1000 ? (n / 1000).toFixed(1) + 'k' : String(Math.round(n))
const pct = (a, b) => b ? `${a >= b ? '+' : ''}${Math.round((a - b) / b * 100)}%` : ''
const line = (r, label) => `${String(fmt(r.clicks)).padStart(6)} clicks ${String(fmt(r.impressions)).padStart(7)} impr  ctr ${(r.ctr * 100).toFixed(1).padStart(4)}%  pos ${r.position.toFixed(1).padStart(5)}  ${label}`
const decode = (u) => { try { return decodeURI(u) } catch { return u } }

console.log(`pitaka.lk search console, ${start} to ${end} (${DAYS} days) vs the ${DAYS} days before\n`)
for (const section of sections) {
    const filter = [{ filters: [{ dimension: 'page', operator: 'contains', expression: `pitaka.lk${section}` }] }]
    const q = (dimensions, rowLimit = 10, s = start, e = end) => query({ startDate: s, endDate: e, dimensions, rowLimit, dimensionFilterGroups: filter })
    const [now] = await q([]), [before] = await q([], 1, prevStart, prevEnd)
    console.log(`=== ${section}`)
    if (!now) { console.log('   no search traffic\n'); continue }
    console.log(`   ${line(now, '')}   clicks ${pct(now.clicks, before?.clicks)}, impressions ${pct(now.impressions, before?.impressions)} vs before`)
    console.log('-- devices'); (await q(['device'])).forEach(r => console.log('   ' + line(r, r.keys[0])))
    console.log('-- countries'); (await q(['country'], 5)).forEach(r => console.log('   ' + line(r, r.keys[0])))
    console.log('-- top pages'); (await q(['page'], 15)).forEach(r => console.log('   ' + line(r, decode(r.keys[0]).replace('https://pitaka.lk', ''))))
    console.log('-- top queries'); (await q(['query'], 20)).forEach(r => console.log('   ' + line(r, r.keys[0])))
    const weeks = await query({ startDate: day(3 + 7 * 12 - 1), endDate: end, dimensions: ['date'], rowLimit: 200, dimensionFilterGroups: filter })
    const byWeek = {}
    weeks.forEach(r => { const w = r.keys[0].slice(0, 10); const k = Object.keys(byWeek).find(x => (new Date(w) - new Date(x)) / 864e5 < 7) || w; byWeek[k] = (byWeek[k] || 0) + r.clicks })
    console.log('-- clicks per week (12 weeks): ' + Object.values(byWeek).map(fmt).join(' '))
    console.log()
}
const sm = await (await fetch(`${api}/sitemaps`, { headers: auth })).json()
console.log('=== sitemaps')
for (const s of sm.sitemap || []) console.log(`   ${s.path}  submitted ${(s.lastSubmitted || '-').slice(0, 10)}  downloaded ${(s.lastDownloaded || '-').slice(0, 10)}  ${s.isPending ? 'pending ' : ''}${(s.contents || []).map(c => `${c.type}: ${c.submitted} submitted`).join(', ')}${s.errors ? ` errors ${s.errors}` : ''}`)
if (!(sm.sitemap || []).length) console.log('   none submitted' + (sm.error ? ` (${sm.error.message})` : ''))
