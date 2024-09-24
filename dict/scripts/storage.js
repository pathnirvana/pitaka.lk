
// store the data in local browser cache - will be available even after browser restart
function setLocalData(name, version) {
    if (typeof(Storage) == "undefined" || !localStorage) {
        return false;
    }
    var setting = dataSettings[name];
    // compress and put in local storage
    localStorage.setItem('version_' + name, version);
    var uncompressed = JSON.stringify(setting.data);
    var compressed = LZString.compressToUTF16(uncompressed);
    localStorage.setItem(name, compressed);
    console.log("Stored data of length " + compressed.length + " to local storage. Uncompressed length = " + uncompressed.length);
    return true;
}

function getLocalData(name) {
    var dataStr = localStorage.getItem(name);
    if (!dataStr) {
        console.log('no data in storage');
        return false;
    }
    var setting = dataSettings[name];
    setting.data = JSON.parse(LZString.decompressFromUTF16(dataStr));
    console.log("Loaded data of length " + setting.data.length + " from local storage.");
    dataLoadComplete(name);
    return true;
}

function initDataSet(name) {
    if (typeof(Storage) == "undefined" || !localStorage) {
        getUrlData(name, -1);
        return;
    }
    // first load whatever data available in storage
    getLocalData(name);
    // check the version and load from url if necessary
    $.getJSON(versionUrl).done(function(version) {
        if (version[name] != Number(localStorage.getItem('version_' + name))) {
            getUrlData(name, version[name]);
        }
    });
}

// whatever the version given would be marked as the version of the loaded data
function getUrlData(name, version) {
    var setting = dataSettings[name];
    $.getJSON(setting.url).done(function(data) {
        setting.data = []; // empty any existing before adding
        $.each(data, function(nodeId, nodeInfo){
            setting.data.push(nodeInfo);
        });
        dataLoadComplete(name, version);
        setLocalData(name, version); // only called when loaded from url
    }).fail(function(name) {
        $('#search-status').text(setting.desc + ' ශබ්දකෝෂය ලබා ගැනීමට නොහැකි වුනා. ඔබේ අන්තර්ජාල සම්බන්ධතාව පරික්ෂා කරන්න.');
    });
}

var SearchType = {
    PALI: 'p',
    SINH: 's'
};
var versionUrl = 'data/data_version.json';

var resultSettings = {
    minQueryLength: 2,
    maxSinglishLength: 10,
    maxResultsDisplay: 20,
    maxResults: 100  // search stopped after getting this many matches
};

var dataSettings = {
    "buddhadatta": {
        url: 'data/buddhadatta_data.json',
        desc: 'පොල්වත්තේ බුද්ධදත්ත හිමි, පාලි-සිංහල අකාරාදිය',
        entryInd: {
            PAGE: -1, // not exist
            PALI: 0,
            SINH: 1  
        },    
        data: [],
        dataLoaded: false,
        trie: new Trie()
    },
    "sumangala": {
        url: 'data/sumangala_data.json',
        desc: 'මඩිතියවෙල සිරි සුමඞ්ගල හිමි, පාලි-සිංහල ශබ්දකෝෂය',
        entryInd: {
            PALI: 0,
            SINH: 1,
            PAGE: 2,
        },
        data: [],
        dataLoaded: false,
        trie: new Trie()
    }
};
var dataSetsToLoad = ["sumangala", "buddhadatta"];
var searchPrevQuery = "";
var searchCache = {};

function initSearchBar() {
    // start loading the data sets
    $.each(dataSetsToLoad, function(ind, name) {
        var div = $('<div>').html('<i class="fa fa-refresh fa-spin"></i> ' + dataSettings[name].desc + ' ලබා ගනිමින්...').attr('dict', name);
        $('#search-status').append(div);
        initDataSet(name);
        searchCache[name] = {};
    });

    $('.search-bar').focus(); // give focus to the search bar on page load

    // clicking on a result brings its pali word to the search bar
    $('#search-results').on('click', '.result-pali-word', function() {
        $('.search-bar').val($(this).text());
        $('.search-bar').focus();
    });
}

// loaded some data (could be from local or from url)
var eventsRegistered = false;
function dataLoadComplete(name, version) {
    var setting = dataSettings[name];
    setting.dataLoaded = true;
	
	// TODO: Load directly from file than building here.
	{		
		for(var i = 0; i < setting.data.length; i++) {
			var paliWord = setting.data[i][setting.entryInd.PALI];
			setting.trie.add(paliWord, i);
		}
	}

    $('#search-status > [dict="' + name + '"]').text('වචන ' + setting.data.length + ' කින් සමන්විත ' + setting.desc + ' සෙවීමට උඩ කොටුවේ type කරන්න.');
    if (!eventsRegistered) {
        $('.search-bar').on('keyup compositionend', function(e) {
            performSearch(e, SearchType.PALI);
        });
        $('#sinhala-search-button').on('click', function(e) {
            performSearch(e, SearchType.SINH);
        });
        eventsRegistered = true;
    }
}

