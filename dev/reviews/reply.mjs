// Posts the replies of data/replies/<app>.json ([{ id, store, appId, review, reply }], drafted and read by hand) to the stores:
//   node reviews/reply.mjs <app> [--go] [--only <id prefix>] [--limit n]
// Without --go it only lists what it would post. A posted reply is marked in the file (posted: date) and in
// data/<app>.jsonl, so a second run skips it. Play allows 350 characters, the App Store shows a reply after its review.
import { readFileSync, writeFileSync } from 'node:fs'
import { api as asc } from '../apple/asc.mjs'
import { auth } from '../play/play.mjs'

const DATA = new URL('data/', import.meta.url).pathname
const [app, ...args] = process.argv.slice(2)
const opt = name => { const i = args.indexOf('--' + name); return i < 0 ? undefined : args[i + 1] ?? true }
const file = `${DATA}replies/${app}.json`, replies = JSON.parse(readFileSync(file, 'utf8'))
const reviews = readFileSync(`${DATA}${app}.jsonl`, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l))

const todo = replies.filter(r => !r.posted && r.reply && (!opt('only') || r.id.startsWith(opt('only')))).slice(0, +(opt('limit') ?? 1e9))
let posted = 0
for (const r of todo) {
  if (r.reply.length > 350 && r.store == 'play') throw new Error(`${r.id}: ${r.reply.length} characters, Play allows 350`)
  console.log(`${r.store} ${r.rating}* ${r.date} ${r.id.slice(0, 8)} | ${r.review.replace(/\s+/g, ' ').slice(0, 90)}\n   -> ${r.reply}`)
  if (!opt('go')) continue
  try {
    if (r.store == 'play') {
      const res = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${r.appId}/reviews/${r.id}:reply`,
        { method: 'POST', headers: { Authorization: `Bearer ${await auth()}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ replyText: r.reply }) })
      if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`)
    } else await asc('POST', '/v1/customerReviewResponses', { data: { type: 'customerReviewResponses', attributes: { responseBody: r.reply },
      relationships: { review: { data: { type: 'customerReviews', id: r.id } } } } })
  } catch (e) { console.log(`   FAILED ${e.message}`); r.error = e.message; continue }
  r.posted = new Date().toISOString(); delete r.error; posted++
  const review = reviews.find(v => v.id == r.id)
  if (review) review.reply = { text: r.reply, date: r.posted }
  writeFileSync(file, JSON.stringify(replies, null, 1)) // after every reply: a failure later loses nothing
}
if (posted) writeFileSync(`${DATA}${app}.jsonl`, reviews.map(r => JSON.stringify(r)).join('\n') + '\n')
console.log(`${todo.length} replies ${opt('go') ? `, ${posted} posted` : 'to post (--go posts them)'}`)
