import { reply } from "../../bot.js";
import { getUser } from "../db.js";
import { highlight } from "../../utils.js";
import { isLimited } from "../../limiter.js";
import { getFormatted } from "../../locales.js";

const MAX_LIMITED_RESULTS = 7;

export default {
  data: {
    description: "Fetches draconic words by english definition or draconic word itself",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "amount", description: "Number of results", type: 4 },
      { name: "is_word", description: "Whether the provided text is a Draconic word", type: 5 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const query = interaction.options.getString("text");
    const is_word = interaction.options.getBoolean("is_word") ?? false;
    const requested = interaction.options.getInteger("amount") ?? 5;
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const user = getUser(interaction.user.id);

    if (requested > MAX_LIMITED_RESULTS && !quiet && !isLimited(interaction, user.perm)) return interaction.reply({ content: await getFormatted("error.limited.fetch", {i: MAX_LIMITED_RESULTS}), flags: 64 });

    const results = is_word ? DICTIONARY.fuzzyFetchByWord(query, requested) : DICTIONARY.fuzzyFetchByDefinition(query, requested);

    const entries = await Promise.all(results.map(s => {
        let def = s.definition;
        if (s instanceof Noun) def = def.replace(/\n/g, ".   ");
        return getFormatted("fetch.entry", { word: s.word, type: s.type, def: def });
    }));

    let content = entries.join("\n") || "> No results";
    content = highlight(query, content);

    await reply(interaction, "fetch.result", { query: query, results: content }, quiet)
  }
};