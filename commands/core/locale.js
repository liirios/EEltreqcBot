import { reply } from "../../bot.js";
import { searchLocaleNames } from "../../db.js";
import { InteractionOption, InteractionResponse } from "../../enum.js";
import { getLocale, resetLocale, setLocale, syncLocales } from "../../locales.js";
import { getPerm } from "../../permissions.js";

export default {
    data: {
        description: "Locale",
        options: [
            {
                name: "get", description: "Get locale", type: 1,
                options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
            },
            {
                name: "set", description: "Set locale", type: 1,
                options: [ InteractionOption.KEY_AUTO, InteractionOption.VALUE, InteractionOption.QUIET ]
            },
            {
                name: "reset", description: "Reset locale", type: 1,
                options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
            },
            {
                name: "add", description: "Add new locale", type: 1,
                options: [ InteractionOption.KEY, InteractionOption.VALUE, InteractionOption.QUIET ]
            },
            {
                name: "actualize", description: "Update locale in default json", type: 1,
                options: [ InteractionOption.KEY, InteractionOption.QUIET ]
            },
            {
                name: "sync", description: "Sync locale with default json", type: 1,
                options: [ InteractionOption.QUIET ]
            },
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    minPerm: 1,
    async autocomplete(interaction) {
        await interaction.respond(searchLocaleNames(interaction.options.getFocused()).map(row => ({ name: row.name, value: row.name })));
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");
        const quiet = interaction.options.getBoolean("quiet") ?? false;
        const perm = getPerm(interaction.user.id);

        switch (sub) {
            case "get": {
                await reply(interaction, "locale.get.result", { key: key, value: getLocale(key) }, quiet);
                return InteractionResponse.OK;
            }
            case "set": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                setLocale(key, value);
                await reply(interaction, "locale.set.result", { key: key, value: value }, quiet);
                return InteractionResponse.OK;
            }
            case "reset": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                resetLocale(key, value);
                await reply(interaction, "locale.reset.result", { key: key, value: getLocale(key) }, quiet);
                return InteractionResponse.OK;
            }
            case "add": {
                return InteractionResponse.UNIMPL;
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                addLocale(key, value);
                await reply(interaction, "locale.add.result", { key: key, value: getLocale(key) }, quiet);
                return InteractionResponse.OK;
            }
            case "actualize": {
                return InteractionResponse.UNIMPL;
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                actualizeLocale(key);
                await reply(interaction, "locale.actualize.result", { key: key, value: getLocale(key) }, quiet);
                return InteractionResponse.OK;
            }
            case "sync": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                syncLocales();
                await reply(interaction, "locale.sync.result", { key: key, value: getLocale(key) }, quiet);
                return InteractionResponse.OK;
            }
        }
    }
};