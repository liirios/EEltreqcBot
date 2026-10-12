import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {LOCALES} from "../../db/db.js";
import {getLocale, resetLocale, setLocale, syncLocales} from "../../locales.js";
import {getPerm} from "../../permissions.js";
import {getQuiet} from "../../utils.js";

export default {
    data: {
        description: "Locale",
        options: [
            {
                name: "get", description: "Get locale", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            },
            {
                name: "update", description: "Update locale", type: 1,
                options: [ Option.KEY_AUTO, Option.VALUE, Option.QUIET ]
            },
            {
                name: "reset", description: "Reset locale", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            },
            {
                name: "add", description: "Add new locale", type: 1,
                options: [ Option.KEY, Option.VALUE, Option.QUIET ]
            },
            {
                name: "actualize", description: "Update locale in default json", type: 1,
                options: [ Option.KEY, Option.QUIET ]
            },
            {
                name: "sync", description: "Sync locale with default json", type: 1,
                options: [ Option.QUIET ]
            },
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(1, false)],
    async autocomplete(interaction) {
        await interaction.respond(LOCALES.query(interaction.options.getFocused()).map(row => ({name: row.name, value: row.name})));
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const value = interaction.options.getString("value");

        if (sub === "get") {
            await reply(interaction, "locale.get.result", {key: key, value: getLocale(key)}, getQuiet(interaction));
            return Result.OK;
        }

        if (getPerm(interaction.user.id) < 3) return Result.NO_PERM(3, false);
        switch (sub) {
            case "update": {
                setLocale(key, value);
                await reply(interaction, "locale.set.result", {key: key, value: value}, getQuiet(interaction));
                return Result.OK;
            }
            case "reset": {
                resetLocale(key, value);
                await reply(interaction, "locale.reset.result", {key: key, value: getLocale(key)}, getQuiet(interaction));
                return Result.OK;
            }
            case "add": {
                return Result.UNIMPL;
                // addLocale(key, value);
                await reply(interaction, "locale.add.result", {key: key, value: getLocale(key)}, getQuiet(interaction));
                return Result.OK;
            }
            case "actualize": {
                return Result.UNIMPL;
                // actualizeLocale(key);
                await reply(interaction, "locale.actualize.result", {key: key, value: getLocale(key)}, getQuiet(interaction));
                return Result.OK;
            }
            case "sync": {
                syncLocales();
                await reply(interaction, "locale.sync.result", {key: key, value: getLocale(key)}, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};