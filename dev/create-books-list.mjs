/**
 * create the list of books by reading the files/urls from the mediafire using mediafire api
 * node --experimental-modules dev/create-books-list.mjs
 */

"use strict";

import fs from 'fs';
import {passwords} from './passwords.mjs';
import https from 'https';
import crypto from 'crypto';
const MFDownloadBase = 'http://www.mediafire.com/file/';
const MFApiBase = 'https://www.mediafire.com/api/';
const MFResFormat = '&response_format=json';
const MFCred = passwords.mediafire;
const MFAppId = 40159;
const MFTopFolder = '7er85ae44wr67';
let collsToBeProcessed; // used to check if all folders are processed before writing entries to the file
const entryMap = new Map(), entries = [];

function parseFileName(fileName) {
    var result = /^([^\[]+)(?:\[(.+)\])?\.(.+)$/g.exec(fileName);
    if (!result) console.error(`Filename ${fileName} can not be parsed`);
    return [result[1].trim(), result[2], result[3]];
}

function callWithData(res, callback)  {
    let rawData = '';
    res.on('data', (chunk) => { rawData += chunk; });
    res.on('end', () => {
        try {
            const parsedData = JSON.parse(rawData);
            callback(parsedData);
        } catch (e) {
            console.error(e.message);
        }
    });
}
function processTopFolder(session_token) {
    const otherParams = `content_type=folders&filter=public&details=yes`;
    https.get(`${MFApiBase}folder/get_content.php?session_token=${session_token}&folder_key=${MFTopFolder}&${otherParams}&${MFResFormat}`, 
        (res) => callWithData(res, (data) => processFolders(data.response.folder_content, session_token))
        ).on('error', (e) => {
            console.error(e);
        });
}
function processFolders(folder_content, session_token) {
    const otherParams = `content_type=files&filter=public&chunk_size=500`;
    collsToBeProcessed = folder_content.folders.length;
    folder_content.folders.forEach(folder => {
        const collDetails = {
            name: folder.name,
            coll: '',
            files: [{
                type: 'collection',
                size: Number(folder.file_count),
                time: folder.created,
                downloads: 0,
                url: '',
            }],
        };
        entries.push(collDetails);

        const folder_key = folder.folderkey;
        https.get(`${MFApiBase}folder/get_content.php?session_token=${session_token}&folder_key=${folder_key}&${otherParams}&${MFResFormat}`, 
            (res) => callWithData(res, (data) => createCollection(data.response.folder_content, folder.name))
            ).on('error', (e) => {
                console.error(e);
            });
    });
    console.log(`Top Folder has ${collsToBeProcessed} folders.`);
}
function createCollection(folder_content, collName) {
    const files = folder_content.files;
    files.forEach(file => {
        const [name, desc, type] = parseFileName(file.filename);
        const mapKey = `${name}@${collName}`;
        const fileDetails = { 
            type: type,
            desc: desc,
            size: Number(file.size),
            time: file.created,
            downloads: Number(file.downloads), 
            url: `${MFDownloadBase}${file.quickkey}`, // created by the key since sinhala filenames generate long urls
        };
        if (entryMap.has(mapKey)) {
            entryMap.get(mapKey).push(fileDetails);
        } else {
            entryMap.set(mapKey, [fileDetails]);
        }
    });
    console.log(`Collection: ${collName}, num files: ${files.length}`);
    collsToBeProcessed--;
    if (!collsToBeProcessed) {
        writeEntries();
    }
}
function writeEntries() {
    //const entries = []; 
    entryMap.forEach((detailsAr, mapKey) => {
        const parts = mapKey.split('@');
        entries.push( {name: parts[0], coll: parts[1], files: detailsAr} );
    });
    console.log(`Num entries: ${entries.length}`);
    const outputFile = 'books/books-list.js';
    fs.writeFileSync(outputFile, `var books_list = ${JSON.stringify(entries)};`, {encoding: 'utf8'});
    console.log(`Wrote file ${outputFile}`);
}

// get a session token and access the top folder and then all the subfolders found
const sha1 = crypto.createHash('sha1');
sha1.update(`${MFCred.email}${MFCred.password}${MFAppId}${MFCred.apiKey}`);
const signature = sha1.digest('hex');

https.get(`${MFApiBase}user/get_session_token.php?application_id=${MFAppId}&signature=${signature}&email=${MFCred.email}&password=${MFCred.password}&token_version=1&${MFResFormat}`, 
    (res) => callWithData(res, (data) => processTopFolder(data.response.session_token))
    ).on('error', (e) => {
        console.error(e);
    });