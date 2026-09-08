import { reply } from "../../bot.js";

export default {
  data: {
    description: "Get a random conjugated word",
    options: [
      {
        name: "type",
        description: "Word type",
        type: 3,
        choices: [
          { name: "Noun", value: IDS.WORDS.N },
          { name: "Verb", value: IDS.WORDS.V },
          { name: "Adjective", value: IDS.WORDS.ADJ },
          { name: "Adverb", value: IDS.WORDS.ADV },
          { name: "Auxiliary", value: IDS.WORDS.AUX },
          { name: "Preposition", value: IDS.WORDS.PP },
          { name: "Particle", value: IDS.WORDS.PART },
          { name: "Determiner", value: IDS.WORDS.DET },
          { name: "Conjuction", value: IDS.WORDS.CON }
        ]
      },
      {
        name: "quiet",
        description: "Ephemeral",
        type: 5
      }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const quiet = interaction.options.getBoolean("quiet") ?? false;
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
      word = word.text;
      def = word.definition;
    }

    await reply(interaction, "random_word.result", { word: word, type: type, def: def }, quiet)
  }
}