/**
 * Utility to rename files in bulk using regex
 */
const fs = require('fs');
/**
 * Run from the dev folder such as following
 * node .\bjt\rename-photos.js 1 true
 */

const path = require('path');
const assert = require('assert');
// should execute from dev folder
eval(fs.readFileSync('../bjt/scripts/books.js')+'');

const book = Number(process.argv[2]);
//const hookPoint = process.argv[3] ? JSON.parse(process.argv[3]) : 0;
const dryRun = Boolean(process.argv[3]) || false;

assert(book > 0, `book (first param) must be defined.`);

const baseFolder = 'C:/Users/Janaka/Documents/Webstorm/pitaka/bjt/newbooks/';
const folder = baseFolder + book;

const bookToInfo = { // hook point (0,1), start file (2)
    1: ['028', 25, ''],
    2: ['024', 19, ''],
    3: ['', 0, '003.jpg'],
    4: ['', 0, '013.jpg'],
    5: ['012', 11, ''],
    6: ['026', 17, ''],
    7: ['', 0, '004.jpg'],
    8: ['', 0, ''],
    9: ['', 0, ''],
    10: ['', 0, ''],
    11: ['', 0, ''],
    12: ['', 0, '009.jpg'],
    13: ['', 0, ''],
    14: ['020', 15, ''],
    15: ['018', 15, ''],
    16: ['', 0, '001b.jpg'],
    17: ['024', 21, ''],
    18: ['018l', 27, ''],
    19: ['', 0, '005.jpg'],
    20: ['', 0, '005.jpg'],
    21: ['', 0, '009.jpg'],
    22: ['', 0, '001b.jpg'],
    23: ['024', 21, ''],
    24: ['026', 21, ''],
    25: ['022', 19, ''],
    26: ['', 0, '005.jpg'],
    27: ['', 0, '003.jpg'],
    28: ['', 0, ''],
    29: ['', 0, '006.jpg'],
    30: ['', 0, '009.jpg'],
    31: ['', 0, '003.jpg'],
    61: ['', 0, '', 'KN4_Page_', 348], // move the files to 31 after renaming
    32: ['', 0, '005.jpg'],
    33: ['', 0, '005.jpg'],
    34: ['', 0, '005.jpg'],
    35: ['028', 25, ''],
    36: ['', 0, '005.jpg'],
    37: ['030', 23, ''],
    38: ['', 0, ''],
    39: ['', 0, ''],
    40: ['024', 19, ''],
    41: ['', 0, '003.jpg'],
    42: ['038', 27, ''],
    43: ['022', 19, ''],
    44: ['', 0, ''],
    45: ['', 0, '006.jpg'],
    46: ['026', 23, ''],
    47: ['', 0, ''],
    48: ['', 0, ''],
    49: ['014', 13, ''],
    50: ['', 0, '003.jpg'],
    51: ['266', 255, ''],
    52: ['', 0, '003.jpg'],
    53: ['', 0, '005.jpg'],
    54: ['', 0, '003.jpg'],
    55: ['', 0, '008.jpg'],
    56: ['', 0, '007.jpg'],
    57: ['', 0, '007.jpg'],
};
const filePrefix = bookToInfo[book][3] || books[book].imagePrefix;
const getNewFilename = (id) => filePrefix + String(id).padStart(3, '0') + '.jpg';

let startFile = bookToInfo[book][2];
const hookFrom = bookToInfo[book][0], hookTo = bookToInfo[book][1];
console.log(`args provided book = ${book}, hook = ${[hookFrom, hookTo]}, dry run = ${dryRun}`);
let renameCount = 0;
//const dryRun = false;

console.log(`renaming files in folder ${folder}`);

const newFiles = [];
let nextPageId = bookToInfo[book][4] || 1, startedProcessing = false;
const oldFilenames = fs.readdirSync(folder);
oldFilenames.forEach(oldFile => {
    if (!startFile || oldFile == startFile) startedProcessing = true; // ignore few initial files
    if (!startedProcessing) return;

    if (hookFrom && oldFile == (hookFrom + '.jpg')) {
        while (nextPageId < hookTo) {
            const emptyFile = getNewFilename(nextPageId++);
            if (!dryRun) fs.copyFileSync(path.join(baseFolder, 'empty.jpg'), path.join(folder, emptyFile));
            console.log(`add empty ${emptyFile}`);
        }
        nextPageId = hookTo;
    }
    const newFile = getNewFilename(nextPageId++);
    assert(!fs.existsSync(path.join(folder, newFile)), `${newFile} already exists`);
    if (!dryRun) fs.renameSync(path.join(folder, oldFile), path.join(folder, newFile));
    if (renameCount < 100) console.log(`rename ${oldFile} -> ${newFile}`);
    renameCount++;
    newFiles.push(newFile);
});

console.log(`${dryRun ? 'dry run' : 'renamed'} total of ${renameCount} files in ${book}`);