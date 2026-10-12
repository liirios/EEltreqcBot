import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getPerm, getPermName} from "../../permissions.js";
import {getQuiet, getTarget} from "../../utils.js";
import {USERS} from "../../db/db.js";

export default {
    data: {
        description: "User",
        options: [
        {
            name: "get", description: "Get user data", type: 1,
            options: [ Option.TARGET, Option.QUIET ]
        },
        {
            name: "update", description: "Update user data", type: 1,
            options: [
                Option.TARGET,
                {name: "perm", description: "Permission level", type: 4},
                {name: "title", description: "Title", type: 3},
                {name: "limited", description: "Limited", type: 5},
                {name: "setquiet", description: "Autoquiet", type: 5},
                Option.QUIET
            ]
        }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(1, false)],
    async autocomplete(interaction) {
        await interaction.respond(searchLocaleNames(interaction.options.getFocused()).map(row => ({name: row.name, value: row.name })));
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const target = getTarget(interaction)
        const setperm = interaction.options.getInteger("perm");
        const title = interaction.options.getString("title");
        const limited = interaction.options.getBoolean("limited");
        const setquiet = interaction.options.getBoolean("setquiet");
        const perm = getPerm(interaction.user.id);
        const u = USERS.get(target.id);

        switch (sub) {
            case "get": {
                await reply(interaction, "user.get.result", {target: target.username, id: target.id, perm: u.perm, perm_name: getPermName(u.perm), title: u.title, limited: limited, quiet: setquiet}, getQuiet(interaction));
                return Result.OK;
            }
            case "update": {
                if (perm < 3) return Result.NO_PERM(3, false);
                if (setperm > 2 && perm < 4) return Result.NO_PERM(4, false);
                USERS.update(target.id, {"perm": setperm, "title": title, "limited": limited, "quiet": setquiet});
                const ul = USERS.get(target.id);
                await reply(interaction, "user.update.result", {target: target.username, id: target.id, perm: ul.perm, perm_name: getPermName(ul.perm), title: ul.title, limited: limited, quiet: setquiet}, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};