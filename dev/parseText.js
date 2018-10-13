/**
 * Created by janaka_2 on 4/12/2014.
 */

function createTextGroup(rootNode, groupClause, contentType, nodeId, hasUdana) {
    var groupRule = '[rend="' + groupClause + '"]';
    var nextUntilRule = groupRule + ', ' + groupClause + '-ending'; // e.g. also stop at <subhead-ending/>

    $(rootNode).children(groupRule).each(function (i) {
        $(this).nextUntil(nextUntilRule).wrapAll("<div class='" + groupClause + "-contents'/>");
        var div = $('<div/>').addClass(groupClause).addClass(contentType).attr('node-id', nodeId.getIdInc());
        $(this).next().add(this).wrapAll(div);
        $(this).replaceWith(function () {
            return $("<span/>").append($(this).contents()).addClass(groupClause).addClass(contentType);
        });
    });

    $('div.' + groupClause + '-contents', rootNode).after(function() {
        if (hasUdana) { // move anything after the last 'centre' element (endings + udana) out of the content div
            var lastCentre = $(this).children('[rend="centre"]').last();
            if (lastCentre.nextAll().length) {
                lastCentre.after('<p rend="hangnum" n="udana"></p>');
            }
            return lastCentre.nextAll().add(lastCentre).addToAttr('rend', contentType);
        } else {
            if ($(this).children().last().is('[rend="centre"]')) { // move just the last centre if any
                return $(this).children().last().addToAttr('rend', contentType);
            }
        }
    });
}

(function ( $ ) {
    $.fn.addToAttr = function (attrName, value) {
        return this.each(function() {
            $(this).attr(attrName, $(this).attr(attrName) + ' ' + value);
        });
    };
}( jQuery ));

var NodeId = function(vaggaId) {
    this.vagga = vaggaId;
    this.part = 0;
};

NodeId.prototype.getIdInc = function () { // increment after getting the current value
    return "" + this.vagga + (this.part++);
};

function createTextGroupInside(xmlDoc, groupClause, contentType, parentDivClasses, nodeId, hasUdana) {
    $.each(parentDivClasses, function(_1, pDivClass) {
        $('div.' + pDivClass, xmlDoc).each(function (i) {
            createTextGroup(this, groupClause, contentType, nodeId, hasUdana);
        });
    });
}

function processMiscTextNodes(xmlDoc) {
    // process the first namothassa line (if any)
    $('body', xmlDoc).children().first().filter('[rend="centre"]').attr('rend', 'namothassa');

    // nikaya and book (if present) - simply wrap with a div/span
    $('p[rend="nikaya"]', xmlDoc).wrap('<div class="nikaya ct_nikaya"/>').replaceWith(function () {
        return $('<span class="nikaya ct_nikaya"/>').append($(this).contents());
    });
    $('p[rend="book"]', xmlDoc).wrap('<div class="book ct_book"/>').replaceWith(function () {
        return $('<span class="book ct_book"/>').append($(this).contents());
    });

    // notes
    $("note", xmlDoc).replaceWith(function () {
        return $('<span class="note" />').append("(" + $(this).html() + ")");
    });
    // bold
    $('hi[rend="bold"]', xmlDoc).replaceWith(function () {
        return $('<span class="bold" />').append($(this).html());
    });

    // paragraphs
    $('p[rend^="bodytext"][n], p[rend^="hangnum"][n]', xmlDoc).each(function (i) {
        var paranum = $(this).attr('n');
        var paraDiv = $('<div />').addClass('paragraph').attr('para', paranum);
        $(this).nextUntil('p[rend^="bodytext"][n], p[rend^="hangnum"][n], p[rend^="centre"], p[rend^="subsubhead"], div.subhead, div.title, div.chapter').add(this).wrapAll(paraDiv);
    });
    $('.paragraph[para="udana"]', xmlDoc).addClass('udana'); // alternatively styles can be applied directly based on the attr value

    // hi paranum => span with rend as class
    $('hi[rend=paranum]', xmlDoc).replaceWith(function() {
        return $('<span/>').addClass($(this).attr('rend')).append($(this).contents());
    });
    $('hi[rend=dot]', xmlDoc).remove(); // remove dot

    // gathax, bodytext, centre etc replace all rend attr with divs
    $('p[rend]', xmlDoc).replaceWith(function () {
        var rendName = $(this).attr("rend");
        return $('<div class="' + rendName + '" />').append($(this).contents());
    });
    $('.gatha1, .gatha2, .gatha3', xmlDoc).removeClass('gatha1 gatha2 gatha3').addClass('gatha'); // rename gathaX->gatha
    $('.centre', xmlDoc).addClass('ending'); // add ending class to all centre

    // move paranum out of the bodytext/hangnum (but inside paragraph)
    var paraDiv = $('.paragraph .bodytext, .paragraph .hangnum', xmlDoc).before(function () {
        return $(this).children('.paranum');
    });
}

