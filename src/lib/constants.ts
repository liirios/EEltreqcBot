import { join } from "path";
import { Message, InteractionReplyOptions } from "discord.js";
import { Command } from "@sapphire/framework";
import { PresenceUpdateStatus, ActivityType } from "discord.js";

export const rootDir = join(__dirname, "..", "..");
export const srcDir = join(rootDir, "src");

export type IOM = Message | Command.ChatInputCommandInteraction | Command.ContextMenuCommandInteraction
export type ReplyFlags = InteractionReplyOptions["flags"];

export const STATUS_TYPES = {
	[ActivityType.Playing]: "Playing",
    [ActivityType.Streaming]: "Streaming",
	[ActivityType.Listening]: "Listening",
	[ActivityType.Watching]: "Watching",
	[ActivityType.Custom]: "Custom",
	[ActivityType.Competing]: "Competing"
} as const;
export type StatusType = keyof typeof STATUS_TYPES;

export const PRESENCE_TYPES = {
	[PresenceUpdateStatus.Online]: "Online",
	[PresenceUpdateStatus.Idle]: "Idle",
	[PresenceUpdateStatus.DoNotDisturb]: "DoNotDisturb",
	[PresenceUpdateStatus.Invisible]: "Invisible"
} as const
export type PresenceType = keyof typeof PRESENCE_TYPES;

export const TEXT_TARGETS = {
	regular: "Regular",
	romanized: "Romanized",
	emojis: "Emojis",
	glyphs: "Glyphs"
} as const;
export type TextTarget = keyof typeof TEXT_TARGETS;

export const NUMBER_SOURCES = {
	integer: "Integer",
	short: "#Drcnc"
} as const;
export type NumberSource = keyof typeof NUMBER_SOURCES;

export const NUMBER_TARGETS = {
	integer: "Integer",
	draconic: "Draconic",
	draconic_em: "DraconicEmojis",
	short: "#Drcnc",
	short_em: "#DrcncEmojis"
} as const;
export type NumberTarget = keyof typeof NUMBER_TARGETS;