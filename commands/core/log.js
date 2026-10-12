import {Option, Result, Setting} from "../../enum.js";
import {reply} from "../../bot.js";
import {getFormatted} from "../../locales.js";
import {query} from "../../logger.js";
import {crop} from "../../utils.js";

export default {
  data: {
    description: "log",
    options: [
      {name: "count", description: "Count", type: 4},
      // TODO: ADD SORT & SEARCH
      Option.QUIET
    ],
    integration_types: [0, 1],
    contexts: [0, 1, 2]
  },
  settings: [Setting.PERM(3, false)],
  async execute(interaction) {
    const count = interaction.options.getInteger("count") ?? 10;
    const quiet = interaction.options.getBoolean("quiet") ?? false;

    query({limit: count}, async (err, results) => {
      const entries = await Promise.all((results ?? {})[0] ?? [].map(s => {
          return getFormatted("log.entry", {timestamp: e.timestamp, level: e.level, message: e.message});
      }));

      let content = entries.join("\n") || "> No results";
      await reply(interaction, "log.result", {query: count, results: content}, quiet)
      return Result.OK;
    });
  }
};