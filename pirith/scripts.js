let curPirith, curSection;
let labels = [], paliText = [], transText = [];// context, audioBuffer;

const pirithList = { // id, desc, length
    'karaniya': [1, 'මෙත්ත සුත්ත', '04:02'],
    'mangala': [2, 'මඞ්ගල සුත්ත', '06:02'],
    'rathana': [3, 'රතන සුත්ත', '10:02'],
};

const audioElem = document.querySelector('audio');

function renderPirithList() {
    return Object.keys(pirithList).map(name => {
        const details = pirithList[name];
        const num = $('<span/>').addClass('pirith-num').text(details[0]);
        const desc = $('<span/>').addClass('pirith-desc').text(details[1]);
        const duration = $('<span/>').addClass('pirith-duration').text(details[2]);
        return $('<div/>').addClass('pirith-item').attr('name', name).attr('num', details[0]).append(num, desc, duration);
    });
}
function playPrevSection() {};
function playNextSection() {};
function playPrevPirith() {};
function playNextPirith() {};

function playPirith() {
    audioElem.src = `audio/${curPirith}.mp3`;
    audioElem.play().then(_ => setupMediaSession(curPirith));
    $('#pirith-stats').text(`pirith: ${curPirith}, labels: ${pirithData[curPirith].labels.length}`);
}

function timeUpdated() {
    console.log(audioElem.currentTime);
    const data = pirithData[curPirith];
    let i = 0;
    for (; i+1 < data.labels.length && audioElem.currentTime > data.labels[i+1][0]; i++);

    $('#pali-text').text(data.pali[i]);
    if (data.trans[i]) $('#trans-text').text(data.trans[i]); // if not defined, keep using the previous
    
    const curLabel = data.labels[i];
    const overlayWidth = $('#pali-text').innerWidth() * (audioElem.currentTime - curLabel[0]) / (curLabel[1] - curLabel[0]);
    $('#overlay').width(overlayWidth);
}

function setupMediaSession(pirithName) {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
    title: 'Never Gonna Give You Up',
    artist: 'Nauyane Ariyadhamma Thero',
    album: 'Whenever You Need Somebody',
    artwork: [
        { src: 'https://dummyimage.com/96x96',   sizes: '96x96',   type: 'image/png' },
        { src: 'https://dummyimage.com/128x128', sizes: '128x128', type: 'image/png' },
        { src: 'https://dummyimage.com/192x192', sizes: '192x192', type: 'image/png' },
        { src: 'https://dummyimage.com/256x256', sizes: '256x256', type: 'image/png' },
        { src: 'https://dummyimage.com/384x384', sizes: '384x384', type: 'image/png' },
        { src: 'https://dummyimage.com/512x512', sizes: '512x512', type: 'image/png' },
    ]
    });
}
