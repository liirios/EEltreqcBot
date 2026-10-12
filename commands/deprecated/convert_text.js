import { reply } from "../bot.js";
import { entriesToDiscord } from "../draconic.js";

export default {
  data: {
    description: "Transcribes text to required type (THIS IS NOT A TRANSLATOR)",
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
    const text = interaction.options.getString("text");
    const type = interaction.options.getString("type");
    const quiet = interaction.options.getBoolean("quiet") ?? false;
    const converters = {
      regular: CHARACTERS.entriesToText,
      romanized: CHARACTERS.entriesToRom,
      glyphs: CHARACTERS.entriesToGlyphs,
      emojis: entriesToDiscord
    };

    await reply(interaction, "convert_text.result", { text: converters[type](CHARACTERS.textToEntriesByAnyText(text)) }, quiet)
  }
}