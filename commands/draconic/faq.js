import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {clearClipboard, getClipboard} from "../../clipboard.js";
import {FAQS, USERS} from "../../db/db.js";
import {getFormatted} from "../../locales.js";
import {getPerm} from "../../permissions.js";
import {formatDateTime, formatUser, getQuiet} from "../../utils.js";

export default {
    data: {
        description: "FAQ",
        options: [
            {
                name: "get", description: "Get FAQ", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            },
            {
                name: "add", description: "Add FAQ", type: 1,
                options: [ Option.KEY, Option.QUIET ]
            },
            {
                name: "remove", description: "Remove FAQ", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            },
            {
                name: "lock", description: "Lock FAQ", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            },
            {
                name: "unlock", description: "Unlock FAQ", type: 1,
                options: [ Option.KEY_AUTO, Option.QUIET ]
            }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(1, false)],
    async autocomplete(interaction) {
        await interaction.respond(FAQS.query(interaction.options.getFocused()).map(row => ({name: row.name, value: row.name })));
    },
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const key = interaction.options.getString("key");

        if (sub === "get") {
            const faq = FAQS.get(key);
            const authorUser = await interaction.client.users.fetch(faq.author);
            const u = USERS.get(faq.author);
        
            await reply(interaction, "faq.get.result", {name: faq.name, author: formatUser(u.title, authorUser), text: faq.content, timestamp: formatDateTime(faq.timestamp) }, getQuiet(interaction));
            return Result.OK;
        }

        if (getPerm(interaction.user.id) < 3) return Result.NO_PERM(3, false);
        switch (sub) {
            case "add": {
                const clip = getClipboard(interaction.user.id);
                if (!clip) return Result.CUSTOM("Empty clipboard");

                try {
                    FAQS.add(key, {"name": key, "author": clip.author, "added_by": interaction.user.id, "content": clip.content, "timestamp": clip.createdAt, "locked": false});
                    clearClipboard(interaction.user.id);
                } catch (err) {
                    if (err.code === "SQLITE_CONSTRAINT_PRIMARYKEY") return Result.CUSTOM(await getFormatted("faq.add.exists", {name: key }));
                    throw err;
                }

                await reply(interaction, "faq.add.result", {name: key}, getQuiet(interaction));
                return Result.OK;
            }
            case "remove": {
                const faq = FAQS.get(key);
                if (faq.locked) return Result.CUSTOM(await getFormatted("faq.remove.locked", {name: key }));

                FAQS.remove(key);

                await reply(interaction, "faq.remove.result", {name: key}, getQuiet(interaction));
                return Result.OK;
            }
        }

        if (perm < 4) return Result.NO_PERM(4);
        switch (sub) {
            case "lock": {
                const faq = FAQS.get(key);
                if (faq.locked) return Result.CUSTOM(await getFormatted("faq.lock.locked", {name: key }));
                
                FAQS.update(key, {"locked": true});

                await reply(interaction, "faq.lock.result", {name: key}, getQuiet(interaction));
                return Result.OK;
            }
            case "unlock": {
                const faq = FAQS.get(key);
                if (!faq.locked) return Result.CUSTOM(await getFormatted("faq.unlock.unlocked", {name: key }));
                
                FAQS.update(key, {"locked": false});

                await reply(interaction, "faq.unlock.result", {name: key}, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};