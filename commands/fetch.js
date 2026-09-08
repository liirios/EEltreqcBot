import { getUser } from "../db.js";
import { highlight } from "../utils.js";
import { isLimited } from "../limiter.js"
import { getFormatted } from "../locales.js";

const MAX_LIMITED_RESULTS = 7;
const CONTENT_MAX = 2000;

export default {
  data: {
    name: "fetch",
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
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const is_word = interaction.options.getBoolean("is_word") ?? false;
    const requested = interaction.options.getInteger("amount") ?? 5;
    const user = getUser(interaction.user.id);

    if (requested > MAX_LIMITED_RESULTS && !quiet && !isLimited(interaction, user.perm)) return interaction.reply({ content: getFormatted("error.limited.fetch", {i: MAX_LIMITED_RESULTS}), flags: 64 });

    const results = is_word ? DICTIONARY.fuzzyFetchByWord(query, requested) : DICTIONARY.fuzzyFetchByDefinition(query, requested);
    let content = results.map(s => {
      let def = s.definition
      if (s instanceof Noun) def = def.replace(/\n/g, ".   ")
      return getFormatted("fetch.result", {word: s.word, type: s.type, def: def})
    }).join("\n") || "> No results";
    content = highlight(query, content);
    if (content.length > CONTENT_MAX) content = content.slice(0, CONTENT_MAX-10) + `... +${content.length-CONTENT_MAX}`;

    await interaction.reply({ content, flags: quiet ? 64 : undefined });
  }
};