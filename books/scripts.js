/**
 * Created by Janaka on 2017-07-15.
 */

var rectSize = {
    SMALL: 'small',
    MEDIUM: 'medium',
    BIG: 'big'
};
var maxBooksPerRow = {
    'small': 6,
    'medium': 5,
    'big': 4
};

var linkType = {
    PDF: 0,
    HTML: 1,
    FOLDER: 2,
    ZIP: 3
};

var linkDesc = [
    ['fa-file-pdf-o', 'PDF', 'PDF file එක භාගත කරගන්න'],
    ['fa-file-text-o', 'HTML', 'HTML file එක වෙත පිවිසෙන්න'],
    ['fa-folder-o', 'ගොනුව', 'ගොනුව වෙත පිවිසෙන්න'],
    ['fa-file-zip-o', 'ZIP', 'ZIP file එක භාගත කරගන්න']
];

var bookColors = ['bisque', 'DarkKhaki', 'DarkSalmon', 'darkorange', 'gold', 'lightblue', 'LavenderBlush', 'lightgreen'];

var typedBookDesc = "යතුරුලියනය කරන ලද ප්‍රමාණයෙන් කුඩා ඉතා පැහැදිලි";
var scannedBookDesc = "ස්කෑන් කර සකසන ලද පොතකි";

