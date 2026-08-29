import { reply } from "../../bot.js";
import { clearClipboard, getClipboard } from "../../clipboard.js";
import { addFAQ, delFAQ, getFAQ, getUser, searchFAQNames } from "../../db.js";
import { InteractionOption, InteractionResponse } from "../../enum.js";
import { getFormatted } from "../../locales.js";
import { getPerm } from "../../permissions.js";
import { formatUser } from "../../utils.js";

export default {
    data: {
        description: "FAQ",
        options: [
            {
                name: "get", description: "Get FAQ", type: 1,
                options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
            },
            {
                name: "add", description: "Add FAQ", type: 1,
                options: [ InteractionOption.KEY, InteractionOption.QUIET ]
            },
            {
                name: "remove", description: "Remove FAQ", type: 1,
                options: [ InteractionOption.KEY_AUTO, InteractionOption.QUIET ]
            }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    minPerm: 1,
    async autocomplete(interaction) {
        await interaction.respond(searchFAQNames(interaction.options.getFocused()).map(row => ({ name: row.name, value: row.name })));
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");
        const quiet = interaction.options.getBoolean("quiet") ?? false;
        const perm = getPerm(interaction.user.id);

        switch (sub) {
            case "get": {
                const faq = getFAQ(key);
                const authorUser = await interaction.client.users.fetch(faq.author);
                const u = getUser(faq.author);
            
                await reply(interaction, "faq.get.result", { name: faq.name, author: formatUser(u.title, authorUser), text: faq.content }, quiet);
                return InteractionResponse.OK;
            }
            case "add": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);

                const clip = getClipboard(interaction.user.id);
                if (!clip) return InteractionResponse.CUSTOM("Empty clipboard");

                try {
                    addFAQ(key, clip.author, interaction.user.id, clip.content);
                    clearClipboard(interaction.user.id);
                } catch (err) {
                    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") return InteractionResponse.CUSTOM(await getFormatted("faq.add.exists", { name: key }));
                    throw err;
                }

                await reply(interaction, "faq.add.result", { name: key}, quiet);
                return InteractionResponse.OK;
            }
            case "remove": {
                if (perm < 3) return InteractionResponse.NO_PERM(3);
                delFAQ(key);

                await reply(interaction, "faq.remove.result", { name: key }, quiet);
                return InteractionResponse.OK;
            }
        }
    }
};