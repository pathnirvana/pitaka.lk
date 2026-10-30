/**
 * single html file and pdf of a book for the tipitaka.lk library, from the error-corrected input html
 *   node dev/books/library-files.js <folder>...
 * output in dev/books/files/<library folder>/, the pdf is made with weasyprint (pip install weasyprint)
 * puppeteer headless chrome can also make pdfs but it does not generate pdf bookmarks for the TOC, hence weasyprint
 */

const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const pretty = require('pretty');
const { JSDOM } = require('jsdom');
const { window } = new JSDOM();
const $ = require('jquery')(window);
const JC = (name, cls) => $(`<${name}/>`).addClass(cls);

const bookList = JSON.parse(fs.readFileSync(__dirname + '/books.json', 'utf8'));

async function generateFiles(book, bookDoc) {
    const bookHeaders = $('h1,h2,h3,h4', bookDoc).get(), toc = JC('ul', 'TOC-container'), filePath = `${__dirname}/files/${book.library.folder}`;
    if (!fs.existsSync(filePath)) fs.mkdirSync(filePath, { recursive: true });
    bookHeaders.forEach((_elem, ind) => {
        const elem = $(_elem), hrefId = `toc-ind-${ind}`;
        elem.attr('id', hrefId).addClass('sinh-toc');
        const link = JC('a', 'TOC').attr('href', '#' + hrefId).text(elem.text());
        toc.append(JC('li', elem.prop('tagName')).append(link));
    });

    const author = book.author || book.subtitle || '';
    const placeholders = { title: book.name, desc: `${book.name} - ${author}`, author, folder: book.folder,
        toc: pretty(JC('div').append(toc).html()), content: bookDoc.body.innerHTML, style: 'print-pdf.css' };
    let tmplStr = fs.readFileSync(`${__dirname}/pre-html-file.html`, 'utf-8');
    for (const key in placeholders) { // function replacement so that a $ in the content is not a special pattern
        tmplStr = tmplStr.replace(new RegExp((key + 'placeholder').toUpperCase(), 'g'), () => placeholders[key]);
    }
    const fileBase = `${filePath}/${book.name}`, authorSuffix = book.group != 2 && author ? ` - ${author}` : '',
        htmlFile = `${fileBase}${authorSuffix}{${book.library.html}}.html`;
    fs.writeFileSync(htmlFile, tmplStr, { encoding: 'utf8' });
    console.log(`wrote ${htmlFile}`);
    if (book.library.pdf) {
        await exec(`weasyprint "${htmlFile}" "${fileBase}${authorSuffix}{${book.library.pdf}}.pdf"`);
        console.log(`wrote ${fileBase} for pdf`);
    }
}

(async () => {
    const folders = process.argv.slice(2);
    if (!folders.length) return console.log('usage: node dev/books/library-files.js <book folder>...');
    for (const folder of folders) {
        const book = bookList.find(b => b.folder == folder);
        if (!book) { console.log(`unknown book ${folder}`); continue; }
        const bookDoc = new JSDOM(fs.readFileSync(`${__dirname}/input/${folder}.html`, 'utf8')).window.document;
        await generateFiles(book, bookDoc);
    }
})();
