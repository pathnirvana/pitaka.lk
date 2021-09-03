/**
 * splits the mammoth output file to multiple html files
 * images and the pali gatha added
 * 
 * "node dev/dhammapada/ss-build.js"
 * output written to the main pitaka/dhammapada/ss folder
 * 
 * organized as index -> vagga -> katha(titles in the word doc) -> gatha/painting
 * 
 * replacing bandi akuru with the hal version in html files 
 * ([ක-ෆ])\u200d\u0dca([ක-ෆ]) with $1්$2
 */

const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify')
const mammoth = require("mammoth")

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
const JC = (name, cls) => $(`<${name}/>`).addClass(cls);
const MDI = (name, cls = '') => $(`<span class="material-icons ${cls}">${name}</span>`)
const lines = fs.readFileSync(__dirname + '/gatha.txt', { encoding: 'utf8' });
let vaggas = lines.split('@'); console.log(`num of vaggas ${vaggas.length}`); //vaggas = vaggas.slice(0, 6); //ONLY TAKE THE FIRST

let kathaIndex = 0, kathaIndexLocal = 0, gathaChecker = 0, vaggaH1, kathaH2, allFootnotes;
const getKathaFileName = (ki) => (ki >= 1 && ki <= 305) ? `katha-${ki}.html` : '';
const getVaggaFileName = (vi) => (vi >= 1 && vi <= 26) ? `vagga-${vi}.html` : '';
const outputFolder = __dirname + '/../../dhammapada/ss/', inputFolder = __dirname + '/ss/'

const mammothOpts = {
    styleMap: [
        "p[style-name='Quote'] => div.pali-gatha > p:fresh",
        "p[style-name='Style2'] => div.sinhala-kavi > p:fresh",
        "p[style-name='Style1'] => div.katha-ending > p:fresh", // number and ending
        "p[style-name='Number and Ending2'] => div.katha-ending > p:fresh", // style names are different in ss3
        "p[style-name='Sinhala kawi'] => div.sinhala-kavi > p:fresh",
        "b => b" // normally b => strong
    ]
}
const wordDocList = ['ss1', 'ss2', 'ss3'], reProcessWordDoc = true;
(async () => {
    let vaggaLinks = '', vaggaInd = 0
    for(const wordFile of wordDocList) {
        console.log(`converting ${wordFile} to html using mammoth`)
        const htmlStr = (await getHtmlStr(wordFile))
    
        const htmlDom = new JSDOM(htmlStr);
        const htmlDoc = htmlDom.window.document;
        vaggaH1 = $('h1', htmlDoc), kathaH2 = $('h2', htmlDoc), allFootnotes = $("li[id^='footnote-']", htmlDoc).get();
        console.log(`num vaggas = ${vaggaH1.length}, kathas = ${kathaH2.length} in ${wordFile}`);
        kathaIndexLocal = 0; // reset for this file
        [...Array(vaggaH1.length).keys()].forEach(() => vaggaLinks += processVagga(vaggas[vaggaInd++], vaggaInd).prop('outerHTML'))
    }

    const indexDiv = JC('div', 'vagga-links').html(vaggaLinks)
    writeIndexFile(indexDiv, outputFolder + '../index.html'); // todo change this to main index
    console.log(`Processed ${kathaIndex} kathas`);
})();

async function getHtmlStr(wordFile) {
    const filePrefix = inputFolder + wordFile
    if (reProcessWordDoc) {
        const mRes = await mammoth.convertToHtml({path: `${filePrefix}.docx`}, mammothOpts);
        fs.writeFileSync(`${filePrefix}.html`, vkbeautify.xml(mRes.value), {encoding: 'utf-8'});
        return mRes.value
    } 
    return fs.readFileSync(`${filePrefix}.html`, {encoding: 'utf-8'})
}

