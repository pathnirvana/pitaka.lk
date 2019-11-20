/**
 * Created by janaka_2 on 10/12/2014.
 */

var editingPassword = getParameterByName(UrlParamNames.EDITING);
var adminEditing = getParameterByName(UrlParamNames.ADMIN_EDITING); // main fields editable only by admin

var specialEditingFields = ['span.ct_sutta_section', 'div.subsubhead', 'div.ending'];
var adminEditingFields = ['span.ct_nikaya', 'span.ct_book', 'span.chapter', 'span.title', 'span.subhead', 'div.namothassa', 'div.specialcaption'];
if (adminEditing) {
    specialEditingFields = specialEditingFields.concat(adminEditingFields);
}

// callback when the tab columns get updated
function cbTabColumnsUpdated(tabId) {
    var curColumns = getCurrentColumns(tabId);

    // set the collection buttons on the toolbar
    var buttonSet = $('#collection-buttons').empty();
    var availColls = $(tabId).data('avail-colls') || [];
    $.each(availColls, function (i, coll) {
        if ($.inArray(coll, curColumns) == -1) { // add only if the collection not already in the columns
            var btnText = '<i class="fa fa-book fa-lg"></i> ' + CollectionsList[coll].medium;
            var button = $('<a>').html(btnText).attr('collection', coll).addClass('button btn-coll-' + getCollectionLanguage(coll));
            button.click(function () {
                $('#main-tabs').pitakaTabsSetColumn(tabId, $(this).attr('collection'));
            });
            buttonSet.append(button);
        }
    });

    if (!editingPassword) { // do not show edit buttons
        return;
    }
    // set the edit/save/cancel button
    $('#edit-buttons .button').hide().off('click'); // needed in case two tabs edited at the same time
    var editingColumn = $(tabId).data('editing-column');
    if (editingColumn && $.inArray(editingColumn, curColumns) != -1) { // show save/cancel buttons when switching from another tab
        enterTextEditingMode(tabId, editingColumn)
    } else {
        exitTextEditingMode(tabId); // show edit button
    }
}

// hide edit button and show save/cancel buttons
function enterTextEditingMode(tabId, column) {
    $(tabId).data('editing-column', column);
    $('#edit-button').hide().off('click');
    $('#edit-save-button').show().on('click', function (e) {
        saveEditedText(tabId, column); // try to save
    });
    $('#edit-cancel-button').show().on('click', function (e) {
        $(tabId).removeData('editing-column');
        $('#main-tabs').pitakaTabsSetColumn(tabId, column);
    });
}
// hide save/cancel buttons and show edit if necessary
function exitTextEditingMode(tabId) {
    $(tabId).removeData('editing-column');
    $('#edit-save-button, #edit-cancel-button').hide().off('click');
    var curColumns = getCurrentColumns(tabId);
    $.each(curColumns, function (i, column) {
        if (getCollectionLanguage(column) == 'sinh') {
            $('#edit-button').show().on('click', function (e) {
                enterTextEditingInterface(tabId, column);
                enterTextEditingMode(tabId, column);
            });
            return false; //break loop
        }
    });
}

function saveEditedText(tabId, column) {
    if (errorCheckEditedFields(tabId, column)) {
        return false; // in case error back to editing
    }

    exitTextEditingInterface(tabId, column);
    exitTextEditingMode(tabId);

    // try to save the contents
    var filename = 'text/' + column + '/' + $(tabId).data('target-id');
    var output = prepareXmlOutput(getTextDiv(tabId, column));
    output = prepareXmlTextSave(output);
    BusyTab.add('saving', tabId);
    saveXmlDoc(filename, output, editingPassword).fail(function() {
        enterTextEditingInterface(tabId, column); // case of error back to the editing interface
        enterTextEditingMode(tabId, column);
    }).done(function() {
        $(tabId).removeData('editing-column');
        $('#main-tabs').pitakaTabsSetColumn(tabId, column); // load the saved version
    }).always(function() {
        BusyTab.remove('saving', tabId);
    });
}

