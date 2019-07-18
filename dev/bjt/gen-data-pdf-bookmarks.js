/**
 * Adapted from get-data.html file for node
 * use in pdf bookmarks generation for the BJT new scans in 2019 June/July
 */
'use strict';

const fs = require('fs');
const vkb = require('vkbeautify');

var F = { // field order in the excel file
    BOOK: 0,
    LEVEL: 1,
    NAME: 2,
    PAGE: 3,
    ENDP: 4
};

function convertToJson(inputText) {
    const lines = inputText.trim().split('\r\n');
    lines.splice(0, 1); // remove the first headers etc
    
    const searchIndex = [];
    const parents = []
    let lineNum = 2;
    lines.forEach(line => {
        var parts = line.split('\t');
        if (parts.length != 5) {
            console.error('Not enough fields in ' + line + '. LineID: ' + lineNum);
            console.log(parts.length);
        }

        if (!parts[F.LEVEL].trim()) { // do not process empty level
            lineNum++;
            return true; // continue
        }
        var level = Number(parts[F.LEVEL].trim());
        if (isNaN(level)) {
            console.error('Level in ' + line + ' is not a number. LineID: ' + lineNum)
        }

        var name = stripLeadingNumbers(parts[F.NAME].trim());
        if (!name) {
            console.error('Name in ' + line + ' is empty. LineID: ' + lineNum);
        }

        var page = Number(parts[F.PAGE].trim());
        var endPage = Number(parts[F.ENDP].trim());
        var book = Number(parts[F.BOOK].trim());
        if (isNaN(page) || isNaN(book) || !page || !book) {
            console.error('Page or Book in ' + line + ' is not a number or zero. LineID: ' + lineNum)
        }

        var parent = -1;
        if (level - 1 >= 0) {
            parent = parents[level - 1];
        }
        var index = searchIndex.length;
        var entry = [book, name, parent, page, level, index];
        if (!isNaN(endPage) && endPage) { // endPage is optional
            entry.push(endPage);
        }
        searchIndex.push(entry);
        parents[level] = index; // new parent for levels below this level

        lineNum++;
    });
    return searchIndex;
}

function stripLeadingNumbers(name) {
    return name.replace(/^[\s\.\-0-9]+/, '');
}

const fileText = fs.readFileSync('bjt/Book1-utf8.txt', {encoding: 'utf-8'});
console.log(`input file size ${fileText.length}`);
const searchIndex = convertToJson(fileText);
console.log('Added ' + searchIndex.length + ' entries to data file.');
fs.writeFileSync('bjt/pdf-bookmarks.json', vkb.json(JSON.stringify(searchIndex)), {encoding: 'utf-8'});