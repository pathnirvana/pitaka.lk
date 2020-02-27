/**
 * splits the mammoth output file to multiple html files
 * run as "node book-processor.js" from the dev/books folder
 * output is written to the public pitaka/books folder
 * 
 * use mammoth as below from the input directory
 * npx mammoth book-name.docx book-name.html --style-map=mammoth-styles.txt
 */ 

const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
const JC = (name, cls) => $(`<${name}/>`).addClass(cls);
const MDI = (name, cls) => `<i class="material-icons ${cls}">${name}</i>`;
const outputFolder = '../../books';

const isNodeEmpty = (node) => node.textElem.length == 0;
const getNodeFileName = (node) => `${node.ids.join('-')}.html`; //${isNodeEmpty(node) ? '-1' : ''}.html`; // if empty point to the first child

const bookList = [
    { name: 'විශුද්ධි මාර්ගය', author: 'බුද්ධඝෝෂ හිමි', folder: 'vishuddhi-margaya', group: 1 }, 
    { name: 'සිංහල මිලින්‍දප්‍ර‍ශ්නය', author: 'හීනටිකුඹුරේ සුමංගල හිමි', folder: 'milinda-prashnaya', group: 1 , gen: true},
    { name: 'අටුවාකථාවස්තු', author: 'පොල්වත්තේ බුද්ධදත්ත හිමි', folder: 'atuwakathawasthu', group: 1 , gen: true},
    { name: 'බෞද්ධයාගේ අත්පොත', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'bauddhayage-athpotha', group: 2 , gen: true},
    { name: 'ධර්ම විනිශ්චය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'dharma-winishchaya', group: 2 },
    { name: 'පාරමිතා ප්‍ර‍කරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'paramitha-prakaranaya', group: 2 },
    { name: 'සූවිසි මහ ගුණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'suvisi-gunaya', group: 2 , gen: true},
    { name: 'අභිධර්මයේ මූලික කරුණු', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'abhidharmaye-mulika-karunu', group: 2 },
    { name: 'අභිධර්ම මාර්ගය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'abhidharma-margaya', group: 2 , gen: true},
    { name: 'චතුරාර්‍ය්‍ය සත්‍යය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'chathurarya-sathya', group: 2 },
    { name: 'පුණ්‍යෝපදේශය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'punyopadeshaya', group: 2 },
    { name: 'ශාසනාවතරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'shasanavatharanaya', group: 2 },
    { name: 'බෝධිපාක්ෂික ධර්ම විස්තරය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'bodhi-pakshika-dharma', group: 2 },
    { name: 'පටිච්ච සමුප්පාද විවරණය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'patichcha-samuppada-vivaranaya', group: 2, gen: true},
    { name: 'උපසම්පදා ශීලය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'upasampada-sheelaya', group: 2 },
    { name: 'උභය ප්‍රාතිමෝක්‍ෂය', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'ubhaya-prathimokshaya', group: 2 },
    { name: 'වඤ්චක ධර්ම හා චිත්තෝපක්ලේශ ධර්ම', author: 'රේරුකානේ චන්දවිමල හිමි', folder: 'wanchaka-dharma', group: 2 },
    { name: 'කර්ම විපාක', author: 'රිදියගම සුධම්මාභිවංශ හිමි', folder: 'karma-vipaka', group: 3 },
    { name: 'රසවාහිනී', author: 'රන්ජිත් වනරත්න', folder: 'rasawahini', group: 3, gen: true },
    { name: 'සීහළවත්ථු', author: 'ධම්මනන්දි හිමි, පොල්වත්තේ බුද්ධදත්ත හිමි', folder: 'sihala-vaththu', group: 3, gen: true },
    { name: 'ත්‍රිපිටක, අටුවා, ටීකා හා පාළි', author: 'දිද්දෙණියේ අරියදස්සන හිමි', folder: 'atuwa-tika-pali', group: 3, gen: true },
];

let nodesAdded;
bookList.forEach(book => {
    if (!book.gen) return; // process only some books
    const bookDom = new JSDOM(fs.readFileSync(`input/${book.folder}.html`, { encoding: 'utf8' }));
    const bookDoc = bookDom.window.document;
    const bookH1 = $('h1', bookDoc).get();
    const footnotes = $("li[id^='footnote-']", bookDoc).get();
    
    nodesAdded = 0;
    const nodeList = processTree(bookH1, 1, [], footnotes);
    assert(nodesAdded == $('h1,h2,h3,h4', bookDoc).length, `nodes added (${nodesAdded}) not equals num headers (${$('h1,h2,h3,h4', bookDoc).length})`);
    console.log(`Processing Book ${book.name} tree H1 = ${nodeList.length}`);

    if (!fs.existsSync(`${outputFolder}/${book.folder}`)) fs.mkdirSync(`${outputFolder}/${book.folder}`);
    writeIndexFile(book, nodeList, `${book.folder}/index.html`);
    writeBookFiles(book, nodeList, book.folder, fs.readFileSync('pre-book.html', { encoding: 'utf8' }), nodeList);
    console.log(`Wrote files for ${book.name}; nodes added ${nodesAdded}`);
});
writeAppIndexFile();

function processTree(headers, level, parents, footnotes) {
    const nodes = [];
    headers.forEach((_elem, ind) => {
        const elem = $(_elem);
        const textElem = elem.nextUntil('h1,h2,h3,h4')
        const newNode = {ids: [...parents, ind + 1], level, header: elem, children: [], textElem};
        elem.attr('file', getNodeFileName(newNode)); // used in finding prev/next nodes if (!isNodeEmpty(newNode))
        if (level + 1 <= 4) {
            const nextUntil = 'h1' + (level > 1 ? ',h2' : '') + (level > 2 ? ',h3' : ''); 
            //console.log(nextUntil);
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
            JC(`h${node.level}`).text(node.header.text()) // if the header can have footnotes will need to change to html
                .append($(MDI('share', 'share-icon')).attr('file-name', getNodeFileName(node))),
            node.textElem,
            node.children.length ? createSubHeadingsDiv(node) : '',
            node.footnotes,
            getBottomLinks(node)
        );
        //if (!isNodeEmpty(node)) // not write empty files
            genericWriteFile(`${rootFolder}/${getNodeFileName(node)}`, node.header.text(), `${book.name} - ${book.author}`, 
                book.folder, contentDiv, tmplStr);
        writeBookFiles(book, node.children, rootFolder, tmplStr, nodeList);
    });
}

function createSubHeadingsDiv(node) {
    return JC('div', 'TOC-container subheadings').append(
        JC('div', 'TOC-text').text('අනු මාතෘකා').attr('level', 2),
        JC('div', 'TOC-children').append(node.children.map(c => createIndexDiv(c))));
}

function getTopLinks(node, book, nodeList) {
    let curNode = {children: nodeList};
    return JC('nav', 'top').append(
        JC('a', 'button').append(MDI('home')).attr('href', '../app-index.html'), 
        MDI('navigate_next'),
        JC('a', 'button').append(MDI('toc'), book.name).attr('href', `index.html#${node.ids.join('-')}`), 
        MDI('navigate_next'),
        node.ids.slice(0, -1).map(id => {
            curNode = curNode.children[id - 1];
            return JC('a', 'button').attr('href', getNodeFileName(curNode)).text(curNode.header.text()).prop('outerHTML');
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

function createIndexDiv(node) {
    const link = JC('a', 'TOC').attr('href', getNodeFileName(node)).attr('level', node.level).text(node.header.text());
    const icon = node.children.length ? MDI('expand_less', 'parent') : MDI('keyboard_arrow_right', 'leaf hover-icon');
    const shareIcon = $(MDI('share', 'share-icon hover-icon')).attr('file-name', getNodeFileName(node));
    return JC('div', 'TOC-container').attr('id', node.ids.join('-')).append(
        JC('div', 'TOC-text').append(icon, link, shareIcon).attr('level', node.level),
        JC('div', 'TOC-children').append(node.children.map(c => createIndexDiv(c))));
}

function writeIndexFile(book, nodeList, fileName) {
    const patunaDiv = $('<div/>').append(nodeList.map(node => createIndexDiv(node)));
    genericWriteFile(fileName, book.name, book.author, book.folder, patunaDiv, fs.readFileSync('pre-index.html', { encoding: 'utf8' }));
}

function genericWriteFile(fileName, title, desc, folder, contentDiv, tmplStr) {
    const contentHtml = vkbeautify.xml(JC('div').append(contentDiv).html());
    tmplStr = tmplStr.replace(/TITLEPLACEHOLDER/g, title);
    tmplStr = tmplStr.replace(/DESCPLACEHOLDER/g, desc);
    tmplStr = tmplStr.replace(/FOLDERPLACEHOLDER/g, folder);
    tmplStr = tmplStr.replace(/CONTENTPLACEHOLDER/, contentHtml)
    fs.writeFileSync(`${outputFolder}/${fileName}`, tmplStr);
}

function writeAppIndexFile() {
    let tmplStr = fs.readFileSync('pre-app-index.html', { encoding: 'utf8' }), groups = [];
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
        tmplStr = tmplStr.replace(new RegExp(`GROUPPLACEHOLDER${ind + 1}`), vkbeautify.xml(gDiv.html()));
    });
    fs.writeFileSync(outputFolder + '/app-index.html', tmplStr);
}

