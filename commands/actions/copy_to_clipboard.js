import {Option, Result, Setting} from "../../enum.js";
import {setClipboard} from "../../clipboard.js";

export default {
  data: {
    name: "Copy to Clipboard",
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(3, false)],
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) return Result.CUSTOM("empty message");

    setClipboard(interaction.user.id, message.author.id, message.content, message.createdAt);

    await interaction.reply({content: `> copied.`, flags: 64});
    return Result.OK;
  }
};