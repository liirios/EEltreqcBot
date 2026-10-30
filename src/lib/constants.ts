import { join } from "path";
import { ActivityType, PresenceUpdateStatus, type InteractionReplyOptions, type Message } from "discord.js";
import type { Command } from "@sapphire/framework";

// do not change anything here obviously
// values here are very unlikely to be changed in the future
// like discord limits or smth

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

export const EMBED_TITLE_LIMIT = 256;
export const EMBED_DESCRIPTION_LIMIT = 4096;
export const EMBED_FOOTER_LIMIT = 2048;
export const EMBED_AUTHOR_LIMIT = 256;
export const EMBED_FIELD_NAME_LIMIT = 256;
export const EMBED_FIELD_VALUE_LIMIT = 1024;
export const EMBED_FIELDS_LIMIT = 25;
export const EMBED_TOTAL_LIMIT = 6000;

export const IMAGE_OPTIONS = {size: 4096, extension: "png"} as const;
export const THUMBNAIL_OPTIONS = {size: 1024} as const;