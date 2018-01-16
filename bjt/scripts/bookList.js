/**
 * Created by Janaka on 2016-10-09.
 */

var defaultImgPrefix = 'page_';

var COLL = {
    PALI: 'pali',
    SINH: 'sinh'
};

var curBookId = 0;
var curBook = {};

function createPagePair(pageId) {
    var pair = $('<div/>').addClass('page-pair').attr('page-id', pageId);
    return pair.append($('<hr/>'), createPage(pageId, COLL.PALI), createPage(pageId + 1, COLL.SINH));
}

function createPage(pageId, coll) {
    var page = $('<div/>').addClass('page half').attr('page-id', pageId).attr('coll', coll);
    var img = $('<img/>').attr('src', getPageImageSrc(pageId));
    var linkSpan = $('<span/>').addClass('page-link').append($('<i class="fa fa-link fa-fw"/>'));
    return page.append(img).append(linkSpan);
}

function getPageImageSrc(pageId) {
    return 'books/' +
        getDef(curBook, 'folder', curBookId) + '/' +
        getDef(curBook, 'imagePrefix', defaultImgPrefix) +
        padZeros(pageId, 3) +
        '.png';
}

// formatting number by adding zeros
function padZeros (str, max) {
    str = str.toString();
    return str.length < max ? padZeros("0" + str, max) : str;
}

function getDef(obj, key, def) {
    return (key in obj) ? obj[key] : def;
}

function loadPrevPage(visibleIds) {
    var minId = Math.min.apply(null, visibleIds);
    var prevId = minId - 2;
    if (prevId < 0) {
        return false;
    }
    $('#image-area').prepend(createPagePair(prevId));
    return prevId;
}

function loadNextPage(visibleIds) {
    var maxId = Math.max.apply(null, visibleIds);
    var nextId = maxId + 2;
    if (nextId > curBook.maxPageId) {
        return false;
    }
    $('#image-area').append(createPagePair(nextId));
    return nextId;
}

function navigateToPage(searchId, origin) {
    var entry = searchIndex[searchId];
    // set the current book
    curBookId = entry[SF.book];
    curBook = books[curBookId];
    // google analaytics - send node view
    ga('send', {
        hitType: 'event',
        eventCategory: origin,
        eventAction: 'view_node',
        eventLabel: entry[SF.name],
        eventValue: searchId,
        bookId: curBookId,
        pageNum: entry[SF.page]
    });

    $('#image-area').children('.page-pair').remove();
    $('#image-area').append(createPagePair(curBook.pageNumOffset + entry[SF.page]));
    $('#search-area').hide();
    $('#image-area').show();
    $('#image-area').scrollTop(0);
    handleScroll();
}

function getVisiblePages() {
    var visibleHeight = $('#image-area').height();
    var visibleIds = Array();
    $('.page-pair').each(function (i) {
        console.log($(this).attr('page-id'));
        var elTop = $(this).offset().top;
        var elBottom = elTop + $(this).outerHeight();
        if (Math.max(elTop, elBottom) < 0 || Math.min(elTop, elBottom) > visibleHeight) {
            return true;
        }
        visibleIds.push(parseInt($(this).attr('page-id')));
        console.log(visibleHeight, elTop, elBottom);
    });
    console.log(visibleIds);
    return visibleIds;
}

// remove all pages that are not vivible and are far from the newpage
function deleteNonVisible(visiblePageIds, newPageId) {
    $('.page-pair').each(function (i) {
        var pageId = parseInt($(this).attr('page-id'));
        if (!(pageId in visiblePageIds) && Math.abs(pageId - newPageId) > 7) {
            $(this).remove();
        }
    });
}

function prevButtonClick() {
    // load prev page and remove bottom page
    var visibleIds = getVisiblePages();
    //$('#image-area').scrollTop(getPageHeight(visibleIds[0]));
    if (newPageId = loadPrevPage(visibleIds)) {
        deleteNonVisible(visibleIds, newPageId);
        console.log("loaded prev page " + newPageId);
        handleScroll();
    }
}

function nextButtonClick() {
    // load next page and remove top page
    var visibleIds = getVisiblePages();
    if (newPageId = loadNextPage(visibleIds)) {
        deleteNonVisible(visibleIds, newPageId);
        console.log("loaded next page " + newPageId);
        handleScroll();
    }
}

function handleScroll() {
    $('#prev-page-button').hide();
    $('#next-page-button').hide();
    if ($('.page-pair').length) { // only if there are images in the window
        if ($(this).scrollTop() == 0) {
            $('#prev-page-button').css('top', 0).show();
        } else if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight - 5 ||
            $(this)[0].scrollHeight <= $(this).innerHeight() - 5) {

            $('#next-page-button').css('top', $('#image-area')[0].scrollHeight - $('#next-page-button').outerHeight()).show();
            console.log($(this)[0].scrollHeight, $(this).innerHeight());
        }
    }
    // position the tree to the top
    //$('#tree-window').css('top', $('#image-area').scrollTop());
}

function getPageHeight(pageId) {
    return $('.page-pair[page-id="' + pageId + '"]').outerHeight();
}