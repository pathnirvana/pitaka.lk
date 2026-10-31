import { model } from './singlish-model.js'

// sinhala unicode -> easy singlish
export const singlish_vowels = [
	['අ', 'a'],
	['ආ', 'a, aa'],
	['ඇ', 'ae'],
	['ඈ', 'ae, aee'],
	['ඉ', 'i'],
	['ඊ', 'i, ii'],
	['උ', 'u'],
	['ඌ', 'u, uu'],
	['එ', 'e'],
	['ඒ', 'e, ee'],
	['ඔ', 'o'],
	['ඕ', 'o, oo'],
	['ඓ', 'ai'], // sinhala only begin
	['ඖ', 'ou'],
	['ඍ', 'ru'],
	['ඎ', 'ru, ruu'],
	//['ඏ', 'li'], /** 2020-6-22 commented out some rare letters to prevent too many possibilites */
	//['ඐ', 'li, lii'] // sinhala only end
]

export const singlish_specials = [
	['ඞ්', 'n'],
	['ං', 'n, m'],
	//['ඃ', 'n, m'] // sinhala only
]

export const singlish_consonants = [
	['ක', 'k'],
	['ග', 'g'],
	['ච', 'c, ch'],
	['ජ', 'j'],
	['ට', 't'],
	['ඩ', 'd'],
	['ණ', 'n'],
	['ත', 'th'],
	['ද', 'd'],
	['න', 'n'],
	['ප', 'p'],
	['බ', 'b'],
	['ම', 'm'],
	['ය', 'y'],
	['ර', 'r'],
	['ල', 'l'],
	['ව', 'v, w'],
	['ශ', 'sh'],
	['ෂ', 'sh'],
	['ස', 's'],
	['හ', 'h'],
	['ළ', 'l'],
	['ෆ', 'f'],

	['ඛ', 'kh, k'],
	['ඤ', 'n, kn'],
	['ඨ', 't'],
	['ඝ', 'gh'],
	['ඟ', 'ng'],
	['ඡ', 'ch'],
	['ඣ', 'jh'],
	['ඦ', 'nj'],
	['ඪ', 'dh'],
	['ඬ', 'nd'],
	['ථ', 'th'],
	['ධ', 'dh'],
	['ඳ', 'nd'],
	['ඵ', 'ph'],
	['භ', 'bh'],
	['ඹ', 'mb'],
	['ඥ', 'gn'] // sinhala only
] 

// sinh before, sinh after, roman after
export const singlish_combinations = [
	['්', ''], //ක්
	['', 'a'], //ක
	['ා', 'a, aa'], //කා
	['ැ', 'ae'],
	['ෑ', 'ae, aee'],
	['ි', 'i'],
	['ී', 'i, ii'],
	['ු', 'u'],
	['ූ', 'u, uu'],
	['ෙ', 'e'],
	['ේ', 'e, ee'],
	['ෛ', 'ei'],
	['ො', 'o'],
	['ෝ', 'o, oo'],

	// following rakar/yansa patterns are aslo needed due to words like ග්රෑම/න්යාස which occur without rakar/yansa
	['්‍ර', 'ra'], //ක්‍ර
	['්‍රා', 'ra, raa'], //ක්‍රා
	['්‍රැ', 'rae'],
	['්‍රෑ', 'rae, raee'],
	['්‍රි', 'ri'],
	['්‍රී', 'ri, rii'],
	['්‍රෙ', 're'],
	['්‍රේ', 're, ree'],
	['්‍රෛ', 'rei'],
	['්‍රො', 'ro'],
	['්‍රෝ', 'ro, roo'],

	['්‍ය', 'ya'], //ක්‍ය
	['්‍යා', 'ya, yaa'], //ක්‍යා
	['්‍යැ', 'yae'],
	['්‍යෑ', 'yae, yaee'],
	['්‍යි', 'yi'],
	['්‍යී', 'yi, yii'],
	['්‍යු', 'yu'],
	['්‍යූ', 'yu, yuu'],
	['්‍යෙ', 'ye'],
	['්‍යේ', 'ye, yee'],
	['්‍යෛ', 'yei'],
	['්‍යො', 'yo'],
	['්‍යෝ', 'yo, yoo'],

	['ෘ', 'ru'],  // sinhala only begin
	['ෲ', 'ru, ruu'],
	['ෞ', 'au'],
	//['ෟ', 'li'],
	//['ෳ', 'li, lii'] // sinhala only end
]

