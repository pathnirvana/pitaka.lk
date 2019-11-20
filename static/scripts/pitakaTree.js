/**
 * Created by janaka_2 on 3/12/2014.
 */
(function ( $ ) {
    $.fn.pitakaTree = function () {
        pitakaTree.registerClick(this);
        $(this).children('ul').children('li:nth-child(2)').children('a').click(); // expand sutta nikaya by default
        return this;
    };

    $.fn.pitakaTreeOpenBranch = function (bookId) {
        this.pitakaTreeCollapse(); // collapse all other branches first
        var bookLi = $('li[node-id="' + bookId + '"]', this);
        bookLi.parents('li').each(function () {
            pitakaTree.showBranch($(this))
        });
        if (bookLi.attr('data-url')) {
            pitakaTree.loadAjaxBranch(bookLi)
        } else {
            pitakaTree.showBranch(bookLi);
        }
    };

    $.fn.pitakaTreeCollapse = function () {
        $('li.parent', this).removeClass('active').children('ul').slideUp('fast');
    };
} (jQuery));

// namespace for tree functions
var pitakaTree = {

    registerClick: function (tree) {
        tree.on('click', 'li > a', function () { // delegate to new ajax elements(li > a) as well
            var li = $(this).parent();
            if (li.is('[disabled]')) { // disabled tree node - do not do anything
                return;
            }
            if (li.hasClass('parent')) {
                if (li.attr('data-url')) {
                    pitakaTree.loadAjaxBranch(li); // not used at the moment
                } else if (li.attr('search-id')) {
                    populateTreeBranch(li); // on-demand load for bjt tree
                } else {
                    pitakaTree.toggleBranch(li);
                }
            } else {
                if (li.attr('node-id')) {
                    //$('#main-tabs').pitakaTabsOpenVagga('tree', li.attr('node-id'), [], li.attr('node-id'));
                    $.fn.pitakaTableOpenVagga('tree', li.attr('node-id'));
                } else if (li.attr('search-id')) {
                    navigateToIndex(li.attr('search-id'), 'tree'); // for bjt tree
                }
            }
        });
    },

    toggleBranch: function (li) {
        li.toggleClass('active').children('ul').slideToggle('fast');
    },

    showBranch: function (li) {
        li.addClass('active').children('ul').slideDown('fast');
    },

    loadAjaxBranch: function (li) {
        $.ajax({
            url: li.attr('data-url'),
            type: "GET",
            dataType: "text",
            success: function (result) {
                if (li.attr('data-url')) {
                    li.append(result);
                    li.removeAttr('data-url');
                    pitakaTree.toggleBranch(li);
                }
            },
            error: function (_1, _2, textError) {
                alert(textError);
            }
        });
    },

    /*setMaxHeight: function () {
        $('#main-tree').css('max-height', $(window).innerHeight() - $('#main-tree').offset().top);
    },*/

    getCollections: function(vaggaId) {
        return $('.pitaka-tree').find('li[node-id="'+ vaggaId +'"]').attr('collections').split(',');
    },

    /* get the pitaka/nikaya/book/vagga hierarchy as a string array */
    getHierarchy: function(vaggaId) {
        var vaggaLi = $('.pitaka-tree').find('li[node-id="'+ vaggaId +'"]');
        return jQuery.uniqueSort(vaggaLi.parents('li').add(vaggaLi).children('a')).map(function() {
            return $(this).text();
        }).get();
    }
};
