import "dotenv/config";
import { loadDefaultLocales, syncLocales } from "./locales.js";
import { setGlobalDispatcher, Agent } from "undici";
import { loadDialect } from "./draconic.js";
import { loadCommandGroup, registerCommands, startBot } from "./bot.js";
import { error, info, verbose } from "./logger.js";

setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

async function main() {
  verbose("------------------------ NEW INSTANCE ------------------------")
  await loadDialect("dr_dr")
  await loadDefaultLocales("default_locales.json")
  await syncLocales()
  await loadCommandGroup("core");
  await loadCommandGroup("fun");
  await loadCommandGroup("draconic");
  await loadCommandGroup("actions");
  await registerCommands()

  process.on("unhandledRejection", (err) => { error(`Unhandled rejection: ${err}`); });

  await startBot()
}

main().catch(err => error(`Fatal: ${err}`));