// singlish -> list of [sinhala, bits] - bits is the extra cost of a shortcut spelling e.g. i for ී (instead of ii)
const singlishMapping = Object.create(null)
let maxSinglishKeyLen = 0
const shortcutBits = 1
function addToSinglishMapping(values, pSinhStr, pRomanStr) {
	const pRomans = pRomanStr.split(',').map(r => r.trim())
	values.forEach(pair => {
		const sinh = pair[0] + pSinhStr

		const romans = pair[1].split(',').map(r => r.trim())
		const isShortcut = (r, list) => r.length < Math.max(...list.map(l => l.length))
		romans.forEach(roman => {
			pRomans.forEach(pRoman => {
				const mapIndex = roman + pRoman
				const bits = shortcutBits * (isShortcut(roman, romans) + isShortcut(pRoman, pRomans))
				if (mapIndex in singlishMapping) {
					singlishMapping[mapIndex].push([sinh, bits])
				} else {
					singlishMapping[mapIndex] = [[sinh, bits]]
					maxSinglishKeyLen = Math.max(mapIndex.length, maxSinglishKeyLen)
				}
			})
		})
	})
}

addToSinglishMapping(singlish_vowels, '', '')
addToSinglishMapping(singlish_specials, '', '')
singlish_combinations.forEach(combi => {
	addToSinglishMapping(singlish_consonants, combi[0], combi[1]);
})
console.log(`singlish map initialized. maxSinglishKeyLen: ${maxSinglishKeyLen}`)

// reduce the number of matches to prevent sql query from exploding by removing letter sequences that do not occur in sinhala
export const matchFilters = {
	// hal followed by හ - occur by mis identification of kh, gh, ch, jh, th, dh, ph, bh, sh as two letters
	// except ක්හට, ක්හි, ක්හු, ස්හි, ස්හු that are common in old sinhala e.g. යමක්හට, දවස්හි
	aspirateSplit: /[ඛගචජටඨඩදපබ]්හ|[කස]්හ[^ටිු]/,
	// consecutive independent vowels
	vowelVowel: /[අ-ඖ][අ-ඖ]/,
	// hal/n followed by a indept vowel (this occurs in words like ගල්අඟුරු but rare)
	halVowel: /[්ං][අ-ඖ]/,
}
const matchFilter = new RegExp(Object.values(matchFilters).map(re => re.source).join('|'))

// sinhala letter n-gram model built from sinhala corpora - used to rank the matches by how likely they occur in sinhala
// letterBits[k] maps a context of k letters to an object of next letter -> -log2 probability
const letterBits = model.data.map((line, k) => {
	const contexts = new Map(), letterOf = sym => model.letters[model.symbols.indexOf(sym)]
	line.split(' ').forEach(group => {
		const next = {}
		for (let i = k; i < group.length; i += 2) next[letterOf(group[i])] = model.symbols.indexOf(group[i + 1]) * model.bitsStep
		contexts.set([...group.slice(0, k)].map(letterOf).join(''), next)
	})
	return contexts
})
// extra bits when backing off from k letter context - bigrams are not pruned so an unseen bigram is very unlikely
const backoffBits = [20, 12, 2]

function getLetterBits(context, letter) {
	let bits = 0
	for (let k = Math.min(context.length, model.order - 1); k >= 0; k--) {
		const next = letterBits[k].get(context.slice(context.length - k))
		if (next && letter in next) return bits + next[letter]
		bits += backoffBits[Math.min(k, backoffBits.length - 1)]
	}
	return bits
}

