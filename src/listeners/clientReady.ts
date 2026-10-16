import { ApplyOptions } from "@sapphire/decorators";
import { Listener, LogLevel } from "@sapphire/framework";
import type { Logger } from "@sapphire/plugin-logger";
import type { StoreRegistryValue } from "@sapphire/pieces";
import { gray, yellow } from "colorette";
import { VERSION } from "../lib/config";
import { formatAuthor, formatField, formatNumber, formatEnv, formatVersion } from "../lib/utils";
import { ActivityType } from "discord.js";

const dev = process.env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({ once: true })
export class UserEvent extends Listener {
	public override run() {
		this.printDefaultInfo();

		if ((this.container.logger as Logger).level <= LogLevel.Debug) this.printDebugInfo();
		this.container.client.user?.setPresence({activities: [{ name: "custom", type: ActivityType.Custom, state: "UNDER MAINTENANCE (porting to typescript)" }]})
	}

	// default
	private printDefaultInfo() {
		const { logger } = this.container;

		logger.info(this.bannerVersion());
		logger.info(this.bannerMode(dev));

		logger.info(this.botAccount());
		logger.info(this.botPrefix());
		logger.info(this.botGuilds());
		logger.info(this.botUsers());
	}

	private bannerVersion() {
		return formatVersion(VERSION);
	}

	private bannerMode(dev: boolean) {
		return formatEnv(dev)
	}

	private botAccount() {
		return formatField("Account", formatAuthor(this.container.client.user!));
	}

	private botPrefix() {
		return formatField("Prefix", yellow(String(this.container.client.options.defaultPrefix ?? "none")));
	}

	private botGuilds() {
		return formatField("Guilds", formatNumber(this.container.client.guilds.cache.size));
	}

	private botUsers() {
		return formatField("Users", formatNumber(this.container.client.guilds.cache.reduce((sum, guild) => sum + guild.memberCount, 0)));
	}

	// debug
	private printDebugInfo() {
		for (const store of this.container.client.stores.values()) this.container.logger.debug(this.styleStore(store));
	}

	private styleStore(store: StoreRegistryValue) {
		return `${gray("Loaded")} ${yellow(store.size.toString().padEnd(3, " "))} ${gray(`${store.name}.`)}`;
	}
}