function performSearch(e, searchType) {
    e.stopPropagation();
    
    if (e.which == 38 || e.which == 40) { // top and down keys
    }
    
    var query = $('.search-bar').val().toLowerCase();
    var queryT = searchType + query;
    if (queryT == searchPrevQuery) {
        return;
    }

    var ul = $('#search-results'), statusDiv = $('#search-status');
    ul.empty().hide();
    searchPrevQuery = queryT;
    if(query.length < resultSettings.minQueryLength) {
        statusDiv.text("අඩුම තරමේ අකුරු " + resultSettings.minQueryLength + " ක් වත් ඇතුළු කරන්න.");
        return;
    }
    
    console.log(queryT);

    // query could be in roman script
	var roman = (isSinglishQuery(query) == true);
	if (roman) {		
		if (query.length > resultSettings.maxSinglishLength) {
			statusDiv.text("සිංග්ලිෂ් වලින් සෙවීමේ දී උපරිමය අකුරු " + resultSettings.maxSinglishLength + " කට සීමා කර ඇත.");
			return;
		}
		if (searchType == SearchType.SINH) {
			statusDiv.text("සිංග්ලිෂ් වලින් සෙවීම පාලි වචන සඳහා පමණක් සීමා කර ඇති බව කරුණාවෙන් සලකන්න.");
			return;
		}
	}
	
    //Check if we've searched for this term before
    var results = {};
	var hits = 0;
    $.each(dataSetsToLoad, function(_1, dataName) {
        if (queryT in searchCache[dataName]) {
            results[dataName] = searchCache[dataName][queryT];
            console.log("found in " + dataName + " cache");
        } else { 
			if (roman) {				
				// Search all singlish_combinations of translations from roman to sinhala
				results[dataName] = [];
				var t0 = performance.now();
                var words = getPossibleMatches(query);
				var s = searchDataSet(words, searchType, dataName);
				var t1 = performance.now();
				console.log("Trie Search Perf: " + (t1 - t0) + " milliseconds.");
				Array.prototype.push.apply(results[dataName], s);
			}
			else {
				var s = searchDataSet([query], searchType, dataName);
				results[dataName] = s;
				hits += s.length;
			}
			
            console.log("" + results[dataName].length + " hits in "+ dataName);
			
            //Add results to cache
            searchCache[dataName][queryT] = results[dataName];    
		}
	   
		hits += results[dataName].length;
    });
	
    // console.log(results);
	 
	// extract text and sort
    var entries = prepareResults(results);
    console.log(entries);
    
    // add results
    if (!entries.length) {
        statusDiv.text("“" + query + "” යන සෙවුම සඳහා ගැළපෙන වචන කිසිවක් හමුවුයේ නැත. වෙනත් සෙවුමක් උත්සාහ කර බලන්න.");
        return;
    }
    
    $.each(entries.slice(0, resultSettings.maxResults), function (_1, entry) {
        var li = $('<li/>').attr('entry-ind', entry.index).addClass('result');
        li.append(getDataNameDisplay(entry));
        li.append(getPaliEntryDisplay(entry, searchType));
        li.append(getSinhEntryDisplay(entry, searchType, query));
        li.attr('dataName', entry.dataName).appendTo(ul);
    });
    ul.slideDown('fast');
    if (entries.length < resultSettings.maxResults) {
        statusDiv.text("“" + query + "” සෙවුම සඳහා වචන " + entries.length + " ක් හමුවුනා.");
    } else {
        statusDiv.text("සෙවුම සඳහා වචන " + hits + " කට වඩා හමුවුනා. එයින් මුල් වචන " + resultSettings.maxResults + " පහත දැක්වේ.");
    }
}

function getPaliEntryDisplay(entry, searchType) {
    return $('<span/>').text(entry.PALI).addClass('result-pali-word');
}

var isPiliPapili = "්ාැෑිීුූෘෙේෛොෝෞෟෲෳංඃ";
function getSinhEntryDisplay(entry, searchType, query) {
    var html = entry.SINH;
    if (searchType == SearchType.SINH) {
        var regex = new RegExp(query + '[' + isPiliPapili + ']?', 'g');
        html = entry.SINH.replace(regex, '<span class="mark">$&</span>');
    }
    return $('<span/>').html(html).addClass('result-sinhala-meaning');
}

function getDataNameDisplay(entry) {
    return $('<i class="fa fa-book fa-fw" />').addClass('dict-name').addClass(entry.dataName).attr('page-num', entry.pageNumber);
}

