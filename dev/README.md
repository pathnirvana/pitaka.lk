# dev
Generators and sources for the static sites. Run the scripts from this folder after `npm install`.

| Command | Does |
|---|---|
| `npm run build:books` | `books/` from `books/input/*.html` and `books/books.json` (`node books/build.js <folder>...` for some books) |
| `npm run build:dhammapada` | `dhammapada/` from `dhammapada/gatha.txt`, `dhammapada_full.html`, `ss/ss1-3.html`, `about.html` |
| `npm run check` | links and #anchors, titles, descriptions, canonical, one h1, image alt, json-ld of both sites |
| `npm run deploy` | check, then `deploy.sh` (dry run; `npm run deploy -- --go` to upload) |
| `./sync-apps.sh` | check, then copy the sites into the Android app projects (dry run; `--go` to copy) |
| `node books/library-files.js <folder>` | single html file and pdf of a book for the tipitaka.lk library (weasyprint) |

`site-lib/` has what both generators share: the page `<head>` (description, canonical, open graph, json-ld),
the top bar with the reading settings, the svg icons, the sitemap writer and the webp images (`cwebp`, `brew install webp`).

## Styles, scripts and fonts
`books/common/book.css|js` and `dhammapada/common/dhammapada.css|js` are generated: each is `site-lib/reader.css|js`
(the shared theme - light, sepia and dark, light by default - typography, top bar, settings, pager) followed by the
site's own `books/book.css|js` or `dhammapada/dhammapada.css|js`. Edit those and rebuild.
The fonts are shared with the unicode tools: Abhaya Uni (regular and bold) and Alakamanda Uni (site titles), cut down
to Sinhala and Latin-1 without hinting into `tools/unicode/fonts/web/` (105, 119 and 66 KB) by `site-lib/make-fonts.sh`,
which `unicode/sync-fonts.mjs` runs after updating the fonts. The pages load them from `/tools/unicode/fonts/web/`;
the apps, whose pages are local files, get a copy in `common/` from `sync-apps.sh`. The UN-* ttf fonts in
`books/common` are only for `print-pdf.css` (library pdfs).

**Search**: the builds index the chapter and story pages (`data-pagefind-body`) with [pagefind](https://pagefind.app)
into `books/pagefind/` and `dhammapada/pagefind/` (not in git), searched by `search.html` (`site-lib/search.js`).
It needs the pages served over http(s), so the apps hide it for now. **Continue reading**: `reader.js` keeps the page
and scroll position last read of each book / edition in localStorage and shows them on the index pages.

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
1000px `.webp` next to each, which the pages show. The jpgs stay for link previews (og:image) and old browsers - iOS before 14 shows no webp, so the iOS apps
(iOS 11+) must bundle the jpgs too; `sync-apps.sh` leaves the jpg paintings out of the Android app only.
Thumbnails in `dhammapada/thumbs/` are 139x150.

`sitemap-lastmod.json` in each generator folder keeps the date each page last changed, for the sitemap.
