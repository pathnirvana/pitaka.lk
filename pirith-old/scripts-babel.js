'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Written by Janaka on August 2019.
 * Functions for controlling and rendering the pirith list
 */
var curPirith = void 0,
    starredOnly = false,
    pirithCounter = null;
var labels = [],
    paliText = [],
    transText = [];

var pirithList = { // order, desc, author, length, count, isStarred, isLoop
    '02-saranagamanam': [0, 'සරණාගමනං', 'ariyadhamma', '1:41'],
    '03-dasasikkhapadani': [1, 'දස සික්ඛාපදානි', 'ariyadhamma', '1:48'],
    '04-samanera-panha': [2, 'සාමණේර පඤ්හො', 'ariyadhamma', '1:53'],
    '05-dvattimsakaraya': [3, 'ද්වත්තිංසාකාරො', 'ariyadhamma', '1:09'],
    '06-paccavekkhana': [4, 'පච්චවෙක්ඛණා', 'ariyadhamma', '3:24'],
    '07-dasadhamma': [5, 'දසධම්ම සුත්තං', 'ariyadhamma', '5:24'],
    '08-mahamangala': [6, 'මහා මඞ්ගල සුත්තං', 'ariyadhamma', '5:46'],
    '09-rathana': [7, 'රතන සුත්තං', 'ariyadhamma', '10:21'],
    '10-karaniya': [8, 'කරණීය මෙත්ත සුත්තං', 'ariyadhamma', '4:02'],
    '11-khandha-parittam': [9, 'ඛන්ධ පරිත්තං', 'ariyadhamma', '6:50'],
    '12-mettanisamsa': [10, 'මෙත්තානිසංස සුත්තං', 'ariyadhamma', '3:33'],
    '13-mittanisamsa': [11, 'මිත්තානිසංස සුත්තං', 'ariyadhamma', '3:27'],
    '14-mora-parittam': [12, 'මොර පරිත්තං', 'ariyadhamma', '2:25'],
    '15-canda-parittam': [13, 'චන්ද පරිත්තං', 'ariyadhamma', '3:26'],
    '16-suriya-parittam': [14, 'සූරිය පරිත්තං', 'ariyadhamma', '3:40'],
    '17-dhajagga-parittam': [15, 'ධජග්ග පරිත්තං', 'ariyadhamma', '11:13'],
    '18-kassapa-bojjhanga': [16, 'මහා කස්සප බොජ්ඣංග සුත්තං', 'ariyadhamma', '7:05'],
    '19-moggallana-bojjhanga': [17, 'මහා මොග්ගල්ලාන බොජ්ඣංග සුත්තං', 'ariyadhamma', '7:03'],
    '20-chunda-bojjhanga': [18, 'මහා චුන්ද බොජ්ඣංග සුත්තං', 'ariyadhamma', '6:53'],
    '21-girimananda-suttam': [19, 'ගිරිමානන්ද සුත්තං', 'ariyadhamma', '24:11'],
    '22-isigili-suttam': [20, 'ඉසිගිලි සුත්තං', 'ariyadhamma', '16:23'],
    '23-dhammacakkappavattana': [21, 'ධම්මචක්කප්පවත්තන සුත්තං', 'ariyadhamma', '24:28'],
    '24-mahasamaya-suttam': [22, 'මහාසමය සුත්තං', 'ariyadhamma', '30:17'],
    '25-alavaka-suttam': [23, 'ආළවක සුත්තං', 'ariyadhamma', '9:40'],
    '26-kasibharadvaja-suttam': [24, 'කසිභාරද්වාජ සුත්තං', 'ariyadhamma', '11:49'],
    '27-parabhava-suttam': [25, 'පරාභව සුත්තං', 'ariyadhamma', '10:00'],
    '28-aggika-bharadvaja-suttam': [26, 'අග්ගික භාරද්වාජ සුත්තං', 'ariyadhamma', '14:22'],
    '29-saccavibhanga-suttam': [27, 'සච්චවිභඞ්ග සුත්තං', 'ariyadhamma', '30:31'],
    '30-atanatiya-suttam-1': [28, 'ආටානාටිය සුත්තං 1', 'ariyadhamma', '41:02'],
    '32-atanatiya-suttam-2': [29, 'ආටානාටිය සුත්තං 2', 'ariyadhamma', '48:55'],
    '35-tesattati-nyana-parittam': [30, 'තෙසැත්තෑ ඤාණ පරිත්තං', 'ariyadhamma', '58:26']
};
Object.keys(pirithList).forEach(function (name, ind) {
    pirithList[name][0] = ind;
    pirithList[name] = pirithList[name].concat([0, false, false]);
});

var authorList = {
    'ariyadhamma': ['නාඋයනේ අරියධම්ම ථෙරෝ', 'Nauyane Ariyadhamma Thero', [128, 256, 512]]
};
var findPirithByNum = function findPirithByNum(num) {
    return Object.keys(pirithList).find(function (name) {
        return pirithList[name][0] == num;
    });
};

