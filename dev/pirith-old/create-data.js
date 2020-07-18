
const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

var jsdom = require('jsdom');
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;

var $ = jQuery = require('jquery')(window);
const CE = (elem, cls) => $(`<${elem}/>`).addClass(cls), 
    CED = (cls) => CE('div', cls), CES = (cls) => CE('span', cls); // helper func

const rootFolder = 'pirith';

const prePageHtml = fs.readFileSync(`${rootFolder}/pre-page.html`, { encoding: 'utf8' });

// copied from the main pirith/scripts.js file
const pirithList = { // order, desc, author, length, count, isStarred, isLoop
    '02-saranagamanam':     [0, 'සරණාගමනං', 'ariyadhamma', '1:41'],
    '03-dasasikkhapadani':  [1, 'දස සික්ඛාපදානි', 'ariyadhamma', '1:48'],
    '04-samanera-panha':    [2, 'සාමණේර පඤ්හො', 'ariyadhamma', '1:53'],
    '05-dvattimsakaraya':   [3, 'ද්වත්තිංසාකාරො', 'ariyadhamma', '1:09'],
    '06-paccavekkhana':     [4, 'පච්චවෙක්ඛණා', 'ariyadhamma', '3:24'],
    '07-dasadhamma':        [5, 'දසධම්ම සුත්තං', 'ariyadhamma', '5:24'],
    '08-mahamangala':       [6, 'මහා මඞ්ගල සුත්තං', 'ariyadhamma', '5:46'],
    '09-rathana':           [7, 'රතන සුත්තං', 'ariyadhamma', '10:21'],
    '10-karaniya':          [8, 'කරණීය මෙත්ත සුත්තං', 'ariyadhamma', '4:02'],
    '11-khandha-parittam':  [9, 'ඛන්ධ පරිත්තං', 'ariyadhamma', '6:50'],
    '12-mettanisamsa':      [10, 'මෙත්තානිසංස සුත්තං', 'ariyadhamma', '3:33'],
    '13-mittanisamsa':      [11, 'මිත්තානිසංස සුත්තං', 'ariyadhamma', '3:27'],
    '14-mora-parittam':     [12, 'මොර පරිත්තං', 'ariyadhamma', '2:25'],
    '15-canda-parittam':    [13, 'චන්ද පරිත්තං', 'ariyadhamma', '3:26'],
    '16-suriya-parittam':   [14, 'සූරිය පරිත්තං', 'ariyadhamma', '3:40'],
    '17-dhajagga-parittam': [15, 'ධජග්ග පරිත්තං', 'ariyadhamma', '11:13'],
    '18-kassapa-bojjhanga':     [16, 'මහා කස්සප බොජ්ඣංග සුත්තං', 'ariyadhamma', '7:05'],
    '19-moggallana-bojjhanga':  [17, 'මහා මොග්ගල්ලාන බොජ්ඣංග සුත්තං', 'ariyadhamma', '7:03'],
    '20-chunda-bojjhanga':      [18, 'මහා චුන්ද බොජ්ඣංග සුත්තං', 'ariyadhamma', '6:53'],
    '21-girimananda-suttam':    [19, 'ගිරිමානන්ද සුත්තං', 'ariyadhamma', '24:11'],
    '22-isigili-suttam':        [20, 'ඉසිගිලි සුත්තං', 'ariyadhamma', '16:23'],
    '23-dhammacakkappavattana': [21, 'ධම්මචක්කප්පවත්තන සුත්තං', 'ariyadhamma', '24:28'],
    '24-mahasamaya-suttam':     [22, 'මහාසමය සුත්තං', 'ariyadhamma', '30:17'],
    '25-alavaka-suttam':        [23, 'ආළවක සුත්තං', 'ariyadhamma', '9:40'],
    '26-kasibharadvaja-suttam': [24, 'කසිභාරද්වාජ සුත්තං', 'ariyadhamma', '11:49'],
    '27-parabhava-suttam':      [25, 'පරාභව සුත්තං', 'ariyadhamma', '10:00'],
    '28-aggika-bharadvaja-suttam':  [26, 'අග්ගික භාරද්වාජ සුත්තං', 'ariyadhamma', '14:22'],
    '29-saccavibhanga-suttam':      [27, 'සච්චවිභඞ්ග සුත්තං', 'ariyadhamma', '30:31'],
    '30-atanatiya-suttam-1':        [28, 'ආටානාටිය සුත්තං 1', 'ariyadhamma', '41:02'],
    '32-atanatiya-suttam-2':        [29, 'ආටානාටිය සුත්තං 2', 'ariyadhamma', '48:55'],
    '35-tesattati-nyana-parittam':  [30, 'තෙසැත්තෑ ඤාණ පරිත්තං', 'ariyadhamma', '58:26'],
};
const dataJson = {};