function isEmptyElement( el ){
    return !$.trim(el.html())
}

function checkTextErrors(xmlDoc, filename, sourceUrl) {
    var error = '';
    // check empty and remove the hangnum
    $('.hangnum', xmlDoc).each(function() {
        if (!isEmptyElement($(this))) {
            error = 'hangnum element with non-empty contents [' + $(this).html() + ']';
            return false;
        }
        $(this).remove();
    });

    // check chapter > title > subhead > subsubhead or paragraph
    if ($('.paragraph .subsubhead, .paragraph .subhead', xmlDoc).length) {
        error = "subsubhead or subhead found inside paragraphs";
    } else if ($('.subhead .title, .subhead .chapter', xmlDoc).length) {
        error = "title or chapter found inside subhead";
    } else if ($('.paragraph .ending, .paragraph .udana', xmlDoc).length) {
        $('.paragraph .ending, .paragraph .udana', xmlDoc).each(function(){console.log($(this).text());});
        error = "ending or udana found inside paragraph"
    } else if ($('span.dot', xmlDoc).length) {
        error = "span.dot found - should be all removed";
    } else if ($('.subsubhead:not(.outside)', xmlDoc).parent(':not(.subhead-contents)').length) {
        error = "subsubhead found outside subhead-contents";
    } else if ($('.subhead-contents .udana', xmlDoc).length) {
        error = "udana found inside subhead-contents";
    } else if ($('p, hi', xmlDoc).length) {
        error = "unprocessed P or HI found";
    } else if ($(':not(.paragraph).udana', xmlDoc).length) {
        error = "an udana found that is not a paragraph";
    }
    var elems = $(':not(.paragraph) > .bodytext, :not(.paragraph) > .gatha', xmlDoc);
    if (!error && elems.length) {
        error = "bodytext or gatha found outside paragraph";
        elems.each(function(){console.log($(this).text());});
    }
    // check allowed content inside paragraphs
    var badParaChild = $('.paragraph', xmlDoc).children(':not(.bodytext, .gatha, .gathalast, span)');
    if (!error && badParaChild.length) {
        badParaChild.each(function(){
           console.log($(this).attr('class'));
        });
        error = "paragraph has something other than bodytext, gatha or gathalast";
    }
    // check for consecutive paragraph numbers and span.paragraph text
    var paragraphs = $('.paragraph[para!=""][para!="udana"]', xmlDoc);
    if (!error && paragraphs.length) {
        var expectedParaNum = paragraphs.first().attr('para').split('-')[0];
        paragraphs.each(function () {
            if ($(this).attr('para') != $(this).children('.paranum').text()) {
                error = "paragraph number not equal to span.paranum text (" + $(this).attr('para') + " and " + $(this).children('.paranum').text() + ")";
                return false;
            }
            var paraPair = $(this).attr('para').split('-');
            if (paraPair[0] != expectedParaNum && paraPair[0] != "1") { // allow restarting with 1
                error = "expected paranum " + expectedParaNum + ", but found paranum " + $(this).attr('para');
                return false;
            }
            expectedParaNum = (+paraPair[paraPair.length - 1]) + 1;
        });
    }

    if (error) {
        console.error(error + ' in file ' + filename + ' source url ' + sourceUrl);
    }
}