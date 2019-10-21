
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