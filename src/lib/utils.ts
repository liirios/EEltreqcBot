import { container } from "@sapphire/framework";
import type { ChatInputCommandSuccessPayload, ContextMenuCommandSuccessPayload, MessageCommandSuccessPayload } from "@sapphire/framework";
import { blue, gray, magenta, white, yellow } from "colorette";
import type { Guild, User } from "discord.js";
import { Message, Channel } from "discord.js";
import type { ChatInputSubcommandSuccessPayload, MessageSubcommandSuccessPayload } from "@sapphire/plugin-subcommands";

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

export const formatBotDM = (): string => `DM${inSquareBrackets(formatNumber(container.client.id ?? ""))}`
export const formatUser = (user: User): string => `${white(user.username)}${inSquareBrackets(formatNumber(user.id))}`;
export const formatChannel = (channel: any): string => channel?.name ?? channel?.recipient?.username ? `${white(channel.name ?? channel.recipient.username)}${inSquareBrackets(formatNumber(channel.id))}` : formatBotDM();
export const formatGuild = (guild: Guild | null): string => guild === null ? formatBotDM() : `${white(guild.name)}${inSquareBrackets(formatNumber(guild.id))}`;

export const formatCommandSuccess = (guild: Guild | null, type: string, content: string, user: User, channel: Channel | null): string => inAngleBrackets(`${formatType(type)} ${formatString(content)} ${formatUser(user)}${magenta("@")}${formatChannel(channel)}${magenta("@")}${formatGuild(guild)}`);

export function mapAll<T, R>(targets: T | T[], f: (target: T) => R | undefined): R[] {
	return ([targets].flat() as T[]).flatMap((target) => f(target) ?? []);
}

export function keyFromLabel<T extends Record<string, string>>(obj: T, label: string) {
	return Object.keys(obj).find((value) => obj[value] === label) as keyof T | undefined;
}

export function randomFrom<T>(from: T[]): T {
	return from[Math.floor(Math.random()*from.length)]
}

// logging
export function logSuccessCommand(payload: ContextMenuCommandSuccessPayload | ChatInputCommandSuccessPayload | MessageCommandSuccessPayload | MessageSubcommandSuccessPayload | ChatInputSubcommandSuccessPayload | Message): void {
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