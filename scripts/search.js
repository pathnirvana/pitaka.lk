/**
 * Created by janaka_2 on 13/1/2015.
 */

// search index fields
var SL = {
    id: 0,
    paliName: 1,
    sinhName: 2,
    type: 3,
    parents: 4
};

var searchIndexUrl = 'text/sutta-list.json';

var searchIndex = [];
var searchPrevQuery = "";
var searchCache = [];
var currentSearch = {}; // all results matching query
var currentSort = {by: 'name', order: 1}; // ascending by name

var resultSettings = {
    minQueryLength: 2,
    maxSinglishLength: 10,
    maxResults: 100,  // search stopped after getting this many matches
    fullSearchBooksLength: 5
};

// used inside select books dialog - hardcoded for now since only sutta pitaka
var childIndex = [[], [3,4,5,6,7]];
var topParents = [1];
var curSearchBooks = childIndex[1];

function initSearchBar() {
    // prefetch the sutta list
    $.getJSON(searchIndexUrl).done(function(data) {
        searchIndex = data;
        console.log('search index loaded with length ' + _.size(searchIndex));
        $('.search-bar').on('keyup compositionend', function(e) {
            performSearch(e);
        }).focus(); // give focus to the search bar on page load
    });

    updateFilterStatusDisplay();

    // clicking on a result brings its pali word to the search bar
    $('#search-results').on('click', '.result-sutta-name,.result-parent-name', function() {
        $('.search-bar').val($(this).text());
        pitakaLkOpenLocation(createLocationObj($(this).attr('index'), [], 0), 'search');
    });
}

function updateFilterStatusDisplay() {
    if (curSearchBooks.length < resultSettings.fullSearchBooksLength) {
        $('#search-filter-status').html("සෙවුම පොත් " + curSearchBooks.length + " කට සීමා වී ඇත. වෙනස් කිරීමට <i class='fa fa-wrench fa-fw'></i> මත click කරන්න.");
    } else {
        $('#search-filter-status').text('');
    }
}

function performSearch(e) {
    e.stopPropagation();

    $('#main-tabs').pitakaTabsShowTab(1); //show the search tab

    var query = $('.search-bar').val().toLowerCase();
    if (query == searchPrevQuery) {
        return;
    }

    var table = $('#search-results'), statusDiv = $('#search-status');
    table.hide().find('.result').remove();
    searchPrevQuery = query;
    if (query.length < resultSettings.minQueryLength) {
        statusDiv.text("අඩුම තරමේ අකුරු " + resultSettings.minQueryLength + " ක් වත් ඇතුළු කරන්න.");
        return;
    }
    console.log(query);

    // query could be in roman script
    if (isSinglishQuery(query) && query.length > resultSettings.maxSinglishLength) {
        statusDiv.text("සිංග්ලිෂ් වලින් සෙවීමේ දී උපරිමය අකුරු " + resultSettings.maxSinglishLength + " කට සීමා කර ඇත.");
        return;
    }

    currentSearch = {query: query};
    searchDataSet();
    // sort and display
    sortSearchResults();
    displaySearchResults(); // display the results
}

function displaySearchResults() {
    var table = $('#search-results'), statusDiv = $('#search-status');
    table.hide().find('.result').remove();

    var entries = currentSearch.results;
    if (!entries.length) {
        statusDiv.text("“" + currentSearch.query + "” යන සෙවුම සඳහා ගැළපෙන වචන කිසිවක් හමුවුයේ නැත. වෙනත් සෙවුමක් උත්සාහ කර බලන්න.");
        return;
    }
    // add results
    $.each(entries, function (_1, entry) {
        var tr = $('<tr/>').attr('index', entry.index).addClass('result');
        tr.append(getBookNameDisplay(entry.nikaya, 'result-nikaya-name'));
        tr.append($('<td/>').append(getSuttaNameDisplay(entry.index, entry.name, 'result-sutta-name')));
        tr.append(getBookNameDisplay(entry.book, 'result-book-name'));
        tr.append(getParentsDisplay(entry));
        tr.appendTo(table);
    });
    table.slideDown('fast');
    if (entries.length < resultSettings.maxResults) {
        statusDiv.text("“" + currentSearch.query + "” යන සෙවුම සඳහා ගැළපෙන වචන " + entries.length + " ක් හමුවුනා.");
    } else {
        statusDiv.text("ඔබගේ සෙවුම සඳහා ගැළපෙන වචන " + entries.length + " කට වඩා හමුවුනා. එයින් මුල් වචන " + resultSettings.maxResults + " පහත දැක්වේ.");
    }
}

