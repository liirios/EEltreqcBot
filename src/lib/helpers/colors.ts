import { EmbedBuilder } from "discord.js";
import chroma from "chroma-js";
import { createCanvas, type SKRSContext2D } from "@napi-rs/canvas";
import colornames from "color-name-list";
import Fuse from "fuse.js";
import { DEFAULT_EMBED_COLOR, COLOR_TILE_BACKGROUND, COLOR_TILE_GAP, COLOR_TILE_HEIGHT, COLOR_TILE_WIDTH } from "../config";
import { isHex, lines } from "../string";
import { DBColors } from "../db/db_colors";
import { COLORS, type DBColor } from "../db/db_schema";
import { Embedder } from "./embedders";

export type ResolvableColor = ResolvedColor | string | number | null | undefined | (ResolvedColor | string | number | null | undefined)[];

export const COL = new DBColors(COLORS).sync();

export class ResolvedColor {
	private static readonly LIST = colornames.map(({name, hex}) => ({name, hex: hex.toLowerCase(), key: ResolvedColor.key(name), lab: chroma(hex).lab()}));
	private static readonly NAMED = new Map(ResolvedColor.LIST.map((value) => [value.key, value]));
	private static readonly HEX = new Map(ResolvedColor.LIST.toReversed().map((value) => [value.hex, value.name]));

	private static readonly FUSE = {keys: ["key"], includeScore: true, ignoreLocation: true, threshold: 0.2};
	private static readonly BUILTIN = new Fuse(ResolvedColor.LIST, ResolvedColor.FUSE);

	private static cacheReady = false;
	private static cacheCustom = new Map<string, DBColor>();
	private static cacheEntries: (typeof ResolvedColor.LIST)[number][] = [];
	private static cacheNamed = new Map(ResolvedColor.NAMED);
	private static cacheByHex = new Map(ResolvedColor.HEX);
	private static cacheNearest = new Map<string, string>();
	private static cacheFuse = new Fuse(ResolvedColor.cacheEntries, ResolvedColor.FUSE);

	public colors: string[] = [];

	public constructor(target?: ResolvableColor, fuzzy = false) {
		if (target instanceof ResolvedColor) this.colors = [...target.colors];
		else if (typeof target === "string") {
			const hex = target.trim().toLowerCase() === "random" ? ResolvedColor.randomHex() : ResolvedColor.parse(target, fuzzy);
			if (hex) this.colors = [hex];
		} else if (typeof target === "number") this.colors = [chroma(target).hex()];
		else if (Array.isArray(target)) this.colors = target.flatMap((value) => ResolvedColor.from(value, fuzzy).colors);
	}

	public valid(): boolean {
		return this.colors.length > 0;
	}

	// from
	public static from(target?: ResolvableColor, fuzzy = false): ResolvedColor {
		return target instanceof ResolvedColor ? target : new ResolvedColor(target, fuzzy);
	}

	// getters
	public get length(): number {
		return this.colors.length;
	}

	public get primary(): string | undefined {
		return this.colors[0];
	}

	public get secondary(): string | undefined {
		return this.colors[1];
	}

	public get tertiary(): string | undefined {
		return this.colors[2];
	}

	public get num(): number | undefined {
		return this.primary ? chroma(this.primary).num() : undefined;
	}

	public get name(): string {
		return [...new Set(this.colors.map((value) => ResolvedColor.nearest(value)))].join(" - ");
	}

	public static randomHex(): string {
		return chroma.random().hex();
	}

	public static random(): ResolvedColor {
		return new ResolvedColor(ResolvedColor.randomHex());
	}

	private static key(s: string): string {
		return s.toLowerCase().replaceAll(" ", "").replaceAll("_", "").replaceAll("-", "");
	}

	public static named(name: string) {
		ResolvedColor.load();
		return ResolvedColor.cacheNamed.get(ResolvedColor.key(name));
	}

	public static isNamed(name: string): boolean {
		return ResolvedColor.named(name) !== undefined;
	}

	public static isReserved(name: string): boolean {
		name = name.trim();
		return isHex(name) || name.toLowerCase() === "random" || name.includes(",");
	}
	
	public isCustom(): boolean {
		return this.valid() && this.colors.every((value) => COL.getByHex(value).length > 0);
	}

