/**
 * store screenshots of the books app (Android and iOS show the same pages): a Sinhala caption over each screen,
 * at the sizes of each store, and the Play feature graphic. The pages are served by any local server of the repo:
 *   (cd .. && python3 -m http.server 8765) &   node dev/apple/store-screenshots.js [output…]
 *   -> dev/apple/build/store-screenshots/<output>/<n>-<scene>.png, play-feature.png
 * (dev/apple/asc-screenshots.mjs puts the apple-* ones on App Store Connect; the play-* ones go in the Play console)
 */
const fs = require('fs'), path = require('path');
const puppeteer = require('puppeteer-core');

const REPO = path.join(__dirname, '../..');
const BASE = process.env.BASE || 'http://127.0.0.1:8765/';
const OUT = path.join(__dirname, 'build/store-screenshots');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const fileUrl = (p) => 'file://' + path.resolve(REPO, p).split('/').map(encodeURIComponent).join('/');

/** store image sizes; css: the width of the screen the app is shown at */
const OUTPUTS = {
    'play-phone': { w: 1080, h: 1920, css: 390 },
    'play-tablet-10': { w: 1600, h: 2560, css: 800 },
    'apple-iphone-6.9': { w: 1320, h: 2868, css: 400 },
    'apple-ipad-13': { w: 2064, h: 2752, css: 820 },
};

const SCENES = [
    { id: 'books', title: 'බෞද්ධ පොත් 46 ක්', sub: 'රේරුකානේ චන්දවිමල හිමියන්ගේ පොත්, ජාතක කතා, ධම්මපදය ඇතුළු පොත් – අන්තර්ජාලය නැතිවත්', page: 'books/index.html', scroll: '.shelf' },
    { id: 'dhammapada', title: 'ධම්මපද කතා දැන් මෙහිම', sub: 'ගාථා 423 සිංහල තේරුම, සජ්ඣායනය සහ සිතුවම් සමඟ, කතා 305', page: 'dhammapada/ss/katha-5.html', scroll: '.gatha-card', offset: -10 },
    { id: 'jathaka', title: 'පින්තූර සහිත ජාතක කතා', sub: 'පන්සිය පණස් ජාතකය සම්පූර්ණයෙන්ම', page: 'books/pansiya-panas-jathaka/1-3-10.html', scroll: 'figure', offset: 120 },
    { id: 'search', title: 'සියලු පොත් තුළ සොයන්න', sub: 'සිංහල හෝ singlish අකුරෙන් – අන්තර්ජාලය නැතිවත්', page: 'books/search.html?q=karaniya%20metta', wait: '#results li' },
    { id: 'continue', title: 'නැවතුණු තැනින් කියවන්න', sub: 'කියවූ තැන මතක තබා ගනී. කැමති මාතෘකා තරුවකින් සුරකින්න', page: 'books/index.html', seed: true },
    { id: 'toc', title: 'පටුනෙන් පරිච්ඡේදයට', sub: 'දිග පොත් වුවද පහසුවෙන් සොයා කියවන්න', page: 'books/vishuddhi-margaya/index.html', seed: true },
    { id: 'themes', title: 'ඔබ කැමති පසුබිමින් කියවන්න', sub: 'සුදු, පුස්කොළ සහ අඳුරු – අකුරු ප්‍රමාණය ද ඔබට ගැලපෙන ලෙස', page: 'books/kunala-jathaka/3.html', themes: ['light', 'sepia', 'dark'] },
];

// what a reader has: two books part read, a dhammapada story and a few stars
const SEED = {
    'pitaka-progress': JSON.stringify({
        'books/vishuddhi-margaya': { path: 'vishuddhi-margaya/2-1.html', title: 'සීල නිර්දේශය', label: 'විශුද්ධි මාර්ගය', time: Date.now() - 3600e3, pos: .42 },
        'dhammapada/ss': { path: 'ss/katha-5.html', title: '1-5 ඝෝෂිතාරාමයෙහි කෝලාහලය', label: 'ධම්මපද කතා - සද්ධර්ම සාගරය', time: Date.now() - 7200e3, pos: .7 },
        'books/pansiya-panas-jathaka': { path: 'pansiya-panas-jathaka/1-3-10.html', title: 'පදුම බුදුරජුන්', label: 'පන්සිය පණස් ජාතකය', time: Date.now() - 86400e3, pos: .15 },
    }),
};

