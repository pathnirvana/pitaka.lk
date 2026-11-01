# dev
Generators and sources for the static sites. Run the scripts from this folder after `npm install`.

| Command | Does |
|---|---|
| `npm run build:books` | `books/` from `books/input/*.html` and `books/books.json` (`node books/build.js <folder>...` for some books) |
| `npm run build:dhammapada` | `dhammapada/` from `dhammapada/gatha.txt`, `dhammapada_full.html`, `ss/ss1-3.html`, `about.html` |
| `npm run check` | links and #anchors, titles, descriptions, canonical, one h1, image alt, json-ld of both sites |
| `npm run deploy` | check, then `deploy.sh` (dry run; `npm run deploy -- --go` to upload) |
| `./sync-apps.sh` | check, then copy the sites into the Android app projects (dry run; `--go` to copy) |
| `apple/build-ios.sh sim\|archive [--upload]` | the iOS app (`apple/project.yml`, XcodeGen): simulator build, or App Store build and TestFlight upload |
| `node apple/store-screenshots.js` | store screenshots of the books app (Play and App Store sizes) and the Play feature graphic, from a local server |
| `node apple/asc-screenshots.mjs` | the App Store screenshots and version number of the editable iOS version |
| `node apple/asc-submit.mjs [--submit]` | the App Store texts (`play/store-text.mjs`) and newest build of that version, and its review submission |
| `node play/play-listing.mjs [--dry]` | the Google Play texts (`play/store-text.mjs`), screenshots and feature graphic of the books app |
| `node play/play-release.mjs` | uploads the books app's signed bundle and releases it on production (`TRACK=internal` for a test) |
| `node play/dhammapada-farewell.mjs [--dry]` | the farewell release of the old Dhammapada app (it opens on `dhammapada/farewell.html`, leading to the books app) and its listing notice |
| `node site-lib/og-cards.js` | link preview cards (og:image) of the books and the dhammapada index; rebuild the sites after |
| `GSC_KEY=<key.json> node gsc-report.mjs [/books/ ...]` | Search Console clicks, queries, pages, devices, sitemaps (read-only service account; key outside the repo) |
| `node books/library-files.js <folder>` | single html file and pdf of a book for the tipitaka.lk library (weasyprint) |

`site-lib/` has what both generators share: the page `<head>` (description, canonical, open graph, json-ld),
the top bar with the reading settings, the svg icons, the sitemap writer and the webp images (`cwebp`, `brew install webp`).

## Styles, scripts and fonts
`books/common/book.css|js` and `dhammapada/common/dhammapada.css|js` are generated: each is `site-lib/reader.css|js`
(the shared theme - light, sepia and dark, light by default - typography, top bar, settings, pager) followed by the
site's own `books/book.css|js` or `dhammapada/dhammapada.css|js`. Edit those and rebuild. The generated files carry a
hash of their content in the name (`book.dccaa540.css`), so browsers never pair new pages with an old cached copy.
The fonts are shared with the unicode tools: Abhaya Uni (regular and bold) and Alakamanda Uni (site titles), cut down
to Sinhala and Latin-1 without hinting into `tools/unicode/fonts/web/` (105, 119 and 66 KB) by `site-lib/make-fonts.sh`,
which `unicode/sync-fonts.mjs` runs after updating the fonts. The pages load them from `/tools/unicode/fonts/web/`;
the apps, whose pages are local files, get a copy in `common/` from `sync-apps.sh`. The UN-* ttf fonts in
`books/common` are only for `print-pdf.css` (library pdfs).

**Search**: the builds index the chapter and story pages (`data-pagefind-body`) with [pagefind](https://pagefind.app)
into `books/pagefind/` and `dhammapada/pagefind/` (not in git), searched by `search.html` (`site-lib/search.js`).
Each search page also searches the other site's index (pagefind `mergeIndex`, `data-merge`), so both find books and
dhammapada; the dhammapada pages carry the pagefind filter `book:dhammapada` like a book. It needs the pages served over
http(s), so the apps hide it for now. **Continue reading**: `reader.js` keeps the page and scroll position last read of
each book / edition in localStorage and shows them on the index pages (the books index shows the dhammapada too).
**Bookmarks** (the stars, `reader.js`) are shared by both sites: `books/bookmarks.html` and `dhammapada/bookmarks.html`
list them all. The dhammapada is listed among the books (`books.json` entry with `site`), hidden in the apps until the
books app carries the dhammapada too.

Test on phones: `node site-lib/check.js` checks the markup; the pages must also fit a 320px wide screen and the
settings, bookmarks and table of contents must work by touch (most readers use phones and the apps).

## Sources
The html files in `books/input/` and `dhammapada/` have been corrected by hand over the years, so they, not the
`.docx` files, are the sources. Edit them and rebuild; never regenerate them from the Word files.

**Books.** Each `h1`-`h4` becomes a page named by its position (`2-10-3.html`), so adding or removing a heading
changes the urls after it - add a redirect in `nginx/pitaka.lk.conf` when that happens. Whatever comes before the
first `h1` (title page, introduction) is shown on the book's index page. The word styles `gatha`, `subhead`,
`largefont` and `centered` become `div` classes. A new book: `npx mammoth book.docx book.html
--style-map=books/input/mammoth-styles.txt`, put the html in `books/input/` and add the book to `books/books.json`
(`group` 1-3 is the section on the index page; `library` has the tipitaka.lk library ids of its folder, html and pdf).

**Dhammapada.** `gatha.txt`: `@` starts a vagga, `k` a katha, `g` another gatha of the same katha and `#` separates
the pali from the sinhala. Katha numbers are taken from their position in `gatha.txt`; the build reports the
numbers in the story sources that do not match. The stories of `dhammapada_full.html` (atuwa) are `h1` headings, those
of `ss/ss*.html` (saddharma sagara) are `h2` headings with the vaggas as `h1`.

## Images
`books/jathaka-images/*.jpeg` (1376px) and `dhammapada/paintings/*.jpg` (1000px) are the originals; the builds make a
1000px `.webp` next to each, which the pages show. The jpgs stay for link previews (og:image) and old browsers; the
apps (Android, iOS 15+) carry only the webp ones. Pages without a picture of their own use the cards of `og-cards.js`.
Thumbnails in `dhammapada/thumbs/` are 139x150.

`sitemap-lastmod.json` in each generator folder keeps the date each page last changed, for the sitemap.

## Apps
One app, "බෞද්ධ පොත්" (Android `lk.pitaka.books`, iOS 1516496078), carries the books and the dhammapada since 3.0.
The pages are at the same paths as on the web and served by the app (Android `https://appassets.androidplatform.net/`,
iOS `app://pitaka.lk/`), so search, `/tools` fonts and localStorage work as on the web; the `app` class on `<html>`
hides the "get the app" links. The apps before 3.0 used `file://`: both apps hand its localStorage (bookmarks,
settings) over once, and `reader.js` adds it. Android: `sync-apps.sh --go`, bump `versionCode`, then
`./gradlew bundleRelease` in `/Volumes/2TB/Android/Books` (the pictures and recordings are install-time asset packs).
The separate Dhammapada app is to get a farewell update that points to the books app.
