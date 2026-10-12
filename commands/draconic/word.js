import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getFormatted} from "../../locales.js";
import {getPerm} from "../../permissions.js";
import {getQuiet, highlight} from "../../utils.js";

const MAX_LIMITED_RESULTS = 7;

export default {
    data: {
        description: "Word",
        options: [
            {
                name: "fetch", description: "Fetch word (Do not spam/flood with it)", type: 1,
                options: [
                    {name: "text", description: "Text", type: 3, required: true},
                    {name: "amount", description: "Number of results", type: 4},
                    {name: "is_word", description: "Whether the provided text is a Draconic word", type: 5 },
                    Option.QUIET
                ]
            },
            {
                name: "random", description: "Random word", type: 1,
                options: [ 
                    {
                        name: "type", description: "Word type", type: 3,
                        choices: [
                            {name: "Noun", value: IDS.WORDS.N},
                            {name: "Verb", value: IDS.WORDS.V},
                            {name: "Adjective", value: IDS.WORDS.ADJ},
                            {name: "Adverb", value: IDS.WORDS.ADV},
                            {name: "Auxiliary", value: IDS.WORDS.AUX},
                            {name: "Preposition", value: IDS.WORDS.PP},
                            {name: "Particle", value: IDS.WORDS.PART},
                            {name: "Determiner", value: IDS.WORDS.DET},
                            {name: "Conjuction", value: IDS.WORDS.CON}
                        ]
                    },
                    Option.QUIET
                ]
            },
            {
                name: "conjugate", description: "Conjugate word", type: 1,
                options: [
                    {name: "stem", description: "Stem", type: 3, required: true},
                    {name: "prefix", description: "Prefix", type: 3},
                    {name: "suffix", description: "Suffix", type: 3},
                    Option.QUIET
                ]
            }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(1, false)],
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const perm = getPerm(interaction.user.id)

        switch (sub) {
            case "fetch": {

                const query = interaction.options.getString("text");
                const is_word = interaction.options.getBoolean("is_word") ?? false;
                const requested = interaction.options.getInteger("amount") ?? 5;

                if (requested > MAX_LIMITED_RESULTS && !quiet && !isLimited(interaction, user.perm)) return Result.CUSTOM(await getFormatted("word.fetch.limited", {i: MAX_LIMITED_RESULTS}))

                const results = is_word ? DICTIONARY.fuzzyFetchByWord(query, requested) : DICTIONARY.fuzzyFetchByDefinition(query, requested);

                const entries = await Promise.all(results.map(s => {
                    let def = s.definition;
                    if (s instanceof Noun) def = def.replace(/\n/g, ".   ");
                    return getFormatted("word.fetch.entry", {word: s.word, type: s.type, def: def});
                }));

                let content = entries.join("\n") || "> No results";
                content = highlight(query, content);

                await reply(interaction, "word.fetch.result", {query: query, results: content}, getQuiet(interaction));
                return Result.OK;
            }
            case "random": {
                const classMap = {
                    [IDS.WORDS.N]: ConjugatedNoun,
                    [IDS.WORDS.V]: ConjugatedVerb,
                    [IDS.WORDS.ADJ]: ConjugatedAdjective,
                    [IDS.WORDS.ADV]: null,
                    [IDS.WORDS.AUX]: null,
                    [IDS.WORDS.PP]: null,
                    [IDS.WORDS.PART]: null,
                    [IDS.WORDS.DET]: null,
                    [IDS.WORDS.CON]: null
                };
                const keys = Object.keys(classMap);
                const type = interaction.options.getString("type") ?? keys[Math.floor(Math.random() * keys.length)];
                let word = "";
                let def = "";
                
                if (classMap[type] !== null) {
                    const ConjClass = classMap[type];
                    const conjugated = new ConjClass().random();
                    word = conjugated.conjugate();
                    def = conjugated.definition();
                } else {
                    const wordlist = Object.values(DICTIONARY[type].MAP);
                    const theword = wordlist[Math.floor(Math.random() * wordlist.length)];
                    word = theword.text;
                    def = theword.definition;
                }

                await reply(interaction, "word.random.result", {word: word, type: type, def: def }, getQuiet(interaction))
                return Result.OK;
            }
            case "conjugate": {
                const stem = interaction.options.getString("stem");
                const prefix = interaction.options.getString("prefix") || "";
                const suffix = interaction.options.getString("suffix") || "";

                await reply(interaction, "word.conjugate.result", {text: AFFIXES.connect(prefix, stem, suffix) }, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};