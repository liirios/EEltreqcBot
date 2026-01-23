const TRUSTED_USERS = new Set([
  "416062410022191104",
  "414847580871196694",
  "1314436119756148747",
  "423415495652278272"
]);

const SERVER_LIMITED = "1315098863694250075";
const MAX_AMOUNT_SERVER = 7;
const CONTENT_MAX = 2000;

function charTriples(str) {
  const s = str.toLowerCase();
  const triples = new Set();
  for (let i = 0; i < s.length - 2; i++) {
    triples.add(s.slice(i, i + 3));
  }
  return triples;
}

function tripleScore(query, text) {
  const qTrip = charTriples(query);
  const tTrip = charTriples(text);
  let common = 0;
  for (let tri of qTrip) {
    if (tTrip.has(tri)) common++;
  }
  return common / Math.max(1, qTrip.size);
}

module.exports = {
  data: {
    name: "fetch",
    description: "Fetches draconic words by english definition",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      { name: "amount", description: "Number of results", type: 4 },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },

  async execute(interaction) {
    const q = interaction.options.getString("text").toLowerCase();
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    let requested = interaction.options.getInteger("amount");

    if (!quiet && interaction.guildId === SERVER_LIMITED && !TRUSTED_USERS.has(interaction.user.id) && requested > MAX_AMOUNT_SERVER) {
      return interaction.reply({
        content: "On this server, only trusted users can request more than 7 results to prevent spam. Alternatively, you can enable quiet = True in this slash command's arguments.",
        flags: 64
      }).catch(console.error);
    }

    const matches = DICTIONARY.ALL_WORDS.FLAT
      .filter(s => s instanceof Noun || typeof s.definition === "string")
      .map(s => {
        let score = 0;
        let text = "";

        if (s instanceof Noun) {
          const combined = GENDERS.combine(s.genders);
          const gendersText = Object.entries(combined)
            .map(([k, v]) => `${k}: ${v}`)
            .join(", ");

          score = tripleScore(q, gendersText) * 200;

          const wordLower = s.word.toLowerCase();
          if (wordLower === q) score += 300;
          if (wordLower.startsWith(q)) score += 100;
          if (wordLower.includes(q)) score += 20;
          score += 20 / Math.max(1, gendersText.length);

          text = `> ${s.word} - ${s.type} - ${gendersText}`;
        } else {
          const def = s.definition.toLowerCase();
          score = tripleScore(q, def) * 200;

          if (def === q) score += 300;
          if (def.startsWith(q)) score += 200;
          const exactMatches = (def.match(new RegExp(`\\b${q}\\b`, "g")) || []).length;
          score += exactMatches * 150;
          if (def.includes(q)) score += 10;
          score += 20 / Math.max(1, def.length);

          text = `> ${s.word} - ${s.type} - ${s.definition}`;
        }

        return { s, score, text };
      })
      .sort((a, b) => b.score - a.score);

    const limit = requested ?? 5;
    let list = matches.slice(0, limit).map(e => e.text).join("\n");

    if (list.length > CONTENT_MAX) {
      const overflow = list.length - CONTENT_MAX;
      list = list.slice(0, CONTENT_MAX - 10) + `... +${overflow}`;
    }

    const content = list || "> No results";

    await interaction.reply({
      content,
      flags: quiet ? 64 : undefined
    }).catch(console.error);
  }
};