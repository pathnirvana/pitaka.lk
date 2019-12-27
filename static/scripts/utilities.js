 /**
 * Created by Janaka Liyanage on 16/12/2014.
 */
var utilScriptPath = $("script[src]").last().attr("src").split('?')[0].split('/').slice(0, -1).join('/')+'/';

function loadXmlDoc(filename, func) {
    var args = arguments;
    return $.ajax({
        url: utilScriptPath + '../' + filename,
        type: "GET",
        dataType: "xml",
        success: function (data, _1, _2) {
            func(data, args[2], args[3], args[4]);
        },
        error: function (_1, status, textError) {
            alert(status + ": " + textError);
        }
    });
}
// this is only used in misc scripts - todo make a general function
function loadTextDoc(filename, func) {
    var args = arguments;
    return $.ajax({
        url: utilScriptPath + '../' + filename,
        type: "GET",
        dataType: "text",
        success: function (data, _1, _2) {
            func(data, args[2], args[3], args[4]);
        },
        error: function (_1, status, textError) {
            alert(status + ": " + textError);
        }
    });
}

function saveXmlDoc(filename, data, password) {
    var docRoot = '../../'; // relative to the write_file.php
    return $.ajax({
        url: utilScriptPath + '../' + 'dev/php/write_file.php',
        type: "POST",
        data: {
            file_name: docRoot + filename,
            password: password,
            file_contents: data
        },
        dataType: "text",
        error: function (_1, status, textError) {
            alert(status + ": " + textError);
        }
    });
}

function downloadFile(filename, xml) {
    var a = window.document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([xml], {type: 'text/xml'}));
    a.download = filename.split("/").pop();

    // Append anchor to body.
    document.body.appendChild(a);
    a.click();

    // Remove anchor from body
    document.body.removeChild(a)
}

function UrlExists(filename) {
    var http = new XMLHttpRequest();
    http.open('HEAD', utilScriptPath + '../' + filename, false);
    http.send();
    return http.status != 404;
}