// add the sinhala string to the match and update the cost (-log2 probability of the match)
function extendMatch({ match, context, cost }, sinh, bits) {
	cost += bits
	for (const letter of sinh) {
		if (letter == '\u200D') continue // zwj in rakar/yansa is not in the model
		if (letter in letterBits[0].get('')) {
			cost += getLetterBits(context, letter)
			context = (context + letter).slice(1 - model.order)
		} else {
			context = '^' // space, dot etc start a new word
		}
	}
	return { match: match + sinh, context, cost }
}

const maxInputLength = 30 // the beam keeps the work linear in the input length, this only guards against very long inputs
// returns the sinhala matches for the singlish input ranked by how likely they occur in sinhala (most likely first)
export function getPossibleMatches(input, { maxMatches = 300 } = {}) {
	if (input.length > maxInputLength) return [input]
	const beamWidth = Math.max(2 * maxMatches, 100) // number of partial matches kept at each input position

	// left to right beam search - beams[pos] has the partial matches for input.slice(0, pos)
	const beams = Array.from({ length: input.length + 1 }, () => new Map())
	beams[0].set('', { match: '', context: '^', cost: 0 })
	for (let pos = 0; pos < input.length; pos++) {
		const partials = [...beams[pos].values()].sort((a, b) => a.cost - b.cost).slice(0, beamWidth)
		for (let len = 1; len <= maxSinglishKeyLen && pos + len <= input.length; len++) {
			const prefix = input.slice(pos, pos + len)
			// if prefix is all sinhala then pass through the prefix - this allows sinhala and singlish mixing and ending dot
			const mappings = isSinglishQuery(prefix) ? singlishMapping[prefix] : (len == 1 ? [[prefix, 0]] : null)
			if (!mappings) continue
			const beam = beams[pos + len]
			for (const partial of partials) {
				const tail = partial.match.slice(-3) // longest filter is 4 letters
				for (const [sinh, bits] of mappings) {
					if (matchFilter.test(tail + sinh)) continue
					const extended = extendMatch(partial, sinh, bits), existing = beam.get(extended.match)
					if (!existing || existing.cost > extended.cost) beam.set(extended.match, extended)
				}
			}
		}
	}
	return [...beams[input.length].values()].sort((a, b) => a.cost - b.cost).slice(0, maxMatches).map(p => p.match)
}