	public static custom(name: string): DBColor | undefined {
		ResolvedColor.load();
		return ResolvedColor.cacheCustom.get(ResolvedColor.key(name));
	}

	public toDiscord(enhanced = true) {
		return {
			primaryColor: this.num ?? 0,
			secondaryColor: enhanced && this.secondary ? chroma(this.secondary).num() : null,
			tertiaryColor: enhanced && this.tertiary ? chroma(this.tertiary).num() : null
		};
	}

	public contrast(bg: string): number {
		return Math.min(...this.colors.map((value) => chroma.contrast(value, bg)));
	}

	public background(): "#ffffff" | "#000000" {
		return this.contrast("#ffffff") >= this.contrast("#000000") ? "#ffffff" : "#000000";
	}

	private static nearest(hex: string): string {
		ResolvedColor.load();

		const known = ResolvedColor.cacheByHex.get(hex) ?? ResolvedColor.cacheNearest.get(hex);
		if (known) return known;

		const lab = chroma(hex).lab();
		let best = ResolvedColor.LIST[0];
		let bestDistance = Infinity;

		for (const color of ResolvedColor.cacheEntries.concat(ResolvedColor.LIST)) {
			const dist = (color.lab[0]-lab[0])**2+(color.lab[1]-lab[1])**2+(color.lab[2]-lab[2])**2;
			if (dist < bestDistance) {
				best = color;
				bestDistance = dist;
			}
		}

		ResolvedColor.cacheNearest.set(hex, best.name);
		return best.name;
	}

	public static search(input: string, limit = 5): {name: string; hex: string}[] {
		const query = ResolvedColor.key(input);
		if (!query) return [];

		ResolvedColor.load();

		const found = [...ResolvedColor.BUILTIN.search(query, {limit}), ...ResolvedColor.cacheFuse.search(query, {limit})];
		return found.sort((a, b) => (a.score ?? 1) - (b.score ?? 1)).slice(0, limit).map(({item}) => ({name: item.name, hex: item.hex}));
	}

	public static parse(input: string, fuzzy = false): string | null {
		const s = input.trim();
		if (isHex(s)) return chroma(s).hex();
		return ResolvedColor.named(s)?.hex ?? (fuzzy ? ResolvedColor.search(s, 1)[0]?.hex : undefined) ?? null;
	}

	// setters
	public static add(name: string, color: string, by: string | null = null): DBColor | null {
		const hex = ResolvedColor.parse(color);
		name = name.trim();
		if (!hex || !name || ResolvedColor.isReserved(name) || ResolvedColor.custom(name)) return null;

		const row = COL.update(hex, name, {origin: {by, at: Date.now()}});
		ResolvedColor.invalidate();
		return row;
	}

	public static modify(name: string, rename?: string, color?: string): DBColor | null {
		const row = ResolvedColor.custom(name);
		const hex = color === undefined ? row?.hex : ResolvedColor.parse(color);
		rename = rename === undefined ? row?.name : rename.trim();
		if (!row || !hex || !rename || ResolvedColor.isReserved(rename)) return null;

		const clash = ResolvedColor.custom(rename);
		if (clash && clash !== row) return null;

		COL.delete(row.hex, row.name);
		const updated = COL.update(hex, rename, {origin: row.origin});
		ResolvedColor.invalidate();

		return updated;
	}

	public static remove(name: string): boolean {
		const row = ResolvedColor.custom(name);
		if (row) {
			COL.delete(row.hex, row.name);
			ResolvedColor.invalidate();
		}
		return !!row;
	}

	// image
	public paint(ctx: SKRSContext2D, x0: number, x1: number) {
		if (this.length < 2) return this.primary ?? COLOR_TILE_BACKGROUND;

		const gradient = ctx.createLinearGradient(x0, 0, x1, 0);
		const lastIndex = this.length-1;
		this.colors.forEach((value, index) => gradient.addColorStop(index / lastIndex, value));

		return gradient;
	}

