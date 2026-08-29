import { reply } from "../../bot.js";
import { searchLocaleNames } from "../../db.js";
import { InteractionOption, InteractionResponse } from "../../enum.js";
import { getPerm, getPermName } from "../../permissions.js";

export default {
    data: {
        description: "User",
        options: [
        {
            name: "get", description: "Get user data", type: 1,
            options: [ InteractionOption.USER, InteractionOption.QUIET ]
        },
        {
            name: "set", description: "Set user data", type: 1,
            options: [
                InteractionOption.USER,
                { name: "perm", description: "Permission level", type: 4 },
                { name: "title", description: "Title", type: 3 },
                InteractionOption.QUIET
            ]
        }
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
        const user = interaction.options.getString("user");
        const setperm = interaction.options.getString("perm");
        const title = interaction.options.getString("title");
        const quiet = interaction.options.getBoolean("quiet") ?? false;
        const perm = getPerm(interaction.user.id);

        switch (sub) {
            case "get": {
                const u = getUser(target.id);
                await reply(interaction, "user.get.result", { user: user.username, id: user.id, perm: u.perm, perm_name: getPermName(u.perm), title: u.title }, quiet);
                return InteractionResponse.OK;
            }
            case "set": {
                if (perm < 3) return InteractionResponse.NO_PERM(3)
                setUser(user.id, setperm, title);
                const u = getUser(target.id);
                await reply(interaction, "user.set.result", { user: user.username, id: user.id, perm: u.perm, perm_name: getPermName(u.perm), title: u.title }, quiet);
                return InteractionResponse.OK;
            }
        }
    }
};