import { ApplyOptions } from "@sapphire/decorators";
import { Listener, LogLevel } from "@sapphire/framework";
import type { Logger } from "@sapphire/plugin-logger";
import type { StoreRegistryValue } from "@sapphire/pieces";
import { gray } from "colorette";
import { VERSION, ACTIVITIES } from "../../../lib/config";
import { formatUser, formatField, formatNumber, formatEnv, formatVersion, formatString } from "../../../lib/utils";

const dev = process.env.NODE_ENV !== "production";

@ApplyOptions<Listener.Options>({once: true})
export class UserEvent extends Listener {
	public override run() {
		this.printDefaultInfo();

		if ((this.container.logger as Logger).level <= LogLevel.Debug) this.printDebugInfo();
		this.container.client.user?.setPresence({activities: ACTIVITIES})
	}

	// default
	private printDefaultInfo() {
		this.container.logger.info(this.bannerVersion());
		this.container.logger.info(this.bannerMode(dev));

		this.container.logger.info(this.botAccount());
		this.container.logger.info(this.botPrefix());
		this.container.logger.info(this.botGuilds());
		this.container.logger.info(this.botUsers());
	}

	private bannerVersion() {
		return formatVersion(VERSION);
	}

	private bannerMode(dev: boolean) {
		return formatEnv(dev)
	}

	private botAccount() {
		return formatField("Account", formatUser(this.container.client.user!));
	}

	private botPrefix() {
		return formatField("Prefix", formatString(String(this.container.client.options.defaultPrefix ?? "@bot only")));
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
		return `${gray(`${store.name}`)}: ${formatNumber(store.size.toString())}`;
	}
}