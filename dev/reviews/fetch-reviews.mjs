// Ratings and reviews of all our apps on both stores, merged into data/<app>.jsonl (one review per line, newest first)
// and data/apps.json. Run again any time: new and edited reviews replace the old lines by id.
//   App Store: all customer reviews and our responses (App Store Connect API, the key of apple/asc.mjs)
//   Google Play: the monthly review reports of the Play Console (every rating since 2016, with or without text; only the
//   changed csv files are downloaded to data/raw/) and the reviews api, which has the last 7 days the reports lack yet
import { mkdirSync, readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs'
import { api as asc } from '../apple/asc.mjs'
import { auth } from '../play/play.mjs'

const DATA = new URL('data/', import.meta.url).pathname, RAW = DATA + 'raw/play/'
const BUCKET = 'pubsite_prod_7901566601510270633' // Play Console > Download reports > Reviews > Cloud Storage URI
// one key per app on both stores; apps not listed here are keyed by their package or bundle id
const APPS = {
  books: { name: 'Sinhala Buddhist Books (බෞද්ධ පොත්)', play: 'lk.pitaka.books', appStore: '1516496078' },
  dhammapada: { name: 'Dhammapada (old app, retired in 2026 for books)', play: 'lk.pitaka.dhammapada', appStore: '1517198274' },
  pirith: { name: 'Pirith - Paritta Chanting', play: 'lk.pitaka.pirith', appStore: '1503645003' },
  sarala: { name: 'Sarala Sinhala Tripitaka (සරල සිංහල ත්‍රිපිටකය)', play: 'lk.pitaka.saralatipitaka', appStore: '1434955293' },
  'tipitaka-atuwa': { name: 'Sinhala Tipitaka: Pali & Atuwa (සිංහල ත්‍රිපිටකය සහ අටුවාව)', play: 'lk.tipitaka.main', appStore: '6615068500' },
  buddhajayanthi: { name: 'Buddha Jayanthi Tripitaka (බුද්ධ ජයන්ති ත්‍රිපිටකය)', play: 'lk.pitaka.buddhajayanthi', appStore: '1453310445' },
  'tipitaka-app': { name: 'Tipitaka.app (Chattha Sangayana)', play: 'app.tipitaka.main', appStore: '6824157493' },
  'pali-dictionary': { name: 'Pali - Sinhala Dictionary', play: 'lk.pitaka.dictionary' },
  'pali-dictionary-old': { name: 'Pali Sinhala Dictionary (old app)', play: 'dictionary.pitaka.lk.palisinhaladictionary' },
  arutha: { name: 'Arutha.lk Sinhala dictionary', play: 'lk.arutha.dictionary' },
  'pitaka-lk-old': { name: 'පිටක.lk (old app)', play: 'com.pitakalk' },
  'currency-converter': { name: 'Currency Converter & Rates', play: 'lk.pitaka.currencyconverter' },
}
const appOf = (store, id) => Object.keys(APPS).find(k => APPS[k][store] == id) ?? id

const reviews = {} // app -> Map(id -> review)
for (const f of existsSync(DATA) ? readdirSync(DATA).filter(f => f.endsWith('.jsonl')) : [])
  reviews[f.slice(0, -6)] = new Map(readFileSync(DATA + f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)).map(r => [r.id, r]))
const put = r => (reviews[r.app] ??= new Map()).set(r.id, { ...reviews[r.app].get(r.id), ...r })
const dateOf = ms => ms ? new Date(+ms).toISOString() : null

// App Store
const appNames = {}
for (const app of (await asc('GET', '/v1/apps?limit=200&fields[apps]=name,bundleId')).data) {
  const key = Object.keys(APPS).find(k => APPS[k].appStore == app.id) ?? app.attributes.bundleId
  appNames[key] ??= app.attributes.name
  APPS[key] ??= { name: app.attributes.name, appStore: app.id }
  let path = `/v1/apps/${app.id}/customerReviews?limit=200&sort=-createdDate&include=response`
  while (path) {
    const page = await asc('GET', path)
    const responses = Object.fromEntries((page.included ?? []).map(i => [i.id, i.attributes]))
    for (const d of page.data) {
      const a = d.attributes, reply = responses[d.relationships?.response?.data?.id]
      put({ id: d.id, app: key, store: 'appstore', appId: app.id, created: new Date(a.createdDate).toISOString(), updated: null,
        rating: a.rating, title: a.title ?? '', text: a.body ?? '', version: null, language: null, territory: a.territory,
        device: null, author: a.reviewerNickname, reply: reply ? { text: reply.responseBody, date: reply.lastModifiedDate } : null })
    }
    path = page.links?.next?.replace('https://api.appstoreconnect.apple.com', '')
  }
}

