/**
 * splits the mammoth output file to multiple html files
 * run as "node dev/books/book-processor.js"
 * output is written to the public pitaka/books folder
 * 
 * use mammoth as below from the input directory
 * npx mammoth book-name.docx book-name.html --style-map=mammoth-styles.txt
 * 
 * DANGER - unless you absolutely have to do not reprocess existing docx files
 * since local corrections have been made to html files which would be overwritten
 * 
 */ 

const fs = require('fs');
const fsExtra = require('fs-extra')
const mammoth = require("mammoth");
const assert = require('assert');
const pretty = require('pretty');
const util = require('util');
const exec = util.promisify(require('child_process').exec); // makes exec awaitable

var jsdom = require('jsdom');
const { get } = require('jquery');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
const JC = (name, cls) => $(`<${name}/>`).addClass(cls);
const MDI = (name, cls) => `<i class="material-icons${cls ? ' ' + cls : ''}">${name}</i>`;
const outputFolder = `${__dirname}/../../books`;

const mammothOpts = {
    styleMap: [
        "b => b", // normally b => strong
        "p[style-name='gatha'] => div.gatha > p:fresh",
        "p[style-name='subhead'] => div.subhead > p:fresh",
        "p[style-name='largefont'] => div.largefont > p:fresh",
        "p[style-name='centered'] => div.centered > p:fresh",
    ],
};

const isNodeEmpty = (node) => node.textElem.length == 0;
const getNodeFileName = (node) => `${node.ids.join('-')}.html`; //${isNodeEmpty(node) ? '-1' : ''}.html`; // if empty point to the first child

