import "./lib/setup";

import { LogLevel, SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits, Partials } from "discord.js";
import { loadDraconic } from "./lib/draconic";
import "@sapphire/plugin-editable-commands/register";
import "@sapphire/plugin-subcommands/register";
import { ResolvedChannel } from "./lib/helpers/channels";
import { ResolvedGuild } from "./lib/helpers/guilds";
import { PREFIX } from "./lib/config";

const client = new SapphireClient({
	defaultPrefix: PREFIX,
	caseInsensitiveCommands: true,
	logger: {
		level: LogLevel.Debug
	},
	intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.GuildMessages, GatewayIntentBits.Guilds, GatewayIntentBits.MessageContent],
	partials: [Partials.Channel],
	loadMessageCommandListeners: true,
	loadDefaultErrorListeners: false,
	loadSubcommandErrorListeners: false,
	allowedMentions: {roles: []},
	fetchPrefix: async (message) => {
		if (!message.guild) return ["", PREFIX];
		return [PREFIX, new ResolvedGuild(message).getPrefix(), new ResolvedChannel(message).getPrefix()]
	}
});

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
