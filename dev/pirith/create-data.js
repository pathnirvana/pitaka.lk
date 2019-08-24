
const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

const rootFolder = 'pirith';
const pirithToProcess = {
    '2': '02-saranagamanam',
    '3': '03-dasasikkhapadani',
    '4': '04-samanera-panha',
    '5': '05-dvattimsakaraya',
    //'6': '06-paccavekkhana',
    '7': '07-dasadhamma',
    '8': '08-mahamangala',
    '9': '09-rathana',
    '10': '10-karaniya',
    /*'11': '11-khandha-parittam',
    '12': '12-mettanisamsa',
    '13': '13-mittanisamsa',
    '14': '14-mora-parittam',
    '15': '15-canda-parittam',
    '16': '16-suriya-parittam',
    '17': '17-dhajagga-parittam',*/
};
const dataJson = {};

const readSplitFile = fileName => {
    const dataStr = fs.readFileSync(fileName, {encoding: 'utf-8'});
    //console.log(data);
    return dataStr.split('\n').map(line => line.trim());
};

function processPirith(fileName, pirithName) {
    const labels = readSplitFile(`${rootFolder}/${fileName}-labels.txt`).map(line => line.split('\t').map(num => Number(num)));
    const paliText = readSplitFile(`${rootFolder}/${fileName}.txt`);
    const transText = readSplitFile(`${rootFolder}/${fileName}-trans.txt`).map(line => line.length ? line : null);
    assert(labels.length == paliText.length && labels.length == transText.length, 
        `labels, paliText and transText lengths are different for ${pirithName}`);
    dataJson[pirithName] = {
        'labels': labels,
        'pali': paliText, // todo: create seperate ones for each pali script
        'trans': transText,
    };
    console.log(`processed ${pirithName}, num labels ${labels.length}`);
}

Object.keys(pirithToProcess).forEach(fileName => processPirith(fileName, pirithToProcess[fileName]));
fs.writeFileSync(`../pirith/pirith-data.js`, 
    'const pirithData = ' + vkbeautify.json(JSON.stringify(dataJson)), 
    {encoding: 'utf-8'});