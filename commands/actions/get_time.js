import {Option, Result, Setting} from "../../enum.js";
import {formatDateTime} from "../../utils.js";

export default {
  data: {
    name: "Get Time",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(3, false)],
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) return Result.CUSTOM("empty message");
    
    await interaction.reply({content: `> ${formatDateTime(message.createdAt)}`, flags: 64});
    return Result.OK;
  }
};