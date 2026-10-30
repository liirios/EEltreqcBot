import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import type { IOM } from "../../../lib/constants";
import { prePerm } from "../../../lib/perms";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { ResolvedGuild } from "../../../lib/helpers/guilds";

const OPTIONS = ["style", "force"];
const FLAGS = ["force"];

const GET_STYLES = ["short", "full", "shortEmbed", "fullEmbed"];
const DEFAULT_GET_STYLE = GET_STYLES[0];

@ApplyOptions<Subcommand.Options>({
	name: "guild", description: "guild", aliases: ["guilds"],
	options: OPTIONS, flags: FLAGS, 
	subcommands: [
		{name: "get", chatInputRun: "guildGet", messageRun: "guildGet"}
	],
	preconditions: [prePerm(1)]
})
export class GuildCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get info about a guild", (o) => o.string("id").string("style").boolean("force").quiet())
			.builder
		);
	}

	private async pickGuild(um: UniversalMessage): Promise<ResolvedGuild | undefined> {
		const id = ((await um.grab.pick("string", "id", null).catch(() => null)) ?? "").trim();
		if (!id) return ResolvedGuild.from(um.guild);
		return /^\d{17,20}$/.test(id) ? ResolvedGuild.from(id) : undefined;
	} // TODO: move to um

	public async guildGet(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(5);

		const target = await this.pickGuild(um);
		if (!target) return um.reply(`Invalid guild id\n-`);

		const style = await um.grab.optionFromList("string", "style", GET_STYLES, false, DEFAULT_GET_STYLE);
		const force = await um.grab.optionOrFlag("force");

		const guild = await target.resolve(force);
		if (!guild.valid()) return um.reply("You need to give a guild id here");
		if (!guild.guild) return um.reply("Couldn't find that guild");

		switch (style) {
			case "full": return um.reply(guild.full());
			case "shortEmbed": return um.setContent("").setEmbeds(guild.shortEmbed()).reply();
			case "fullEmbed": return um.setContent("").setEmbeds(guild.fullEmbed()).reply();
			case "short":
			default: return um.reply(guild.short());
		}
	}
}