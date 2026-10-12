import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getFormatted} from "../../locales.js";
import {getQuiet, isNumeric} from "../../utils.js";
import {entriesToDiscord} from "../../draconic.js";

export default {
    data: {
        description: "Convert",
        options: [
            {
                name: "text", description: "Convert text", type: 1,
                options: [
                    {name: "value", description: "Text", type: 3, required: true},
                    {
                        name: "to", description: "To", type: 3, required: true,
                        choices: [
                            {name: "Regular", value: "regular"},
                            {name: "Romanized", value: "romanized"},
                            {name: "Emojis (Discord)", value: "emojis"},
                            {name: "Glyphs (Unicode)", value: "glyphs"}
                        ]
                    },
                    Option.QUIET
                ]
            },
            {
                name: "number", description: "Convert number", type: 1,
                options: [
                    {name: "value", description: "Number", type: 3, required: true},
                    {
                        name: "from", description: "From", type: 3, required: true,
                        choices: [
                            {name: "Integer", value: "integer"},
                            {name: "#Drcnc", value: "short"}
                        ]
                    },
                    {
                        name: "to", description: "To", type: 3, required: true,
                        choices: [
                            {name: "Integer", value: "integer"},
                            {name: "Draconic", value: "draconic"},
                            {name: "Draconic (Emojis)", value: "draconic_em"},
                            {name: "#Drcnc", value: "short"},
                            {name: "#Drcnc (Emojis)", value: "short_em"}
                        ]
                    },
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
        const value = interaction.options.getString("value");
        const from = interaction.options.getString("from");
        const to = interaction.options.getString("to");

        switch (sub) {
            case "text": {
                const converters = {
                    regular: CHARACTERS.entriesToText,
                    romanized: CHARACTERS.entriesToRom,
                    glyphs: CHARACTERS.entriesToGlyphs,
                    emojis: entriesToDiscord
                };

                await reply(interaction, "convert.text.result", {value: converters[to](CHARACTERS.textToEntriesByAnyText(value))}, getQuiet(interaction));
                return Result.OK;
            }
            case "number": {
                let number = 0;
                if (from == "integer") {
                    if (!isNumeric(value)) return interaction.reply({content: await getFormatted("error.value_is_nan", {value: value}), flags: 64});
                    number = parseInt(value, 10);
                } else if (from == "short") number = NUMBERS.textToNumberShort(value);
                const converters = {
                    integer: () => number,
                    draconic: () => NUMBERS.numberToText(number),
                    draconic_em: () => entriesToDiscord(CHARACTERS.textToEntriesByAnyText(NUMBERS.numberToText(number))),
                    short: () => NUMBERS.numberToTextShort(number),
                    short_em: () => entriesToDiscord(CHARACTERS.textToEntriesByAnyText(NUMBERS.numberToTextShort(number)))
                };

                await reply(interaction, "convert.number.result", {value: converters[to]()}, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};