function prepareXmlOutput(root) {
    var output = root.html().replace(/xmlns=\"http\:\/\/www\.w3\.org\/1999\/xhtml\" /g, '');
    output = output.replace(/–/g, '\u002D');
    output = output.replace(/…/g, '...');
    output = output.replace(/‚/g, ',');
    output = output.replace(/´/g, '’');
    output = output.replace(/\u200C/g, '');
    output = output.replace(/\u200D\u0DCA\u200D\u0DBB/g, '\u0DCA\u200D\u0DBB'); //rakar fixing

    return vkbeautify.xml(output.trim());
}

function prepareXmlTextSave(output) {
    output = output.replace(/style="[^"]*"/g, ""); //style attr
    output = output.replace(/data\-span_id="[^"]*"/g, ""); // data_span-id attr
    return output.replace(/sc_collapsed/g, ""); // collapsed class
}

function prepareJsonOutput(jsonObj) {
    return vkbeautify.json(JSON.stringify(jsonObj).replace(/\u200C/g, ''));
}

function escapeRE(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

function getParameterByName(name, defVal) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? defVal : decodeURIComponent(results[1].replace(/\+/g, " "));
}

 /**
  * DIALOG RELATED CODE
  */
 var DialogNames = {
    LINK_REPORT: 'dialog_link_report',
    STATIC: 'dialog_static',
    SELECT_BOOK: 'dialog_select_book'
};
var dialogSettings = {}; // way to pass setting in to dialog html files
function repositionDialog() {
    // get the screen height and width
    var maskHeight = Math.min($(document).height(), $(window).height());
    var maskWidth = $(window).width();
    if (maskWidth < 500) {
        $('#dialog-box').css('min-width', maskWidth);
    }

    // assign values to the overlay and dialog box
    $('#dialog-overlay').css({height:maskHeight, width:maskWidth});
}

function copyTextAndShowToast(copyText, toastMsg) {
    const el = document.createElement('textarea');
    el.value = copyText;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

    var toast = $('#toast').text(toastMsg).fadeIn(300);
    // After 3 seconds, remove the show class from DIV
    setTimeout(function(){ toast.fadeOut(); }, 3000);
}
function showToast(toastMsg, duration) {
    var toast = $('#toast').text(toastMsg).fadeIn(300);
    // After duration miliseconds, remove the show class from DIV
    var durationMS = duration || 3000; // incase of not defined use default 3000
    setTimeout(function(){ toast.fadeOut(); }, durationMS);
}

// function to determine the browser OS
// currently used for disabling tooltips 
function getOS() {
    var userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;
  
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
  
    return os;
  }  
/**
 * TOOLTIP Related code
 * when names are mouseover'ed show the value in the tip attr as the tooltip
 */
//var isAndroid = getParameterByName('android', 0);
var toolTipDelay = 1000, toolTipTimeoutConst;
function showToolTip() {
    var os = getOS();
    if (os == 'Android' || os == 'iOS') return; // no tooltips on mobile platform
    toolTipTimeoutConst = setTimeout(_.bind(function () { // delay showing the tip
        var tipText = $(this).attr('tip');
        var tip = $('<span/>').addClass('tooltip').text(tipText).appendTo($('body'));
        // position
        var left = $(this).offset().left;
        var top = $(this).offset().top + $(this).outerHeight();
        if ($(this).hasClass('tipright')) {
            tip.css({left:left - 150, top:top}).fadeIn(400);
        } else {
            tip.css({left:left, top:top}).fadeIn(400);
        }
    }, $(this)), toolTipDelay);
}

// Remove the tooltip on mouseout
function hideToolTip() {
    clearTimeout(toolTipTimeoutConst);
    $('.tooltip').remove();
}

// set dark mode between 7pm and 6am unless user has manually set the mode before
function autoSetDarkMode() {
    var darkMode = localStorage.getItem('dark-mode')
    if (darkMode) {
        $('body').toggleClass('dark', darkMode == 'dark');
        return;
    }
    var hour = (new Date()).getHours();
    if (hour >= 19 || hour <= 6) {
        $('body').addClass('dark');
    }
}
$('#dark-toggle').click(function (e) {
    $('body').toggleClass('dark');
    if ($('body').hasClass('dark')) {
        localStorage.setItem('dark-mode', 'dark')
        showToast('රාත්‍රී අඳුරු තිරය ක්‍රියාත්මකයි');
    } else {
        localStorage.setItem('dark-mode', 'light')
        showToast('ආලෝකමත් තිරය ක්‍රියාත්මකයි');
    }
});


// location related code
var CollectionsList = {
    'pali-cs': { short: 'cs', medium: 'Chatta S', long: 'Chattha (Sixth) Sangayana Pali'},
    'sinh-aps': { short: 'aps', medium: 'A P Soysa', long: 'A.P. de Soyza Sinhala' },
    'sinh-kg': { short: 'kg', medium: 'K Gnanananda', long: 'Kiribathgoda Gnanananda Thero Sinhala'},
    'sinh-bj': { short: 'bj', medium: 'B Jayanthi', long: 'Buddha Jayanthi Tripitaka Sinhala'}
};

var UrlParamNames = {
    NODE: 'node',
    PARA: 'para'
};
// e.g. location url pitaka.lk/15111/12/cs,kk
// url rewritten pitaka.lk/?node=15111&para=12&coll=cs,kk
function getStartupLocation() {
    var nodeId = getParameterByName('n', 0),
        paragraphId = getParameterByName('p', 0);
    // colls no longer supported - open cs and aps in both cases
    /*colls = colls ? colls.split(',') : ['cs', 'aps'];
    var collNames = [];
    $.each(colls, function(_1, coll) {
       for (var collName in CollectionsList) {
           if (CollectionsList[collName].short == coll) {
               collNames.push(collName);
           }
       }
    });*/
    if (!$.isNumeric(paragraphId)) {
        paragraphId = 0;
    }
    if (!nodeId || !$.isNumeric(nodeId) || (+nodeId) < 1000) {
        return false
    }
    return createLocationObj(nodeId, paragraphId);
}

function createLocationObj(nodeId, paragraphId) {
    var bookId = nodeId.substr(0, 2), vaggaId = nodeId.length >= 4 ? nodeId.substr(0, 4) : (bookId + '10'); // select the first vagga of  the book if node==book
    nodeId = (nodeId.length > 4) ? nodeId : 0; // incase node==vagga/book, nodeId is not needed
    return { bookId: +(bookId), vaggaId: +(vaggaId), nodeId: +(nodeId), paragraphId: +(paragraphId)};
}

function pitakaLkOpenLocation(loc, origin) {
    console.log(JSON.stringify(loc));
    $('.pitaka-tree').pitakaTreeOpenBranch(loc.bookId);
    $.fn.pitakaTableOpenVagga(origin, loc.vaggaId, loc.nodeId, loc.paragraphId);
}