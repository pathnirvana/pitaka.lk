const authorList = {
    'ariyadhamma': ['නාඋයනේ අරියධම්ම ථෙරෝ', 'Nauyane Ariyadhamma Thero', [128, 256, 512]],
};
const audioElem = document.querySelector('audio');
audioElem.addEventListener('play', setupMediaSession);
audioElem.addEventListener('timeupdate', timeUpdated);

function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const authorInfo = authorList['ariyadhamma'];
    const metadata = {
        title: 'TITLEPLACEHOLDER',
        artist: authorInfo[1],
        album: 'පිරිත්',
    };
    metadata.artwork = authorInfo[2].forEach(size => {
        return {
            src: `../artwork/ariyadhamma-${size}.png`,
            sizes: `${size}x${size}`, 
            type: 'image/png' 
        }
    });
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

function timeUpdated() {
    const labels = document.querySelectorAll('.label[label-start]');
    [...labels].forEach(label => {
        const isActive = (Number(label.getAttribute('label-start')) <= audioElem.currentTime &&
            Number(label.getAttribute('label-end')) > audioElem.currentTime);
        label.classList.toggle('active', isActive);
    })
}