const readSplitFile = fileName => {
    if (!fs.existsSync(fileName)) return [];
    const dataStr = fs.readFileSync(fileName, {encoding: 'utf-8'});
    //console.log(data);
    return dataStr.split('\n').map(line => line.trim());
};

const readTextFile = fileName => {
    if (!fs.existsSync(fileName)) return [];
    const dataStr = fs.readFileSync(fileName, {encoding: 'utf-8'});
    //console.log(data);
    return dataStr.split('\r\n\r\n').map(group => {
        const lines = group.split('\r\n');
        return lines.map(line => {
            const parts = line.split('=').map(part => part.trim());
            assert(parts.length == 2, `no = found on text line ${line} : group ${group}`);
            if (parts[1].endsWith(';')) parts[1] = parts[1].slice(0, -1); // remove last ;
            return parts;
        });
    });
}

function processPirith(pirithName) {
    const fileName = Number(pirithName.split('-')[0]);
    if (!fs.existsSync(`${rootFolder}/${fileName}-combi.txt`)) return; // dont process if no data files

    const labels = readSplitFile(`${rootFolder}/${fileName}-labels.txt`).map(line => line.split('\t').map(num => Number(num)));
    const text = readTextFile(`${rootFolder}/${fileName}-combi.txt`);
    assert(labels.length == text.length, `labels and text lengths are different for ${pirithName}`);
    dataJson[pirithName] = {
        'labels': labels,
        'text': text,
    };
    console.log(`processed data for ${pirithName}, num labels ${labels.length}`);

    // write the full sentences to static pages
    const paliSent = readSplitFile(`${rootFolder}/${fileName}.txt`);
    const sinhSent = readSplitFile(`${rootFolder}/${fileName}-trans.txt`).map(line => line.length ? line : null);
    assert(!paliSent.length || (paliSent.length == labels.length && sinhSent.length == labels.length), 
        `labels and sentence lengths are different for ${pirithName}`);

    const pageSize = writeStaticPage(pirithName, labels, text, paliSent, sinhSent);
    console.log(`wrote static page for ${pirithName}, page size ${pageSize}`);
}


/** STATIC PAGES */

function writeStaticPage(pirithName, labels, text, paliSent, sinhSent) {
    const renderedText = text.map((rows, ind) => {
        const textE = CED(`text-rows`).append(rows.map(row => CED('text-row').append(
            [CED('pali part').text(row[0]), CED('sinh part').text(row[1])])));
        const labelE = CED('label').append(textE)
            .attr('label-start', labels[ind][0])
            .attr('label-end', labels[ind][1]);
        if (paliSent.length) {
            labelE.append(CED('sentences').append(
                CED('pali-sent').text(paliSent[ind]), 
                CED('sinh-sent').text(sinhSent[ind])));
        }
        return labelE;
    });
    const audio = $('<audio controls></audio>');
    const contentDiv = CED('content').append(
        audio,
        renderedText
    );

    const contentHtml = vkbeautify.xml(CED('div').append(contentDiv).html());
    let tmplStr = prePageHtml.replace(/TITLEPLACEHOLDER/g, pirithList[pirithName][1]);
    tmplStr = tmplStr.replace(/PIRITHNAMEPLACEHOLDER/g, pirithName);
    tmplStr = tmplStr.replace(/CONTENTPLACEHOLDER/, contentHtml)
    fs.writeFileSync(`../pirith/pages/${pirithName}.html`, tmplStr);
    return tmplStr.length;
}


Object.keys(pirithList).forEach(pirithName => processPirith(pirithName));

// write the data file
fs.writeFileSync(`../pirith/pirith-data.js`, 
    'const pirithData = ' + vkbeautify.json(JSON.stringify(dataJson)), 
    {encoding: 'utf-8'});