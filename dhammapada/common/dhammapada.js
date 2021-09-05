
$(document).keydown(function(e) {
    switch(e.which) {
        case 37: // left
        $('nav.bottom a.prev').get(0).click();
        break;

        case 39: // right
        $('nav.bottom a.next').get(0).click();
        break;

        default: return; // exit this handler for other keys
    }
    e.preventDefault(); // prevent the default action (scroll / move caret)
});

const clipb = new ClipboardJS('.share-icon', {
    text: function(icon) {
        //const bookFolder = $(icon).parents('[book-folder]:first').attr('book-folder');
        return `https://pitaka.lk/dhammapada/${$(icon).attr('file-name') || ''}`;
    }
});
clipb.on('success', function(e) { showToast('link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.'); });

function showToast(toastMsg) {
    var toast = $('#toast').text(toastMsg).show();
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ toast.hide(); }, 3000);
}

// gatha audio playing code
const audios = document.querySelectorAll('audio');

// Pause all <audio> elements except for the one that started playing.
function pauseOtherAudios({ target }) {
  for (const audio of audios) {
    if (audio !== target) {
      audio.pause();
    }
  }
}
function playNextAudio({ target }) {
    const nextIndex = parseInt($(target).attr('gatha-num')) + 1
    const nextAudio = $(`audio[gatha-num='${nextIndex}']`)
    if (nextAudio.length) nextAudio[0].play()
}
// Add event listeners to all audios
for (const audio of audios) {
  audio.addEventListener('play', pauseOtherAudios);
  audio.addEventListener('ended', playNextAudio);
}