function errorCheckEditedFields(tabId, column) {
    var error = false;
    $('.subhead-contents > textarea, .chapter-contents > textarea', getTextDiv(tabId, column)).each(function(y) {
        var paraNumList = $(this).data('para-list').split(',');
        var fullText = $(this).val().split('#');
        if (fullText.length != paraNumList.length) {
            var secTitle = $(this).parent().siblings('span').text() || $(this).parent().siblings('span').children('input').val();
            alert('Make sure that there are exactly ' + paraNumList.length + ' paragraphs in ' + secTitle + ' section. Currently it has ' + fullText.length + ' paragraphs.');
            error = true;
            return false; // can return since no changes are done
        }
    });
    return error;
}

function getTextDiv(tabId, column) {
    return $('.text-section[collection="' + column + '"]', $(tabId));
}

// replace editable content with textareas and textinputs
function enterTextEditingInterface(tabId, column) {
    var textDiv = getTextDiv(tabId, column);

    $(specialEditingFields.join(','), textDiv).html(function() {
        return $('<input type="text" />').val($(this).text()).addClass('edit-textinput');
    });

    // set of consecutive paras get one textarea
    $('.subhead-contents, .chapter-contents', textDiv).each(function() {
        $(this).children('.paragraph').each(function() {
            var paraSet = $(this).nextUntil(':not(.paragraph)').add(this);
            if (paraSet.length >= 3) { // at least 3 paras. otherwise individual textareas
                $(this).before(createTextAreaForParagraphs(paraSet));
                paraSet.remove();
            }
        });
        if ($(this).children().length > 1) { // prevent textarea from covering other elements
            $(this).children('textarea').css({height: 'auto'});
        }

        /*if (!$(this).children(':not(.paragraph)').length) { // if all children are paragraphs
            var paraSet = $(this).children('.paragraph');
            $(this).append(createTextAreaForParagraphs(paraSet));
            paraSet.remove();
        }*/
    });
    // each para gets own textarea
    $('.paragraph', textDiv).append(function() {
        return createTextAreaForParagraphs($(this));
    });
    $(window).resize();
}

// replace textareas and textinputs with divs/spans
function exitTextEditingInterface(tabId, column) {
    var textDiv = getTextDiv(tabId, column);

    // each para has own textarea
    $('.paragraph', textDiv).each(function(y) {
        createTextDivsFromTextarea($(this), $(this).children('textarea').val());
        $(this).children('textarea').remove();
    });

    // set of para has one textarea
    $('.subhead-contents > textarea, .chapter-contents > textarea', textDiv).each(function(y) {
        var paraNumList = $(this).data('para-list').split(',');
        var fullText = $(this).val().split('#');
        var textarea = $(this);
        $.each(fullText, function(i, paraText) {
            var paraNum = paraNumList[i];
            var paranumSpan = $('<span/>').addClass('paranum').text(paraNum); // todo not needed if paraNum is empty
            var paraDiv = $('<div/>').addClass('paragraph').attr('para', paraNum).prepend(paranumSpan);
            createTextDivsFromTextarea(paraDiv, paraText);
            textarea.before(paraDiv);
        });
        textarea.remove();
    });

    $(specialEditingFields.join(','), textDiv).html(function() {
        return $(this).children().val();
    });
}

function createTextAreaForParagraphs(paraSet) {
    var fullText = [], paraNumList = [];
    paraSet.each(function (x) {
        var paraText = [];
        $(this).children('div').each(function (x) {
            paraText.push($(this).text().trim()); // todo add space for gatha and other formatting
        });
        $(this).children('div').remove(); // remove divs after extracting text
        fullText.push(paraText.join('\n'));
        paraNumList.push($(this).attr('para'));
    });
    return $('<textarea />').val(fullText.join('\n\n#')).addClass('edit-textarea').data('para-list', paraNumList.join(','));
}

function createTextDivsFromTextarea(paraDiv, paraText) {
    $.each(paraText.trim().split('\n'), function(x, divText) {
        if (divText.length) {
            var divClass = 'bodytext'; // todo add other formatting types
            paraDiv.append($('<div/>').addClass(divClass).text(divText));
        }
    });
}

function loadCollectionsForTargetId(targetId) {
    // for a given target(vagga) load the index file and get the collections attr
}