function getSuttaNameDisplay(ind, name, cssClass) {
    return $('<span/>').text(name).addClass(cssClass).attr('index', ind);
}
function getParentsDisplay(entry) {
    var td = $('<td/>').addClass('result-parents');
    $.each(entry.parents, function (_1, ind) {
        var name = searchIndex[ind][SL.paliName];  // use the pali name in parents display
        td.prepend(getSuttaNameDisplay(ind, name, 'result-parent-name')).prepend($('<span/>').text(' » '));
    });
    td.children().first().remove(); // remove the last »
    return td;
}
function getBookNameDisplay(ind, cssClass) {
    var paliName = searchIndex[ind][SL.paliName]; // no sinhala name for these
    return $('<td/>').text(ind + '. ' + paliName).addClass(cssClass);
}

// check if the entry belongs in the currently selected search books list
function inCurrentSearchBooks(parents) {
    return curSearchBooks.length == resultSettings.fullSearchBooksLength ||
        !_.isEmpty(_.intersection(parents, curSearchBooks));
}

function regExNameSearch(info, queryReg) {
    if (info[SL.id] < 10) return -1; // do not search pitaka and nikaya
    if (info[SL.paliName].search(queryReg) != -1)
        return SL.paliName;
    else if (info[SL.sinhName] && info[SL.sinhName].search(queryReg) != -1)
        return SL.sinhName;
    return -1;
}

function searchDataSet() {
    var query = currentSearch.query;
    var results = [];

    //Check if we've searched for this term before
    if (query in searchCache) {
        results = searchCache[query];
        console.log('Results for query ' + query + ' found in cache of length ' + results.length);
    } else {
        // Search all singlish_combinations of translations from roman to sinhala
        var words = isSinglishQuery(query) ? getPossibleMatches(query) : [query];
        // TODO: improve this code to ignore na na la la sha sha variations at the comparison
        var queryReg = new RegExp(words.join('|'), "i"), match = -1;
        $.each(searchIndex, function (i, info) {
            if ((match = regExNameSearch(info, queryReg)) != -1 && inCurrentSearchBooks(info[SL.parents])) {
                results.push([i, match]);
                if (results.length == resultSettings.maxResults) {
                    return false;
                }
            }
        });

        console.log("Search in index found " + results.length + " hits");
        //Add results to cache
        searchCache[query] = results;
    }

    // extract text for each index and sort based on pali text
    // output an array of {index: xx, name: pali_name, parents: list of parents}
    results = _.uniq(results); // dedup indexes
    // extract entries
    results = _.map(results, function(m) {
        var info = searchIndex[m[0]];
        return {
            index: m[0],
            name: info[m[1]],
            nikaya: info[SL.parents][1], // nikaya - 2nd parent
            book: info[SL.parents][2] || m[0], // vagga - 3rd parent (could be undefined if has only 2 parents)
            parents: info[SL.parents].slice(3).sort(function (a, b) { return b - a; })
        };
    });
    currentSearch.results = results;
}

// sort entries by currentSort
function sortSearchResults() {
    currentSearch.results.sort(function (e1, e2) {
        if (e1[currentSort.by] < e2[currentSort.by])
            return -1 * currentSort.order;
        if (e1[currentSort.by] > e2[currentSort.by])
            return 1 * currentSort.order;
        return 0;
    });
}

function refreshCurrentSearchDisplay(by, order) {
    currentSort = {by: by, order: order == 'asc' ? 1 : -1};
    sortSearchResults();
    displaySearchResults();
}