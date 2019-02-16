// create a sitemap for the pitaka.lk/main to be submitted to the 
// google search console for indexing
const fs = require('fs');
const suttas = JSON.parse(fs.readFileSync('main/text/sutta-list.json', {encoding: 'utf8'}));
const list = Object.entries(suttas).map(sutta => `https://pitaka.lk/main?n=${sutta[0]}`).join('\n');
fs.writeFileSync('main/text/sitemap.txt', list, {encoding: 'utf8'});
