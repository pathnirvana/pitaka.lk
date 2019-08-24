/**
 * Written by Janaka on August 2019.
 * Functions for controlling and rendering the pirith list
 */
let curPirith, starredOnly = false, pirithCounter = null;
let labels = [], paliText = [], transText = [];

const pirithList = { // order, desc, author, length, count, isStarred, isLoop
    '02-saranagamanam':     [0, 'සරණාගමනං', 'ariyadhamma', '1:41'],
    '03-dasasikkhapadani':  [1, 'දස සික්ඛාපදානි', 'ariyadhamma', '1:48'],
    '04-samanera-panha':    [2, 'සාමණේර පඤ්හො', 'ariyadhamma', '1:53'],
    '05-dvattimsakaraya':   [3, 'ද්වත්තිංසාකාරො', 'ariyadhamma', '1:09'],
    '06-paccavekkhana':     [4, 'පච්චවෙක්ඛණා', 'ariyadhamma', '3:24'],
    '07-dasadhamma':        [5, 'දසධම්ම සුත්තං', 'ariyadhamma', '5:24'],
    '08-mahamangala':       [6, 'මහා මඞ්ගල සුත්තං', 'ariyadhamma', '5:46'],
    '09-rathana':           [7, 'රතන සුත්තං', 'ariyadhamma', '10:21'],
    '10-karaniya':          [8, 'කරණීය මෙත්ත සුත්තං', 'ariyadhamma', '4:02'],
    '11-khandha-parittam':  [9, 'ඛන්ධ පරිත්තං', 'ariyadhamma', '6:50'],
    '12-mettanisamsa':      [10, 'මෙත්තානිසංස සුත්තං', 'ariyadhamma', '3:33'],
    '13-mittanisamsa':      [11, 'මිත්තානිසංස සුත්තං', 'ariyadhamma', '3:27'],
    '14-mora-parittam':     [12, 'මොර පරිත්තං', 'ariyadhamma', '2:25'],
    '15-canda-parittam':    [13, 'චන්ද පරිත්තං', 'ariyadhamma', '3:26'],
    '16-suriya-parittam':   [14, 'සූරිය පරිත්තං', 'ariyadhamma', '3:40'],
    '17-dhajagga-parittam': [15, 'ධජග්ග පරිත්තං', 'ariyadhamma', '11:13'],
};
Object.keys(pirithList).forEach((name, ind) => { 
    pirithList[name][0] = ind; 
    pirithList[name] = pirithList[name].concat([0, false, false]); 
});

const authorList = {
    'ariyadhamma': ['නාඋයනේ අරියධම්ම ථෙරෝ', 'Nauyane Ariyadhamma Thero', [128, 256, 512]],
};
const findPirithByNum = num => Object.keys(pirithList).find(name => pirithList[name][0] == num);

const audioElem = document.querySelector('audio'), pirithListLength = Object.keys(pirithList).length;

function loadFromStorage() {
    const ar = localStorage.getItem('pirith-data');
    if (!ar) return; // item not found - initial load
    JSON.parse(ar).forEach(([name, order, count, starred]) => {
        if (!pirithList[name]) return; // pirith name changed
        pirithList[name][0] = order;
        pirithList[name][4] = count;
        pirithList[name][5] = starred;
    });
}
function saveToStorage() {
    const ar = Object.keys(pirithList).map(
        name => [ name, pirithList[name][0], pirithList[name][4], pirithList[name][5] ]
    );
    localStorage.setItem('pirith-data', JSON.stringify(ar));
}
function toggleStarred() {
    starredOnly = !starredOnly;
    $('#star-toggle').toggleClass('starred', starredOnly);
    refreshPirithList();
}
const CE = (elem, cls) => $(`<${elem}/>`).addClass(cls), 
    CED = (cls) => CE('div', cls), CES = (cls) => CE('span', cls); // helper func

function refreshPirithList() {
    const items = Object.keys(pirithList)
    .sort((a, b) => pirithList[a][0] - pirithList[b][0])
    .filter(name => !starredOnly || pirithList[name][5])
    .map(name => {
        const info = pirithList[name];
        const num = CES('pirith-num').text(info[0] + 1);
        const desc = CES('pirith-desc').append(CES('name').text(info[1]), CES('duration').text(`(${info[3]})`));
        const loopIcon = CES(info[6] ? 'loop-icon active' : 'loop-icon');
        const starIcon = CES(info[5] ? 'star-icon starred' : 'star-icon');
        const moveIG = CES('action-group').append($('<i class="fa fa-chevron-up up-icon"></i>'),
            $('<i class="fa fa-chevron-down down-icon"></i>'));
        const action = CES('action-icons').append(loopIcon, starIcon, moveIG)
        const count = CES('pirith-count').text(info[4]);
        const details = CED('pirith-details').append(num, desc, count, action);

        const item = CED('pirith-item').attr('name', name).attr('num', info[0]).append(details);
        if (name == curPirith) {
            const pali = CED('pali').append(CES('past'), CES('present'), CES('future'));
            const text = CED('pirith-text').append(pali, CED('trans')).attr('id', 'text');
            item.append(text).addClass('active');
        }
        return item;
    });
    $('#pirith-list').empty().append(items);
    timeUpdated(); // rerender pali/trans text if any
}

function movePirithItem(e, inc, checkFunc) {
    const name = $(e.currentTarget).parents('[name]').attr('name');
    const curNum = pirithList[name][0];
    console.log(`moving ${name} at ${curNum} by ${inc} check ${checkFunc(curNum)}`);
    if (checkFunc(curNum)) return;
    let otherNum = findPirithByNum(curNum + inc);
    if (otherNum) pirithList[otherNum][0] = curNum;
    pirithList[name][0] = curNum + inc;
    refreshPirithList();
    saveToStorage();
} 

