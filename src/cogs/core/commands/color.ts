import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args, MessageCommand } from "@sapphire/framework";
import { AttachmentBuilder, Message } from "discord.js";
import type { IOM } from "../../../lib/constants";
import type { DBColor } from "../../../lib/db/db_schema";
import { prePerm } from "../../../lib/perms";
import { formatChanges } from "../../../lib/string";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { ResolvedColor } from "../../../lib/helpers/colors";

const OPTIONS = ["style", "limit", "new_name", "color", "fuzzy"]
const FLAGS = ["fuzzy"]

const STYLES = ["image", "short", "full", "shortEmbed", "fullEmbed"]
const DEFAULT_STYLE = STYLES[0]


@ApplyOptions<Subcommand.Options>({
	name: "color", description: "color", aliases: ["colors"],
	options: OPTIONS, flags: FLAGS,
	subcommands: [
		{name: "get", chatInputRun: "colorGet", messageRun: "colorGet"},
		{name: "search", chatInputRun: "colorSearch", messageRun: "colorSearch"},
		{name: "find", chatInputRun: "colorSearch", messageRun: "colorSearch"},
		{name: "add", chatInputRun: "colorAdd", messageRun: "colorAdd"},
		{name: "modify", chatInputRun: "colorModify", messageRun: "colorModify"},
		{name: "remove", chatInputRun: "colorRemove", messageRun: "colorRemove"},
		{name: "role", messageRun: "colorRole"},
		{name: "roles", messageRun: "colorRole"}
	],
	preconditions: [prePerm(1)]
})
export class ColorCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("get", "Get color or gradient", (o) => o.string("colors", true).string("style", false, undefined, STYLES).boolean("fuzzy", false).quiet())
			.sub("search", "Search color names", (o) => o.string("query", true).integer("limit", false).quiet())
			.sub("add", "Add a custom color", (o) => o.string("color", true).string("name", true).boolean("fuzzy", false).quiet())
			.sub("modify", "Modify a custom color", (o) => o.string("name", true).string("new_name", false).string("color", false).boolean("fuzzy", false).quiet())
			.sub("remove", "Remove a custom color", (o) => o.string("name", true).quiet())
			.builder
		);
	}

	public async colorGet(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const inputs = await um.grab.repeat("string", "colors", {times: Infinity}, ",");
		const input = inputs.flatMap((value) => value.split(",")).map((value) => value.trim()).filter(Boolean);
		const fuzzy = (await um.grab.optionOrFlag("fuzzy")) ?? true;
		const hexes = input.map((value) => new ResolvedColor(value, fuzzy).primary);
		const invalid = input.find((_value, index) => !hexes[index]);
		if (invalid) return um.reply(`Invalid color ${invalid}\n-# give color names, hex values like #ff0000 or random, separated by commas (or spaces if no names contain spaces)`);

		const color = new ResolvedColor(hexes);
		const style = await um.grab.optionFromList("string", "style", STYLES, false, DEFAULT_STYLE);
		const file = new AttachmentBuilder(await color.image(), {name: "color.png"});

		switch (style) {
			case "short": return um.reply(color.short());
			case "full": return um.reply(color.full());
			case "shortEmbed": return um.setContent("").setFiles(file).setEmbeds(color.shortEmbed().setImage("attachment://color.png")).reply();
			case "fullEmbed": return um.setContent("").setFiles(file).setEmbeds(color.fullEmbed().setImage("attachment://color.png")).reply();
			case "image": default: return um.setFiles(file).reply(color.short());
		}
	}

	public async colorSearch(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const query = (await um.grab.rest("string", "query")).trim();
		const limit = Math.min(Math.max(await um.grab.option("integer", "limit", 5), 1), 25);

		const found = ResolvedColor.search(query, limit);
		if (!found.length) return um.reply(`No colors found for \`${query}\``);
		return um.reply([`Colors matching \`${query}\`:`, ...found.map((value) => `- ${value.name} (${value.hex})`)].join("\n"));
	}

	public async colorAdd(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(5)

		const input = (await um.grab.pick("string", "color")).trim();
		const name = (await um.grab.rest("string", "name")).trim();
		const fuzzy = await um.grab.optionOrFlag("fuzzy");

		const hex = new ResolvedColor(input, fuzzy).primary;
		if (!hex) return um.reply(`Invalid color ${input}\n-# give color names, hex values like #ff0000 or random, separated by commas (or spaces if no names contain spaces)`);
		if (!name || ResolvedColor.isReserved(name)) return um.reply(`Invalid name\n-# no commas, hex values or random`);
		if (ResolvedColor.custom(name)) return um.reply("There is already a custom color with that name");

		const row = ResolvedColor.add(name, hex, um.author.id);
		if (!row) return um.reply("Couldn't add that color");
		return um.reply(`Added custom color ${row.name} (${row.hex})`);
	}

	public async colorModify(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(5)

		const row = ResolvedColor.custom((await um.grab.pick("string", "name")).trim());
		if (!row) return um.reply("Custom color not found\n-# builtin colors cant be changed");
		const before = {...row};

		const rename = ((await um.grab.option("string", "new_name", null)) ?? undefined)?.trim() || undefined;
		if (rename && ResolvedColor.isReserved(rename)) return um.reply(`Invalid name\n-# no commas, hex values or random`);
		const taken = rename ? ResolvedColor.custom(rename) : undefined;
		if (taken && taken !== row) return um.reply("There is already another custom color with that name");

		const fuzzy = await um.grab.optionOrFlag("fuzzy");
		const input = ((await um.grab.option("string", "color", null)) ?? undefined)?.trim() || undefined;
		const hex = input ? new ResolvedColor(input, fuzzy).primary : undefined;
		if (input && !hex) return um.reply(`Invalid color ${input}\n-# give color names, hex values like #ff0000 or random, separated by commas (or spaces if no names contain spaces)`);

		const changed = (rename && rename !== before.name) || (hex && hex !== before.hex);
		if (!changed) return um.reply(`Nothing to modify\n-# give options like --new_name=Name or --color=#ff0000`);

		const after = ResolvedColor.modify(before.name, rename, hex);
		if (!after) return um.reply("Couldn't modify that color");

		const applied = Object.fromEntries((["name", "hex"] as const).filter((value) => before[value] !== after[value]).map((value) => [value, after[value]])) as Partial<DBColor>;
		return um.reply(formatChanges(`Color ${before.name} updated:`, before, applied));
	}

	public async colorRemove(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(5)

		const row = ResolvedColor.custom((await um.grab.rest("string", "name")).trim());
		if (!row) return um.reply("Custom color not found\n-# builtin colors cant be changed");

		ResolvedColor.remove(row.name);
		return um.reply(`Removed custom color ${row.name}`);
	}

	public async colorRole(message: Message, args: Args, context: MessageCommand.RunContext) {
		const cmd = this.container.stores.get("commands").get("colorole");
		if (!cmd?.messageRun) return;
		return cmd.messageRun(message, args, context);
	}
}