function processVagga(vagga, vaggaInd) {
    const kathas = vagga.split('k').map(line => line.trim()).filter(line => line);
    const vaggaName = kathas[0];
    console.log(`vagga ${kathas[0]} has ${kathas.length - 1} kathas`);
    assert(vaggaName.split('\n').length == 1, `multiline vagga heading ${vaggaName}`);

    const vaggaNameDiv = JC('div', 'vagga-name').text(vaggaName).attr('id', `vagga-${vaggaInd}`)
    const vaggaDiv = JC('div', 'vagga').append(vaggaNameDiv);
    const kathaDivs = kathas.slice(1).map(katha => processKatha(katha, vaggaInd, vaggaName));
    writeVaggaFile(vaggaDiv.append(kathaDivs, getVaggaLinks(vaggaInd)), outputFolder + getVaggaFileName(vaggaInd), vaggaName);

    return JC('a', 'vagga-link').attr('id', `vagga-${vaggaInd}`).attr('href', 'ss/' + getVaggaFileName(vaggaInd))
        .append(JC('div', 'vagga-name').text(vaggaName));
}

function processKatha(katha, vaggaInd, vaggaName) {
    const gathas = katha.split('g').map(line => line.trim()).filter(line => line);
    const kathaTitle = writeKathaFile(gathas, vaggaInd, vaggaName);
    const kathaDiv = JC('a', 'katha').attr('href', getKathaFileName(kathaIndex)).attr('id', `katha-${kathaIndex}`);
    kathaDiv.append(JC('div', 'katha-title').text(kathaTitle), gathas.map(gatha => getGatha(gatha, false)));
    return kathaDiv; // for the vagga file
}

function getGatha(gatha, isFull = false) {
    const parts = gatha.split('#').map(line => line.trim()).filter(line => line);
    assert(parts.length == 2, `gatha ${gatha} has more than 2 parts ${parts.length}`);
    assert(/^\d+$/.exec(parts[0].split('\r\n')[0]), `pali gatha part ${parts[0]} does not start with a number`);
    const gathaNumber = Number(parts[0].split('\r\n')[0]); 
    assert(isFull || gathaNumber == ++gathaChecker, `incorrect gatha number ${gathaNumber}. Should be ${gathaChecker}`);
    const gathaPali = getGathaPart(parts[0], 'pali'), gathaSinh = getGathaPart(parts[1], 'sinhala');
    const gathaPainting = getPainting(gathaNumber, isFull);
    return JC('div', 'gatha').attr('gatha-num', gathaNumber).attr('is-full', isFull)
        .append(JC('div', 'gatha-parts').append(gathaPali, gathaSinh), gathaPainting)
}

function getGathaPart(gatha, className) {
    const lines = gatha.split('\n').map(line => line.trim());
    return JC('div', className).append(lines.filter(line => !/^\d+$/.exec(line)).map(line => $('<p/>').text(line)));
}

function writeKathaFile(gathas, vaggaInd, vaggaName) {
    const [kathaTitle, kathaHead] = getKathaHeading($(kathaH2[kathaIndexLocal]));
    kathaIndex++; kathaIndexLocal++;
    const kathaItems = JC('div', 'katha-items').append(kathaHead.nextUntil('h1,h2'));
    //console.log(kathaItems.text())
    if (!kathaItems.children().last().is('.katha-ending')) console.log(`last of the katha items is not an ending for ${kathaTitle}`)
    addFootnotesTo(kathaItems)
    const gathaDivs = gathas.map(gatha => getGatha(gatha, true));
    const kathaBody = $('<div/>').append(
        getBackLink(vaggaInd, vaggaName), kathaHead, gathaDivs, kathaItems, getKathaLinks());
    let tmpl = fs.readFileSync(inputFolder + 'tmpl-katha.html', { encoding: 'utf8' });
    tmpl = tmpl.replace(/TITLEPLACEHOLDER/, kathaTitle.replace(/^[\d\-\.\s]*/g, '')); // set the title
    tmpl = tmpl.replace(/FIRSTPAINTINGPLACEHOLDER/, gathaDivs[0].attr('gatha-num')); // set image
    tmpl = tmpl.replace(/CONTENTPLACEHOLDER/, vkbeautify.xml(kathaBody.html())); // set the content
    fs.writeFileSync(outputFolder + getKathaFileName(kathaIndex), tmpl);
    return kathaTitle;
}

