import "dotenv/config";
import {loadDefaultLocales, syncLocales} from "./locales.js";
import {setGlobalDispatcher, Agent} from "undici";
import {loadDialect} from "./draconic.js";
import {startBot} from "./bot.js";
import {loadAllCommandGroups, registerCommands, runCommandListener} from "./commands.js";
import {loadAllEventGroups, registerEvents} from "./events.js";
import {error, info, verbose} from "./logger.js";

setGlobalDispatcher(new Agent({connect: {timeout: 30_000}}));

async function main() {
  verbose("------------------------ NEW INSTANCE ------------------------")
  await loadDialect("dr_dr")
  await loadDefaultLocales("default_locales.json")
  await syncLocales()

  await loadAllCommandGroups();
  await loadAllEventGroups();

  await runCommandListener();
  await registerCommands();
  await registerEvents();

  process.on("unhandledRejection", (err) => {error(`Unhandled rejection: ${err}`);});

  await startBot()
}

main().catch(err => error(`Fatal: ${err.stack}`));