var audioElem = function audioElem() {
    return document.querySelector('audio');
},
    pirithListLength = Object.keys(pirithList).length;

function loadFromStorage() {
    var ar = localStorage.getItem('pirith-data');
    if (!ar) return; // item not found - initial load
    JSON.parse(ar).forEach(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 4),
            name = _ref2[0],
            order = _ref2[1],
            count = _ref2[2],
            starred = _ref2[3];

        if (!pirithList[name]) return; // pirith name changed
        pirithList[name][0] = order;
        pirithList[name][4] = count;
        pirithList[name][5] = starred;
    });
}
function saveToStorage() {
    var ar = Object.keys(pirithList).map(function (name) {
        return [name, pirithList[name][0], pirithList[name][4], pirithList[name][5]];
    });
    localStorage.setItem('pirith-data', JSON.stringify(ar));
}
function toggleStarred() {
    starredOnly = !starredOnly;
    $('#star-toggle').toggleClass('starred', starredOnly);
    refreshPirithList();
}
var CE = function CE(elem, cls) {
    return $('<' + elem + '/>').addClass(cls);
},
    CED = function CED(cls) {
    return CE('div', cls);
},
    CES = function CES(cls) {
    return CE('span', cls);
}; // helper func

function refreshPirithList() {
    var items = Object.keys(pirithList).sort(function (a, b) {
        return pirithList[a][0] - pirithList[b][0];
    }).filter(function (name) {
        return !starredOnly || pirithList[name][5];
    }).map(function (name) {
        var info = pirithList[name];
        var num = CES('pirith-num').text(info[0] + 1);
        var staticLink = $('<a/>').text('(' + info[3] + ')').addClass('duration');
        if (pirithData[name]) staticLink.attr('href', 'pages/' + name + '.html'); // only if data exists
        var desc = CES('pirith-desc').append(CES('name').text(info[1]), staticLink);
        var loopIcon = CES(info[6] ? 'loop-icon active' : 'loop-icon');
        var starIcon = CES(info[5] ? 'star-icon starred' : 'star-icon');
        var moveIG = CED('action-group').append(CES('up-icon'), CES('down-icon'));
        var action = CES('action-icons').append(loopIcon, starIcon, moveIG);
        var count = CES('pirith-count').text(info[4]);
        var details = CED('pirith-details').append(num, desc, count, action);

        var item = CED('pirith-item').attr('name', name).attr('num', info[0]).append(details);
        if (name == curPirith) {
            var text = CED('pirith-text').attr('id', 'text');
            item.append($('<audio controls></audio>'), text).addClass('active');
        }
        return item;
    });
    $('#pirith-list').empty().append(items);
    timeUpdated(); // rerender pali/trans text if any
}

function movePirithItem(e, inc, checkFunc) {
    var name = $(e.currentTarget).parents('[name]').attr('name');
    var curNum = pirithList[name][0];
    console.log('moving ' + name + ' at ' + curNum + ' by ' + inc + ' check ' + checkFunc(curNum));
    if (checkFunc(curNum)) return;
    var otherNum = findPirithByNum(curNum + inc);
    if (otherNum) pirithList[otherNum][0] = curNum;
    pirithList[name][0] = curNum + inc;
    refreshPirithList();
    saveToStorage();
}

function registerEvents() {
    $('#pirith-list').on('click', '.pirith-item', function (e) {
        if (curPirith != $(e.currentTarget).attr('name')) {
            // only if it is not playing already
            curPirith = $(e.currentTarget).attr('name');
            playPirith();
        }
    }).on('click', '.star-icon', function (e) {
        var name = $(e.currentTarget).parents('[name]').attr('name');
        pirithList[name][5] = !pirithList[name][5];
        $(e.currentTarget).toggleClass('starred', pirithList[name][5]);
        saveToStorage();
        console.log((pirithList[name][5] ? 'Adding' : 'Removing') + ' star from ' + name);
    }).on('click', '.loop-icon', function (e) {
        var name = $(e.currentTarget).parents('[name]').attr('name');
        pirithList[name][6] = !pirithList[name][6];
        $(e.currentTarget).toggleClass('active', pirithList[name][6]);
        // saveToStorage();
        console.log((pirithList[name][6] ? 'Adding' : 'Removing') + ' loop from ' + name);
    }).on('click', '.up-icon', function (e) {
        movePirithItem(e, -1, function (num) {
            return num < 1;
        });
    }).on('click', '.down-icon', function (e) {
        movePirithItem(e, 1, function (num) {
            return num + 1 >= pirithListLength;
        });
    }).on('click', '.action-icons', function (e) {
        e.stopPropagation();
    });
}

function playPrevSection() {};
function playNextSection() {};

