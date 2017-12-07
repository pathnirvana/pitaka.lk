/**
 * Created by janaka_2 on 5/12/2014.
 */
(function ( $ ) {
    $.fn.pitakaTabs = function () {
        getActiveTab(this).show(); // show the active tab
        registerTabClicks(this);
        return $(this);
    };

    function registerTabClicks(tabs) {
        // handle tab clicks
        $('.tab-links', tabs).on('click', 'li', function (e) { // delegate to new elements(tabs) too
            var tabId = $(this).attr('id');
            if (tabId == '#pitaka-tab-new') { //clicking on the newtab - create a newtab and focus
                tabId = createNewPitakaTab(tabs, 'last');
            }
            changePitakaTabFocus(tabId);
        });
        // close icon click handler
        $('.tab-links', tabs).on('click', '.close-icon', function (e) { // delegate to new elements(tabs) too
            var tabId = $(this).parent().attr('id');
            closePitakaTab(tabId);
            e.stopPropagation(); // prevent parent li click - since icon is inside the li
        });
        // close tab column handler
        $('.tab-content', tabs).on('click', '.close-icon', function (e) {
            var tabId = $(this).data('tabId');
            var tabColumns = $('.tab-column', $(tabId));
            if (tabColumns.length <= 1) { // not allow closing the last column
                return;
            }
            $(this).parent().remove();
            tabColumns.removeClass('half').find('div').height('auto');
            cbTabColumnsUpdated(tabId);
        });
        // text clicks - delegated
        $('.tab-content', tabs).on('click', 'span.subhead', function (e) { // span.chapter removed from here due to perf reasons
            var span_id = $(this).attr('data-span_id');
            var spans = $('span[data-span_id="' + span_id + '"]', tabs).add(this);
            spans.parent().height('auto');
            spans.toggleClass('sc_collapsed').siblings("div").slideToggle('slow');
            spans.siblings("div").promise().done(function(){
                balanceTextDivs($(spans[0]).parent(), $(spans[1]).parent(), 2, false); // only balance the clicked subhead
                if (!spans.hasClass('sc_collapsed')) {
                    getActiveTab(tabs).scrollTop($(this).parent().position().top);
                }
            });
        }).on('click', 'span.title', function (e) { // on click bring it to the top - useful in opening a location
            getActiveTab(tabs).scrollTop($(this).parent().position().top);
        }).on('mouseenter', 'span.chapter, span.title, span.subhead, span.paranum', function(e) {
            $(this).append('<span class="span-links"><i class="fa fa-link" title="සබැඳියාව" type="link"></i>&nbsp;<i class="fa fa-minus-circle" title="වරදක්" type="error"></i></span>');
        }).on('mouseleave', 'span.chapter, span.title, span.subhead, span.paranum', function(e) {
            $(this).children('.span-links').remove();
        });
        // span links
        $('.tab-content', tabs).on('click', '.span-links i', function (e) {
            showSpanLinksDialog($(this));
            e.stopPropagation();
        });
        /*$('.tab-content', tabs).on('click', '.edit-textinput', function (e) { // prevent collapse when clicked on text input
            e.stopPropagation();
        });*/
    }

    function showSpanLinksDialog(icon) {
        var nodeId = icon.parents('div.chapter, div.title, div.subhead').first().attr('node-id');
        if (!nodeId) {
            return;
        }
        var colls = getCurrentColumns(getTabId(getActiveTab()));
        var paraId = icon.parents('div.paragraph').first().attr('para');
        dialogSettings = { nodeId: nodeId, paragraphId: paraId, collections: colls};
        showDialog(DialogNames.LINK_REPORT, icon.attr('type'));
    }

    function createNewPitakaTab(tabs, tabLocation) {
        var tabId = '#pitaka-tab' + Math.floor((Math.random() * 1000) + 1);
        var newTabLi = $('<li/>').attr('id', tabId).append('<a>අළුත් ටැබය</a><span class="close-icon"/>');
        if (tabLocation == 'last') {
            $('[id="#pitaka-tab-new"]').before(newTabLi);
        } else {
            $('[id="#pitaka-tab-search"]').after(newTabLi);
        }
        //tabBefore.before('<li id="' + tabId + '"><a>අළුත් ටැබය</a><span class="close-icon"/></li>');
        var newTab = $('<div/>').addClass('tab').attr('id', tabId.substr(1));
        tabs.children('.tab-content').append(newTab); //todo set some default content
        return tabId;
    }

    function changePitakaTabFocus(tabId) {
        $(tabId).addClass('active').fadeIn(400).siblings().removeClass('active').hide();
        getTabHeader(tabId).addClass('active').siblings().removeClass('active');
        // call change columns callback
        cbTabColumnsUpdated(tabId);
    }

    function closePitakaTab(tabId) {
        var tabLi = getTabHeader(tabId);
        if (tabLi.siblings().length <= 2) {
            return; // do not close the last tab
        }
        if (tabLi.hasClass('active')) { // make another tab active
            var firstId = tabLi.siblings().first().attr('id'); // just select the first tab
            changePitakaTabFocus(firstId);
        }
        $(tabId).remove();
        tabLi.remove();
    }

    // get a subset of collections to be displayed by default for a tab
    // select pali coll and one of available sinhala collections
    function getDefaultColumns(availColls) {
        var columns = ['pali-cs'];
        $.each(availColls, function(_1, coll) {
            if (getCollectionLanguage(coll) == 'sinh') {
                columns.push(coll);
                return false;
            }
        });
        return columns;
    }

    /*
    depending on the origin of the click decide which tab to open the content - search, tree, startup
     */
    function getTabToOpenContent(origin) {
        // if origin is search, create a new tab - else use the active tab which is not the search tab
        var newTabId = '';
        if (origin == 'search') {
            newTabId = createNewPitakaTab($('#main-tabs'), 'first');
            changePitakaTabFocus(newTabId);
        } else {
            if ((newTabId = getTabId(getActiveTab())) == '#pitaka-tab-search') {
                newTabId = $('[id="#pitaka-tab-search"]').next().attr('id');
                changePitakaTabFocus(newTabId);
            }
        }
        return $(newTabId);
    }

    /*
    Show the tab given by the index (1 based). Currently used to show the search tab
     */
    $.fn.pitakaTabsShowTab = function (tabIndex) {
        var tabId = $('.tab-links li:nth-child(' + tabIndex + ')').attr('id');
        changePitakaTabFocus(tabId);
    };
    /**
     * Sets the contents of all columns
     */
    $.fn.pitakaTabsOpenVagga = function (origin, vaggaId, forceColls) {
        console.log(vaggaId, forceColls);
        //var tab = getActiveTab(this);
        var tab = getTabToOpenContent(origin);
        var columns = getCurrentColumns(tab);
        var availColls = pitakaTree.getCollections(vaggaId);
        if (forceColls.length) {
            columns = forceColls;
        }
        if (!columns.length) {
            columns = getDefaultColumns(availColls);
        }

        columns = columns.filter(function(n) { // should be a subset of the availColls, so do array intersection
            return availColls.indexOf(n) != -1;
        });

        var vaggaFileId = 'vagga_' + vaggaId + '.xml';
        tab.empty().append('<br style="clear:both;" />').data('target-id', vaggaFileId).data('avail-colls', availColls);
        var deferred = [];
        for (var i = 0; i < columns.length; i++) {
            deferred.push($(this).pitakaTabsSetColumn(getTabId(tab), columns[i]));
        }
        return $.when.apply($, deferred);
    };

    $.fn.pitakaTabsOpenSutta = function (origin, location) {
        $('#main-tabs').pitakaTabsOpenVagga(origin, location.vaggaId, location.collection).done(function() {
            var tab = getActiveTab();
            var highlightPara = [];
            if (location.paragraphId) {
                highlightPara = $('div.paragraph[para="' + location.paragraphId + '"]', tab);
                if (highlightPara.length) {
                    highlightPara.css('background-color', 'lightyellow');
                    location.nodeId = highlightPara.parents('div.subhead').attr('node-id');
                }
            }
            var divsToOpen = $('div[node-id="'+ location.nodeId +'"]', tab);
            divsToOpen.first().children('span').click();
            if (highlightPara.length) {
                divsToOpen.children('div').promise().done(function() {
                    tab.scrollTop(highlightPara.position().top);
                });
            }
        });
    };

    // add a div or get the div to be replaced
    function getReplaceTextDiv(tabId, collection) {
        var colLang = getCollectionLanguage(collection), tab = $(tabId);
        var textDiv = $('.text-section[collection^="' + colLang + '"]', tab);
        if (!textDiv.length) { // new column need to be created/added
            textDiv = $('<div/>').addClass('text-section');
            var closeButton = $('<span/>').addClass('text-action').addClass('close-icon').data('tabId', getTabId(tab));
            var collectionInfo = $('<div/>').addClass('collection-info');
            var tabColumn = $('<div/>').addClass('tab-column').append(closeButton, collectionInfo, textDiv);
            if (colLang == 'pali') {
                tab.prepend(tabColumn); // insert as the first column
            } else {
                tab.children('br').before(tabColumn); // insert before the last br
            }
        }
        textDiv.siblings('.collection-info').html(CollectionsList[collection].long);
        textDiv.attr('collection', collection);
        return textDiv;
    }

    // set a specific column to a collection
    $.fn.pitakaTabsSetColumn = function (tabId, collection) {
        var replaceDiv = getReplaceTextDiv(tabId, collection);
        return loadTextToColumn(replaceDiv, tabId, collection);
    };
    /**
     * load and replace the existing content on the textDiv
     */
    function loadTextToColumn(textDiv, tabId, collection) {
        var doneLoading = new $.Deferred(), tab = $(tabId);
        var targetUrl = 'text/' + collection + '/' + tab.data('target-id');
        BusyTab.add('loading', tabId);
        textDiv.load(targetUrl, '', function(response, status, xhr) {
            BusyTab.remove('loading', tabId);
            hideAllSubheads($(this)); // start all collapsed
            if (status == 'error') {
                var msg = "සූත්‍ර දේශනාව ලබා ගැනීමේදී දෝෂයක් සිදුවූ බව කණගාටුවෙන් දැනුම් දෙමු . : ";
                textDiv.html( msg + xhr.status + " " + xhr.statusText + ". Url: " + targetUrl);
                setTabHeaderError(tabId);
                doneLoading.reject(xhr.status);
            } else {
                var textDivs = $('.text-section', tab).not(textDiv);
                if (textDivs.length == 1 && BusyTab.get('loading', tabId) == 0) {
                    $('.tab-column', tab).addClass('half');
                    BusyTab.add('opening', tabId);
                    setTimeout(function() {
                        syncShowSubheads($(textDivs[0]), textDiv);
                        balanceTextDivs($(textDivs[0]), textDiv, 3, true);
                        BusyTab.remove('opening', tabId);
                    }, 10);
                }
                doneLoading.resolve();
            }
            cbTabColumnsUpdated(tabId);
        });
        return doneLoading.promise(); // so calling methods can do things after content is loaded
    }

    var textDivLevels = ['paragraph', 'subhead-contents', 'subhead']; // subhead-contents only needed for editing(balancing textareas)
    function balanceTextDivs(div1, div2, uptoLevel, doAssoc) {
        if (!div1.length || !div2.length) {
            return;
        }
        $.each(textDivLevels.slice(0, uptoLevel), function(level, divClass) {
            var subDivs1 = $('div:visible.' + divClass, div1), subDivs2 = $('div:visible.' + divClass, div2);
            if (subDivs1.length != subDivs2.length) {
                console.log('Balance Height error: At ' + divClass + ' different number of children ' + subDivs1.length + ' and ' + subDivs2.length);
                return true;
            }

            subDivs1.each(function (i) {
                var pair = $(this).add($(subDivs2[i])).height('auto');
                var h = Math.max($(this).height(), $(subDivs2[i]).height());
                pair.height(h); // balancing step
                if (doAssoc && divClass == 'subhead') {
                    registerMatchingSpans($(this), $(subDivs2[i]));
                }
            });
        });
    }

    function registerMatchingSpans(div1, div2) {
        var span_id = Math.floor((Math.random() * 1000000) + 1);
        div1.add(div2).children('span').attr('data-span_id', span_id);
    }

    $.fn.pitakaTabsResize = function () {
        var tabContent = $('.tab-content', $(this));
        tabContent.css('max-height', $(window).innerHeight() - tabContent.offset().top - 20); // todo remove 20
        var textDivs = $('.text-section', getActiveTab(this));
        if (textDivs.length == 2) {
            balanceTextDivs($(textDivs[0]), $(textDivs[1]), 3, false);
        }
    };

    function getActiveTab(tabs) {
        return $('.tab.active', tabs || $('#main-tabs'));
    }
    function getTabId(tab) {
        return '#' + tab.attr('id');
    }

    $.fn.pitakaTabsToggleText = function (groupClass, show) {
        var tab = getActiveTab(this);
        var spans = tab.find('span.' + groupClass);
        if (show) {
            BusyTab.add('opening', getTabId(tab));
            setTimeout(function() {
                spans.removeClass('sc_collapsed').siblings('div').height('auto').css({display: 'block'});
                $(window).resize();
                BusyTab.remove('opening', getTabId(tab));
            }, 10);
        } else {
            spans.addClass('sc_collapsed').siblings('div').css({display: 'none'}).height('auto');
            $(window).resize();
        }
        return $(this);
    };
    function hideAllSubheads(textDiv) {
        $('span.subhead', textDiv).addClass('sc_collapsed').siblings('div').hide().height('auto');
    }
    function syncShowSubheads(master, slave) {
        var tab = getActiveTab();
        var mDivs = $('span.subhead', master), sDivs = $('span.subhead', slave);
        if (mDivs.length != sDivs.length) {
            console.error("syncShowSubheads fail - textdivs have different number of subheads");
            return;
        }
        sDivs.each(function(i){
            var collapsed = $(mDivs[i]).hasClass('sc_collapsed');
            $(this).toggleClass('sc_collapsed', collapsed).siblings('div').toggle(!collapsed);
        });
    }

    // get the language part of the collection
    function getCollectionLanguage(coll) {
        return coll.substr(0, 4);
    }
    // callback when the tab columns get updated
    function cbTabColumnsUpdated(tabId) {
        var curColumns = getCurrentColumns(tabId);

        // set the collection buttons on the toolbar
        $('#right-toolbar a.button[collection]').remove();
        var availColls = $(tabId).data('avail-colls') || [];
        $.each(availColls, function (i, coll) {
            if ($.inArray(coll, curColumns) == -1) { // add only if the collection not already in the columns
                var btnText = '<i class="fa fa-book fa-lg"></i> ' + CollectionsList[coll].medium;
                var button = $('<a/>').html(btnText).attr('collection', coll).addClass('button btn-coll-' + getCollectionLanguage(coll));
                button.click(function () {
                    $('#main-tabs').pitakaTabsSetColumn(tabId, $(this).attr('collection'));
                });
                $('#right-toolbar').append(button);
            }
        });
    }
}( jQuery ));