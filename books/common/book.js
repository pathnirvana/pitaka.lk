$('.TOC-text .material-icons.parent').click(e => {
    const icon = $(e.currentTarget);
    icon.parent().toggleClass('closed').siblings('.TOC-children').toggle();
    icon.text(icon.text() == 'expand_less' ? 'arrow_downward' : 'expand_less');
});

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

const clipb = new ClipboardJS('.share-icon', { //.TOC-text .share-icon
    text: function(icon) {
        const bookFolder = $(icon).parents('[book-folder]:first').attr('book-folder');
        return `https://pitaka.lk/books/${bookFolder}/${$(icon).attr('file-name') || ''}`;
    }
});
clipb.on('success', e => showToast('link එක copy කර ගත්තා. ඔබට අවශ්‍ය තැන paste කරන්න.'));

function showToast(toastMsg) {
    var toast = $('#toast').text(toastMsg).show();
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ toast.hide(); }, 3000);
}

const cssColors = {
    light: {
        '--background-color': '#ffffff',
        '--hover-background-color': '#eeeeee',
        '--accent-color': 'lightsalmon',
        '--text-color': '#000000',
        '--info-color': 'blue', // used for links too
        '--error-color': 'brown',
    },
    dark: {
        '--background-color': '#212121',
        '--hover-background-color': '#111111',
        '--accent-color': '#2F4F4F',
        '--text-color': '#ffffff',
        '--info-color': '#FFB74D',
        '--error-color': 'turquoise',
    }
};
const themeKeyName = 'books-app-theme', bookmarksKeyName = 'books-app-bookmarks'
const updateColors = () => {
    const root = document.documentElement, theme = localStorage.getItem(themeKeyName) || 'light' 
    for (const property in cssColors[theme]) {
        root.style.setProperty(property, cssColors[theme][property]);
    }
}

const bookmarks = JSON.parse(localStorage.getItem(bookmarksKeyName) || '{}')
const getBookmarkHref = (folder, ids) => `${folder}/${ids.join('-')}.html`
const toggleBookmark = (icon) => {
    const info = JSON.parse(icon.dataset.bookmark), key = getBookmarkHref(info.book.folder, info.ids)
    if (icon.classList.contains('active')) {
        icon.classList.remove('active')
        icon.textContent = 'star_outline'
        delete bookmarks[key]
        showToast('එම මාතෘකාවේ තරුව ඉවත් කළා.')
    } else {
        icon.classList.add('active')
        icon.textContent = 'star'
        bookmarks[key] = { ...info, time: Date.now() }
        showToast('එම මාතෘකාවට තරුවක් එකතු කළා.')
    }
    localStorage.setItem(bookmarksKeyName, JSON.stringify(bookmarks))
}
const updateBookmarks = () => {
    document.querySelectorAll('.star-icon').forEach(icon => {
        console.log(icon.dataset.bookmark)
        const info = JSON.parse(icon.dataset.bookmark), key = getBookmarkHref(info.book.folder, info.ids)
        if (bookmarks[key]) {
            icon.textContent = 'star'
            icon.classList.add('active')
        }
    })
}

document.addEventListener("DOMContentLoaded", () => {
    updateColors() // initially set the theme
    updateBookmarks() // intially set the bookmarks

    const toggleButton = document.getElementById('dark-mode-toggle');
    if (toggleButton) {
        toggleButton.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const theme = localStorage.getItem(themeKeyName) == 'dark' ? 'light' : 'dark'
            localStorage.setItem(themeKeyName, theme);
            updateColors()
        });
    }
    document.querySelectorAll('.star-icon').forEach(icon => icon.addEventListener('click', (event) => toggleBookmark(event.target)))
});
