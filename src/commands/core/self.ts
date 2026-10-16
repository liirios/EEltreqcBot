import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ActivitiesOptions, ActivityType, userMention } from "discord.js";
import { PRESENCE_TYPES, PresenceType, STATUS_TYPES, type IOM } from "../../lib/constants";
import { AUTHOR_ID, VERSION } from "../../lib/config";
import { isMessage, isSlash, keyFromLabel, universalReply } from "../../lib/utils";
import { Args } from "@sapphire/framework";
import { prePerm, requirePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import { SlashBuilder } from "../../lib/helpers/slash";

const AVAILABLE_GET = ["author", "prefix", "version"];


@ApplyOptions<Subcommand.Options>({
	name: "self", description: "self",
	subcommands: [
		{name: "get", chatInputRun: "getField", messageRun: "getField"},
		{
			name: "set", type: "group",
			entries: [
				{name: "name", chatInputRun: "setName", messageRun: "setName"},
				{name: "status", chatInputRun: "setStatus", messageRun: "setStatus"}
			]
		}
	],
	preconditions: [prePerm(1)]
})
export class SelfCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get info about this bot", (o) => o
				.string("field", true, "Field to take data from", AVAILABLE_GET)
				.quiet())
			.grp("set", "Alter state of this bot", (g) => g
				.sub("name", "Set this bot's username in current guild", (o) => o
					.string("value")
					.quiet())
				.sub("status", "Set this bot's global status", (o) => o
					.string("presence", true, "Presence type", PRESENCE_TYPES)
					.string("status", false, "Status type", STATUS_TYPES)
					.string("value", false, "Text displayed in status")
					.quiet()))
			.builder
		);
	}

	public async getField(iom: IOM, args?: Args) {
		let field = ""
		if (isSlash(iom)) field = iom.options.getString("field", true);
		else if (isMessage(iom) && args) field = await new Grabber(args).pickFrom("string", "field", AVAILABLE_GET, false);
		else return;

		let content = "";
		switch (field) {
			case "author": {content = `This bot's author is ${userMention(AUTHOR_ID)}`; break;}
			case "prefix": {content = `This bot's default prefix is ${this.container.client?.user} or \`^\``; break;}
			case "version": {content = `This bot's version is \`${VERSION}\``; break;}
		}

		await universalReply(iom, content)}

	public async setName(iom: IOM, args?: Args) {
		if (!iom.guild) return universalReply(iom, "You cant use that here");
		let value = undefined;
		if (isSlash(iom)) value = iom.options.getString("value")
		else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			value = await grab.rest("string", "value", "")
			if (value.length === 0) value = null;
		}
		if (value === undefined) return universalReply(iom, "Somewhy the name argument wasnt acquired");
		await iom.guild.members.me?.setNickname(value)
		return universalReply(iom, `Self name changed to \`${value}\` at ${iom.guild.name}`)
	}

	public async setStatus(iom: IOM, args?: Args) {
		let presence: PresenceType, status: ActivityType, value: string | null;
		if (isSlash(iom)) {
			requirePerm(iom.user.id, 3);
			presence = iom.options.getString("presence", true) as PresenceType;
			status = Number(iom.options.getString("status") ?? ActivityType.Custom);
			value = iom.options.getString("value");
		} else if (isMessage(iom) && args) {
			requirePerm(iom.author.id, 3);
			const grab = new Grabber(args);
			presence = keyFromLabel(PRESENCE_TYPES, await grab.pickFrom("string", "presence", Object.values(PRESENCE_TYPES), false)) as PresenceType;
			status = Number(keyFromLabel(STATUS_TYPES, await grab.pickFrom("string", "status", Object.values(STATUS_TYPES), false, STATUS_TYPES[4])));
			value = (await grab.rest("string", "value", "")) || null;
		} else return;

		if (status === ActivityType.Streaming) return universalReply(iom, "Streaming is unimplemented");

		if (!value) {
			this.container.client.user?.setPresence({ status: presence, activities: [] });
			return universalReply(iom, `Self presence changed to ${PRESENCE_TYPES[presence]}`);
		}

		let activity: ActivitiesOptions;
		switch (status) {
			case ActivityType.Custom: {activity = { name: "custom", type: status, state: value }; break;}
			default: {activity = { name: value, type: status };}
		}
		this.container.client.user?.setPresence({ status: presence, activities: [activity] });
		return universalReply(iom, `Self presence changed to ${PRESENCE_TYPES[presence]}, ${STATUS_TYPES[status]}: \`${value}\``);
	}
}