// extract text for each index and sort based on pali text
// output an array of {index: xx, pali: pali_word, sinh: sinhala_meaning, dataName: dataName}
function prepareResults(results) {
    var entries = [];
    // extract entries
    $.each(results, function(dataName, indexes) {
        var setting = dataSettings[dataName];
        //indexes= Array.from(new Set(indexes)); // es6 not supported by ie
        var dedupIndexes = []; // dedup indexes
        $.each(indexes, function(_1, ind) {
            if ($.inArray(ind, dedupIndexes) >= 0) {
                return true; // continue
            }
            var pageNumber = setting.entryInd.PAGE >= 0 ? setting.data[ind][setting.entryInd.PAGE] : 0;
            var entry = {
                index: ind,
                PALI: setting.data[ind][setting.entryInd.PALI],
                SINH: setting.data[ind][setting.entryInd.SINH],
                pageNumber: pageNumber,
                dataName: dataName
            };
            entries.push(entry);
            dedupIndexes.push(ind);
        });
    });
    // sort entries by PALI and then dataName
    entries.sort(function (e1, e2) {
        if (e1.PALI < e2.PALI)
            return -1;
        if (e1.PALI > e2.PALI)
            return 1;
        if (e1.dataName < e2.dataName)
            return -1;
        if (e1.dataName > e2.dataName)
            return 1;
        return 0;
    });
    
    return entries;
}

function searchDataSet(queries, searchType, dataName) {
    var setting = dataSettings[dataName];
    var results = [];
	
    // TODO: improve this code to ignore na na la la sha sha variations at the comparison

    if (searchType == SearchType.PALI) {
		for (var n in queries) {
			var word = queries[n];
			var node = setting.trie.search(word);
			if (node != null) {
				//console.log(node);
				collect(node, resultSettings.maxResults, results);
			}
		}
		
		//console.log(results);
		return results;
		
    } else { // sinhala search
        var regEx = new RegExp(queries[0], "i");
        var searchInd = setting.entryInd.SINH;
		
		for(var i = 0; i < setting.data.length; i++) {
			if (setting.data[i][searchInd].search(regEx) != -1)
				results.push(i);
			
			if (results.length == resultSettings.maxResults)
				break;
		}
		
		return results;
    }
}

var abbreviations = {};
abbreviations["sumangala"] = {
    "පු.ක්‍රි": ["පුබ්බ ක්‍රියා", 0], //pulled up
    "අ": ["අව්‍යය සද්ද", 0],
    "පු": ["පුල්ලිඞ්ගික", "c1"],
    "ඉ": ["ඉත්‍ථි ලිඞ්ගික", "c1"],
    "න": ["නපුංසක ලිඞ්ගික", "c1"],
    "එ": ["එකක නිපාත", 2],
    "දු": ["දුකනිපාත", 2],
    "ත": ["තතිය", 2],
    "නි": ["නිපාත", 2],
    "ප": ["පණ්ණාසක", 2],
    // "දී,නි": ["දීඝ නිකාය", 3], // removed occurances in text
    "ති": ["තිලිඞ්ගික", "c1"],
    "ක්‍රි": ["ක්‍රියා", 0],
    "වි": ["විභාවිනී", 0],
    // "ම.පූ.": ["මනෝරථ පූරණී", 3], // not ocurring in text
    // "සු. වි": ["සුමඞ්ගලවිලාසිනී", 3], // not ocurring in text
    "ව": ["වණ්ණනා", 0],
    "d": ["ධාතු", 0],
    "භු": ["භුවාදිගණය", 4],
    "රු": ["රුධාදිගණය", 4],
    "දි": ["දිවාදිගණය", 4],
    "සු": ["ස්වාදිගණය", 4],
    "කි": ["කියාදිගණය", 4],
    "ත2": ["තනාදිගණය", 4], // duplicate abbre
    "චු": ["චුරාදිගණය", 4],
    "අ2": ["එනම් විකරණය", 5], // duplicate
    "අං": ["එනම් විකරණය", 5],
    "ය": ["එනම් විකරණය", 5],
    "ණු ණ, යිර": ["එනම් විකරණය", 5], // could not find occurances of the below 4 entries - but leave them anyway
    "ණා": ["එනම් විකරණය", 5],
    "ඔ, උණා": ["එනම් විකරණය", 5],
    "ණෙ, ණය": ["එනම් විකරණය", 5]
    // "ත්‍රි. මූ": ["ත්‍රිපිටක මුද්‍රණය", 0] // removed occurances in text
};

var su_otherNotations = {
    "-": ["ආදෙස", 0],
    "‍+": ["එකතු කිරීම", 0],
    "=": ["සමාන", 0],
    ",": ["එම අත්‍ථර්‍", 0],
    ".": ["අන්‍යාත්‍ථර්‍", 0]    
};

abbreviations["buddhadatta"] = {
    "පූ.ක්‍රි": ["පූර්ව ක්‍රියා", 0],
    "ක්‍රි.වි": ["ක්‍රියා විශේෂණ", 0],
    "නි": ["නිපාත", 0],
    "පු": ["පුල් ලිඞ්ග", "c1"],
    "ඉ": ["ඉත්‍ථි ලිඞ්ග", "c1"],
    "න": ["නපුංසක ලිඞ්ග", "c1"],
    "3": ["තුන් ලිඟු ඇති", "c1"]
};