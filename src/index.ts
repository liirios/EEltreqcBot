import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import { loadDraconic } from "./lib/draconic";
import "@sapphire/plugin-editable-commands/register";
import "@sapphire/plugin-subcommands/register";
import { PREFIX } from "./lib/config";
import { join } from "path";
import { getRootData } from "@sapphire/pieces";
import { readdirSync } from "fs";
import { PRE, Prefixes } from "./lib/helpers/prefixes";

const client = new SapphireClient({
	defaultPrefix: PREFIX,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions],
	partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.User],
	loadMessageCommandListeners: true,
	loadDefaultErrorListeners: false,
	loadSubcommandErrorListeners: false,
	allowedMentions: {roles: []},
	fetchPrefix: async (message) => {
		if (!message.guild) return ["", PRE.getGlobal()];
		const prefixes = PRE.getAvailable(message, message);
		if (Prefixes.isDisabled(prefixes)) return [];
		return Prefixes.usable(prefixes);
	}
});

const cogsRoot = join(getRootData().root, "cogs");
for (const entry of readdirSync(cogsRoot, { withFileTypes: true })) {
	if (entry.isDirectory()) client.stores.registerPath(join(cogsRoot, entry.name));
}

const main = async () => {
	try {
		client.logger.info("Logging in");
		await loadDraconic();
		await client.login();
		client.logger.info("logged in");
	} catch (error) {
		client.logger.fatal(error);
		await client.destroy();
		process.exit(1);
	}
};

void main();