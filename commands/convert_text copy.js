function entriesToDiscord(map) {
    return [...map.values()]
        .map(value => {
            const index = Object.keys(CHARACTERS.MAP).indexOf(value["name"]);
            return index !== -1 ? newDiscords[index] : "";
        })
        .join("");
}

export default {
  data: {
    name: "convert_text",
    description: "Transcribes text to required type",
    options: [
      { name: "text", description: "Text", type: 3, required: true },
      {
        name: "type",
        description: "Type",
        type: 3,
        required: true,
        choices: [
          { name: "Regular", value: "regular" },
          { name: "Romanized", value: "romanized" },
          { name: "Emojis (Discord)", value: "emojis" },
          { name: "Glyphs (Unicode)", value: "glyphs" }
        ]
      },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const converters = {
      regular: CHARACTERS.entriesToText,
      romanized: CHARACTERS.entriesToRom,
      glyphs: CHARACTERS.entriesToGlyphs,
      emojis: entriesToDiscord
    };

    const f = converters[interaction.options.getString('type')];

    await interaction.reply({
      content: `> ${f(CHARACTERS.textToEntriesByAnyText(interaction.options.getString('text')))}`,
      flags: interaction.options.getBoolean('quiet') ?? false ? 64 : undefined
    }).catch(console.error);
  }
}