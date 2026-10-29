// The FM converter as it was in tools/unicode/fm_to_unicode.htm (git 6b8f8e5a), for regression tests.
// Generated - do not edit. Only the DOM access was replaced; pitakaNumberReplacements() is left out except its
// ක්‍ඳා fix, which the new converter keeps.
let text
var conso = Array();

	// following are not unicode consos - conjunct letters
	// but add them since uni font has glyps for them
	conso["CI"] = "ක්‍ෂ";
	conso["Cj"] = "ක්‍ව";
	conso["Ë"] = "ක්‍ෂ";
	conso["†"] = "ත්‍ථ";
	conso["…"] = "ත්‍ව";
	conso["‡"] = "න්‍ද";
	conso["JO"] = "න්‍ධ";
	conso["Š"] = "ද්‍ධ";
	conso["`O"] = "ද්‍ධ";
	conso["„"] = "ද්‍ව";
	conso["`j"] = "ද්‍ව";
	// following are unicode consos
	conso["`o"] = "ඳ"; // added
	conso["`P"] = "ඦ"; // added
	conso["`v"] = "ඬ"; // added
	conso["`."] = "ඟ"; // added
	conso["`y"] = "ඟ"; // not sure if this is correct -sagnaka ha does not exist
	conso["P"] = "ඡ"; //=
	conso["X"] = "ඞ";
	conso["r"] = "ර";
	conso["I"] = "ෂ";
	conso["U"] = "ඹ";
	conso["c"] = "ජ";
	conso["V"] = "ඪ";
	conso[">"] = "ඝ";
	conso["L"] = "ඛ";
	conso["<"] = "ළ";
	conso["K"] = "ණ";
	conso["M"] = "ඵ";
	conso["G"] = "ඨ";
	conso["¿"] = "ළු";
	conso["Y"] = "ශ";
	conso["["] = "ඤ";
	conso["{"] = "ඥ";
	conso["|"] = "ඳ";
	conso["~"] = "ඬ";
	conso["CO"] = "ඣ";
	conso["®"] = "ඣ";
	conso["Õ"] = "ඟ";
	conso["n"] = "බ";
	conso["p"] = "ච";
	conso["v"] = "ඩ";
	conso["M"] = "ඵ";
	conso["*"] = "ෆ";
	conso["."] = "ග";
	conso["y"] = "හ";
	conso["c"] = "ජ";
	conso["l"] = "ක";
	conso[","] = "ල";
	conso["u"] = "ම";
	conso["k"] = "න";
	conso["m"] = "ප";
	conso["o"] = "ද";
	conso["r"] = "ර";
	conso["i"] = "ස";
	conso["g"] = "ට";
	conso["j"] = "ව";
	conso[";"] = "ත";
	conso["N"] = "භ";
	conso["h"] = "ය";
	conso["O"] = "ධ";
	conso[":"] = "ථ";

	var nonRepeatVowel = ["ැ", "ෑ", "ි", "ී", "ු", "ූ", "්", "ා", "ෙ", "ේ", "ෛ", "ො", "ෝ", "ෲ", "ෘ"];

	function escapeRE(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	
function replaceSeq(fm_pre, fm_post, un_pre, un_post) {
		for (fm in conso) {
			var re = new RegExp(escapeRE(fm_pre + fm + fm_post), "g");
			text = text.replace(re, un_pre + conso[fm] + un_post);
		}
		return text;
	}

	
function startText(input) {
		text = input;  
		
		// correct common errors
		// match a and A. normalize two hal variants in to one
		text = text.replace(/A/g, "a");
		text = text.replace(/=/g, "q");
		text = text.replace(/\+/g, "Q");

		// multiple vowels of same type replaced by one
		text = text.replace(/a{2,}/g, "a"); //"්"
		text = text.replace(/q{2,}/g, "q"); //"ු"
		text = text.replace(/Q{2,}/g, "Q"); //"ූ",
		text = text.replace(/s{2,}/g, "s"); //"ි"
		text = text.replace(/S{2,}/g, "S"); //"ී"
		text = text.replace(/%{2,}/g, "%"); //rakaransaya

		// uncommon seqs - might want to replicate if common
		text = text.replace(/ff;%/g, "ත්‍රෛ");
		text = text.replace(/fm%!/g, "ප්‍රෞ");

		// repl
		//e.g. text = text.replace(/ffk/g, "නෛ");
		text = replaceSeq("ff", "", "", "ෛ");
		text = text.replace(/fft/g, "එෛ"); // special non-conso

		// repl
		//e.g. text = text.replace(/fkHda/g, "න්‍යෝ");
		text = replaceSeq("f", "Hda", "", "්‍යෝ");

		// repl
		//e.g. text = text.replace(/f;Hd/g, "ත්‍යො");
		text = replaceSeq("f", "Hd", "", "්‍යො");

		// repl
		// e.g. text = text.replace(/f;H/g, "ත්‍යෙ");
		text = replaceSeq("f", "H", "", "\u0DCA\u200D\u0DBA\u0DD9"); //්‍යෙ

		// repl
		text = text.replace(/fI%da/g, "ෂ්‍රෝ");
		text = text.replace(/f>%da/g, "‍ඝ්‍රෝ");
		text = text.replace(/fY%da/g, "ශ්‍රෝ");
		text = text.replace(/fCI%da/g, "ක්‍ෂ්‍රෝ");
		text = text.replace(/fË%da/g, "ක්‍ෂ්‍රෝ");
		text = text.replace(/fn%da/g, "බ්‍රෝ");
		text = text.replace(/fv%da/g, "ඩ්‍රෝ");
		text = text.replace(/f\*%da/g, "ෆ්‍රෝ");
		text = text.replace(/f\.%da/g, "ග්‍රෝ");
		text = text.replace(/fl%da/g, "ක්‍රෝ");
		text = text.replace(/fm%da/g, "ප්‍රෝ");
		text = text.replace(/føda/g, "ද්‍රෝ");
		text = text.replace(/fi%da/g, "ස්‍රෝ");
		text = text.replace(/fg%da/g, "ට්‍රෝ");
		text = text.replace(/f\;%da/g, "ත්‍රෝ");

		// repl
		text = text.replace(/fY%d/g, "ශ්‍රො");
		text = text.replace(/fv%d/g, "ඩ්‍රො");
		text = text.replace(/f\*%d/g, "ෆ්‍රො");
		text = text.replace(/f\.%d/g, "ග්‍රො");
		text = text.replace(/fl%d/g, "ක්‍රො");
		text = text.replace(/fm%d/g, "ප්‍රො");
		text = text.replace(/fi%d/g, "ස්‍රො");
		text = text.replace(/fg%d/g, "ට්‍රො");
		text = text.replace(/f\;%d/g, "ත්‍රො");

		// sp
		text = text.replace(/fød/g, "ද්‍රො");

		// repl
		text = text.replace(/%a/g, "a%"); // can swap
		text = text.replace(/fYa%/g, "ශ්‍රේ");
		text = text.replace(/f\*a%/g, "ෆ්‍රේ");
		text = text.replace(/f\.a%/g, "ග්‍රේ");
		text = text.replace(/fla%/g, "ක්‍රේ");
		text = text.replace(/fma%/g, "ප්‍රේ");
		text = text.replace(/fia%/g, "ස්‍රේ");
		text = text.replace(/f\;a%/g, "ත්‍රේ");

		//sp
		text = text.replace(/fí%/g, "බ්‍රේ");
		text = text.replace(/fâ%/g, "ඩ්‍රේ");
		text = text.replace(/føa/g, "ද්‍රේ");
		text = text.replace(/fè%/g, "ධ්‍රේ");

		// repl
		text = text.replace(/fI%/g, "ෂ්‍රෙ");
		text = text.replace(/fY%/g, "ශ්‍රෙ");
		text = text.replace(/fn%/g, "බ්‍රෙ");
		text = text.replace(/f\*%/g, "ෆ්‍රෙ");
		text = text.replace(/f\.%/g, "ග්‍රෙ");
		text = text.replace(/fl%/g, "ක්‍රෙ");
		text = text.replace(/fm%/g, "ප්‍රෙ");
		text = text.replace(/fi%/g, "ස්‍රෙ");
		text = text.replace(/f\;%/g, "ත්‍රෙ");
		text = text.replace(/fN%/g, "භ්‍රෙ");
		text = text.replace(/fO%/g, "ධ්‍රෙ");

		//sp
		text = text.replace(/fø/g, "ද්‍රෙ");

		// repl
		// e.g. text = text.replace(/fk!/g, "නෞ");
		text = replaceSeq("f", "!", "", "ෞ");

		// repl
		// e.g. text = text.replace(/fkda/g, "නෝ");
		text = replaceSeq("f", "da", "", "ෝ");

		// repl
		// e.g. text = text.replace(/fkd/g, "නො");
		text = replaceSeq("f", "d", "", "ො");

		// repl
		// e.g. text = text.replace(/fka/g, "නේ");
		text = replaceSeq("f", "a", "", "ේ");
		//text = replaceSeq("f", "A", "", "ේ"); // shorter hal glyph is 'A' e.g. in ළේ

		// sp
		text = text.replace(/fþ/g, "ඡේ");
		text = text.replace(/fÜ/g, "ටේ");
		text = text.replace(/fõ/g, "වේ");
		text = text.replace(/fò/g, "ඹේ");
		text = text.replace(/fï/g, "මේ");
		text = text.replace(/fí/g, "බේ");
		text = text.replace(/fè/g, "ධේ");
		text = text.replace(/fâ/g, "ඩේ");
		text = text.replace(/få/g, "ඬේ");
		text = text.replace(/fÙ/g, "ඞේ");
		text = text.replace(/f¾/g, "රේ");
		text = text.replace(/fÄ/g, "ඛේ");
		text = text.replace(/fÉ/g, "චේ");
		text = text.replace(/fÊ/g, "ජේ");

		// repl
		// e.g. text = text.replace(/fk/g, "නෙ");
		text = replaceSeq("f", "", "", "ෙ");

		text = text.replace(/hH_/g, "ර්‍ය්‍ය"); //ර්ය  
		text = text.replace(/hœ/g, "ර්‍ය්‍ය"); //ර්‍්‍ය
		// the font does not seem to support ර්‍්‍ය for anything other than ය 
		// so keep the replication disabled for now
		//text = replaceSeq("", "H_", "\u0DBB\u0DCA\u200D", "්‍ය");
		//text = replaceSeq("", "œ", "\u0DBB\u0DCA\u200D", "්‍ය");
		// e.g. text = text.replace(/h_/g, "ර්‍ය");  // added 
		text = replaceSeq("", "_", "\u0DBB\u0DCA\u200D", "");
		// use replication rules to replace above

		// --------- special letters (mostly special glyphs in the FM font)
		text = text.replace(/rE/g, "රූ");
		text = text.replace(/re/g, "රු");
		text = text.replace(/\?/g, "රෑ"); //added
		text = text.replace(/\//g, "රැ"); //=
		text = text.replace(/ƒ/g, "ඳැ"); //=
		text = text.replace(/\\/g, "ඳා"); //added
		text = text.replace(/Æ/g, "ලූ");
		text = text.replace(/¨/g, "ලු"); //corrected
		text = text.replace(/ø/g, "ද්‍ර");
		text = text.replace(/÷/g, "ඳු");
		text = text.replace(/`ÿ/g, "ඳු"); //added
		text = text.replace(/ÿ/g, "දු");
		text = text.replace(/ª/g, "ඳූ"); //added
		text = text.replace(/`¥/g, "ඳූ"); //added
		text = text.replace(/¥/g, "දූ"); //added
		//text = text.replace(/μ/g, "ද්‍ය"); //one version of the FM fonts use this
		text = text.replace(/ü/g, "ඤූ"); //=
		text = text.replace(/û/g, "ඤු"); //=
		text = text.replace(/£/g, "ඳී");
		text = text.replace(/`§/g, "ඳී");
		text = text.replace(/§/g, "දී");
		text = text.replace(/°/g, "ඣී");
		text = text.replace(/Á/g, "ඨී");
		text = text.replace(/Â/g, "ඡී");
		text = text.replace(/Ç/g, "ඛී");
		text = text.replace(/Í/g, "රී");
		text = text.replace(/Ð/g, "ඪී");
		text = text.replace(/Ò/g, "ථී");
		text = text.replace(/Ô/g, "ජී");
		text = text.replace(/Ö/g, "චී");
		text = text.replace(/Ú/g, "ඵී");
		text = text.replace(/Ý/g, "ඵී");
		text = text.replace(/à/g, "ටී");
		text = text.replace(/é/g, "ඬී");
		text = text.replace(/`ã/g, "ඬී");
		text = text.replace(/ã/g, "ඩී");
		text = text.replace(/ë/g, "ධී");
		text = text.replace(/î/g, "බී");
		text = text.replace(/ó/g, "මී");
		text = text.replace(/ö/g, "ඹී");
		text = text.replace(/ù/g, "වී");
		text = text.replace(/Ú/g, "ඵී");
		text = text.replace(/Œ/g, "ණී");
		text = text.replace(/“/g, " ර්‍ණ");
		text = text.replace(/¢/g, "ඳි");
		text = text.replace(/`È/g, "ඳි");
		text = text.replace(/È/g, "දි");
		text = text.replace(/¯/g, "ඣි");
		text = text.replace(/À/g, "ඨි");
		text = text.replace(/Å/g, "ඛි");
		text = text.replace(/ß/g, "රි");
		text = text.replace(/Î/g, "ඪි");
		text = text.replace(/Ñ/g, "චි");
		text = text.replace(/Ó/g, "ථි");
		text = text.replace(/á/g, "ටි");
		text = text.replace(/ç/g, "ඬි");
		text = text.replace(/`ä/g, "ඬි");
		text = text.replace(/ä/g, "ඩි");
		text = text.replace(/ê/g, "ධි");
		text = text.replace(/ì/g, "බි");
		text = text.replace(/ñ/g, "මි");
		text = text.replace(/ý/g, "ඡි"); //added
		text = text.replace(/ð/g, "ජි");
		text = text.replace(/ô/g, "ඹි");
		text = text.replace(/ú/g, "වි");
		text = text.replace(/ˉ/g, "ඣි");
		text = text.replace(/‚/g, "ණි");
		text = text.replace(/‹/g, "ද්‍ධි"); //added
		text = text.replace(/‰/g, "ද්‍වි"); //added
		text = text.replace(/þ/g, "ඡ්");
		text = text.replace(/Ü/g, "ට්");
		text = text.replace(/õ/g, "ව්");
		text = text.replace(/ò/g, "ඹ්");
		text = text.replace(/ï/g, "ම්");
		text = text.replace(/í/g, "බ්");
		text = text.replace(/è/g, "ධ්");
		text = text.replace(/â/g, "ඩ්");
		text = text.replace(/å/g, "ඬ්");
		text = text.replace(/`Ù/g, "ඬ්");
		text = text.replace(/Ù/g, "ඞ්");
		text = text.replace(/¾/g, "ර්");
		text = text.replace(/Ä/g, "ඛ්");
		text = text.replace(/É/g, "ච්");
		text = text.replace(/Ê/g, "ජ්");
		text = text.replace(/×/g, "ඥා"); //ඥ
		text = text.replace(/Ø/g, "ඤා"); //ඤ
		text = text.replace(/F/g, "ත්‍"); // todo - can we make bandi akuru for these
		text = text.replace(/J/g, "න්‍");
		text = text.replace(/Þ/g, "දා");
		text = text.replace(/±/g, "දැ");
		text = text.replace(/ˆ/g, "න්‍දා");
		text = text.replace(/›/g, "ශ්‍රී");


		// --------------- vowels
		text = text.replace(/ft/g, "ඓ");
		text = text.replace(/T!/g, "ඖ");
		text = text.replace(/W!/g, "ඌ");
		text = text.replace(/wE/g, "ඈ");
		text = text.replace(/wd/g, "ආ");
		text = text.replace(/we/g, "ඇ");
		text = text.replace(/ta/g, "ඒ");
		text = text.replace(/RD/g, "ඎ");
		text = text.replace(/R/g, "ඍ");
		text = text.replace(/Ï/g, "ඐ");
		text = text.replace(/´/g, "ඕ");
		text = text.replace(/Ta/g, "ඕ"); //error correcting
		text = text.replace(/Ì/g, "ඏ");
		text = text.replace(/b/g, "ඉ");
		text = text.replace(/B/g, "ඊ");
		text = text.replace(/t/g, "එ");
		text = text.replace(/T/g, "ඔ");
		text = text.replace(/W/g, "උ");
		text = text.replace(/w/g, "අ");

		// few special cases
		text = text.replace(/`Co/g, "ඤ");
		text = text.replace(/`G/g, "ට්ඨ"); // very rare

		// -----------consonants repl
		// e.g. text = text.replace(/k/g, "න");
		text = replaceSeq("", "", "", "");

		// needed to cover the cases like ක්‍ෂ that are not included in consonants 
		text = text.replace(/C/g, "ක්‍");

		// ------- dependant vowels
		text = text.replace(/s%/g, "%s"); // this set added
		text = text.replace(/S%/g, "%S");
		text = text.replace(/%s/g, "්‍රි"); // e.g ත්‍රි
		text = text.replace(/%S/g, "්‍රී"); // e.g. ත්‍රී

		text = text.replace(/H/g, "්‍ය"); // works fine
		text = text.replace(/%/g, "්‍ර"); // changed
		//text = text.replace(/f/g, "ෙ"); //  removed - not working
		text = text.replace(/e/g, "ැ");
		text = text.replace(/E/g, "ෑ");
		text = text.replace(/q/g, "ු");
		text = text.replace(/Q/g, "ූ");
		text = text.replace(/s/g, "ි");
		text = text.replace(/S/g, "ී");
		text = text.replace(/DD/g, "ෲ");
		text = text.replace(/D/g, "ෘ");
		text = text.replace(/!!/g, "ෳ");
		text = text.replace(/!/g, "ෟ");
		text = text.replace(/d/g, "ා");
		text = text.replace(/a/g, "්");
		text = text.replace(/x/g, "ං");
		text = text.replace(/#/g, "ඃ");
		text = text.replace(/ ’/g, "ී");
		text = text.replace(/ ‘/g, "ි");


		// ----------- ascii chars
		text = text.replace(/'/g, ".");
		text = text.replace(/"/g, ",");
		text = text.replace(/˜/g, "”");
		text = text.replace(/—/g, "“");
		text = text.replace(/™/g, "{");
		text = text.replace(/š/g, "}");
		text = text.replace(/ /g, "'");
		text = text.replace(/•/g, "■");
		text = text.replace(/²/g, "●");
		text = text.replace(/Ã/g, "▲");
		text = text.replace(/­/g, "÷");
		// text = text.replace(/−/g, "÷"); //removed - matched below
		text = text.replace(/¬/g, "+");
		text = text.replace(/«/g, "×");
		text = text.replace(/}/g, "=");
		// text = text.replace(/”/g, "□"); //removed - keep as is
		text = text.replace(/æ/g, "!");
		text = text.replace(/\$/g, "/");
		text = text.replace(/\(/g, ":");
		text = text.replace(/\)/g, "*");
		text = text.replace(/&/g, ")"); //order changed from above
		text = text.replace(/-/g, "-");
		text = text.replace(/@/g, "?");
		text = text.replace(/ZZ/g, "”"); //added
		text = text.replace(/Z/g, "’");
		text = text.replace(/zz/g, "“"); //added
		text = text.replace(/z/g, "‘");
		text = text.replace(/]/g, "%");
		text = text.replace(/\^/g, "(");
		text = text.replace(/¡/g, "-");
		// text = text.replace(/¤/g, "–"); // removed
		text = text.replace(/\¦/g, ";");
		text = text.replace(/³/g, "★");
		text = text.replace(/µ/g, "i"); 
		text = text.replace(/μ/g, "i"); //not the same μ as above
		text = text.replace(/¶/g, "v");
		text = text.replace(/·/g, "x");
		text = text.replace(/∙/g, "x");
		text = text.replace(/¸/g, "I"); // not the comma
		text = text.replace(/¹/g, "V");
		text = text.replace(/º/g, "X");
		text = text.replace(/\u0080/g, " ");
		text = text.replace(/ı/g, " ");
		text = text.replace(/Ÿ/g, "˚");
		
		
	text = text.replace(/ක්‍ඳා/g, "ඤා")
	return text
}
module.exports = startText