function registerEvents() {
    $('#pirith-list').on('click', '.pirith-item', e => {
        if (curPirith != $(e.currentTarget).attr('name')) { // only if it is not playing already
            curPirith = $(e.currentTarget).attr('name');
            playPirith();
        }
    }).on('click', '.star-icon', e => {
        const name = $(e.currentTarget).parents('[name]').attr('name');
        pirithList[name][5] = !pirithList[name][5];
        $(e.currentTarget).toggleClass('starred', pirithList[name][5]);
        saveToStorage();
        console.log(`${pirithList[name][5] ? 'Adding' : 'Removing'} star from ${name}`);
    }).on('click', '.loop-icon', e => {
        const name = $(e.currentTarget).parents('[name]').attr('name');
        pirithList[name][6] = !pirithList[name][6];
        $(e.currentTarget).toggleClass('active', pirithList[name][6]);
        // saveToStorage();
        console.log(`${pirithList[name][6] ? 'Adding' : 'Removing'} loop from ${name}`);
    }).on('click', '.up-icon', e => {
        movePirithItem(e, -1, num => num < 1);
    }).on('click', '.down-icon', e => {
        movePirithItem(e, 1, num => num + 1 >= pirithListLength);
    }).on('click', '.action-icons', e => {
        e.stopPropagation();
    });
}

function playPrevSection() {};
function playNextSection() {};

function getNextPirithToPlay(inc) {
    const curPirithNum = pirithList[curPirith][0];
    let newPirithNum = curPirithNum + inc;
    if (!starredOnly) return findPirithByNum(newPirithNum);
    while (newPirithNum < pirithList.length && newPirithNum >= 0) { // loop until next starred pirith is found
        let name = findPirithByNum(newPirithNum);
        if (name && pirithList[name][5]) return nextPirith;
        newPirithNum += inc;
    }
}

// called from android notification - loop setting ignored, counts not updated
function playNextPirith(inc) { // inc is +1 for next or -1 for prev
    const nextPirith = getNextPirithToPlay(inc);
    if (nextPirith) {
        curPirith = nextPirith;
        playPirith();
    }
}

// pirith ended event - start next or loop, increment counts
function pirithEnded() {
    console.log(`${curPirith} ended`);
    if (playedPirith == curPirith) {
        const newCount = ++pirithList[curPirith][4];
        console.log(`incrementing count for ${playedPirith} by 1 to ${newCount}`);
        $(`.pirith-item[name=${playedPirith}] .pirith-count`).text(newCount);
        saveToStorage();
    }
    if (!pirithList[curPirith][6]) { // not looping - update curPirith to next one
        curPirith = getNextPirithToPlay(1);
    }
    playPirith()
}
// pause event (seeking also seems to fire this event) - prevent incrementing of the count
function pirithPaused() {
    console.log(`${curPirith} paused at ${audioElem.currentTime}. duration: ${audioElem.duration}`);
    // at the end of play the event is fired again - following condition filters those end events
    if (Math.abs(audioElem.currentTime - audioElem.duration) > 0.01) playedPirith = null;
}

// starts playing from the beginning
function playPirith() {
    if (!curPirith) return;
    audioElem.src = `audio/${curPirith}.mp3`;
    audioElem.play().then(_ => setupMediaSession(curPirith));
    $('#title-bar-text').text(pirithList[curPirith][1]);
    refreshPirithList(); // render pirith text in the curPirith item
    playedPirith = curPirith;
    console.log(`${curPirith} playing.`);
}

function timeUpdated() {
    if (!curPirith || !pirithData[curPirith]) return;
    const data = pirithData[curPirith];
    let i = -1;
    for (; i+1 < data.labels.length && audioElem.currentTime > data.labels[i+1][0]; i++);
    if (i < 0) return;

    const chars = breakCharacters(data.pali[i]);
    const curLabel = data.labels[i];
    const elapsedRatio = Math.min(1, (audioElem.currentTime - curLabel[0]) / (curLabel[1] - curLabel[0]) );
    const ci = Math.floor((chars.length - 1) * elapsedRatio);
    $('#text .past').text(chars.slice(0, ci).join('')); // ci not included
    $('#text .present').text(chars[ci]).css('color', `rgb(${250 - elapsedRatio * 150}, ${elapsedRatio * 100}, ${elapsedRatio * 100})`);
    $('#text .future').text(chars.slice(ci + 1).join(''));

    let ti = i;
    while (!data.trans[ti]) ti--; // if null, get the previous one
    $('#text .trans').text(data.trans[ti]);
    //console.log(`time ${audioElem.currentTime}, label: ${i}, char: ${chars[ci]}`);
}

function setupMediaSession(pirithName) {
    if (!('mediaSession' in navigator)) return;
    const authorInfo = authorList[pirithList[pirithName][2]];
    const metadata = {
        title: pirithList[pirithName][1], // TODO needs script change 
        artist: authorInfo[1],
        //album: 'Whenever You Need Somebody',
    };
    metadata.artwork = authorInfo[2].map(size => {
        return { 
            src: `artwork/${pirithList[pirithName][2]}-${size}.png`,
            sizes: `${size}x${size}`, 
            type: 'image/png' 
        };
    });
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

// {} denotes a section that is not available in the audio
const siCharRegex = new RegExp('(\{.+?\})|[අආඉඊඋඌඑඔ ,\.\-\?]|([ක-ෆ](\u0dca\u200d[රය])?[\u0dcaා-ො]?[ංඃ]?)', 'g');

function breakCharacters(word) {
    let match, chars = [];
    while ((match = siCharRegex.exec(word)) !== null) { // get all the matches
        chars.push(match[0]);
    }
    return chars;
}