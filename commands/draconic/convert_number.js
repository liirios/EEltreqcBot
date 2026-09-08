import { getFormatted } from "../../locales.js";
import { crop, isNumeric } from "../../utils.js";
import { entriesToDiscord } from "../../draconic.js";
import { reply } from "../../bot.js";

export default {
  data: {
    description: "Converts number to required type (May be incorrect)",
    options: [
      { name: "number", description: "Number", type: 3, required: true },
      {
        name: "from",
        description: "From",
        type: 3,
        required: true,
        choices: [
          { name: "Integer", value: "integer" },
          { name: "#Drcnc", value: "short" }
        ]
      },
      {
        name: "to",
        description: "To",
        type: 3,
        required: true,
        choices: [
          { name: "Integer", value: "integer" },
          { name: "Draconic", value: "draconic" },
          { name: "Draconic (Emojis)", value: "draconic_em" },
          { name: "#Drcnc", value: "short" },
          { name: "#Drcnc (Emojis)", value: "short_em" }
        ]
      },
      { name: "quiet", description: "Ephemeral", type: 5 }
    ],
    "integration_types": [0, 1],
    "contexts": [0, 1, 2]
  },
  minPerm: 1,
  async execute(interaction) {
    const number_text = interaction.options.getString("number");
    const from = interaction.options.getString("from");
    const to = interaction.options.getString("to");
    const quiet = interaction.options.getBoolean("quiet");

    let number = 0;
    if (from == "integer") {
      if (!isNumeric(number_text)) return interaction.reply({ content: await getFormatted("error.value_is_nan", {value: number_text}), flags: 64 });
      number = parseInt(number_text, 10);
    } else if (from == "short") number = NUMBERS.textToNumberShort(number_text);
    const converters = {
      integer: () => number,
      draconic: () => NUMBERS.numberToText(number),
      draconic_em: () => entriesToDiscord(CHARACTERS.textToEntriesByAnyText(NUMBERS.numberToText(number))),
      short: () => NUMBERS.numberToTextShort(number),
      short_em: () => entriesToDiscord(CHARACTERS.textToEntriesByAnyText(NUMBERS.numberToTextShort(number)))
    };

    await reply(interaction, "convert_number.result", { text: converters[to]() }, quiet)
  }
}