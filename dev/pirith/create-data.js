
const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

const rootFolder = 'pirith';
const pirithToProcess = ['karaniya', 'mahamangala'];
const dataJson = {};

const readSplitFile = fileName => {
    const dataStr = fs.readFileSync(fileName, {encoding: 'utf-8'});
    //console.log(data);
    return dataStr.split('\n').map(line => line.trim());
};

function processPirith(pirithName) {
    const labels = readSplitFile(`${rootFolder}/${pirithName}-labels.txt`).map(line => line.split('\t').map(num => Number(num)));
    const paliText = readSplitFile(`${rootFolder}/${pirithName}.txt`);
    assert(labels.length == paliText.length, `labels and paliText lengths are different for ${pirithName}`);

    //const transText = new Array(labels.length);
    //let prevTInd = 0;
    const transText = readSplitFile(`${rootFolder}/${pirithName}-trans.txt`).map(line => line.length ? line : null);/* line.split('#')).forEach(items => {
        if (items.length == 2) { // use the index specified in the line
            prevTInd = Number(items[0]) - 1;
            transText[prevTInd] = items[1];
        } else { // just add one to the prev index
            transText[++prevTInd] = items[0];
        }
    });*/
    dataJson[pirithName] = {
        'labels': labels,
        'pali': paliText, // todo: create seperate ones for each pali script
        'trans': transText,
    };
    console.log(`processed ${pirithName}, num labels ${labels.length}`);
}

pirithToProcess.forEach(name => processPirith(name));
fs.writeFileSync(`../pirith/pirith-data.js`, 
    'const pirithData = ' + vkbeautify.json(JSON.stringify(dataJson)), 
    {encoding: 'utf-8'});