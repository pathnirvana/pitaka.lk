
const fs = require('fs');
const assert = require('assert');
const vkbeautify = require('vkbeautify');

const rootFolder = 'pirith';
const pirithToProcess = {
    '2': '02-saranagamanam',
    '3': '03-dasasikkhapadani',
    '4': '04-samanera-panha',
    '5': '05-dvattimsakaraya',
    '6': '06-paccavekkhana',
    '7': '07-dasadhamma',
    '8': '08-mahamangala',
    '9': '09-rathana',
    '10': '10-karaniya',
    '11': '11-khandha-parittam',
    /*'12': '12-mettanisamsa',
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

const readTextFile = fileName => {
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

function processPirith(fileName, pirithName) {
    const labels = readSplitFile(`${rootFolder}/${fileName}-labels.txt`).map(line => line.split('\t').map(num => Number(num)));
    const text = readTextFile(`${rootFolder}/${fileName}-combi.txt`);

    //const paliText = readSplitFile(`${rootFolder}/${fileName}.txt`);
    //const transText = readSplitFile(`${rootFolder}/${fileName}-trans.txt`).map(line => line.length ? line : null);
    assert(labels.length == text.length, `labels and text lengths are different for ${pirithName}`);
    dataJson[pirithName] = {
        'labels': labels,
        'text': text,
    };
    console.log(`processed ${pirithName}, num labels ${labels.length}`);
}

Object.keys(pirithToProcess).forEach(fileName => processPirith(fileName, pirithToProcess[fileName]));
fs.writeFileSync(`../pirith/pirith-data-2.js`, 
    'const pirithData = ' + vkbeautify.json(JSON.stringify(dataJson)), 
    {encoding: 'utf-8'});