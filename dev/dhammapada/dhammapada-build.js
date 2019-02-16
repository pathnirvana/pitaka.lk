// splits the mammoth output file to multiple html files
// images and the pali gatha added
// magick mogrify -resize 1000x1000 -background none -fill white -font 'Segoe-UI' -pointsize 50 -gravity south -stroke gray -strokewidth 1 -draw "text 0,100 'pitaka.lk/dhammapada'" -path output -quality 50 *.jpg

const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
const MDI = (name, cls) => `<i class="material-icons ${cls}">${name}</i>`;

const kathaDom = new JSDOM(fs.readFileSync('katha.html', { encoding: 'utf8' }));
//const katha2Dom = new JSDOM(fs.readFileSync('katha2.html', { encoding: 'utf8' }));
const kathaDoc = kathaDom.window.document;// katha2Doc = katha2Dom.window.document;
const kathaH1 = $('h1', kathaDoc); console.log(`num kathas = ${kathaH1.length}`);

const lines = fs.readFileSync('gatha.txt', { encoding: 'utf8' });
let vaggas = lines.split('@'); console.log(`num of vaggas ${vaggas.length}`); //vaggas = vaggas.slice(0, 6); //ONLY TAKE THE FIRST

let kathaIndex = 0, gathaChecker = 0;
const getKathaFileName = (ki) => (ki >= 1 && ki <= 305) ? `katha-${ki}.html` : '';
const getVaggaFileName = (vi) => (vi >= 1 && vi <= 26) ? `vagga-${vi}.html` : '';

const indexDiv = $('<div/>').append(vaggas.map((vagga, vaggaInd) => processVagga(vagga, vaggaInd + 1))).addClass('vagga-links');
writeIndexFile(indexDiv, 'output/index.html');

function processVagga(vagga, vaggaInd) {
    const kathas = vagga.split('k').map(line => line.trim()).filter(line => line);
    const vaggaName = kathas[0];
    console.log(`vagga ${kathas[0]} has ${kathas.length - 1} kathas`);
    assert(vaggaName.split('\n').length == 1, `multiline vagga heading ${vaggaName}`);

    const vaggaNameDiv = $('<div/>').text(vaggaName).attr('id', `vagga-${vaggaInd}`).addClass('vagga-name');
    const vaggaDiv = $('<div/>').addClass('vagga').append(vaggaNameDiv);
    const kathaDivs = kathas.slice(1).map(katha => processKatha(katha, vaggaInd, vaggaName));
    writeVaggaFile(vaggaDiv.append(kathaDivs, getVaggaLinks(vaggaInd)), `output/${getVaggaFileName(vaggaInd)}`, vaggaName);

    return $('<a/>').addClass('vagga-link').attr('id', `vagga-${vaggaInd}`).attr('href', getVaggaFileName(vaggaInd)).append(
        $('<div/>').addClass('vagga-name').text(vaggaName));
}

function processKatha(katha, vaggaInd, vaggaName) {
    const gathas = katha.split('g').map(line => line.trim()).filter(line => line);
    const kathaTitle = writeKathaFile(gathas, vaggaInd, vaggaName);
    const kathaDiv = $('<a/>').addClass('katha').attr('href', getKathaFileName(kathaIndex)).attr('id', `katha-${kathaIndex}`);
    kathaDiv.append($('<div/>').html(kathaTitle).addClass('katha-title'), gathas.map(gatha => processGatha(gatha, false)));
    return kathaDiv;
}

function processGatha(gatha, isFull = false) {
    const parts = gatha.split('#').map(line => line.trim()).filter(line => line);
    assert(parts.length == 2, `gatha ${gatha} has more than 2 parts ${parts.length}`);
    assert(/^\d+$/.exec(parts[0].split('\r\n')[0]), `pali gatha part ${parts[0]} does not start with a number`);
    const gathaNumber = Number(parts[0].split('\r\n')[0]); 
    assert(isFull || gathaNumber == ++gathaChecker, `incorrect gatha number ${gathaNumber}. Should be ${gathaChecker}`);
    const gathaPali = processGathaPart(parts[0], 'pali'), gathaSinh = processGathaPart(parts[1], 'sinhala');
    const gathaPainting = getPainting(gathaNumber, isFull);
    return $('<div/>').addClass('gatha').attr('gatha-num', gathaNumber).attr('is-full', isFull).append(
        $('<div/>').addClass('gatha-parts').append(gathaPali, gathaSinh), 
        gathaPainting);
}