var groups = [
    {
        name: "ත්‍රිපිටක",
        anchor: "tipitaka",
        rect: rectSize.MEDIUM,
        books: [
            {
                name: "බුද්ධ ජයන්ති ත්‍රිපිටකය",
                desc: "පාළි සහ සිංහල පරිවර්තනය PDF පොත් 57",
                urls: [["https://www.mediafire.com/folder/najd8hdk6bqqf/Buddha_Jayanthi_Tipitaka", linkType.FOLDER, 885]],
            },
            {
                name: "සරළ සිංහල ත්‍රිපිටක පරිවර්තනය",
                desc: "ඒ. පී. සොයිසා පරිවර්තනය PDF පොත් 38",
                urls: [["http://www.mediafire.com/file/q6mcjc8jpo1dp8o/APZoysa_Tripitakaya.zip", linkType.ZIP, 60]],
            },
            {
                name: "පාළි අටුවා පොත්",
                desc: "හේවාවිතාරණ මුද්‍රණය PDF පොත් 49",
                urls: [["https://www.mediafire.com/folder/31bz1yz9la6m9/Pali_Attakatha", linkType.FOLDER, 3400]],
            },
            {
                name: "විශුද්ධි මාර්ගය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/4pz6zy81895h5n6/Vishuddhi_Margaya.pdf", linkType.PDF, 6],
                    ["http://pitaka.lk/books/Vishuddhi_Margaya.htm", linkType.HTML, 9]],
            },
			{
                name: "මිලින්ද ප්‍රශ්නය",
                desc: typedBookDesc,
				author: "හීනටිකුඹුරේ සුමංගල හිමි",
                urls: [["https://www.mediafire.com/file/2q9nfk024p9doee/Milinda%20Prashnaya.pdf", linkType.PDF, 4], ["http://pitaka.lk/books/Milinda_Prashnaya.htm", linkType.HTML, 9]],
            },
            {
                name: "සරළ සිංහල මිලින්ද ප්‍රශ්නය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/u7kkdtxrd89xevw/Sarala_Sinhala_Milinda_Prashnaya.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/Sarala_Sinhala_Milinda_Prashnaya.htm", linkType.HTML, 0.6]],
            },
            {
                name: "ත්‍රිපිටක සූචි පොත් 4 ක්",
                desc: "ත්‍රිපිටකයේ සූත්‍ර අඩංගු ස්ථාන පහසුවෙන් සොයා ගැනීමට",
                urls: [["https://www.mediafire.com/folder/135fy9y2xm19s/Tripitaka_Suchiya", linkType.FOLDER, 35]],
            },
            {
                name: "පන්සිය පනස් ජාතකය - පොත් දෙකකි",
                desc: "පොත් දෙකම භාගත කරගන්න.",
                urls: [["http://www.mediafire.com/file/cdt3ch4fkdbgro6/SR051_Pansiya_Panas_Jathakaya_1.pdf", linkType.PDF, 118],
                    ["http://www.mediafire.com/file/9m3t8d4l37sptpl/SR052_Pansiya_Panas_Jathakaya_2.pdf", linkType.PDF, 120]],
            },
            {
                name: "අභිධර්මාර්ථ ප්‍රදීපිකා 1-4",
                desc: "පොත් සතරම භාගත කරගන්න.",
                urls: [["http://www.mediafire.com/file/ldxjd8khuwpce6t", linkType.PDF, 29],
                    ["http://www.mediafire.com/file/81az86fut6teh6f", linkType.PDF, 35],
                    ["http://www.mediafire.com/file/sd8izxwh8zb293x", linkType.PDF, 30],
                    ["http://www.mediafire.com/file/b2mpn9w4wigciv8", linkType.PDF, 38]],
            }
        ]
    },
    {
        name: "රේරුකානේ චන්ද්‍රවිමල හිමියන්ගේ පොත්",
        anchor: "rerukane",
        rect: rectSize.SMALL,
        books: [
            {
                name: "යතුරුලියනය කළ පොත් 19 ක්",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/7gnmxf14xhgzl08/Rerukane_Thero_19_books.zip", linkType.ZIP, 29]],
            },
            {
                name: "බෞද්ධයාගේ අත්පොත",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/38w9pjbq9qr3dbs/Bauddhayage_Athpotha.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Bauddhayage_Athpotha.htm", linkType.HTML, 2.3]],
            },
            {
                name: "අභිධර්මයේ මූලික කරුණු",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/epmoc5661k704uc/Abhidharmaye_Mulika_Karunu.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Abhidharmaye_Mulika_Karunu.htm", linkType.HTML, 2]],
            },
            {
                name: "අභිධර්ම මාර්ගය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/bbz96rxw26ck46t/Abhidharma%20Margaya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Abhidharma_Margaya.htm", linkType.HTML, 3.4]],
            },
            {
                name: "බෝධිපාක්ෂික ධර්ම විස්තරය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/nhhhfmipp39hq15/Bodhi_Pakshika_Dharma.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Bodhi_Pakshika_Dharma.htm", linkType.HTML, 2.1]],
            },
            {
                name: "බෝධි පූජාව",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/rjc9rheddzj20tw/Bodhi_Poojawa.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Bodhi_Poojawa.htm", linkType.HTML, 1.1]],
            },
            {
                name: "බුද්ධ නීති සංග්‍ර‍හය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/pbb67818435g0b5/Buddha_Neethi_Sangrahaya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Buddha_Neethi_Sangrahaya.htm", linkType.HTML, 1.8]],
            },
            {
                name: "චත්තාළීසාකාර මහා විපස්සනා භාවනාව",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/n62oj4mcq17oux2/Chathalisakara_Maha_Vipassana_Bhawanawa.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Chathalisakara_Maha_Vipassana_Bhawanawa.htm", linkType.HTML, 1.6]],
            },
            {
                name: "චතුරාර්‍ය්‍ය සත්‍යය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/cotp292wjfqvv44/Chathurarya_Sathya.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Chathurarya_Sathya.htm", linkType.HTML, 1.6]],
            },
            {
                name: "ධර්‍ම විනිශ්චය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/g19jfrca0cl99a0/Dharma_Winishchaya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Dharma_Winishchaya.htm", linkType.HTML, 2.2]],
            },
            {
                name: "කෙලෙස් එක්දහස් පන්සියය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/yuga7t5urvwy391/Keles_Ekdahas_Pansiyaya_final.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Keles_Ekdahas_Pansiyaya.htm", linkType.HTML, 2.5]],
            },
            {
                name: "පාරමිතා ප්‍ර‍කරණය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/auwlvdl970zopdw/Paramitha_Prakaranaya.pdf", linkType.PDF, 3],
                    ["http://pitaka.lk/books/rc/Paramitha_Prakaranaya.htm", linkType.HTML, 3.4]],
            },
            {
                name: "පොහොය දිනය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/t3974o1427ucrml/Pohoya_Dinaya.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Pohoya_Dinaya.htm", linkType.HTML, 1.5]],
            },
            {
                name: "පුණ්‍යෝපදේශය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/puc4b48f54a5ieg/Punyopadeseya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Punyopadeseya.htm", linkType.HTML, 1.8]],
            },
            {
                name: "සතිපට්ඨාන භාවනා ක්‍ර‍මය (බුරුමයේ)",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/am47t78i0f3dvb4/Sathipattana_Bhawana_Kramaya.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Sathipattana_Bhawana_Kramaya.htm", linkType.HTML, 1.3]],
            },
            {
                name: "ශාසනාවතරණය",
                css: { "font-size": "16px" },
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/kbcoc1y3477ee7e/Shasanavatharanaya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Shasanavatharanaya.htm", linkType.HTML, 3.1]],
            },
            {
                name: "සූවිසි මහ ගුණය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/ova55k0150nr24v/Suvisi_Gunaya.pdf", linkType.PDF, 3],
                    ["http://pitaka.lk/books/rc/Suvisi_Gunaya.htm", linkType.HTML, 5.4]],
            },
            {
                name: "උභය ප්‍රාතිමෝක්‍ෂය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/wdm9725vv9z2sdg/Ubhaya_Prathimokshaya.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/rc/Ubhaya_Prathimokshaya.htm", linkType.HTML, 0.8]],
            },
            {
                name: "උපසම්පදා ශීලය",
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/5r8j7ikdjs8559l/Upasampada_Sheelaya.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Upasampada_Sheelaya.htm", linkType.HTML, 3.6]],
            },
            {
                name: "වඤ්චක ධර්ම හා චිත්තෝපක්ලේශ ධර්ම",
                css: { "font-size": "16px" },
                desc: typedBookDesc,
                urls: [["http://www.mediafire.com/file/ze5hhwogbn6olzq/Wanchaka_Dharma.pdf", linkType.PDF, 2],
                    ["http://pitaka.lk/books/rc/Wanchaka_Dharma.htm", linkType.HTML, 1.7]],
            },
        ]
    },
    {
        name: "පැරණි බෞද්ධ පොත්",
        anchor: "old",
        rect: rectSize.SMALL,
        books: [
            {
                name: "සද්ධර්මාලංකාරය",
                css: { "font-size": "16px" },
                desc: scannedBookDesc,
                author: "ජයබාහු ධර්මකීර්ති හිමි",
                urls: [["http://www.mediafire.com/file/fainuf469mkfpk6/Saddharmalankaraya.pdf", linkType.PDF, 39]],
            },
            {
                name: "සද්ධර්ම රත්නාවලිය",
                desc: scannedBookDesc,
                author: "ධර්මසේන මහා ස්ථවිර",
                urls: [["http://www.mediafire.com/file/o3elhiutlydntwk/Saddharma_Rathnawaliya.pdf", linkType.PDF, 107]],
            },
            {
                name: "පූජාවලිය",
                desc: scannedBookDesc,
                author: "මයුරපාද පරිවේණාධිපති",
                urls: [["http://www.mediafire.com/file/xbt05j040yczqan/Pujawaliya.pdf", linkType.PDF, 50]],
            },
            {
                name: "බුත්සරණ",
                desc: scannedBookDesc,
                author: "විද්‍යාචක්‍රවර්තී",
                urls: [["http://www.mediafire.com/file/quid07uqk46yqu6/Buthsarana.pdf", linkType.PDF, 27]],
            },
            {
                name: "සීහළවත්ථු",
                desc: typedBookDesc,
                author: "ධම්මනන්දි හිමි, පොල්වත්තේ බුද්ධදත්ත හිමි",
                urls: [["http://www.mediafire.com/file/esntbjbec1a71mz/Sihala_Vatthu.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/Sihala_Vatthu.htm", linkType.HTML, 1.6]],
            },
            {
                name: "සිංහල දීපවංශය",
                desc: scannedBookDesc,
                urls: [["http://www.mediafire.com/file/67n99d989ee3ble/Sinhala_Deepavansaya.pdf", linkType.PDF, 12]],
            },
            {
                name: "මහාවංශය",
                desc: scannedBookDesc,
                urls: [["http://www.mediafire.com/file/3dxp8x7x5b5nv5g/Mahawansaya.pdf", linkType.PDF, 59]],
            },
            {
                name: "පිරුවානා පොත් වහන්සේ",
                desc: scannedBookDesc,
                urls: [["http://www.mediafire.com/file/gw5x5a4w0lgbr67/Piruvana_Poth_Vahanse.pdf", linkType.PDF, 19]],
            }
        ]
    },
    {
        name: "පාලි භාෂාව ඉගැනුම සහ වෙනත් පොත්",
        anchor: "pali_other",
        rect: rectSize.MEDIUM,
        books: [
            {
                name: "පාලිභාෂාවතරණය 1-3",
                css: { "font-size": "18px" },
                desc: "පොත් තුනම භාගත කරගන්න",
                author: "පොල්වත්තේ බුද්ධදත්ත හිමි",
                urls: [["http://www.mediafire.com/file/md9hgduvqr5dctp/Palibhashavatharanaya_1.pdf", linkType.PDF, 19],
                    ["http://www.mediafire.com/file/e0mfud2xa2v1xd5/Palibhashavatharanaya_2.pdf", linkType.PDF, 36],
                    ["http://www.mediafire.com/file/75az2rx6k6bg5ch/Palibhashavatharanaya_3.pdf", linkType.PDF, 29]],
            },
            {
                name: "සරල පාලි ශික්ෂකය",
                desc: scannedBookDesc,
                author: "බළන්ගොඩ ආනන්ද මෛත්‍රිය හිමි",
                urls: [["http://www.mediafire.com/file/7n9fxks64bp41nd/Sarala_Pali_Shikshakaya.pdf", linkType.PDF, 6]],
            },
            {
                name: "පාලි-සිංහල ශබ්දකෝෂය",
                desc: scannedBookDesc,
                author: "මඩිතියවෙල සිරි සුමංගල හිමි",
                urls: [["http://www.mediafire.com/file/49j7un7thtn5u8b/Pali_Sinhala_Dictionary_Sumangala.pdf", linkType.PDF, 53]],
            },
            {
                name: "දහම් පාසල් ධර්මාආචාර්‍ය පොත්",
                desc: scannedBookDesc,
                urls: [["https://www.mediafire.com/folder/dyokffivchi1r/Daham_Pasal_Poth", linkType.FOLDER, 1500]],
            },
			{
                name: "කර්ම විපාක",
                desc: typedBookDesc,
				author: "රිදියගම සුධම්මාභිවංශ හිමි",
                urls: [["http://www.mediafire.com/file/hoepn8zlja8h16f/Karma_Vipaka.pdf", linkType.PDF, 1],
                    ["http://pitaka.lk/books/Karma_Vipaka.htm", linkType.HTML, 1.5]],
            },
        ]
    }
];