function getKathaHeading(kathaHead) {
    assert(kathaHead.text().trim(), `katha heading of kathaIndex ${kathaIndex}/${kathaIndexLocal} is empty`);
    const numText = kathaHead.next().text().trim()
    if (!/^(\d+)\s*[-–]\s*(\d+)/.exec(numText) || !kathaHead.next().is('.katha-ending'))
        console.log(`katha number '${numText}' of '${kathaHead.text()}' does not follow the standard`)
    // adds the katha number to the title and delete the number from the dom
    const kathaTitle = numText.replace(/^(\d+)\s*[-–]\s*(\d+)/, '$1-$2') + ' ' + kathaHead.text()
    kathaHead.next().remove()
    kathaHead.text(kathaTitle).addClass('katha').append(MDI('share', 'share-icon').attr('file-name', getKathaFileName(kathaIndex)));
    return [kathaTitle, kathaHead];
}

// process footnotes for a katha
function addFootnotesTo(kathaItems) {
    const newLi = kathaItems.find("a[id^='footnote-ref-']").get().map((footref, ind) => { // add node.header if header has footnotes
        const footId = Number($(footref).text().slice(1, -1));
        assert(footId >= 1 && footId <= allFootnotes.length, `footnote id ${footId} is out of range [1, ${allFootnotes.length}]`);
        $(footref).text(`[${ind + 1}]`).addClass('footnote-ref');
        return allFootnotes[footId - 1];
    });
    if (newLi.length) kathaItems.append(JC('ol', 'footnotes').append(newLi))
}

function getBackLink(vaggaInd, vaggaName) {
    return JC('nav', 'top').append(
        getNavButton('', `../index.html#vagga-${vaggaInd}`, `මුල් පිටුවට`, 'home'),
        getNavButton('', `${getVaggaFileName(vaggaInd)}#katha-${kathaIndex}`, `${vaggaName} වෙතට`, 'arrow_upward'),
    );
}
function getKathaLinks() {
    return JC('nav', 'bottom').append(
        getNavButton('prev', getKathaFileName(kathaIndex - 1), 'කලින් කතාවට', 'arrow_back'),
        getNavButton('next', getKathaFileName(kathaIndex + 1), 'ඊළඟ කතාවට', 'arrow_forward', true)
    );
}
function getVaggaLinks(vaggaInd) {
    return JC('nav', 'bottom').append(
        getNavButton('prev', getVaggaFileName(vaggaInd - 1), 'කලින් වර්ගයට', 'arrow_back'),
        getNavButton('', `../index.html#vagga-${vaggaInd}`, `මුල් පිටුවට`, 'home'),
        getNavButton('next', getVaggaFileName(vaggaInd + 1), 'ඊළඟ වර්ගයට', 'arrow_forward', true),
    );
}
function getNavButton(cls, href, text, icon, iconRight = false) {
    const children = [MDI(icon), JC('span', 'button-text').text(text)]
    if (iconRight) children.reverse()
    return JC('a', `button ${cls}`).attr('href', href).append(children)
}
function getPainting(gathaNumber, isFull) {
    const src = `../${isFull ? 'paintings' : 'thumbs'}/${gathaNumber}.jpg`;
    return JC('div', 'painting').attr('is-full', isFull).append($('<img/>').attr('src', src));
}

function writeIndexFile(indexDiv, fileName) {
    const indexContent = vkbeautify.xml($('<div/>').append(indexDiv).html());
    fs.writeFileSync(fileName, fs.readFileSync(inputFolder + 'tmpl-index.html', { encoding: 'utf8' }).replace(/CONTENTPLACEHOLDER/, indexContent));
}

function writeVaggaFile(vaggaDiv, fileName, vaggaName) {
    const vaggaContent = vkbeautify.xml($('<div/>').append(vaggaDiv).html());
    let tmpl = fs.readFileSync(inputFolder + 'tmpl-vagga.html', { encoding: 'utf8' });
    tmpl = tmpl.replace(/TITLEPLACEHOLDER/g, vaggaName.replace(/^[\d\-\.\s]*/g, '')); // set the title/desc
    tmpl = tmpl.replace(/CONTENTPLACEHOLDER/, vaggaContent); // set the content
    fs.writeFileSync(fileName, tmpl);
}
