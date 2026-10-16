import { container } from "@sapphire/framework";
import type { ChatInputCommandSuccessPayload, ContextMenuCommandSuccessPayload, MessageCommandSuccessPayload } from "@sapphire/framework";
import { blue, gray, magenta, white, yellow } from "colorette";
import type { BaseMessageOptions, Guild, User } from "discord.js";
import { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message, MessageFlags, Channel } from "discord.js";
import { IOM, ReplyFlags } from "./constants";
import type { MessageSubcommandSuccessPayload } from "@sapphire/plugin-subcommands";
import { reply } from '@sapphire/plugin-editable-commands';

// color formatting
export const formatField = (label: string, value: string): string => `${gray(`${label}:`)} ${value}`;
export const formatVersion = (version: string): string => formatField("Version", yellow(version));
export const formatEnv = (dev: boolean): string => dev ? magenta("</> DEVELOPMENT MODE") : `${gray("<")}${yellow("/")}${gray(">")} ${yellow("PRODUCTION MODE")}`;

export const formatNumber = (num: number | string): string => blue(num);
export const formatString = (num: string): string => yellow(`"${num}"`);
export const formatType = (type: string | any): string => magenta(typeof type === "string" ? type : typeof type);

export const inSquareBrackets = (text: string): string => `${gray("[")}${text}${gray("]")}`;
export const inRoundBrackets = (text: string): string => `${gray("(")}${text}${gray(")")}`;
export const inCurlyBrackets = (text: string): string => `${gray("{")}${text}${gray("}")}`;
export const inAngleBrackets = (text: string): string => `${gray("<")}${text}${gray(">")}`;

export const DMFormatted = (): string => `DM${inSquareBrackets(formatNumber(container.client.id ?? ""))}`
export const formatAuthor = (user: User): string => `${white(user.username)}${inSquareBrackets(formatNumber(user.id))}`;
export const formatChannel = (channel: any): string => channel?.name ?? channel?.recipient?.username ? `${white(channel.name ?? channel.recipient.username)}${inSquareBrackets(formatNumber(channel.id))}` : DMFormatted();
export const formatGuild = (guild: Guild | null): string => guild === null ? DMFormatted() : `${white(guild.name)}${inSquareBrackets(formatNumber(guild.id))}`;

export const formatCommandSuccess = (guild: Guild | null, type: string, content: string, user: User, channel: Channel | null): string => inAngleBrackets(`${formatType(type)} ${formatString(content)} ${formatAuthor(user)}${magenta("@")}${formatChannel(channel)}${magenta("@")}${formatGuild(guild)}`);

export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload | MessageSubcommandSuccessPayload | Message): void {
	let guild: Guild | null;
	let user: User;
	let content: string;
	let type: string;
	let channel: Channel | null;

	if (payload instanceof Message) {
		guild = payload.guild;
		user = payload.author;
		content = payload.content;
		channel = payload.channel;
		type = "subcommand";
	} else if ("interaction" in payload) {
		guild = payload.interaction.guild;
		user = payload.interaction.user;
		channel = payload.interaction.channel;

		if (payload.interaction.isChatInputCommand()) {
			content = payload.interaction.toString();
			type = "slash";
		} else {
			content = payload.interaction.commandName;
			type = "context menu";
		}
	} else {
		guild = payload.message.guild;
		user = payload.message.author;
		channel = payload.message.channel;
		content = payload.message.content;
		type = "command";
	}

	container.logger.debug(formatCommandSuccess(guild, type, content, user, channel));
}


// discord
export function getQuiet(iom: IOM): ReplyFlags {
	return iom instanceof ChatInputCommandInteraction && (iom.options.getBoolean("quiet") ?? false) ? MessageFlags.Ephemeral : undefined
} // TODO: make custom iom class

export const isMessage = (iom: IOM): iom is Message => iom instanceof Message;
export const isSlash = (iom: IOM): iom is ChatInputCommandInteraction => iom instanceof ChatInputCommandInteraction;
export const isContextMenu = (iom: IOM): iom is ContextMenuCommandInteraction => iom instanceof ContextMenuCommandInteraction;

export async function universalReply(iom: IOM, content: string = "", forceQuiet?: boolean, editable: boolean = true, options: BaseMessageOptions = {}): Promise<Message | undefined> {
	const payload = {...options, content: crop(2000, content)};
	if (isSlash(iom)) {
		if (iom.deferred || iom.replied) return await iom.editReply(payload);
		return await iom.reply({...payload, fetchReply: true, flags: forceQuiet === undefined ? getQuiet(iom) : (forceQuiet ? MessageFlags.Ephemeral : undefined)});
	}
	else if (isMessage(iom) && iom.channel?.isSendable()) return editable ? await reply(iom, payload) : await iom.reply(payload);
	return;
}

export async function universalEditReply(iom: IOM, target?: Message, content: string = "", options: BaseMessageOptions = {}): Promise<Message | undefined> {
    const payload = {...options, content: crop(2000, content)};
    if (isSlash(iom)) {
        if (!iom.deferred && !iom.replied) return await universalReply(iom, content, undefined, true, options);
        return await iom.editReply(payload);
    }
    if (target !== undefined) return await target.edit(payload);
    return;
}

// rest
export function highlight(words: string, content: string): string {
	const wordList = [...new Set(words.split(/\s+/).filter(Boolean))];
	if (!wordList.length) return content;

	const escaped = wordList.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const pattern = new RegExp(`(?:${escaped.join("|")})`, "gi");

	return content.replace(pattern, (m) => `**${m}**`).replace(/\*\*(\s+)\*\*/g, "$1");
}

export function crop(maximum: number, content: string): string {
	if (content.length <= maximum) return content;
	return content.slice(0, maximum - 10) + `... +${content.length - maximum}`;
}

export function keyFromLabel<T extends Record<string, string>>(obj: T, label: string) {
	return Object.keys(obj).find(key => obj[key] === label) as keyof T | undefined;
}