function addGroup(groupInd, group) {
    var groupHeader = $('<div/>').addClass('group-header').text(group.name).attr('id', group.anchor);
    var table = $('<table/>').addClass('group');
    var curBooksCount = maxBooksPerRow[group.rect], tr;
    $.each(group.books, function(bookInd, book) {
        if (curBooksCount >= maxBooksPerRow[group.rect]) {
            tr = $('<tr/>').attr('align', 'center'); table.append(tr); curBooksCount = 0;
        }
        var links = $('<span/>').addClass('links');
        $.each(book.urls, function(_1, url) {
            links.append(createLinkButton(url));
        });
        var rect = $('<div/>').addClass('book-rect').addClass(group.rect)
            .append($('<span/>').addClass('book-name').text(book.name), links)
            .css('background-color', getBookColor(groupInd, bookInd));
        if ('css' in book) {
            rect.css(book.css);
        }
        if ('author' in book) {
            rect.append($('<span/>').addClass('book-author').text(book.author));
        }
        //var details = $('<span/>').addClass('details')
        var desc = $('<div/>').addClass('book-desc').text(book.desc);
        tr.append($('<td/>').append(rect, desc));
        curBooksCount++;
        console.log(maxBooksPerRow[group.rect]);
    });
    $('#main-div').append($('<hr/>'), groupHeader, table);

}

function getBookColor(gInd, bInd) {
    var colorInd = ((gInd + 1) + (bInd + 1)) % bookColors.length;
    return bookColors[colorInd];
}

function populateBookTables() {
    $.each(groups, function(groupInd, group) {
        addGroup(groupInd, group);
    });
}

function createLinkButton(url) {
    var linkD = linkDesc[url[1]];
    var sizeText = url[2] < 1024 ? url[2] + ' MB' : (url[2] / 1024).toFixed(1) + ' GB';
    var link = $('<a/>').addClass('button').attr('tip', linkD[2]).attr('href', url[0])
        .append($('<i/>').addClass('fa fa-lg ' + linkD[0]), $('<span/>').text(' ' + linkD[1] + ' ' + sizeText));
    if (url[1] == linkType.FOLDER) {
        link.attr('target', '_blank');
    }
    return link;
}