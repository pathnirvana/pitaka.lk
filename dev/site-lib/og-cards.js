/**
 * link preview images (og:image, 1200x630) for the pages without a picture of their own:
 *   books/common/og/books.jpg          the books site
 *   books/common/og/<folder>.jpg       each book (its index and chapters; chapters with a picture use the picture)
 *   dhammapada/common/og/dhammapada.jpg the dhammapada index and about pages (stories and vaggas use their paintings)
 * drawn by Chrome from an html card with the site fonts; a card is redrawn only when its text changes (og-cards.json)
 *   node dev/site-lib/og-cards.js [--all]     then rebuild the sites, which use the cards that exist
 */
const fs = require('fs'), path = require('path'), crypto = require('crypto'), os = require('os');
const puppeteer = require('puppeteer-core');

const REPO = path.join(__dirname, '../..');
const STATE = path.join(__dirname, 'og-cards.json');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const fileUrl = (p) => 'file://' + path.resolve(REPO, p).split('/').map(encodeURIComponent).join('/');
const esc = (s) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const style = `
@font-face { font-family: Abhaya; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Regular.woff2')}'); }
@font-face { font-family: Abhaya; font-weight: bold; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Bold.woff2')}'); }
@font-face { font-family: Alakamanda; src: url('${fileUrl('tools/unicode/fonts/AlakamandaUni-Regular.ttf')}'); }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; overflow: hidden; font-family: Abhaya, serif; color: #29231c;
    background: radial-gradient(circle at 18% 50%, #fffaf2 0, #f6f0e6 55%, #ecdfca 100%); }
.card { position: absolute; inset: 22px; border: 3px solid #d9b98f; border-radius: 28px; display: flex; align-items: center; gap: 48px; padding: 0 64px 40px; }
.logo { width: 330px; height: 330px; flex-shrink: 0; border-radius: 50%; box-shadow: 0 6px 18px rgba(110, 43, 18, .22); }
.text { flex: 1; min-width: 0; }
.kicker { font-family: Alakamanda; color: #c2621f; font-size: 44px; line-height: 1.2; }
.title { font-weight: bold; color: #6e2b12; line-height: 1.22; margin-top: 10px; }
.sub { color: #6b6155; font-size: 38px; line-height: 1.3; margin-top: 16px; }
.foot { position: absolute; left: 64px; right: 64px; bottom: 22px; display: flex; justify-content: space-between;
    font-size: 27px; color: #9a3d12; font-family: Georgia, serif; letter-spacing: .5px; }
.paintings { width: 420px; height: 470px; flex-shrink: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.paintings img { width: 100%; height: 100%; object-fit: cover; border-radius: 16px; box-shadow: 0 4px 12px rgba(70, 45, 20, .2); }`;
// the title is made smaller until it fits in three lines
const fit = () => { // in the page, once the fonts are loaded
    const t = document.querySelector('.title'); let s = +(t.dataset.size || 86);
    t.style.fontSize = s + 'px';
    while (t.scrollHeight > s * 1.22 * 3 + 4 && s > 40) t.style.fontSize = (s -= 2) + 'px';
};

const bookCard = ({ kicker, title, sub, foot }) => `<div class="card"><img class="logo" src="${fileUrl('books/common/logo-512.png')}">
<div class="text"><div class="kicker">${esc(kicker)}</div><div class="title">${esc(title)}</div>${sub ? `<div class="sub">${esc(sub)}</div>` : ''}</div>
<div class="foot"><span>${esc(foot)}</span><span>නොමිලේ කියවන්න · Android · iPhone</span></div></div>`;
const dhammapadaCard = ({ paintings }) => `<div class="card"><div class="text"><div class="kicker">pitaka.lk</div>
<div class="title" data-size="118" style="font-family: Alakamanda; font-weight: normal">ධම්මපද කතා</div>
<div class="sub">ගාථා 423 පාලියෙන් හා සිංහල තේරුම සමඟ, සජ්ඣායනය, සිතුවම් සහ කතා 305</div></div>
<div class="paintings">${paintings.map(n => `<img src="${fileUrl(`dhammapada/paintings/${n}.jpg`)}">`).join('')}</div>
<div class="foot"><span>pitaka.lk/dhammapada</span><span>නොමිලේ කියවන්න · Android · iPhone</span></div></div>`;

function cards() {
    const books = JSON.parse(fs.readFileSync(path.join(__dirname, '../books/books.json'), 'utf8')).filter(b => !b.site);
    return [
        { out: 'books/common/og/books.jpg', html: bookCard({ kicker: 'pitaka.lk', title: 'බෞද්ධ පොත්', sub: `රේරුකානේ චන්දවිමල හිමියන්ගේ පොත්, ජාතක කතා, ධම්මපදය ඇතුළු පොත් ${books.length + 1} ක්`, foot: 'pitaka.lk/books' }) },
        ...books.map(b => ({ out: `books/common/og/${b.folder}.jpg`, html: bookCard({ kicker: 'බෞද්ධ පොත්', title: b.name, sub: b.author || b.subtitle, foot: `pitaka.lk/books/${b.folder}` }) })),
        { out: 'dhammapada/common/og/dhammapada.jpg', html: dhammapadaCard({ paintings: [1, 21, 183, 277] }) },
    ];
}

(async () => {
    const all = process.argv.includes('--all');
    const state = fs.existsSync(STATE) ? JSON.parse(fs.readFileSync(STATE, 'utf8')) : {};
    const todo = cards().map(c => ({ ...c, hash: crypto.createHash('md5').update(style + fit + c.html).digest('hex').slice(0, 12) }))
        .filter(c => all || state[c.out] != c.hash || !fs.existsSync(path.join(REPO, c.out)));
    if (!todo.length) return console.log('og cards are up to date');
    const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 630 });
    const tmp = path.join(os.tmpdir(), 'og-card.html');
    for (const c of todo) {
        fs.writeFileSync(tmp, `<!DOCTYPE html><html lang="si"><head><meta charset="utf-8"><style>${style}</style></head><body>${c.html}</body></html>`);
        await page.goto('file://' + tmp, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await page.evaluate(fit);
        fs.mkdirSync(path.dirname(path.join(REPO, c.out)), { recursive: true });
        await page.screenshot({ path: path.join(REPO, c.out), type: 'jpeg', quality: 86 });
        state[c.out] = c.hash;
        console.log(c.out);
    }
    await browser.close();
    fs.writeFileSync(STATE, JSON.stringify(state, null, 1) + '\n');
})().catch(e => { console.error(e); process.exit(1); });