function processGathaPart(gatha, className) {
    const lines = gatha.split('\n').map(line => line.trim());
    const gDiv = $('<div/>').addClass(className);
    gDiv.append(lines.filter(line => !/^\d+$/.exec(line)).map(line => $('<p/>').text(line)));
    return gDiv;
}

function writeKathaFile(gathas, vaggaInd, vaggaName) {
    const [kathaTitle, kathaHeading] = getKathaHeading($(kathaH1[kathaIndex++]));
    const kathaItems = $('<div/>').addClass('katha-items').append(kathaHeading.nextUntil('h1'));
    const gathaDivs = gathas.map(gatha => processGatha(gatha, true));
    const kathaBody = $('<div/>').append(getBackLink(vaggaInd, vaggaName), kathaHeading, gathaDivs, kathaItems, getKathaLinks());
    let preContent = fs.readFileSync('pre-katha.html', { encoding: 'utf8' });
    preContent = preContent.replace(/TITLEPLACEHOLDER/, kathaHeading.text().replace(/^[\d\-\.\w]*/g, '')); // set the title
    preContent = preContent.replace(/FIRSTPAINTINGPLACEHOLDER/, gathaDivs[0].attr('gatha-num')); // set image
    preContent = preContent.replace(/CONTENTPLACEHOLDER/, vkbeautify.xml(kathaBody.html())); // set the content
    fs.writeFileSync('output/' + getKathaFileName(kathaIndex), preContent);
    return kathaTitle;
}

function getBackLink(vaggaInd, vaggaName) {
    const vaggaLink = $('<a/>').addClass('button').attr('href', `${getVaggaFileName(vaggaInd)}#katha-${kathaIndex}`).text(`${vaggaName} වෙතට`);
    const indexLink = $('<a/>').addClass('button').attr('href', `index.html#vagga-${vaggaInd}`).text(`මුල් පිටුවට`);
    return $('<nav/>').addClass('top').append(vaggaLink, indexLink);
}
function getKathaLinks() {
    const prevLink = $('<a/>').addClass('button prev').attr('href', getKathaFileName(kathaIndex - 1)).text('කලින් කතාවට');
    const nextLink = $('<a/>').addClass('button next').attr('href', getKathaFileName(kathaIndex + 1)).text('ඊළඟ කතාවට');
    return $('<nav/>').addClass('bottom').append(prevLink, nextLink);
}
function getVaggaLinks(vaggaInd) {
    const prevLink = $('<a/>').addClass('button prev').attr('href', getVaggaFileName(vaggaInd - 1)).text('කලින් වර්ගයට');
    const indexLink = $('<a/>').addClass('button').attr('href', `index.html#vagga-${vaggaInd}`).text(`මුල් පිටුවට`);
    const nextLink = $('<a/>').addClass('button next').attr('href', getVaggaFileName(vaggaInd + 1)).text('ඊළඟ වර්ගයට');
    return $('<nav/>').addClass('bottom').append(prevLink, indexLink, nextLink);
}
function getPainting(gathaNumber, isFull) {
    const src = `${isFull ? 'paintings' : 'thumbs'}/${gathaNumber}.jpg`;
    return $('<div/>').addClass('painting').attr('is-full', isFull).append($('<img/>').attr('src', src));
}

function writeIndexFile(indexDiv, fileName) {
    const indexContent = vkbeautify.xml($('<div/>').append(indexDiv).html());
    fs.writeFileSync(fileName, fs.readFileSync('pre-index.html', { encoding: 'utf8' }).replace(/CONTENTPLACEHOLDER/, indexContent));
}
function getKathaHeading(kathaHead) {
    assert(/^(\d+)[\-\.]{1}(\d+)/.exec(kathaHead.text()), `katha heading '${kathaHead.text()}' does not follow the standard`);
    const kathaTitle = kathaHead.text().replace(/^(\d+)[\-\.]{1}(\d+)/, '$1-$2');
    kathaHead.text(kathaTitle).addClass('katha')
        .append($(MDI('share', 'share-icon')).attr('file-name', getKathaFileName(kathaIndex)));
    return [kathaTitle, kathaHead];
}

function writeVaggaFile(vaggaDiv, fileName, vaggaName) {
    const vaggaContent = vkbeautify.xml($('<div/>').append(vaggaDiv).html());
    let preContent = fs.readFileSync('pre-vagga.html', { encoding: 'utf8' });
    preContent = preContent.replace(/TITLEPLACEHOLDER/, vaggaName.replace(/^[\d\-\.\w]*/g, '')); // set the title
    preContent = preContent.replace(/CONTENTPLACEHOLDER/, vaggaContent); // set the content
    fs.writeFileSync(fileName, preContent);
}


console.log(`Processed ${kathaIndex} kathas`);
