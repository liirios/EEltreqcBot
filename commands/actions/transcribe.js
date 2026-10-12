import {Option, Result, Setting} from "../../enum.js";
import {entriesToDiscord} from "../../draconic.js";

export default {
  data: {
    type: 3,
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(1, false)],
  async execute(interaction) {
    const message = interaction.targetMessage;

    if (!message.content) return Result.CUSTOM("empty message");

    await reply(interaction, "transcribe.result", {value: entriesToDiscord(CHARACTERS.textToEntriesByAnyText(message.content))}, true);
    return Result.OK;
  }
};