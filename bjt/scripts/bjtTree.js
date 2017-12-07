/**
 * Created by Janaka on 2016-10-18.
 */

var childIndex = [];
var topParents = [];

// use the entries in searchIndex to populate the tree
function populateTree() {
    $.each(searchIndex, function (i, entry) {
        var parent = entry[SF.parent];
        if (parent != -1) {
            if (typeof childIndex[parent] === 'undefined') {
                childIndex[parent] = [];
            }
            childIndex[parent].push(i);
        } else { // top parents
            topParents.push(i);
        }
    });

    // find the topParents (3 of them) and add them to the tree - topParents are hardcoded
    console.log(topParents);
    if (topParents.length != 3) {
        console.error('There should be 3 top parents. Only ' + topParents.length + ' found.');
    }

    $.each(topParents, function (_1, parent) {
        $('#three-pitaka-ul').append(getBJTTreeItem(parent));
        $.merge(curSearchBooks, childIndex[parent]);
    });
}

function getBJTParents(ind) {
    var parents = [], parent = -1;
    while ((parent = (searchIndex[ind][SF.parent])) != -1) {
        parents.push(ind = parent);
    }
    return parents;
}

function getBJTTreeItem(ind) {
    var li = $('<li/>').attr('search-id', ind).append($('<a/>').text(searchIndex[ind][SF.name]));
    if (typeof childIndex[ind] !== 'undefined') { // parent
        li.addClass('parent');
    }
    return li;
}

// populate on-demand when a parent branch is clicked, due to perf issues on ie when adding all child nodes at once
function populateTreeBranch(li) {
    if (li.children('ul').length == 0) { // check if already populated
        var searchId = li.attr('search-id');
        var ul = $('<ul/>');
        // create new empty child li elements with search-id and text
        $.each(childIndex[searchId], function (_1, i) {
            ul.append(getBJTTreeItem(i));
        });
        li.append(ul);
    }
    pitakaTree.toggleBranch(li);
}