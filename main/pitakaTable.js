// created on 2018-06-28

(function ( $ ) {
$.fn.registerTextClicks = function() {
    var tbody = $('#text-view-tbody');
    // text clicks - delegated
    tbody.on('click', 'span.subhead', function (e) { // span.chapter removed from here due to perf reasons
        $(this).parents('tr').find('span').toggleClass('sc_collapsed');
        var nodeId = $(this).parents('tr').attr('node-id');
        tbody.find('tr.textbody[node-id=' + nodeId + ']').toggle();
        if (!$(this).hasClass('sc_collapsed')) {
            setScrollTop($(this));
        }
    });
    // span links
    /*tbody.on('click', 'i.share-icon', function (e) {
        var nodeId = $(this).parents('tr').attr('node-id');
        var paraId = $(this).parents('tr').attr('para');
        var url = 'https://pitaka.lk/main?n=' + nodeId;
        if (paraId) {
            url += ('&p=' + paraId);
        }
        copyTextAndShowToast(url, 'link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.');
        e.stopPropagation();
    });*/
    const clipb = new ClipboardJS('i.share-icon', {
        text: function(icon) {
            var nodeId = $(icon).parents('tr').attr('node-id');
            var paraId = $(icon).parents('tr').attr('para');
            var url = 'https://pitaka.lk/main?n=' + nodeId;
            if (paraId) {
                url += ('&p=' + paraId);
            }
            return url;
        }
    });
    clipb.on('success', function(e) { showToast('link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.'); });
}


$.fn.pitakaTableOpenVagga = function (origin, vaggaId, nodeId, paraId) {
    var colls = pitakaTree.getCollections(vaggaId);
    var vaggaFileId = 'vagga_' + vaggaId + '.xml';
    var deferred = [], textDivs = {};
    _.each(colls, function(coll) {
        var doneLoading = $.Deferred();
        deferred.push(doneLoading);
        var targetUrl = '../main/text/' + coll + '/' + vaggaFileId;

        textDivs[coll] = $('<div/>').load(targetUrl, '', function(response, status, xhr) {
            if (status == 'error') {
                setLoadingError(xhr, targetUrl);
                doneLoading.reject(xhr.status);
            } else {
                doneLoading.resolve();
            }
        });
    });
    $.when.apply($, deferred).done(function () {
        showTextArea();
        var tbody = $('#text-view-tbody').empty();
        loadTextToTable(textDivs, tbody);
        if (textDivs['sinh-aps']) {
            // set the coll to hide if user explicitly did so or if screen size too small
            if (!userCloseColl) userCloseColl = 'pali-cs';
            tbody.find('td[coll='+userCloseColl+']').addClass('user-closed-coll');
        } else {
            userCloseColl = '';
        }
        hideAllSubheads(tbody); // hide all subheads

        var topTr = tbody.children().first();
        if (nodeId) { //open/highlight node/para
            topTr = tbody.find('tr[node-id='+nodeId+']').show();
            topTr.find('span.subhead').removeClass('sc_collapsed');
            if (paraId) {
                topTr = tbody.find('tr[para='+paraId+']').addClass('highlight-para');
            }
        }
        setScrollTop(topTr);
        setMetaTags(tbody, nodeId || (vaggaId + '0'));
        
        // clicking on tree when it is overlapping with the text should hide it
        if (origin == 'tree' && $('.pitaka-tree-container').css('position') == 'absolute') {
            $('.pitaka-tree-container').animate({width: 'hide'}, 250);
        }
    });
}

// set the document title and the other opentype properties
// (update) unfortunately the dynamic tags are not picked up by FB
function setMetaTags(tbody, nodeId) {
    if (!nodeId) return;
    var topTr = tbody.find('tr[node-id='+nodeId+']');
    var title = topTr.find('span.chapter,span.title,span.subhead').last().text().replace(/^\d+\./, '').trim();
    document.title = title;
    $('meta[property="og:title"]').attr('content', title);
    $('meta[property="og:description"]').attr('content', pitakaTree.getHierarchy(String(nodeId).substr(0, 4)).join(' > '));
    window.historyInitiated = true; 
    if (!window.historyPopped) { // if navigation based on history pop, do not put in history again
        history.pushState([nodeId], title, '?n=' + nodeId); 
        console.log('putting node to history '+ nodeId);
    }
    window.historyPopped = false;
}

// topElem should be an item in the table
function setScrollTop(topElem) {
    $('#text-view-area').scrollTop($('#text-view-area').scrollTop() + topElem.position().top);
}

function hideAllSubheads(tbody) {
    var nodeIds = _.uniq(_.map(tbody.find('span.subhead').parents('tr'), function(tr) {return $(tr).attr('node-id');}));
    _.each(nodeIds, function(id) {
        tbody.find('tr.textbody[node-id='+ id +']').hide();
    });
    tbody.find('span.subhead').addClass('sc_collapsed');
}

function setLoadingError(xhr, targetUrl) {
    var msg = "සූත්‍ර දේශනාව ලබා ගැනීමේදී දෝෂයක් සිදුවූ බව කණගාටුවෙන් දැනුම් දෙමු . : ";
    alert( msg + xhr.status + " " + xhr.statusText + ". Url: " + targetUrl);
}

var trSpanSelector = 'div>span:not(.note):not(.bold)'; // spans that should go in the table rows 
//bug - this skips the 'ending' since they are direct divs without spans
function loadTextToTable(textDivs, tbody) {
    var paliSpans = textDivs['pali-cs'].find(trSpanSelector);
    var sinhSpans = textDivs['sinh-aps'] ? textDivs['sinh-aps'].find(trSpanSelector) : null;

    for (var i = 0; i < paliSpans.length; i++) {
        var div = $(paliSpans[i]).parent();
        var paliTd = getTableTd(paliSpans[i], 'pali-cs');
        var tr = $('<tr/>').append(paliTd);
        var nodeId = div.attr('node-id');
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

    $('span.chapter, span.title, span.subhead').each(function(_1) { // add star icons
        var nodeId = $(this).parents('tr').attr('node-id');
        $(this).after(createStarIcon(nodeId));
    });
    var shareIcon = $('<i/>').addClass('fa fa-share share-icon');
    $('span.chapter, span.title, span.subhead, span.paranum').after(shareIcon);
}
function getTableTd(span, coll) {
    var div = $(span).parent(), td = $('<td/>').attr('coll', coll);
    if (div.hasClass('paragraph')) {
        td.append(div.children());
    } else {
        td.append(span);
    }
    return td;
}

} (jQuery));