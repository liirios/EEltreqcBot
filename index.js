import "dotenv/config";
import { loadDefaultLocales, syncLocales } from "./locales.js";
import { setGlobalDispatcher, Agent } from "undici";
import { loadDialect } from "./draconic.js";
import { loadCommands, registerCommands, startBot } from "./bot.js";

setGlobalDispatcher(new Agent({ connect: { timeout: 30_000 } }));

async function main() {
  await loadDialect("dr_dr")
  await loadDefaultLocales("default_locales.json")
  await syncLocales()
  await loadCommands("commands");
  await loadCommands("admin_commands");
  await loadCommands("actions");
  await registerCommands()

  process.on("unhandledRejection", console.error);

  await startBot()
}

main().catch(console.error);