	public tile(ctx: SKRSContext2D, x: number, y: number, w: number, h: number, label: string = this.name) {
		const pad = 6;
		const height = 4;
		const width = w-pad*2;

		let size = 14;
		let text = label;
		ctx.font = `bold ${size}px sans-serif`;
		while (ctx.measureText(text).width > width && size > 8) {
			size--;
			ctx.font = `bold ${size}px sans-serif`;
		}
		while (ctx.measureText(text).width > width && text.length > 1) {
			text = text.slice(0, -4) + "...";
		}

		ctx.fillStyle = this.background();
		ctx.fillRect(x, y, w, h);

		ctx.textBaseline = "middle";
		ctx.fillStyle = this.paint(ctx, x+pad, x+pad+ctx.measureText(text).width);
		ctx.fillText(text, x+pad, y+(h-height)/2);

		ctx.fillStyle = this.paint(ctx, x, x+w);
		ctx.fillRect(x, y+h-height, w, height);
	}

	public static async sheet(items: {color: ResolvedColor, label: string}[]): Promise<Buffer> {
		const cols = Math.max(1, Math.min(items.length, 5));
		const rows = Math.ceil(items.length/cols);

		const canvas = createCanvas(cols*(COLOR_TILE_WIDTH+ COLOR_TILE_GAP)+COLOR_TILE_GAP, rows*(COLOR_TILE_HEIGHT+COLOR_TILE_GAP)+COLOR_TILE_GAP);
		const ctx = canvas.getContext("2d");
		ctx.fillStyle = COLOR_TILE_BACKGROUND;
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		items.forEach(({color, label}, i) => {
			const x = COLOR_TILE_GAP+(i%cols)*(COLOR_TILE_WIDTH+COLOR_TILE_GAP);
			const y = COLOR_TILE_GAP+Math.floor(i/cols)*(COLOR_TILE_HEIGHT+COLOR_TILE_GAP);
			color.tile(ctx, x, y, COLOR_TILE_WIDTH, COLOR_TILE_HEIGHT, label);
		});

		return canvas.encode("png");
	}

	public async image(label: string = this.name): Promise<Buffer> {
		return ResolvedColor.sheet([{color: this, label}]);
	}

	// text
	public short(): string {
		if (!this.valid()) return "";
		return `${this.name} (${this.colors.join(" ")})`;
	}

	public entry(): string {
		return this.valid() ? `- ${this.short()}` : "";
	}

	public full(): string {
		if (!this.valid()) return "";

		return lines([
			`${this.isCustom() ? "Custom color" : "Color"}:`,
			`- name: ${this.name}`,
			`- colors: ${this.length}`,
			...this.colors.map((value, index) => `- ${index+1}: ${value}`)
		]);
	}

	// embeds
	private baseEmbed(): Embedder {
		return new Embedder()
			.setAuthor(this.name)
			.setColor(this.num ?? DEFAULT_EMBED_COLOR);
	}

	public shortEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const e = this.baseEmbed();

		e.addField("colors", this.colors.join(" "), true);

		return e.build();
	}

	public fullEmbed(): EmbedBuilder {
		if (!this.valid()) return new EmbedBuilder();

		const e = this.baseEmbed();

		e.addField("custom", String(this.isCustom()), true);
		e.addField("length", String(this.length), true);
		this.colors.forEach((value, index) => e.addField(String(index+1), value, true));

		return e.build();
	}

	// cache
	private static invalidate(): void {
		ResolvedColor.cacheReady = false;
	}

	private static load(): void {
		if (ResolvedColor.cacheReady) return;

		ResolvedColor.cacheCustom = new Map();
		ResolvedColor.cacheEntries = [];
		ResolvedColor.cacheNamed = new Map(ResolvedColor.NAMED);
		ResolvedColor.cacheByHex = new Map(ResolvedColor.HEX);
		ResolvedColor.cacheNearest = new Map();

		for (const row of COL.getAll()) {
			const entry = {name: row.name, hex: row.hex, key: ResolvedColor.key(row.name), lab: chroma(row.hex).lab()};
			if (ResolvedColor.cacheCustom.has(entry.key)) continue;

			ResolvedColor.cacheCustom.set(entry.key, row);
			ResolvedColor.cacheEntries.push(entry);
			ResolvedColor.cacheNamed.set(entry.key, entry);
			ResolvedColor.cacheByHex.set(entry.hex, entry.name);
		}

		ResolvedColor.cacheFuse = new Fuse(ResolvedColor.cacheEntries, ResolvedColor.FUSE);
		ResolvedColor.cacheReady = true;
	}
}