let browser;
async function appScreen(scene, css, cssH, file, theme = 'light') {
    const page = await browser.newPage();
    await page.setViewport({ width: css, height: cssH, deviceScaleFactor: 3, isMobile: css < 600, hasTouch: css < 600 });
    await page.evaluateOnNewDocument((seed, theme) => {
        if (seed) for (const k in seed) localStorage.setItem(k, seed[k]);
        localStorage.setItem('pitaka-theme', theme);
        document.addEventListener('DOMContentLoaded', () => document.documentElement.classList.add('app')); // as in the apps
    }, scene.seed ? SEED : null, theme);
    await page.goto(BASE + scene.page, { waitUntil: 'networkidle0' });
    if (scene.wait) await page.waitForSelector(scene.wait, { timeout: 20000 });
    await page.evaluate(async (sel, offset) => {
        await document.fonts.ready;
        const el = sel && document.querySelector(sel);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + scrollY - 60 - offset);
    }, scene.scroll, scene.offset || 0);
    await new Promise(r => setTimeout(r, 900));
    await page.evaluate(() => document.querySelector('.appbar').classList.remove('hidden')); // it hides when scrolled down
    await new Promise(r => setTimeout(r, 300));
    await page.screenshot({ path: file });
    await page.close();
    return file;
}

/** the caption band, the side margins and the corner radius of the screen (which runs off the bottom by the radius) */
const frameBox = (o) => ({ band: Math.round(o.h * 0.2), mx: Math.round(o.w * 0.07), radius: Math.round(o.w * 0.035) });

function frameHtml(o, scene, imgs) {
    const { band, mx, radius } = frameBox(o);
    const title = Math.round(Math.min(o.w * 0.066, o.h * 0.036)), sub = Math.round(title * 0.5);
    const screen = imgs.length == 1 ? `<img class="screen" src="file://${imgs[0]}">`
        : `<div class="screen split">${imgs.map(f => `<div><img src="file://${f}"></div>`).join('')}</div>`;
    return `<!doctype html><html lang="si"><head><meta charset="utf-8"><style>
    @font-face { font-family: Abhaya; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Bold.woff2')}'); font-weight: 700 }
    @font-face { font-family: Abhaya; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Regular.woff2')}'); font-weight: 400 }
    html, body { margin: 0; width: ${o.w}px; height: ${o.h}px; overflow: hidden }
    body { background: radial-gradient(ellipse at 50% 0%, #b3561f 0%, #7d3313 45%, #4f1d09 100%); font-family: Abhaya, serif; position: relative }
    .caption { position: absolute; left: 0; right: 0; top: 0; height: ${band}px; display: flex; flex-direction: column; align-items: center;
      justify-content: center; text-align: center; padding: 0 ${mx}px; box-sizing: border-box }
    h1 { margin: 0; font-size: ${title}px; font-weight: 700; color: #fbe7b4; line-height: 1.25 }
    p { margin: ${Math.round(sub * 0.6)}px 0 0; font-size: ${sub}px; color: #f3d9c6; line-height: 1.4 }
    .screen { position: absolute; left: ${mx}px; top: ${band}px; width: ${o.w - 2 * mx}px; height: ${o.h - band + radius}px; object-fit: cover;
      object-position: top; border-radius: ${radius}px; box-shadow: 0 ${radius}px ${radius * 3}px rgba(0,0,0,.45); background: #fdfbf7 }
    .split { display: flex; overflow: hidden }
    .split > div { flex: 1; overflow: hidden } .split img { width: 300%; height: auto; display: block }
    .split > div:nth-child(2) img { margin-left: -100% } .split > div:nth-child(3) img { margin-left: -200% }
  </style></head><body><div class="caption"><h1>${scene.title}</h1><p>${scene.sub}</p></div>${screen}</body></html>`;
}

