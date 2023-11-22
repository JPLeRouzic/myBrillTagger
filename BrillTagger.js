        // FIXME 
        // Discover if it is a date or time
        // * The token could be complete (date and time) or incomplete with only date or only time 
        // * date and time could have various formats
        // if (date_parse(words[i]) !== false) {
        // tags[i] = 'CDN';
        // }

        // Discover if it is a fraction
        // Discover ordinal form when in a string ('eighteen', ''61st'', '172nd', '78th', '83rd')
        // Discover cardinal form when in a string ('twenty-eighth', 'twenty-fifth', 'twenty-first') 
        // Discover ordinal numbers like ('eighty-five')
        // Detect roman numbers like ('II', 'ii')
        // Detect units such as ('g/kg', 'g/mL')
        // Detect combine pronoun and verb like in ('you\'re', 'you\'s', '\'tain\'t', 'You\'ve', 'I\'ve', 'They\'ve')
        

//constructor for the prototype POSTagger
function POSTagger() {
    this.lexicon = dictionnary;
}

/**
 * Indicates whether or not this string starts with the specified string.
 * @param {Object} string
 */
function startsWith(b, a) {
    if (!a) {
        return false;
    }
    return b.indexOf(a) == 0;
}

/**
 * Indicates whether or not this string ends with the specified string.
 * @param {Object} string
 */
function endsWith(b, a) {
    if (!a || a.length > b.length) {
        return false;
    }
    return b.indexOf(a) == b.length - a.length;
}

// function wordInLexicon(word) {
function tokenExists(word) {
    var ss = dictionnary[word];
    if (ss != null)
        return true;
    // if the tag is not in our hash, try doing it using the lower case of the word
    if (!ss)
        ss = dictionnary[word.toLowerCase()];
    if (ss) {
        return true;
    }
    return false;
}

POSTagger.prototype.tag = function (words) {
    var tags = new Array(words.length);
    for (var i = 0, size = words.length; i < size; i++) {
        var ss = this.lexicon[words[i]];
        // if the tag is not in the stored hash, try the lower case version of the word again from the hash
        if (!ss)
            ss = this.lexicon[words[i].toLowerCase()];
        if (!ss && words[i].length == 1)
            tags[i] = words[i] + "^";
        //if not found then assign a Noun tag to it
        if (!ss)
            tags[i] = "NN0";
        else {
            tags[i] = ss[0];
            }
    }

    //Apply transformational rules
    for (var i = 0; i < words.length; i++) {
        var word = tags[i];

        //  rule 1: DT0, {VBD | VBP} --> DT0, NN
        // "Some rain" verb base form
        // "Some rain" verb infinitive form
        // "Some have rain"
        if (i > 0 && tags[i - 1] == "DT0") {
            if (word == "VVB" ||
                    word == "VVI" ||
                    word == "VHI") {
                tags[i] = "NN0";
            }
        }

        // rule 2: convert a noun to a number (CRD) if "." appears in the word
        // and if first character of $token is 'N'
        // It detects also URLs
        if (startsWith(word, "N")) {
            if (words[i].indexOf(".") > -1) {
                // url if there are two contiguous alpha characters
                if (/[a-zA-Z]{2}/.test(words[i]))
                    tags[i] = "URL";
                else
                    tags[i] = "CRD";
            }
            // Try to convert into a number
            if (parseFloat(words[i]))
                tags[i] = "CRD";
        }

        // rule 3: convert a noun to a past participle if words[i] ends with "ed"
        if (startsWith(tags[i], "N") && endsWith(words[i], "ed"))
            tags[i] = "VBN";

        // rule 4: convert any type to adverb if it ends in "ly";
        if (endsWith(words[i], "ly"))
            tags[i] = "AV0";

        // rule 5: convert a common noun (NN or NNS) to a adjective if it ends with "al"
        if (startsWith(tags[i], "NN") && endsWith(word, "al"))
            tags[i] = i, "AJ0";

        // rule 6: convert a noun to a verb if the preceding work is "would"
        if (i > 0 && startsWith(tags[i], "NN") && words[i - 1].toLowerCase() == "would")
            tags[i] = "VVI";

        // rule 7: if a word has been categorized as a common noun and it ends with "s",
        // then set its type to plural common noun (NNS)


        // rule 7: if a word has been categorized as a common noun and it ends with "s",
        //         then set its type to plural common noun (NN2)
        // FIXME Convert NN1 to NN2 if plural as some plural are not terminated by 's' like goose => geese
        if (tags[i] == "NN1" && endsWith(words[i], "s") && !endsWith(words[i], "ss"))
            tags[i] = "NN2";

        // rule 8: convert a common noun to a present participle verb (i.e., a gerund)
        if (startsWith(tags[i], "NN") && endsWith(words[i], "ing"))
            tags[i] = "VVG";

        /*
         * This is to infer if it's something numeric
         */
        tags[i] = transformNumerics(words[i], tags[i]);

        /*
         * This is to infer if it's something else than a common noun
         * for ex. Common noun to adj. if it ends with 'al'
         */
        if (isNoun(tags[i]) && !isProperNoun(tags[i])) {
            tags[i] = transformNoun(tags[i], words[i]);
        }

        /*
         * For undetected articles
         */
        if (i > 0 && (tags[i - 1] === 'ZZ0') && (substr(tags[i], -3, 2) === 'NN')) {
            tags[i - 1] = 'AT0';
        }

        /*
         * Converts verbs after 'the' to nouns
         */
        if (i > 0 && tags[i - 1] === 'DT0' && isVerb(tags[i])) {
            tags[i] = 'NN1';
        }

        /*
         * Rectifies 'I' as a pronoun if before a verb
         */
        if (i > 0 && tags[i - 1] === 'ZZ0' && isVerb(tags[i])) {
            tags[i - 1] = 'PNP';
        }

        /*
         * Rectifies 'one' as a pronoun if it is after 'the'
         */
        if (i > 0 && tags[i - 1] === 'AT0' && tags[i] === 'CRD') {
            tags[i] = 'PNI';
        }

        // Convert NN1 to NP0 if first (and only the first) character is upper case, except if first word of sentence (except if all characters are uppercase)
        if (i > 0 && (tags[i] === 'NN1') && (starts_with_upper(words[i]))) {
            tags[i] = 'NP0';
        }

        // Discover negative abreviation like ('weren't')
        if ((tags[i] !== 'VM1') && (substr(words[i], -2, 1) === '\'t')) {
            tags[i] = 'VM1';
        }

        // Differentiate between VVB and VVI
        if (i > 0) {
            previousTag = tags[i - 1];
            if (i > 0 && (substr(previousTag, 0, 1) === 'V') && (tags[i] === 'VVB')) {
                tags[i] = 'VVI';
            }
        }

        /*
         * Rectifies 'like' as a verb if after 'do'
         * verb => (*PNP, (VBD), (XX0), (AV0), Vxx* )
         */
        if (
                (i > 0 && tags[i - 1] === 'VBD' && tags[i] === 'PRP') || // 'do like'
                (i > 1 && tags[i - 2] === 'VBD' && tags[i - 1] === 'XX0' && tags[i] === 'PRP') || // 'do not like'
                (i > 2 && tags[i - 2] === 'VBD' && tags[i - 1] === 'AV0' && tags[i] === 'PRP') || // 'do really like'
                (i > 3 && tags[i - 3] === 'VDB' && tags[i - 2] === 'XX0' &&
                        tags[i - 1] === 'AV0' && tags[i] === 'PRP') // 'do not really like'
                ) {
            tags[i] = 'VMI';
        }

        /*
         * This is to infer if it's something numeric
         * Anything that ends 'ly' is an adverb
         */
        if (i > 0) {
            tags[i] = transformBetweenNounAndVerb(tags, i, words[i]);
        }

    }
    var result = new Array();
    for (i in words) {
        result[i] = [words[i], tags[i]];
    }
    return result;
} ;

