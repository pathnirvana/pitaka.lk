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
    return pair.append(createPage(pageId, COLL.PALI), createPage(pageId + 1, COLL.SINH));
}

function createPage(pageId, coll) {
    var page = $('<div/>').addClass('page half').attr('page-id', pageId).addClass(coll);
    var img = $('<img/>').attr('src', getPageImageSrc(pageId));
    var linkSpan = $('<span/>').addClass('page-link').append($('<i class="fa fa-share"/>'));
    var pageNav = (coll == COLL.PALI) ? 
        $('<a class="page-navigation right"><i class="fa fa-angle-right"></i> සිංහල පිටුවට <i class="fa fa-angle-right"></i></a>') : 
        $('<a class="page-navigation left"><i class="fa fa-angle-left"></i> පාලි පිටුවට <i class="fa fa-angle-left"></i></a>');
    return page.append(img).append(linkSpan).append(pageNav);
}

var imgURLPrefix = 'newbooks'; // default for loading in the website
var isAndroid = getParameterByName('is_android', 0); // if in the android webview app
var imageFileExt = getParameterByName('image_extension', 'jpg'); // if old books, change this to png
var loadFromRemote = getParameterByName('load_books_remote', 0);
var booksFolder = getParameterByName('books_folder', '');

if (isAndroid) {
    if (loadFromRemote > 0) {
        imgURLPrefix = 'https://pitaka.lk/bjt/newbooks'; // full path for android app without pages
    } else {
        imgURLPrefix = booksFolder; // could be bjt_books or bjt_newbooks in either internal or sdcard storage
    }
}
console.log("Loading images from: " + imgURLPrefix);

function getPageImageSrc(pageId) {
    return imgURLPrefix + '/' +
        getDef(curBook, 'folder', curBookId) + '/' +
        getDef(curBook, 'imagePrefix', defaultImgPrefix) +
        padZeros(pageId, 3) +
        '.' + imageFileExt;
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

function navigateToIndex(searchId, origin) {
    var entry = searchIndex[searchId];
    navigateToLocation(entry[SF.book], entry[SF.page], entry[SF.name], origin);
    if (origin == 'tree') { // hide the tree
        $('#tree-window').hide();
    }
}

function navigateToLocation(bookId, pageId, name, origin) {
    // set the current book
    curBookId = bookId;
    curBook = bjtBooksInfo[curBookId];
    // google analaytics - send node view
    ga('send', {
        hitType: 'event',
        eventCategory: origin,
        eventAction: 'view_node',
        eventLabel: name,
        eventValue: curBookId,
        pageNum: pageId
    });

    $('#image-area').children('.page-pair').remove();
    $('#image-area').append(createPagePair(curBook.pageNumOffset + pageId));
    showTextArea();
    $('#image-area').scrollTop(0);
    handleResize();
}

function createBJTLink(bookId, pageId) {
    return 'https://pitaka.lk/bjt?b=' + bookId + '&p=' + (Number(pageId) - curBook.pageNumOffset);
}
function navigateStartupLocation() {
    var bookId = Number(getParameterByName('b', 0)),
        pageId = Number(getParameterByName('p', 0));
    if (bookId && pageId && $.isNumeric(bookId) && $.isNumeric(pageId)) {
        if (pageId % 2 == 0) {
            hideCol = COLL.SINH; // open the pali page
        } else {
            pageId--; // pageId should be even - open sinhala page
        }
        navigateToLocation(bookId, pageId, '', 'startup');
    } else {
        showSearchArea();
    }
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
    if (newPageId = loadPrevPage(visibleIds)) {
        deleteNonVisible(visibleIds, newPageId);
        console.log("loaded prev page " + newPageId);
        handleResize();
    }
}

function nextButtonClick() {
    // load next page and remove top page
    var visibleIds = getVisiblePages();
    if (newPageId = loadNextPage(visibleIds)) {
        deleteNonVisible(visibleIds, newPageId);
        console.log("loaded next page " + newPageId);
        handleResize();
    }
}

var hideCol = COLL.PALI;
var userNumColls = 2; // used only when width > 800

function sideButtonClick() {
    $('div.page').toggle();
    hideCol = hideCol == COLL.PALI ? COLL.SINH : COLL.PALI;
}
function onePageView() {
    $('div.page.' + hideCol).hide();
    $('div.page > .page-navigation').show();
}
function twoPageView() {
    $('div.page').show();
    $('div.page > .page-navigation').hide();   
}
function handleResize() {
    if ($(window).width() < 800) {
        onePageView();
        $('#select-num-columns').hide();
    } else {
        $('#select-num-columns').show();
        (userNumColls == 2) ? twoPageView() : onePageView();
    }
    // to make sure the overlay fills the screen and dialogbox aligned to center
    // only do it if the dialog box is not hidden
    if (!$('#dialog-box').is(':hidden')) repositionDialog();
}

function selectNumColumns(e) {
    if ($('#image-area').is(":hidden")) return;
    userNumColls = (userNumColls == 1) ? 2 : 1; 
    $(this).children().toggle();
    handleResize();
}