// the Play feature graphic (1024x500)
const featureHtml = () => `<!doctype html><html lang="si"><head><meta charset="utf-8"><style>
    @font-face { font-family: Abhaya; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Bold.woff2')}'); font-weight: 700 }
    @font-face { font-family: Abhaya; src: url('${fileUrl('tools/unicode/fonts/web/AbhayaUni-Regular.woff2')}'); font-weight: 400 }
    @font-face { font-family: Alakamanda; src: url('${fileUrl('tools/unicode/fonts/AlakamandaUni-Regular.ttf')}') }
    html, body { margin: 0; width: 1024px; height: 500px; overflow: hidden }
    body { background: radial-gradient(ellipse at 30% 0%, #b3561f 0%, #7d3313 50%, #4f1d09 100%); font-family: Abhaya, serif; display: flex; align-items: center; gap: 44px; padding: 0 56px; box-sizing: border-box }
    img.logo { width: 270px; height: 270px; border-radius: 50%; box-shadow: 0 10px 30px rgba(0,0,0,.4) }
    h1 { font-family: Alakamanda; font-weight: normal; color: #fbe7b4; font-size: 92px; margin: 0; line-height: 1.15 }
    p { color: #f3d9c6; font-size: 31px; margin: 14px 0 0; line-height: 1.4 }
    .paintings { display: flex; gap: 10px; margin-top: 22px }
    .paintings img { width: 92px; height: 92px; object-fit: cover; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,.35) }
  </style></head><body><img class="logo" src="${fileUrl('books/common/logo-512.png')}"><div><h1>බෞද්ධ පොත්</h1>
  <p>පොත් 46 ක් සහ ධම්මපද කතා – සිතුවම්, සජ්ඣායනය සමඟ. අන්තර්ජාලය නැතිව කියවන්න.</p>
  <div class="paintings">${[1, 21, 183, 277, 354].map(n => `<img src="${fileUrl(`dhammapada/paintings/${n}.jpg`)}">`).join('')}</div></div></body></html>`;

(async () => {
    const want = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(OUTPUTS);
    browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--allow-file-access-from-files'] });
    const render = async (html, w, h, file) => {
        const tmp = file.replace(/\.png$/, '.html');
        fs.writeFileSync(tmp, html);
        const page = await browser.newPage();
        await page.setViewport({ width: w, height: h });
        await page.goto('file://' + tmp, { waitUntil: 'networkidle0' });
        await page.evaluate(() => document.fonts.ready);
        await page.screenshot({ path: file });
        await page.close();
        fs.unlinkSync(tmp);
    };
    for (const name of want) {
        const o = OUTPUTS[name], dir = path.join(OUT, name), raw = path.join(OUT, '.raw', name);
        fs.rmSync(dir, { recursive: true, force: true });
        fs.mkdirSync(dir, { recursive: true }); fs.mkdirSync(raw, { recursive: true });
        const { mx, band, radius } = frameBox(o);
        const cssH = Math.round(o.css * (o.h - band + radius) / (o.w - 2 * mx)); // the screen fills the frame below the caption
        for (const [n, scene] of SCENES.entries()) {
            const imgs = [];
            for (const theme of scene.themes || ['light']) imgs.push(await appScreen(scene, o.css, cssH, path.join(raw, `${scene.id}-${theme}.png`), theme));
            await render(frameHtml(o, scene, imgs), o.w, o.h, path.join(dir, `${n + 1}-${scene.id}.png`));
        }
        console.log('wrote', path.relative(REPO, dir));
    }
    await render(featureHtml(), 1024, 500, path.join(OUT, 'play-feature.png'));
    await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
