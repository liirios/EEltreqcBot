import { PREFIX } from "./config";
import { ResolvedTime } from "./helpers/timestamps";
import { ResolvedUser } from "./helpers/users";

export function toString(value: unknown, hideFalse = true): string {
	if (hideFalse && !value) return "";
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

export function highlight(words: string, content: string): string {
	const wordList = [...new Set(words.split(/\s+/).filter(Boolean))];
	if (!wordList.length) return content;

	const escaped = wordList.map((value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
	const pattern = new RegExp(`(?:${escaped.join("|")})`, "gi");

	return content.replace(pattern, (value) => `**${value}**`).replace(/\*\*(\s+)\*\*/g, "$1");
}

export function crop(maximum: number, content: string): string {
	if (content.length <= maximum) return content;
	return content.slice(0, maximum-10) + `... +${content.length-maximum}`;
}

export function lines(items: string[]): string {
	return items.filter((value) => value && !value.endsWith(": ")).join("\n");
}

export function compare(a: any, b: any, caseSensitive = true): boolean {
	if (typeof a === "string" && typeof b === "string" && !caseSensitive) return a.toLowerCase() === b.toLowerCase();
	return a === b;
}

export function compareObjects(before: object, after: object, caseSensitive = true) {
	const bef = before as Record<string, any>;
	const aft = after as Record<string, any>;

	const added: Record<string, any> = {};
	const removed: Record<string, any> = {};
	const edited: Record<string, {from: any; to: any}> = {};

	for (const k of new Set([...Object.keys(bef), ...Object.keys(aft)])) {
		const x = bef[k];
		const y = aft[k];
		if (compare(JSON.stringify(x), JSON.stringify(y), caseSensitive)) continue;
		if (x === undefined) added[k] = y;
		else if (y === undefined) removed[k] = x;
		else edited[k] = {from: x, to: y};
	}

	return {added, removed, edited};
}

export function changedFields<T extends object>(before: T, payload: Partial<T>, caseSensitive = true): Partial<T> {
	const defined = Object.fromEntries(Object.entries(payload).filter(([_key, value]) => value !== undefined));
	const {added, edited} = compareObjects(before, {...before, ...defined}, caseSensitive);
	return {...added, ...Object.fromEntries(Object.entries(edited).map(([key, value]) => [key, value.to]))} as Partial<T>;
}

export function formatChanges(title: string, added: Record<string, any> = {}, removed: Record<string, any> = {}, edited: Record<string, {from: any; to: any}> = {}, allowInline = true): string {
	const lines = [
		...Object.entries(added).map(([key, value]) => `${key}: ${toString(value)} (added)`),
		...Object.entries(removed).map(([key, value]) => `${key}: ${toString(value)} (removed)`),
		...Object.entries(edited).map(([key, value]) => `${key}: ${toString(value.from)} -> ${toString(value.to)}`),
	];

	if (!lines.length) return "";
	if (lines.length === 1 && allowInline) return `${title}: ${lines[0]}`;
	return `${title}:\n${lines.map((value) => `- ${value}`).join("\n")}`;
}

export function formatDifferences(title: string, before: object, after: object, allowInline = true): string {
	const {added, removed, edited} = compareObjects(before, after);
	return formatChanges(title, added, removed, edited, allowInline);
}

export function formatOrigin(origin: {by: string | null, at: number}): string {
	return `${origin.by ? `by ${ResolvedUser.mention(origin.by)}` : "by unknown"} at ${ResolvedTime.AnRMention(origin.at)}`;
}

export function label(type: string, id?: string | number): string {
	return `${type}^${id}`;
}

export function customOnlyPrefix(prefix?: string | null): string {
	return prefix && prefix !== PREFIX ? prefix : "";
}

export function stripVariation(text: string): string {
	return text.replaceAll("\uFE0F", "");
}

export function isNumeric(text: string): boolean {
	return /^\d+$/.test(text);
}

export function isHex(text: string): boolean {
	return /^#?[0-9a-f]{6}$/i.test(text);
}


// mention
export function mentionUser(id?: string): string {
	return `<@${id}>`
}

export function mentionRole(id?: string): string {
	return `<@&${id}>`
}

export function mentionChannel(id?: string): string {
	return `<#${id}>`
}

export function mentionTime(unix: number, style: string): string {
	return `<t:${unix}:${style}>`
}

export function labeledUrl(label: string, url: string): string {
	return `[${label}](${url})`
}