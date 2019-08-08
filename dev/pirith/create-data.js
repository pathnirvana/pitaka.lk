const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

const rootFolder = 'pirith';
const pirithToProcess = ['karaniya'];
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

    const transText = {};
    readSplitFile(`${rootFolder}/${pirithName}-trans.txt`).map(line => line.split('#')).forEach(items => {
        transText[items[0]] = items[1];
    });
    dataJson[pirithName] = {
        'labels': labels,
        'pali': paliText, // todo: create seperate ones for each pali script
        'trans': transText,
    };
}

pirithToProcess.forEach(name => processPirith(name));
fs.writeFileSync(`../pirith/pirith-data.js`, 
    'const pirithData = ' + vkbeautify.json(JSON.stringify(dataJson)), 
    {encoding: 'utf-8'});