import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getQuiet} from "../../utils.js";

export default {
    data: {
        description: "Thy",
        options: [
            {
                name: "rename", description: "Rename", type: 1,
                options: [ Option.VALUE_OPTIONAL, Option.QUIET ]
            },
            {
                name: "status", description: "Status", type: 1,
                options: [
                    {name: "status", description: "Status", type: 3, choices: Option.STATUSES, required: true },
                    {name: "type", description: "Activity", type: 4, choices: Option.TYPES, required: true },
                    Option.VALUE,
                    Option.QUIET
                ]
            }
        ],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(4, false)],
    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        const value = interaction.options.getString("value");

        switch (sub) {
            case "rename": {
                await interaction.guild.members.me.setNickname(value);
                await reply(interaction, "thy.rename.result", {value: value}, getQuiet(interaction));
                return Result.OK;
            }
            case "status": {
                const status = interaction.options.getString("status");
                const type = interaction.options.getInteger("type");

                const status_text = Option.STATUSES.find(c => c.value === status)?.name;
                const type_text = Option.TYPES.find(c => c.value === type)?.name;

                interaction.client.user.setPresence({status, activities: value ? [{name: value, type}] : []});

                await reply(interaction, "thy.status.result", {status: status_text ?? "None", type: type_text ?? "None", value: value}, getQuiet(interaction));
                return Result.OK;
            }
        }
    }
};