function getNextPirithToPlay(inc) {
    var curPirithNum = pirithList[curPirith][0];
    var newPirithNum = curPirithNum + inc;
    if (!starredOnly) return findPirithByNum(newPirithNum);
    while (newPirithNum < pirithList.length && newPirithNum >= 0) {
        // loop until next starred pirith is found
        var name = findPirithByNum(newPirithNum);
        if (name && pirithList[name][5]) return nextPirith;
        newPirithNum += inc;
    }
}

// called from android notification - loop setting ignored, counts not updated
function playNextPirith(inc) {
    // inc is +1 for next or -1 for prev
    var nextPirith = getNextPirithToPlay(inc);
    if (nextPirith) {
        curPirith = nextPirith;
        playPirith();
    }
}

// pirith ended event - start next or loop, increment counts
function pirithEnded() {
    console.log(curPirith + ' ended');
    if (playedPirith == curPirith) {
        var newCount = ++pirithList[curPirith][4];
        console.log('incrementing count for ' + playedPirith + ' by 1 to ' + newCount);
        $('.pirith-item[name=' + playedPirith + '] .pirith-count').text(newCount);
        saveToStorage();
    }
    if (!pirithList[curPirith][6]) {
        // not looping - update curPirith to next one
        curPirith = getNextPirithToPlay(1);
    }
    playPirith();
}
// pause event (seeking also seems to fire this event) - prevent incrementing of the count
function pirithPaused() {
    console.log(curPirith + ' paused at ' + audioElem().currentTime + '. duration: ' + audioElem().duration);
    // at the end of play the event is fired again - following condition filters those end events
    if (Math.abs(audioElem().currentTime - audioElem().duration) > 0.01) playedPirith = null;
}

// starts playing from the beginning
function playPirith() {
    if (!curPirith) return;
    refreshPirithList(); // render pirith text/audioElem in the curPirith item
    audioElem().src = 'audio/' + curPirith + '.mp3';
    audioElem().play().then(function (_) {
        return setupMediaSession(curPirith);
    });
    $('audio').on('ended', pirithEnded).on('pause', pirithPaused).on('timeupdate', timeUpdated);
    $('#title-bar-text').text(pirithList[curPirith][1]);
    playedPirith = curPirith;
    console.log(curPirith + ' playing.');
}

function timeUpdated() {
    if (!curPirith || !pirithData[curPirith] || !audioElem()) return;
    var data = pirithData[curPirith];
    var i = -1;
    for (; i + 1 < data.labels.length && audioElem().currentTime > data.labels[i + 1][0]; i++) {}
    if (i < 0) return;

    var curLabel = data.labels[i],
        curText = data.text[i];
    var elapsedRatio = Math.min(1, (audioElem().currentTime - curLabel[0]) / (curLabel[1] - curLabel[0]));
    var ci = computeCi(curText, elapsedRatio);
    $('#text').empty();
    $('#text').append(renderTextRows(curText.slice(0, ci), 'past')); // ci not included
    $('#text').append(renderTextRows([curText[ci]], 'present'));
    $('#text').append(renderTextRows(curText.slice(ci + 1), 'future'));
    //console.log(`time ${audioElem.currentTime}, label: ${i}, char: ${chars[ci]}`);
}

function renderTextRows(rows, className) {
    return CED('text-rows ' + className).append(rows.map(function (row) {
        return CED('text-row').append([CED('pali part').text(row[0]), CED('sinh part').text(row[1])]);
    }));
}

function computeCi(text, elapsedRatio) {
    var total = text.reduce(function (acc, row) {
        return acc + row[0].length;
    }, 0);
    var elapsedTotal = total * elapsedRatio;
    for (var i = 0, sum = 0; i < text.length; i++) {
        sum = sum + text[i][0].length;
        if (sum >= elapsedTotal) return i;
    }
    return text.length - 1;
}

function setupMediaSession(pirithName) {
    if (!('mediaSession' in navigator)) {
        console.log('No mediaSession support in navigator');
        return;
    }
    var authorInfo = authorList[pirithList[pirithName][2]];
    var metadata = {
        title: pirithList[pirithName][1], // TODO needs script change 
        artist: authorInfo[1],
        album: 'පිරිත්'
    };
    metadata.artwork = authorInfo[2].map(function (size) {
        return {
            src: 'artwork/' + pirithList[pirithName][2] + '-' + size + '.png',
            sizes: size + 'x' + size,
            type: 'image/png'
        };
    });
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

/*
// {} denotes a section that is not available in the audio
const siCharRegex = new RegExp('(\{.+?\})|[අආඉඊඋඌඑඔ ,\.\-\?]|([ක-ෆ](\u0dca\u200d[රය])?[\u0dcaා-ො]?[ංඃ]?)', 'g');

function breakCharacters(word) {
    let match, chars = [];
    while ((match = siCharRegex.exec(word)) !== null) { // get all the matches
        chars.push(match[0]);
    }
    return chars;
}*/
