// Reviews of one app (or all) from data/ of fetch-reviews.mjs, one line each, newest first:
//   node reviews/show.mjs <app|all> [--since 2026-10-01] [--stars 1-3] [--version 3.0] [--store play|appstore] [--all] [--json]
// --all includes the ratings without text; --json prints the records as they are stored
import { readFileSync, readdirSync } from 'node:fs'

const DATA = new URL('data/', import.meta.url).pathname
const [app = 'all', ...args] = process.argv.slice(2)
const opt = name => { const i = args.indexOf('--' + name); return i < 0 ? undefined : args[i + 1] ?? true }
const files = app == 'all' ? readdirSync(DATA).filter(f => f.endsWith('.jsonl')) : [app + '.jsonl']
const [low, high = low] = (opt('stars') ?? '1-5').split('-').map(Number)

const list = files.flatMap(f => readFileSync(DATA + f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)))
  .filter(r => (opt('all') || r.text) && r.rating >= low && r.rating <= high)
  .filter(r => !opt('since') || (r.updated ?? r.created) >= opt('since'))
  .filter(r => !opt('version') || r.version?.startsWith(opt('version')))
  .filter(r => !opt('store') || r.store == opt('store'))
  .sort((a, b) => (b.updated ?? b.created).localeCompare(a.updated ?? a.created))
for (const r of list) console.log(opt('json') ? JSON.stringify(r) : [(r.updated ?? r.created).slice(0, 10), app == 'all' ? r.app : '',
  r.store, `${r.rating}*`, r.version ? 'v' + r.version : '', r.territory ?? r.device ?? '', '|',
  [r.title, r.text].filter(Boolean).join(' - ').replace(/\s+/g, ' '), r.reply ? '[replied]' : ''].filter(Boolean).join(' '))
console.error(`${list.length} reviews`)
