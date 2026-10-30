import { EmbedBuilder, type ColorResolvable } from "discord.js";
import { crop } from "../string";
import { EMBED_TITLE_LIMIT, EMBED_DESCRIPTION_LIMIT, EMBED_FOOTER_LIMIT, EMBED_AUTHOR_LIMIT, EMBED_FIELD_NAME_LIMIT, EMBED_FIELD_VALUE_LIMIT, EMBED_FIELDS_LIMIT, EMBED_TOTAL_LIMIT } from "../constants";

export class Embedder {
	public embed: EmbedBuilder;

	public constructor(embed?: EmbedBuilder) {
		this.embed = embed ?? new EmbedBuilder();
	}

	// from
	public static from(embed?: EmbedBuilder | Embedder): Embedder {
		return embed instanceof Embedder ? embed : new Embedder(embed);
	}

	// build
	public build(): EmbedBuilder {
		return this.embed;
	}

	// setters
	public setTitle(title: string): this {
		this.embed.setTitle(this.fit(title, EMBED_TITLE_LIMIT, this.embed.data.title?.length ?? 0) || null);
		return this;
	}

	public setDescription(description: string): this {
		this.embed.setDescription(this.fit(description, EMBED_DESCRIPTION_LIMIT, this.embed.data.description?.length ?? 0) || null);
		return this;
	}

	public setAuthor(name: string, iconURL?: string, url?: string): this {
		const text = this.fit(name, EMBED_AUTHOR_LIMIT, this.embed.data.author?.name.length ?? 0);
		this.embed.setAuthor(text ? {name: text, iconURL, url} : null);
		return this;
	}

	public setFooter(text: string, iconURL?: string): this {
		const cut = this.fit(text, EMBED_FOOTER_LIMIT, this.embed.data.footer?.text.length ?? 0);
		this.embed.setFooter(cut ? {text: cut, iconURL} : null);
		return this;
	}

	public addField(name: string, value: string, inline = false): boolean {
		if (!name || !value || this.fieldCount >= EMBED_FIELDS_LIMIT) return false;

		const fieldName = Embedder.cut(name, EMBED_FIELD_NAME_LIMIT);
		const fieldValue = Embedder.cut(value, Math.min(EMBED_FIELD_VALUE_LIMIT, this.remaining - fieldName.length));
		if (!fieldValue) return false;

		this.embed.addFields({name: fieldName, value: fieldValue, inline});
		return true;
	}

	public setColor(color: ColorResolvable | null): this {
		this.embed.setColor(color);
		return this;
	}

	public setThumbnail(url: string | null): this {
		this.embed.setThumbnail(url);
		return this;
	}

	public setImage(url: string | null): this {
		this.embed.setImage(url);
		return this;
	}

	public setTimestamp(date?: Date | number | null): this {
		this.embed.setTimestamp(date);
		return this;
	}

	// getters
	public get length(): number {
		const d = this.embed.data;

		let total = 0;
		total += d.title?.length ?? 0
		total += d.description?.length ?? 0
		total += d.footer?.text.length ?? 0
		total += d.author?.name.length ?? 0
		for (const f of d.fields ?? []) total += f.name.length + f.value.length;

		return total;
	}

	public get remaining(): number {
		return Math.max(0, EMBED_TOTAL_LIMIT - this.length);
	}

	public get fieldCount(): number {
		return this.embed.data.fields?.length ?? 0;
	}

	public get full(): boolean {
		return this.fieldCount >= EMBED_FIELDS_LIMIT || this.remaining === 0;
	}

	// text
	private static cut(text: string, max: number): string {
		if (max <= 0) return "";
		if (max < 20) return text.slice(0, max);
		return crop(max, text);
	}

	private fit(text: string, max: number, replacing = 0): string {
		return Embedder.cut(text, Math.min(max, this.remaining + replacing));
	}
}