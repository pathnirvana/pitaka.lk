/**
 * checks the generated static sites before a deploy
 *   node dev/site-lib/check.js books dhammapada      (folders relative to the repo root)
 * broken links and #anchors, empty hrefs, a page without lang/title/description/canonical/one h1,
 * duplicate titles, images without alt, invalid json-ld. exits with 1 when there are problems
 * regex based (the pages are generated, so the markup is regular) - jsdom is too slow and memory hungry for ~6000 pages
 */

const fs = require('fs'), path = require('path');

const repoRoot = path.join(__dirname, '../..');
const sites = process.argv.slice(2);
if (!sites.length) { console.log('usage: node dev/site-lib/check.js <site folder>...'); process.exit(2); }

const skipDirs = new Set(['Android', 'node_modules']);
function htmlFiles(dir) {
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
        if (e.isDirectory()) return skipDirs.has(e.name) ? [] : htmlFiles(path.join(dir, e.name));
        return e.name.endsWith('.html') ? [path.join(dir, e.name)] : [];
    });
}
const attrs = (html, tag, attr) => [...html.matchAll(new RegExp(`<${tag}\\b[^>]*?\\s${attr}="([^"]*)"`, 'g'))].map(m => m[1]);
const meta = (html, name) => (new RegExp(`<meta (?:name|property)="${name}" content="([^"]*)"`).exec(html) || [])[1];

const problems = [], warnings = [], idsOf = new Map(), titles = new Map();
// back links of footnotes depend on the footnote numbering in the book sources - shown, but do not fail the check
const isWarning = (msg) => /^missing anchor #(footnote-ref-|_ftn)/.test(msg);
const report = (file, msg) => (isWarning(msg) ? warnings : problems).push(`${path.relative(repoRoot, file)}: ${msg}`);
const pages = sites.flatMap(s => htmlFiles(path.join(repoRoot, s)));
const read = (f) => fs.readFileSync(f, 'utf8');
const getIds = (f) => {
    if (!idsOf.has(f)) idsOf.set(f, new Set(fs.existsSync(f) ? attrs(read(f), '[a-z0-9]+', 'id') : []));
    return idsOf.get(f);
};

for (const file of pages) {
    const html = read(file);
    if (/http-equiv="refresh"/.test(html)) continue; // redirect stubs
    const isNoIndex = /<meta name="robots" content="noindex">/.test(html);
    if (!/<html lang="\w+">/.test(html)) report(file, 'no lang on <html>');
    const title = (/<title>([^<]*)<\/title>/.exec(html) || [])[1];
    if (!title || !title.trim()) report(file, 'no title');
    else if (!isNoIndex) titles.set(title, [...(titles.get(title) || []), file]);
    if (!meta(html, 'description')) report(file, 'no meta description');
    if (!isNoIndex && !/<link rel="canonical" href="https:\/\/[^"]+">/.test(html)) report(file, 'no canonical');
    const h1s = (html.match(/<h1\b/g) || []).length;
    if (h1s != 1) report(file, `${h1s} h1 headings`);
    for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) report(file, `image without alt: ${m[0].slice(0, 80)}`);
    for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
        try { JSON.parse(m[1]); } catch (e) { report(file, `invalid json-ld: ${e.message}`); }
    }
    const links = [...attrs(html, 'a', 'href'), ...attrs(html, '(?:img|script|source|audio)', 'src'), ...attrs(html, 'link', 'href')];
    attrs(html, 'source', 'srcset').forEach(s => s.split(',').forEach(c => links.push(c.trim().split(/\s+/)[0])));
    for (const href of links) {
        if (href === '') { report(file, 'empty href/src'); continue; }
        if (/^(https?:|mailto:|data:|tel:|javascript:)/.test(href)) continue;
        const [p, anchor] = href.replace(/\?[^#]*/, '').split('#');
        const target = p ? path.resolve(p.startsWith('/') ? repoRoot : path.dirname(file), decodeURIComponent(p.replace(/^\//, ''))) : file;
        const targetFile = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target, 'index.html') : target;
        if (!fs.existsSync(targetFile)) { report(file, `broken link ${href}`); continue; }
        if (anchor && targetFile.endsWith('.html') && !getIds(targetFile).has(decodeURIComponent(anchor))) report(file, `missing anchor ${href}`);
    }
}
for (const [title, files] of titles) if (files.length > 1) report(files[0], `title '${title}' also used by ${files.slice(1).map(f => path.relative(repoRoot, f)).join(', ')}`);

if (warnings.length) console.log(`warnings (footnote numbering in the book sources):\n  ${warnings.join('\n  ')}`);
const byKind = problems.reduce((m, p) => { const k = p.replace(/^[^:]+: /, '').replace(/[\s:'].*/, ''); m[k] = (m[k] || 0) + 1; return m; }, {});
problems.slice(0, 60).forEach(p => console.log(p));
if (problems.length > 60) console.log(`... and ${problems.length - 60} more`);
console.log(`${pages.length} pages checked, ${problems.length} problems`, problems.length ? byKind : '');
process.exit(problems.length ? 1 : 0);