POSTagger.prototype.prettyPrint = function (taggedWords) {
    for (i in taggedWords) {
        print(taggedWords[i][0] + "(" + taggedWords[i][1] + ")");
}
}

function isNoun(tag) {
    return tag.trim().startsWith('N') && tag !== 'NULL';
}

function startsWithUpper(str) {
    const firstChar = str.charAt(0);
    if (firstChar.toLowerCase() !== firstChar) {
        const lastChar = str.slice(-1);
        return lastChar.toLowerCase() === lastChar;
    } else {
        return false;
    }
}

function isProperNoun(tag) {
    return tag === 'NP0';
}

function isPunctuation(tag) {
    return tag === 'PUN';
}

function isSingularNoun(tag) {
    return tag === 'NN1';
}

function isPluralNoun(tag, token) {
    return this.isNoun(tag) && token.slice(-1) === 's';
}

function isVerb(tag) {
    return tag.trim().startsWith('V');
}

function isPastTenseVerb(token) {
    return this.lexicon[token]?.includes('VBN') || false;
}

function isPresentTenseVerb(token) {
    return this.lexicon[token]?.includes('VBZ') || false;
}

function isAdjective(token) {
    return this.lexicon[token]?.includes('JJ') || token.slice(-2) === 'al';
}

function isGerund(token) {
    return token.slice(-3) === 'ing';
}

function isPastParticiple(token) {
    return token.slice(-2) === 'ed';
}

function isAdverb(token) {
    return token.slice(-2) === 'ly';
}

function transformNoun(tag, token) {
 if( this.tokenExists(token) ) {
	    if (this.isAdjective(token)) {
		tag = 'AJ0';
	    } else if (this.isGerund(token)) {
		tag = 'VVG';
	    } else if (this.isPastParticiple(token)) {
		tag = 'VBN';
	    } else if (token === 'I') {
		tag = 'PPSS';
	    } else if (this.isPluralNoun(tag, token)) {
		tag = 'NN2';
	    }

	    if (token.includes('.')) {
		tag = 'CDN';
	    }
	    return tag;
    } else {
    	return 'NN0' ;
    }
}

function transformBetweenNounAndVerb(tags, i, token) {
    if (
            this.tokenExists(token) &&
            this.isNoun(tags[i]) &&
            this.isNoun(tags[i - 1])
            ) {
        if (this.isPastTenseVerb(token)) {
            tags[i] = 'VVD';
        } else if (this.isPresentTenseVerb(token)) {
            tags[i] = 'VVB';
        }
    }

    return tags[i];
}

function transformNumerics(token, tag) {
    // Regular expressions for matching numerals, years, and percentages
    const NUMERAL = /\d+/;
    const YEAR = /\b\d{4}\b/;
    const PERCENTAGE = /\d+\%/;
    
    // Tag numerals, cardinals, money (NNS)
    if (NUMERAL.test(token)) {
        tag = 'CRD';
    }

    // Tag years
    const yearMatches = token.match(YEAR);
    if (yearMatches) {
        tag = yearMatches[0].includes('CDN') ? 'CDN' : 'CRD';
    }

    // Tag percentages
    if (PERCENTAGE.test(token)) {
        tag = 'CDN';
    }

    return tag;
}

// substr(string $string, int $offset, ?int $length = null): string
function substr(str, offset, length) {
if(offset < 0) {
   // Use negative offset to start from the end of the string
    let slicedSubstring = str.slice(offset);

    return slicedSubstring ;
} else {
    return str.substring(offset, offset + length);
    }
}

