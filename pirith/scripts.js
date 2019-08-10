let curPirith, curSection;
let labels = [], paliText = [], transText = [];// context, audioBuffer;

const pirithList = { // order, desc, author, length, count, starred
    'karaniya': [0, 'මෙත්ත සුත්ත', 'ariyadhamma', '04:02', 0, false],
    'mangala': [1, 'මඞ්ගල සුත්ත', 'ariyadhamma', '06:02', 0, false],
    'rathana': [2, 'රතන සුත්ත', 'ariyadhamma', '10:02', 0, false],
    'test1': [3, 'test 1', 'ariyadhamma', '10:02', 0, false],
};
const authorList = {
    'ariyadhamma': ['නාඋයනේ අරියධම්ම ථෙරෝ', 'Nauyane Ariyadhamma Thero', [128, 256, 512]],
};
const findPirithNum = num => Object.keys(pirithList).find(name => pirithList[name][0] == num);

const audioElem = document.querySelector('audio'), pirithListLength = Object.keys(pirithList).length;

function loadFromStorage() {
    const ar = localStorage.getItem('pirith-data');
    if (!ar) return; // item not found - initial load
    JSON.parse(ar).forEach(([name, order, count, starred]) => {
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

function refreshPirithList() {
    const items = Object.keys(pirithList).sort((a, b) => pirithList[a][0] - pirithList[b][0]).map(name => {
        const details = pirithList[name];
        const num = $('<span/>').addClass('pirith-num').text(details[0] + 1);
        const desc = $('<span/>').addClass('pirith-desc').text(details[1]);
        const duration = $('<span/>').addClass('pirith-duration').text(details[3]);
        const repeatIcon = $('<i class="fa fa-repeat fa-fw" style="color: darkgreen;"></i>');
        const starIcon = $('<span/>').addClass(details[5] ? 'star-icon starred' : 'star-icon');
        const upIcon = $('<i class="fa fa-angle-double-up up-icon"></i>');
        const downIcon = $('<i class="fa fa-angle-double-down down-icon"></i>');
        const action = $('<span/>').addClass('action-icons').append(repeatIcon, starIcon, upIcon, downIcon)
        const count = $('<span/>').addClass('pirith-count').text(details[4]);
        return $('<div/>').addClass('pirith-item').attr('name', name).attr('num', details[0]).append(num, desc, action, count, duration);
    });
    $('#pirith-list').empty().append(items);
}

function movePirithItem(e, inc, checkFunc) {
    const name = $(e.currentTarget).parents('[name]').attr('name');
    const curNum = pirithList[name][0];
    console.log(`moving ${name} at ${curNum} by ${inc} check ${checkFunc(curNum)}`);
    if (checkFunc(curNum)) return;
    pirithList[findPirithNum(curNum + inc)][0] = curNum;
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
    }).on('click', '.repeat-icon', e => {
        

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

function playNextPirith(inc) { // inc is +1 for next or -1 for prev
    const curPirithNum = pirithList[curPirith][0];
    const nextPirith = findPirithNum(curPirithNum + inc);
    if (nextPirith) {
        curPirith = nextPirith;
        playPirith();
    }
}

// ended event - start next or loop, increment counts
function pirithEnded() {
    console.log(`${curPirith} ended`);
}
// pause event (seeking also seems to fire this event) - prevent incrementing of the count
function pirithPaused() {
    console.log(`${curPirith} paused`);
}

function playPirith() {
    audioElem.src = `audio/${curPirith}.mp3`;
    audioElem.play().then(_ => setupMediaSession(curPirith));
    $('#title-bar-text').text(pirithList[curPirith][1]);
    console.log(`${curPirith} playing. labels: ${pirithData[curPirith].labels.length}`);
}

function timeUpdated() {
    //console.log(audioElem.currentTime);
    const data = pirithData[curPirith];
    let i = 0;
    for (; i+1 < data.labels.length && audioElem.currentTime > data.labels[i+1][0]; i++);

    $('#pali-text').text(data.pali[i]);
    let ti = i;
    while (!data.trans[ti]) ti--; // if not defined, get the previous one
    $('#trans-text').text(data.trans[ti]);
    
    const curLabel = data.labels[i];
    const overlayWidth = $('#pali-text').innerWidth() * (audioElem.currentTime - curLabel[0]) / (curLabel[1] - curLabel[0]);
    $('#overlay').width(overlayWidth);
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

const siCharRegex = new RegExp('[අආඉඊඋඌඑඔ\s,\.\-]|([ක-ෆ](\u0dca\u200d[රය])?[\u0dcaා-ො]?[ංඃ]?)');

function breakCharacters(word) {
    let match, chars = [];
    while ((match = siCharRegex.exec(word)) !== null) { // get all the matches
        chars.push(match[0]);
    }
    return chars;
}