// ---- dhammapada site (after dev/site-lib/reader.js) ----

// gatha audio: only one plays at a time, the next gatha plays when one ends
const audios = Array.from(document.querySelectorAll('audio[data-gatha]'));
audios.forEach((audio, i) => {
    audio.addEventListener('play', () => {
        audios.forEach(other => { if (other !== audio) other.pause(); });
        if ('mediaSession' in navigator && window.MediaMetadata) {
            navigator.mediaSession.metadata = new MediaMetadata({ title: `ධම්මපද ගාථා ${audio.dataset.gatha}`, artist: 'pitaka.lk', album: document.title });
        }
    });
    audio.addEventListener('ended', () => {
        const next = audios[i + 1];
        if (next) {
            next.play();
            next.closest('[data-gatha]').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
});
