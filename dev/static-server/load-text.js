/**
 * This code runs on the server
 */
const { readFileSync, promises: fs } = require("fs");
const vkbeautify = require('vkbeautify');
const jsdom = require('jsdom').JSDOM;
const jWindow = (new jsdom('<html></html>')).window;
const $ = require('jquery')(jWindow);

const JC = (name, cls) => $(`<${name}/>`).addClass(cls);

// load the tree to extract required information
const tree = JC('div').html(readFileSync('../main/text/main_toc_full.xml', {encoding: 'utf-8'}));
const getCollections = (vaggaId) =>
    tree.find('li[node-id="'+ vaggaId +'"]').attr('collections').split(',');

// get the pitaka/nikaya/book/vagga hierarchy as a string array
const getHierarchy = (vaggaId) => {
    const vaggaLi = tree.find('li[node-id="'+ vaggaId +'"]');
    return $.uniqueSort(vaggaLi.parents('li').add(vaggaLi).children('a')).map(function() {
        return $(this).text();
    }).get();
}

// this function copied from pitakaTable.js but modified to run on the server
// create a new node and load the text, then render html and remove the node
async function getRenderedText(nodeId, paraId) {
    const vaggaId = nodeId.substr(0, 4);
    const colls = getCollections(vaggaId);
    const vaggaFileId = 'vagga_' + vaggaId + '.xml';

    const textDivs = {};
    await Promise.all(colls.map(async coll => {
        const targetUrl = '../main/text/' + coll + '/' + vaggaFileId;
        const html = await fs.readFile(targetUrl, {encoding: 'utf-8'});
        textDivs[coll] = $('<div/>').html(html);
    }));
    //showTextArea();
    const tbody = JC('div'); // create a new root node
    loadTextToTable(textDivs, tbody);
    if (textDivs['sinh-aps']) {
        // set the coll to hide if user explicitly did so or if screen size too small
        tbody.find('td[coll=pali-cs]').addClass('user-closed-coll');
    }
    hideAllSubheads(tbody); // hide all subheads

    //const topTr = tbody.children().first();
    // open/highlight node/para
    topTr = tbody.find('tr[node-id='+nodeId+']').show();
    if (topTr) {
        topTr.find('span.subhead').removeClass('sc_collapsed');
        if (paraId) {
            topTr = tbody.find('tr[para='+paraId+']').css('background-color', 'lightyellow');
        }
    }
    
    const html = vkbeautify.xml(tbody.html());
    const {title, desc} = getMetaTags(tbody, nodeId);
    tbody.remove(); // remove from the dom after getting the html
    return {text: html, title, desc}
}

// get the document title and the other opentype properties
function getMetaTags(tbody, nodeId) {
    const topTr = tbody.find('tr[node-id='+nodeId+']');
    const title = topTr.find('span.chapter,span.title,span.subhead').last().text().replace(/^\d+\./, '').trim();
    const desc = getHierarchy(String(nodeId).substr(0, 4)).join(' > ');
    return {title, desc};
}

/**
 * Following functions are almost identical to the main/pitakaTable.js
 */
function hideAllSubheads(tbody) {
    const nodeIds = Array.from(new Set(
        tbody.find('span.subhead').parents('tr').toArray().map(tr => $(tr).attr('node-id'))));
    nodeIds.forEach(id => tbody.find(`tr.textbody[node-id=${id}]`).hide());
    tbody.find('span.subhead').addClass('sc_collapsed');
}

const trSpanSelector = 'div>span:not(.note):not(.bold)'; // spans that should go in the table rows 
//bug - this skips the 'ending' since they are direct divs without spans
function loadTextToTable(textDivs, tbody) {
    const paliSpans = textDivs['pali-cs'].find(trSpanSelector);
    const sinhSpans = textDivs['sinh-aps'] ? textDivs['sinh-aps'].find(trSpanSelector) : null;

    for (let i = 0; i < paliSpans.length; i++) {
        const div = $(paliSpans[i]).parent();
        const paliTd = getTableTd(paliSpans[i], 'pali-cs');
        const tr = $('<tr/>').append(paliTd);
        let nodeId = div.attr('node-id');
        if (div.hasClass('paragraph')) {
            nodeId = div.parents('div[node-id]').first().attr('node-id');
            tr.attr('para', div.attr('para')).addClass('textbody');
        }
        tr.attr('node-id', nodeId);

        if (sinhSpans) {
            tr.append(getTableTd(sinhSpans[i], 'sinh-aps'));
        }
        tbody.append(tr);
    }

    const starIcon = JC('i', 'fa fa-star star-icon');
    tbody.find('span.chapter, span.title, span.subhead').after(starIcon);
    const shareIcon = JC('i', 'fa fa-share share-icon');
    tbody.find('span.chapter, span.title, span.subhead, span.paranum').after(shareIcon);
}
function getTableTd(span, coll) {
    const div = $(span).parent(), td = $('<td/>').attr('coll', coll);
    if (div.hasClass('paragraph')) {
        td.append(div.children());
    } else {
        td.append(span);
    }
    return td;
}

module.exports = { getRenderedText };