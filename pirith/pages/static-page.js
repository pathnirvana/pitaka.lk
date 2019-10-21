const authorList = {
    'ariyadhamma': ['නාඋයනේ අරියධම්ම ථෙරෝ', 'Nauyane Ariyadhamma Thero', [128, 256, 512]],
};
const audioElem = document.querySelector('audio');
audioElem.src = `../audio/${pirithName}.mp3`;
audioElem.addEventListener('play', setupMediaSession);
audioElem.addEventListener('timeupdate', timeUpdated);

const clipb = new ClipboardJS('.share-icon', {
    text: function(icon) {
        return `https://pitaka.lk/pirith/pages/${pirithName}.html`;
    }
});
clipb.on('success', function(e) { showToast('link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.'); });

function showToast(toastMsg) {
    var toast = $('#toast').text(toastMsg).show();
    setTimeout(function(){ toast.hide(); }, 3000); // After 3 seconds, remove the show class from DIV
}

function setupMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const authorInfo = authorList['ariyadhamma'];
    const metadata = {
        title: 'TITLEPLACEHOLDER',
        artist: authorInfo[1],
        album: 'පිරිත්',
    };
    metadata.artwork = _.map(authorInfo[2], function(size) {
        return {
            src: `../artwork/ariyadhamma-${size}.png`,
            sizes: `${size}x${size}`, 
            type: 'image/png' 
        };
    });
    navigator.mediaSession.metadata = new MediaMetadata(metadata);
}

function timeUpdated() {
    $('.label[label-start]').each(function(_1, labelE) {
        const label = $(labelE);
        const isActive = (Number(label.attr('label-start')) <= audioElem.currentTime &&
            Number(label.attr('label-end')) > audioElem.currentTime);
        label.toggleClass('active', isActive);
        if (isActive) {
            //label.prepend(audioElem);
            //$('body').scrollTop(label.offset().top);
        }
    });
}