import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getPerm} from "../../permissions.js";
import {formatUser, getQuiet, getTarget} from "../../utils.js";
import {USERS} from "../../db/db.js";

export default {
    data: {
        description: "Set autoquiet",
        options: [Option.TARGET, Option.BOOLEAN, Option.QUIET],
        integration_types: [0, 1],
        contexts: [0, 1, 2]
    },
    settings: [Setting.PERM(3, false)],
    async execute(interaction) {
        const target = getTarget(interaction);
        const boolean = interaction.options.getBoolean("boolean") ?? false;
        
        let quiet = getQuiet(interaction);

        if (target.id !== interaction.user.id) {
            if (getPerm(interaction.user.id) < 3) return Result.NO_PERM(3, false);
        } else quiet = true;

        USERS.update(target.id, {"quiet": boolean})

        await reply(interaction, "quiet.result", {target: formatUser(USERS.get()?.title ?? "{nick}", interaction.user), boolean: boolean}, quiet)
        return Result.OK;
    }
};