const bookList = [
    { name: 'පන්සිය පණස් ජාතකය', author: 'වේරගොඩ අමරමෝලි හිමි', folder: 'pansiya-panas-jathaka', group: 1, files: ['වෙනත්', '', ''], gen: '' }, //html, pdf, non-gen pdf
    { name: 'මහාවංශය', author: 'සිංහල පරිවර්තනය', folder: 'mahavanshaya', group: 1, files: ['ඉපැරණි පොත්', 1176, 1177, 60], gen: '' },
    { name: 'පැරණි බුදුසිරිත', author: 'සම්පිණ්ඩිතමහානිදානය', folder: 'sampinditha-mahanidanaya', group: 1, files: ['වෙනත්', 1174, 1175, 768], gen: 'html' },
    { name: 'ගෞතම බුද්ධ චරිතය', author: 'බළන්ගොඩ ආනන්ද මෛත්‍රෙය හිමි', folder: 'buddha-charithaya', group: 1, files: ['වෙනත්', 1028, 1029], gen: '' },
    { name: 'සතිපට්ඨාන විපස්සනා භාවනා', author: 'දෙවිනුවර ඤාණාවාස හිමි', folder: 'satipattana-vipassana', group: 1, files: ['භාවනා කමටහන්', 1030, 755], gen: '' },
    { name: 'විශුද්ධි මාර්ගය', author: 'මාතර ධර්මවංශ හිමි', folder: 'vishuddhi-margaya', group: 1, files: ['භාවනා කමටහන්', 1031, '', 413], gen: '' },
    { name: 'සිංහල මිලින්‍දප්‍ර‍ශ්නය', author: 'හීනටිකුඹුරේ සුමංගල හිමි', folder: 'milinda-prashnaya', group: 1, files: ['වෙනත්', 1027, 594], gen: '' },
    { name: 'අටුවාකථාවස්තු', author: 'පොල්වත්තේ බුද්ධදත්ත හිමි', folder: 'atuwakathawasthu', group: 1, files: ['වෙනත්', 1032, 1033], gen: '' },
    { name: 'ශමථ විදර්ශනා භාවනා මාර්ගය', author: 'මාතර ඥාණාරාම හිමි', folder: 'bhavana-margaya', group: 1, files: ['භාවනා කමටහන්', 1048, 1049], gen: '' },
    
    { name: 'බෞද්ධයාගේ අත්පොත', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'bauddhayage-athpotha', group: 2, files: ['rrk', 465, 502], gen: '' },
    { name: 'ධර්ම විනිශ්චය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'dharma-winishchaya', group: 2, files: ['rrk', 471, 492], gen: '' },
    { name: 'පාරමිතා ප්‍ර‍කරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'paramitha-prakaranaya', group: 2, files: ['rrk', 473, 496], gen: '' },
    { name: 'සූවිසි මහ ගුණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'suvisi-gunaya', group: 2, files: ['rrk', 479, 513], gen: '' },
    { name: 'අභිධර්මයේ මූලික කරුණු', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'abhidharmaye-mulika-karunu', group: 2, files: ['rrk', 464, 485], gen: '' },
    { name: 'අභිධර්ම මාර්ගය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'abhidharma-margaya', group: 2, files: ['rrk', 463, 484], gen: '' },
    { name: 'චතුරාර්‍ය්‍ය සත්‍යය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'chathurarya-sathya', group: 2, files: ['rrk', 470, 491], gen: '' },
    { name: 'පුණ්‍යෝපදේශය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'punyopadeshaya', group: 2, files: ['rrk', 476, 497], gen: '' },
    { name: 'ශාසනාවතරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'shasanavatharanaya', group: 2, files: ['rrk', 478, 510], gen: '' },
    { name: 'බෝධිපාක්ෂික ධර්ම විස්තරය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'bodhi-pakshika-dharma', group: 2, files: ['rrk', 466, 501], gen: '' },
    { name: 'පටිච්ච සමුප්පාද විවරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'patichcha-samuppada-vivaranaya', group: 2, files: ['rrk', 474, 495], gen: ''},
    { name: 'උපසම්පදා ශීලය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'upasampada-sheelaya', group: 2, files: ['rrk', 481, 487], gen: '' },
    { name: 'උභය ප්‍රාතිමෝක්‍ෂය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'ubhaya-prathimokshaya', group: 2, files: ['rrk', 480, 488], gen: '' },
    { name: 'වඤ්චක හා චිත්තෝපක්ලේශ ධර්ම', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'wanchaka-dharma', group: 2, files: ['rrk', 483, 507], gen: '' },
    { name: 'විදර්ශනා භාවනා ක්‍රමය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'vidarshana-bhavana-kramaya', group: 2, files: ['rrk', 482, 508], gen: '' },
    { name: 'කෙලෙස් එක්දහස් පන්සියය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'keles-1500', group: 2, files: ['rrk', 472, 489], gen: '' },
    { name: 'පොහොය දිනය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'pohoya-dinaya', group: 2, files: ['rrk', 475, 498], gen: '' },
    { name: 'බෝධි පූජාව', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'bodhi-poojawa', group: 2, files: ['rrk', 467, 500], gen: '' },
    { name: 'චත්තාළීසාකාර විපස්සනා භාවනාව', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'chaththalisakara-vipassana', group: 2, files: ['rrk', 469, 490], gen: '' },
    { name: 'විනය කර්ම', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'vinaya-karma', group: 2, files: ['rrk', 945, 944], gen: '' },
    { name: 'සතිපට්ඨාන භාවනා ක්‍ර‍මය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'sathipttana-bhavana-kramaya', group: 2, files: ['rrk', 947, 511], gen: '' },
    { name: 'නිර්වාණ විනිශ්චය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'nirvana-vinishchaya', group: 2, files: ['rrk', 1043, 1044], gen: '' },
    { name: 'පට්ඨාන මහා පකරණ සන්නය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'pattana-pakarana-sannaya', group: 2, files: ['rrk', 1169, 1170], gen: '' },

    { name: 'පොහොය වර්ණනාව', author: 'මාපලගම සෝමිස්සර හිමි', folder: 'pohoya-varnanava', group: 3, files: ['වෙනත්', 1024, 769], gen: '' },
    { name: 'කර්ම විපාක', author: 'රිදියගම සුධම්මාභිවංශ හිමි', folder: 'karma-vipaka', group: 3, files: ['වෙනත්', 1025, '', 534], gen: '' },
    { name: 'රසවාහිනී', author: 'රන්ජිත් වනරත්න', folder: 'rasawahini', group: 3, files: ['ඉපැරණි පොත්', 1026, '', 64], gen: '' },
    { name: 'සීහළවත්ථු', author: 'ධම්මනන්දි හිමි, පොල්වත්තේ බුද්ධදත්ත හිමි', folder: 'sihala-vaththu', group: 3, files: ['ඉපැරණි පොත්', 1034, '', 74], gen: '' },
    { name: 'ත්‍රිපිටක, අටුවා, ටීකා හා පාළි', author: 'දිද්දෙණියේ අරියදස්සන හිමි', folder: 'atuwa-tika-pali', group: 3, files: ['වෙනත්', 1035, '', 603], gen: '' },
    { name: 'පාලිභාෂාවතරණය 1', author: 'පොල්වත්තේ බුද්ධදත්ත හිමි', folder: 'palibhashavatharanaya-1', group: 3, files: ['පාලි ඉගෙනුම', 1036, '', 164], gen: ''},
    { name: 'අභිධර්ම චන්ද්‍රිකාව', author: 'මාතර ශ්‍රී ධර්මවංශ හිමි', folder: 'abhidharma-chandrikava', group: 3, files: ['අභිධර්ම', 1037, 943], gen: ''},
    { name: 'අමාවතුර', author: 'ගුරුළුගෝමී', folder: 'amawathura', group: 3, files: ['ඉපැරණි පොත්', 1038, 54], gen: ''},
    { name: 'අනාගත වංශය මෙතේ බුදුසිරිත', author: 'විල්ගම්මුල සංඝරාජ හිමි', folder: 'anagatha-vanshaya', group: 3, files: ['වෙනත්', 1039, 952], gen: '' },
    { name: 'ජිනකාලමාලී ප්‍රකරණය', author: 'රත්නපඤ්ඤ හිමි', folder: 'jinakalamali-prakaranaya', group: 3, files: ['ඉපැරණි පොත්', 1040, 1041], gen: '' },
    { name: 'කුණාල ජාතකය - උන්මාදිනී', author: '', folder: 'kunala-jathaka', group: 3, files: ['සූත්‍ර', 1042, '', 648], gen: '' },
    { name: 'පූජාවලිය', author: 'වේරගොඩ අමරමෝලි හිමි', folder: 'pujawaliya', group: 3, files: ['ඉපැරණි පොත්', 1148, 1149], gen: ''},
    { name: 'සද්ධර්ම රත්නාවලිය', author: 'ධර්මසේන හිමි', folder: 'saddharma-rathnavaliya', group: 3, files: ['ඉපැරණි පොත්', 1171, 1172], gen: ''},
];

const reprocessAll = false; // process all books even without the 'gen' prop as 'web'
let nodesAdded;
(async () => {
    for (const book of bookList) {
        if (!book.gen && !reprocessAll) continue; // process only some books
        if (book.gen == 'docx') { // reprocess docx or read from file (DANGER: do not do this for existing files)
            console.log(`Regenerating html from docx ${book.folder}`);
            const mRes = await mammoth.convertToHtml({path: `${__dirname}/input/${book.folder}.docx`}, mammothOpts);
            console.log(mRes.messages)
            fs.writeFileSync(`${__dirname}/input/${book.folder}.html`, pretty(mRes.value), {encoding: 'utf-8'})
        } else {
            const bookDom = new JSDOM(fs.readFileSync(`${__dirname}/input/${book.folder}.html`, { encoding: 'utf8' }));
            const bookDoc = bookDom.window.document;
            if (book.gen == 'files') {
                await generateFiles(book, bookDoc) // generate pdf and full-html files for library from error-corrected html files
            } else { // if (book.gen == 'web')
                generateWebpages(book, bookDoc); // generate split html pages for books website/app
            }
        }
    }
})();
writeTopIndexFile();

async function generateFiles(book, bookDoc) {
    const bookHeaders = $('h1,h2,h3,h4', bookDoc).get(), toc = JC('ul', 'TOC-container'), filePath = `${__dirname}/files/${book.files[0]}`
    if (!fs.existsSync(filePath)) fs.mkdirSync(filePath) 
    bookHeaders.forEach((_elem, ind) => {
        const elem = $(_elem), hrefId = `toc-ind-${ind}`
        elem.attr('id', hrefId).addClass('sinh-toc')
        const link = JC('a', 'TOC').attr('href', '#' + hrefId).text(elem.text())
        toc.append(JC('li', elem.prop('tagName')).append(link))
    })

    const placeholders = { title: book.name, desc: `${book.name} - ${book.author}`, author: book.author, folder: book.folder,
        toc: pretty(JC('div').append(toc).html()), content: bookDoc.body.innerHTML, style: 'print-pdf.css' }
    let tmplStr = fs.readFileSync(`${__dirname}/pre-html-file.html`, 'utf-8')
    for (const key in placeholders) {
        tmplStr = tmplStr.replace(new RegExp((key + 'placeholder').toUpperCase(), 'g'), placeholders[key]);    
    }
    const fileBase = `${filePath}/${book.name}`, author = book.group != 2 && book.author ? ` - ${book.author}` : '', 
        htmlFile = `${fileBase}${author}{${book.files[1]}}.html`
    fs.writeFileSync(htmlFile, tmplStr, { encoding: 'utf8' })
    console.log(`wrote ${fileBase} for html`)
    if (book.files[2]) {
        // puppeteer headless chrome can also be used but it does not generate pdf bookmarks for TOC, hence weasyprint
        await exec(`weasyprint "${htmlFile}" "${fileBase}${author}{${book.files[2]}}.pdf"`);
        console.log(`wrote ${fileBase} for pdf`)
    }
}

function generateWebpages(book, bookDoc) {
    const bookH1 = $('h1', bookDoc).get();
    const footnotes = $("li[id^='footnote-']", bookDoc).get();
    
    nodesAdded = 0;
    const nodeList = processTree(bookH1, 1, [], footnotes);
    assert(nodesAdded == $('h1,h2,h3,h4', bookDoc).length, `nodes added (${nodesAdded}) not equals num headers (${$('h1,h2,h3,h4', bookDoc).length})`);
    console.log(`Processing Book ${book.name} tree H1 = ${nodeList.length}`);

    const bookPath = `${outputFolder}/${book.folder}`
    if (!fs.existsSync(bookPath)) {
        fs.mkdirSync(bookPath) 
    } else { // delete everything inside the directory
        fsExtra.emptyDirSync(bookPath)
    }
    writeIndexFile(book, nodeList, `${book.folder}/index.html`);
    writeBookFiles(book, nodeList, book.folder, fs.readFileSync(`${__dirname}/pre-book.html`, { encoding: 'utf8' }), nodeList);
    console.log(`Wrote files for ${book.name}; nodes added ${nodesAdded}`);
}

function processTree(headers, level, parents, footnotes) {
    const nodes = [];
    headers.forEach((_elem, ind) => {
        const elem = $(_elem);
        const textElem = elem.nextUntil('h1,h2,h3,h4')
        const newNode = {ids: [...parents, ind + 1], level, header: elem, headerText: elem.text().trim(), children: [], textElem};
        elem.attr('file', getNodeFileName(newNode)); // used in finding prev/next nodes if (!isNodeEmpty(newNode))
        if (level + 1 <= 4) {
            const nextUntil = 'h1' + (level > 1 ? ',h2' : '') + (level > 2 ? ',h3' : ''); 
            const hChildren = elem.nextUntil(nextUntil, `h${level + 1}`).get();
            newNode.children = processTree(hChildren, level + 1, newNode.ids, footnotes);
        }
        processFootNotes(newNode, footnotes); // for header and textElem
        nodes.push(newNode);
        nodesAdded++;
    });
    return nodes;
}

function processFootNotes(node, footnotes) {
    if (!footnotes.length) return;
    const newLi = node.textElem.find("a[id^='footnote-ref-']").get().map((footref, ind) => { // add node.header if header has footnotes
        const footId = Number($(footref).text().slice(1, -1));
        assert(footId >= 1 && footId <= footnotes.length, `footnote id ${footId} is out of range [1, ${footnotes.length}]`);
        $(footref).text(`[${ind + 1}]`).addClass('footnote-ref');
        return footnotes[footId - 1];
    });
    if (newLi.length) {
        node.footnotes = JC('ol', 'footnotes').append(newLi);
    }
}

function writeBookFiles(book, children, rootFolder, tmplStr, nodeList) {
    children.forEach(node => {
        const contentDiv = JC('div', 'content').append(
            getTopLinks(node, book, nodeList), 
            JC('div', 'heading-bar').append(JC(`h${node.level}`).text(node.headerText), // if the header can have footnotes will need to change to html
                getBookmarkIcon(node, {book, nodeList}),
                $(MDI('share', 'share-icon')).attr('file-name', getNodeFileName(node))),
            node.textElem,
            node.children.length ? createSubHeadingsDiv(node, {book, nodeList}) : '',
            node.footnotes,
            getBottomLinks(node)
        );
        //if (!isNodeEmpty(node)) // not write empty files
        genericWriteFile(`${rootFolder}/${getNodeFileName(node)}`, contentDiv, tmplStr,
            { title: `${node.headerText} - ${book.name}`, desc: `${book.name} - ${book.author}`, folder: book.folder })
        writeBookFiles(book, node.children, rootFolder, tmplStr, nodeList);
    });
}

function createSubHeadingsDiv(node, context) {
    return JC('div', 'TOC-container subheadings').append(
        JC('div', 'TOC-text').text('අනු මාතෘකා').attr('level', 2),
        JC('div', 'TOC-children').append(node.children.map(c => createIndexDiv(c, context))));
}

function getTopLinks(node, book, nodeList) {
    let curNode = {children: nodeList};
    return JC('nav', 'top').append(
        JC('a', 'button').append(MDI('home')).attr('href', '../index.html'), 
        MDI('navigate_next'),
        JC('a', 'button').append(MDI('toc'), book.name).attr('href', `index.html#${node.ids.join('-')}`), 
        MDI('navigate_next'),
        node.ids.slice(0, -1).map(id => {
            curNode = curNode.children[id - 1];
            return JC('a', 'button').attr('href', getNodeFileName(curNode)).text(curNode.headerText).prop('outerHTML');
        }).join(MDI('navigate_next'))
    );
}

function getBottomLinks(node) {
    const prev = node.header.prevAll('[file]:first');
    const next = node.header.nextAll('[file]:first');
    return JC('nav', 'bottom').append(
        (prev.length ? JC('a', 'button prev').append(MDI('arrow_back'), prev.text()).attr('href', prev.attr('file')) : ''),
        (next.length ? JC('a', 'button next').html(`${next.text()} ${MDI('arrow_forward')}`).attr('href', next.attr('file')) : '')
    );
}
function getBookmarkIcon(node, {book, nodeList}, extraClass) {
    let curNode = {children: nodeList}
    const headings = node.ids.map(id => {
        curNode = curNode.children[id - 1];
        return curNode.headerText
    })
    return $(MDI('star_outline', 'star-icon ' + extraClass)).attr('data-bookmark', 
        JSON.stringify({ ids: node.ids, headings, book: {name: book.name, folder: book.folder} }))
}

function createIndexDiv(node, context) {
    const link = JC('a', 'TOC').attr('href', getNodeFileName(node)).attr('level', node.level).text(node.headerText);
    const icon = node.children.length ? MDI('expand_less', 'parent') : MDI('keyboard_arrow_right', 'leaf hover-icon');
    const starIcon = getBookmarkIcon(node, context, 'hover-icon')
    const shareIcon = $(MDI('share', 'share-icon hover-icon')).attr('file-name', getNodeFileName(node));
    return JC('div', 'TOC-container').attr('id', node.ids.join('-')).append(
        JC('div', 'TOC-text').append(icon, link, starIcon, shareIcon).attr('level', node.level),
        JC('div', 'TOC-children').append(node.children.map(c => createIndexDiv(c, context))));
}

function writeIndexFile(book, nodeList, fileName) {
    const patunaDiv = $('<div/>').append(nodeList.map(node => createIndexDiv(node, {book, nodeList})));
    const nameAuthor = `${book.name} - ${book.author}`
    genericWriteFile(fileName, patunaDiv, fs.readFileSync(`${__dirname}/pre-book-index.html`, { encoding: 'utf8' }),
        { title: nameAuthor, desc: nameAuthor, folder: book.folder, titleBar: book.name, htmlId: book.files[1], pdfId: book.files[2] || book.files[3] });
}

function genericWriteFile(fileName, contentDiv, tmplStr, placeholders) {
    const contentHtml = pretty(JC('div').append(contentDiv).html()) /// vkbeautify.xml() was replaced by pretty - vkb breaks strong tags while pretty keeps them inline
    for (key in placeholders) {
        tmplStr = tmplStr.replace(new RegExp((key + 'placeholder').toUpperCase(), 'g'), placeholders[key]);    
    }
    tmplStr = tmplStr.replace(/CONTENTPLACEHOLDER/, contentHtml)
    fs.writeFileSync(`${outputFolder}/${fileName}`, tmplStr);
}

function writeTopIndexFile() {
    let tmplStr = fs.readFileSync(`${__dirname}/pre-index.html`, { encoding: 'utf8' }), groups = [];
    bookList.forEach(book => {
        if (groups[book.group - 1]) {
            groups[book.group - 1].push(book);
        } else {
            groups[book.group - 1] = [book];
        }
    });
    groups.forEach((group, ind) => {
        const gDiv = JC('div').append(group.map(book => {
            return JC('div', 'book').attr('book-folder', book.folder).append(
                MDI('keyboard_arrow_right', 'hover-icon'), JC('a').attr('href', book.folder + '/index.html').text(book.name), 
                MDI('share', 'share-icon hover-icon')
            );
        }));
        tmplStr = tmplStr.replace(new RegExp(`GROUPPLACEHOLDER${ind + 1}`), pretty(gDiv.html()));
    });
    fs.writeFileSync(outputFolder + '/index.html', tmplStr);
}

