# myBrillTagger
My version of the famous Brill's POS tagger, written in vanilla Javascript
Part of speech taggers (POS taggers) are programs that take a text and try to find to which grammatical entity (noun, verb, etc) each word belongs.
https://en.wikipedia.org/wiki/Part-of-speech_tagging

This is useful when trying to somehow understand what a text is about. Yet it's not a semantic analysis.
Usually, POS taggers use statistical techniques like HMM. Brill's tagger uses a simpler technique, certainly not the most efficient, but easy to understand.
https://en.wikipedia.org/wiki/Brill_tagger

It starts by labeling all POS as nouns, then it tries to refine the tagging by correcting incongruities.
For example in English, it converts a noun_tag to a past participle if the noun ends with "ed"

Brill's tagger has only a few rules, mine has many more, but I may have made a lot of errors, English is not even my native tongue.
I use three characters for tag mnemonics, where Brill used a mix of 2 and 3 characters.