export function isSinglishQuery(query) {
	return /[A-Za-z]/.test(query);
}
/*
[
        'ස්හස්ත්‍රය',   'ස්හාස්ත්‍රය',   'ස්හස්ථ්‍රය',   'ස්හාස්ථ්‍රය',
        'ස්හස්ත්‍රාය',  'ස්හාස්ත්‍රාය',  'ස්හස්ථ්‍රාය',  'ස්හාස්ථ්‍රාය',
        'ස්හස්ත්‍රයා',  'ස්හාස්ත්‍රයා',  'ස්හස්ථ්‍රයා',  'ස්හාස්ථ්‍රයා',
        'ස්හස්ත්‍රායා', 'ස්හාස්ත්‍රායා', 'ස්හස්ථ්‍රායා', 'ස්හාස්ථ්‍රායා',
        'ශස්ත්‍රය',    'ෂස්ත්‍රය',     'ශාස්ත්‍රය',   'ෂාස්ත්‍රය',
        'ශස්ථ්‍රය',    'ෂස්ථ්‍රය',     'ශාස්ථ්‍රය',   'ෂාස්ථ්‍රය',
        'ශස්ත්‍රාය',   'ෂස්ත්‍රාය',    'ශාස්ත්‍රාය',  'ෂාස්ත්‍රාය',
        'ශස්ථ්‍රාය',   'ෂස්ථ්‍රාය',    'ශාස්ථ්‍රාය',  'ෂාස්ථ්‍රාය',
        'ශස්ත්‍රයා',   'ෂස්ත්‍රයා',    'ශාස්ත්‍රයා',  'ෂාස්ත්‍රයා',
        'ශස්ථ්‍රයා',   'ෂස්ථ්‍රයා',    'ශාස්ථ්‍රයා',  'ෂාස්ථ්‍රයා',
        'ශස්ත්‍රායා',  'ෂස්ත්‍රායා',   'ශාස්ත්‍රායා', 'ෂාස්ත්‍රායා',
        'ශස්ථ්‍රායා',  'ෂස්ථ්‍රායා',   'ශාස්ථ්‍රායා', 'ෂාස්ථ්‍රායා'
      ]

'ජණඩ්හිපට්හිවරණය',    'ජාණඩ්හිපට්හිවරණය',    'ජනඩ්හිපට්හිවරණය',    'ජානඩ්හිපට්හිවරණය',
        'ජණාඩ්හිපට්හිවරණය',   'ජාණාඩ්හිපට්හිවරණය',   'ජනාඩ්හිපට්හිවරණය',   'ජානාඩ්හිපට්හිවරණය',
        'ජණද්හිපට්හිවරණය',    'ජාණද්හිපට්හිවරණය',    'ජනද්හිපට්හිවරණය',    'ජානද්හිපට්හිවරණය',
        'ජණාද්හිපට්හිවරණය',   'ජාණාද්හිපට්හිවරණය',   'ජනාද්හිපට්හිවරණය',   'ජානාද්හිපට්හිවරණය',
        'ජණඩ්හිපාට්හිවරණය',   'ජාණඩ්හිපාට්හිවරණය',   'ජනඩ්හිපාට්හිවරණය',   'ජානඩ්හිපාට්හිවරණය',
        'ජණාඩ්හිපාට්හිවරණය',  'ජාණාඩ්හිපාට්හිවරණය',  'ජනාඩ්හිපාට්හිවරණය',  'ජානාඩ්හිපාට්හිවරණය',
        'ජණද්හිපාට්හිවරණය',   'ජාණද්හිපාට්හිවරණය',   'ජනද්හිපාට්හිවරණය',   'ජානද්හිපාට්හිවරණය',
        'ජණාද්හිපාට්හිවරණය',  'ජාණාද්හිපාට්හිවරණය',  'ජනාද්හිපාට්හිවරණය',  'ජානාද්හිපාට්හිවරණය',
        'ජණඩ්හිපට්හිවාරණය',   'ජාණඩ්හිපට්හිවාරණය',   'ජනඩ්හිපට්හිවාරණය',   'ජානඩ්හිපට්හිවාරණය',
        'ජණාඩ්හිපට්හිවාරණය',  'ජාණාඩ්හිපට්හිවාරණය',  'ජනාඩ්හිපට්හිවාරණය',  'ජානාඩ්හිපට්හිවාරණය',
        'ජණද්හිපට්හිවාරණය',   'ජාණද්හිපට්හිවාරණය',   'ජනද්හිපට්හිවාරණය',   'ජානද්හිපට්හිවාරණය',
        'ජණාද්හිපට්හිවාරණය',  'ජාණාද්හිපට්හිවාරණය',  'ජනාද්හිපට්හිවාරණය',  'ජානාද්හිපට්හිවාරණය',
        'ජණඩ්හිපාට්හිවාරණය',  'ජාණඩ්හිපාට්හිවාරණය',  'ජනඩ්හිපාට්හිවාරණය',  'ජානඩ්හිපාට්හිවාරණය',
        'ජණාඩ්හිපාට්හිවාරණය', 'ජාණාඩ්හිපාට්හිවාරණය', 'ජනාඩ්හිපාට්හිවාරණය', 'ජානාඩ්හිපාට්හිවාරණය',
        'ජණද්හිපාට්හිවාරණය',  'ජාණද්හිපාට්හිවාරණය',  'ජනද්හිපාට්හිවාරණය',  'ජානද්හිපාට්හිවාරණය',
        'ජණාද්හිපාට්හිවාරණය', 'ජාණාද්හිපාට්හිවාරණය', 'ජනාද්හිපාට්හිවාරණය', 'ජානාද්හිපාට්හිවාරණය',

		*/