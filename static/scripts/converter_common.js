/**
 * Created by Janaka on 2017-01-15.
 */

// global variable to avoid passing it to all functions
var text = '';

function replaceRe(f, r) {
    var re = new RegExp(f, "gi");
    text = text.replace(re, r);
}

function genericConvert(dir, conso_combi, specials) {
    conso_combi.sort(function(a, b) {
        return b[dir].length - a[dir].length;
    });
    $.each(conso_combi, function(_1, cc) {
        if (cc.length < 3 || cc[2] == dir) {
            replaceRe(cc[dir], cc[+!dir]);
        }
    });

    specials.sort(function(a, b) {
        return b[dir].length - a[dir].length;
    });
    $.each(specials, function(_1, v) {
        if (v.length < 3 || v[2] == dir) {
            replaceRe(v[dir], v[+!dir]);
        }
    });
}

// create permutations
function createConsoCombi(combinations, consonants) {
    var conso_combi = [];
    $.each(combinations, function (_1, combi) {
        $.each(consonants, function (_2, conso) {
            var cc = [conso[0] + combi[2], combi[0] + conso[1] + combi[1]];
            if (conso.length > 2) { // add one-way direction if any
                cc.push(conso[2]);
            }
            conso_combi.push(cc);
        });
    });
    return conso_combi;
}