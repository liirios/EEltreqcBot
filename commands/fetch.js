const TRUSTED_USERS = new Set([ "416062410022191104", "414847580871196694", "1314436119756148747", "423415495652278272" ]);
const SERVER_LIMITED = "1315098863694250075";
const MAX_AMOUNT_SERVER = 7;
const CONTENT_MAX = 2000;

module.exports = {
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
  async execute(interaction) {
    const query = interaction.options.getString("text");
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const requested = interaction.options.getInteger("amount") ?? 5;
    
    if (!quiet && interaction.guildId === SERVER_LIMITED && !TRUSTED_USERS.has(interaction.user.id) && requested > MAX_AMOUNT_SERVER) {
      return interaction.reply({content: "On this server, only trusted users can request more than 7 results to prevent spam. Alternatively, enable quiet = True.", flags: 64});
    }

    const results = interaction.options.getBoolean("is_word") ?? false ? DICTIONARY.fuzzyFetchByWord(query, requested) : DICTIONARY.fuzzyFetchByDefinition(query, requested);

    let content = results.map(s => {
      if (s instanceof Noun) return `> ${s.word} - ${s.type} - ${s.definition.replace(/\n/g, ", ")}`;
      else return `> ${s.word} - ${s.type} - ${s.definition}`;
    }).join("\n") || "> No results";
    
    if (content.length > CONTENT_MAX) {
      const overflow = content.length - CONTENT_MAX;
      content = content.slice(0, CONTENT_MAX - 10) + `... +${overflow}`;
    }
    
    await interaction.reply({content, flags: quiet ? 64 : undefined});
  }
};