// Google Play: review reports, downloading the csv files that changed
mkdirSync(RAW, { recursive: true })
const storage = { headers: { Authorization: `Bearer ${await auth('https://www.googleapis.com/auth/devstorage.read_only')}` } }
const manifestPath = RAW + 'manifest.json', manifest = existsSync(manifestPath) ? JSON.parse(readFileSync(manifestPath)) : {}
const objects = []
let pageToken = ''
do {
  const r = await (await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o?prefix=reviews/&maxResults=1000${pageToken && '&pageToken=' + pageToken}`, storage)).json()
  if (r.error) throw new Error(`bucket: ${JSON.stringify(r.error)}`)
  objects.push(...(r.items ?? []))
  pageToken = r.nextPageToken
} while (pageToken)
let downloaded = 0
for (const o of objects.filter(o => manifest[o.name] != o.md5Hash)) {
  const r = await fetch(`https://storage.googleapis.com/storage/v1/b/${BUCKET}/o/${encodeURIComponent(o.name)}?alt=media`, storage)
  if (!r.ok) throw new Error(`${o.name}: ${r.status}`)
  writeFileSync(RAW + o.name.split('/').pop(), Buffer.from(await r.arrayBuffer()))
  manifest[o.name] = o.md5Hash
  downloaded++
}
writeFileSync(manifestPath, JSON.stringify(manifest, null, 1))
// files in month order, so a review edited later wins
for (const f of readdirSync(RAW).filter(f => f.endsWith('.csv')).sort((a, b) => a.slice(-10).localeCompare(b.slice(-10)))) {
  const [head, ...rows] = parseCsv(readFileSync(RAW + f).toString('utf16le').replace(/^﻿/, ''))
  for (const row of rows) {
    const c = Object.fromEntries(head.map((h, i) => [h, row[i] ?? '']))
    if (!c['Package Name']) continue
    const reviewId = c['Review Link'].match(/reviewId=([^&]+)/)?.[1]
    put({ id: reviewId ?? `${c['Package Name']}:${c['Review Submit Millis Since Epoch']}`, app: appOf('play', c['Package Name']),
      store: 'play', appId: c['Package Name'], created: dateOf(c['Review Submit Millis Since Epoch']),
      updated: dateOf(c['Review Last Update Millis Since Epoch']), rating: +c['Star Rating'], title: c['Review Title'],
      text: c['Review Text'], version: c['App Version Name'] || null, language: c['Reviewer Language'] || null, territory: null,
      device: c['Device'] || null, author: null,
      reply: c['Developer Reply Text'] ? { text: c['Developer Reply Text'], date: dateOf(c['Developer Reply Millis Since Epoch']) } : null })
  }
}

// Google Play: reviews api, the last 7 days
const playToken = await auth()
for (const pkg of new Set(objects.map(o => o.name.match(/reviews_(.+)_\d{6}\.csv/)?.[1]).filter(Boolean))) {
  let token = ''
  do {
    const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${pkg}/reviews?maxResults=100${token && '&token=' + token}`,
      { headers: { Authorization: `Bearer ${playToken}` } })
    if (!r.ok) { console.log(`${pkg} reviews api: ${r.status}`); break }
    const json = await r.json()
    for (const rv of json.reviews ?? []) {
      const u = rv.comments.find(c => c.userComment)?.userComment, d = rv.comments.find(c => c.developerComment)?.developerComment
      const app = appOf('play', pkg), old = reviews[app]?.get(rv.reviewId)
      put({ id: rv.reviewId, app, store: 'play', appId: pkg, created: old?.created ?? dateOf(u.lastModified.seconds * 1000),
        updated: dateOf(u.lastModified.seconds * 1000), rating: u.starRating, title: old?.title ?? '', text: u.text.trim(),
        version: u.appVersionName ?? old?.version ?? null, language: u.reviewerLanguage ?? null, territory: null,
        device: u.device ?? old?.device ?? null, author: rv.authorName ?? null,
        reply: d ? { text: d.text, date: dateOf(d.lastModified.seconds * 1000) } : old?.reply ?? null })
    }
    token = json.tokenPagination?.nextPageToken
  } while (token)
}

// write
const summary = []
for (const [app, map] of Object.entries(reviews)) {
  const list = [...map.values()].sort((a, b) => (b.updated ?? b.created).localeCompare(a.updated ?? a.created))
  writeFileSync(DATA + app + '.jsonl', list.map(r => JSON.stringify(r)).join('\n') + '\n')
  const count = store => list.filter(r => r.store == store).length
  summary.push({ app, name: APPS[app]?.name ?? appNames[app] ?? app, play: APPS[app]?.play ?? null, appStore: APPS[app]?.appStore ?? null,
    ratings: list.length, withText: list.filter(r => r.text).length, playRatings: count('play'), appStoreReviews: count('appstore'),
    average: +(list.reduce((s, r) => s + r.rating, 0) / list.length).toFixed(2), newest: list[0].updated ?? list[0].created })
}
summary.sort((a, b) => b.ratings - a.ratings)
writeFileSync(DATA + 'apps.json', JSON.stringify({ fetched: new Date().toISOString(), apps: summary }, null, 1))
console.log(`${downloaded} report files downloaded`)
for (const s of summary) console.log(`${s.app.padEnd(22)} ${String(s.ratings).padStart(5)} ratings ${String(s.withText).padStart(5)} with text  newest ${s.newest.slice(0, 10)}`)

/** rows of a csv text (quoted fields may hold commas, quotes and newlines) */
function parseCsv(text) {
  const rows = [[]]
  let field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch == '"' && text[i + 1] == '"') field += text[i++]
      else if (ch == '"') quoted = false
      else field += ch
    } else if (ch == '"') quoted = true
    else if (ch == ',') rows.at(-1).push(field), field = ''
    else if (ch == '\n') rows.at(-1).push(field.replace(/\r$/, '')), rows.push([]), field = ''
    else field += ch
  }
  if (field || rows.at(-1).length) rows.at(-1).push(field)
  return rows.filter(r => r.length > 1)
}
