var optGroupValues = [];

function updateSelectedBooks() {
    curSearchBooks = optGroupValues;
    updateFilterStatusDisplay();
    console.log('curSearchBooks = ' + curSearchBooks);
    closeDialog();

    //Have to clean the search cache and rerun the search
    searchCache = []; // clear the cache
    searchDataSet();
    sortSearchResults();
    displaySearchResults();
}
function createOptGroup(searchId, nameField) {
    return $('<optgroup/>').attr('search-id', searchId).attr('label', searchIndex[searchId][nameField]);
}
function createChildOptions(optElem, childIds, nameField) {
    $.each(childIds, function (_1, childId) {
        var child = $('<option/>').attr('value', childId).text(searchIndex[childId][nameField]);
        optElem.append(child);
    });
}
var dialogBookSelectHtml = '\
    <div style="width: 500px">\
    <div id="dlg-get-link">\
    <div class="title"><i class="fa fa-book fa-lg" style="color: #5423DB"></i> සෙවීම සීමා කරන්න</div>\
    <p>මෙම තෝරන ලද පොත් වලට පමණක් සෙවීම සීමා වේ. Use this to filter the search results by books.</p>\
    <select id="optgroup" multiple="multiple" class="books-select"></select>\
    <p>පොතක් තේරීමට හෝ තෝරාගන්නා ලද පොතක් ඉවත් කිරීමට ඒ මත click කරන්න.</p>\
    </div>\
    <div style="text-align: center">\
    <a href="#" class="button update-button" onclick="updateSelectedBooks()"><i class="fa fa-check fa-fw"></i>Save</a>\
    <a href="#" class="button close-button" onclick="closeDialog()"><i class="fa fa-times fa-fw"></i>Cancel</a>\
    </div>\
    </div>';

function showBookSelectDialog(nameField) {
    // show the dialog
    $('#dialog-message').html(dialogBookSelectHtml);
    repositionDialog();
    $('#dialog-overlay').fadeIn('fast');
    $('#dialog-box').slideDown('fast');

    // populate entries
    $.each(topParents, function (_1, parent) {
        var og = createOptGroup(parent, nameField);
        createChildOptions(og, childIndex[parent], nameField);
        $('#optgroup').append(og);
    });

    optGroupValues = curSearchBooks;
    $('#optgroup').multiSelect({ selectableOptgroup: true,
        selectableHeader: "<div class='select-header'>ඉතිරි පොත්</div>",
        selectionHeader: "<div class='select-header'>තෝරන ලද පොත්</div>",
        afterSelect: function(values) {
            optGroupValues = _.union(optGroupValues, _.map(values, Number));
            console.log(values);
        },
        afterDeselect: function(values) {
            optGroupValues = _.difference(optGroupValues, _.map(values, Number));
        }
    });
    $('#optgroup').multiSelect('select', _.map(optGroupValues, String));
}