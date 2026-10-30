import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import { AttachmentBuilder } from "discord.js";
import type { IOM } from "../../../lib/constants";
import type { DBColorole } from "../../../lib/db/db_schema";
import { prePerm } from "../../../lib/perms";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { ResolvedColorole } from "../../../lib/helpers/coloroles";
import { ResolvedColor } from "../../../lib/helpers/colors";
import { ResolvedUser } from "../../../lib/helpers/users";
import { formatChanges } from "../../../lib/string";

const OPTIONS = ["style", "name", "color", "secondary", "tertiary", "auto_name", "fuzzy"];
const FLAGS = ["fuzzy"];

const ALL_STYLES = ["entries", "image"];
const DEFAULT_ALL_STYLE = ALL_STYLES[1];
const GET_STYLES = ["short", "full", "image", "shortEmbed", "fullEmbed"];
const DEFAULT_GET_STYLE = GET_STYLES[0];

@ApplyOptions<Subcommand.Options>({
	name: "colorole", description: "colorole", aliases: ["coloroles", "colorrole", "colorroles", "colorsrole", "colorsroles"],
	options: OPTIONS, flags: FLAGS,
	subcommands: [
		{name: "all", chatInputRun: "coloroleGetAll", messageRun: "coloroleGetAll", default: true},
		{name: "get", chatInputRun: "coloroleGet", messageRun: "coloroleGet"},
		{name: "apply", chatInputRun: "coloroleApply", messageRun: "coloroleApply"},
		{name: "reset", chatInputRun: "coloroleReset", messageRun: "coloroleReset"},
		{name: "add", chatInputRun: "coloroleAdd", messageRun: "coloroleAdd"},
		{name: "modify", chatInputRun: "coloroleModify", messageRun: "coloroleModify"},
		{name: "remove", chatInputRun: "coloroleRemove", messageRun: "coloroleRemove"}
	],
	preconditions: [prePerm(1)]
})
export class ColoroleCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("all", "Get info about all coloroles in this guild", (o) => o.string("style", false, undefined, ALL_STYLES).quiet())
			.sub("get", "Get info about specific colorole in this guild by id", (o) => o.integer("id", true).string("style", false, undefined, GET_STYLES).quiet())
			.sub("elaborate", "Get full info about specific colorole in this guild by id", (o) => o.integer("id", true).quiet())
			.sub("apply", "Apply colorole onto yourself (or someone else)", (o) => o.integer("id", true).target().quiet())
			.sub("reset", "Remove colorole from yourself (or someone else)", (o) => o.integer("id").target().quiet())
			.sub("add", "Create a new colorole from color names or hex values", (o) => o
				.string("color", true)
				.string("secondary").string("tertiary").string("name").boolean("auto_name").boolean("fuzzy")
				.quiet())
			.sub("modify", "Modify colorole in current guild", (o) => o
				.integer("id", true)
				.string("name").string("color").string("secondary").string("tertiary").boolean("auto_name").boolean("fuzzy")
				.quiet())
			.sub("remove", "Remove colorole from current guild", (o) => o.integer("id", true).quiet())
			.builder
		);
	}

	private async pickColorole(um: UniversalMessage): Promise<ResolvedColorole | undefined> {
		const id = await um.grab.pick("integer", "id", null);
		return id == null ? undefined : ResolvedColorole.byId(um.guild, String(id));
	}

	private async pickColoroleAndTarget(um: UniversalMessage, required = true): Promise<{colorole?: ResolvedColorole; target: ResolvedUser}> {
		const {value: id, user} = await um.pickUserAnd("integer", "id", required ? undefined : null);
		const colorole = id == null ? undefined : ResolvedColorole.byId(um.guild, String(id));
		return {colorole, target: await user.resolve(um.guild.id)};
	}

	private async pickText(um: UniversalMessage, name: string): Promise<string | undefined> {
		return ((await um.grab.option("string", name, null)) ?? undefined)?.trim() || undefined;
	}

	private async pickAutoName(um: UniversalMessage, name?: string): Promise<boolean | undefined> {
		return (await um.grab.option("boolean", "auto_name", null)) ?? (name ? false : undefined);
	}

	private async pickColor(um: UniversalMessage, name: string, fuzzy = false): Promise<string | null | undefined | false> {
		const raw = await this.pickText(um, name);
		if (raw === undefined) return undefined;
		if (/^(none|null)$/i.test(raw)) return null;
		return ResolvedColor.from(raw, fuzzy).primary ?? false;
	}

	public async coloroleGetAll(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args);

		const list = um.guild.coloroles;
		if (!list.length) return um.reply("There are no coloroles in this guild");

		const style = await um.grab.optionFromList("string", "style", ALL_STYLES, false, DEFAULT_ALL_STYLE);
		switch (style) {
			case "entries": return um.reply([`Available coloroles at ${um.guild.getName()}:`, ...list.map((value) => value.entry())].join("\n"));
			case "image": default: return um.setContent("").setFiles(new AttachmentBuilder(await ResolvedColorole.image(list), {name: "coloroles.png"})).reply();
		}
	}

	public async coloroleGet(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args);

		const colorole = await this.pickColorole(um);
		if (!colorole?.valid()) return um.reply("Colorole not found");

		const style = await um.grab.optionFromList("string", "style", GET_STYLES, false, DEFAULT_GET_STYLE);
		switch (style) {
			case "full": return um.reply(colorole.full());
			case "image": return um.setContent("").setFiles(new AttachmentBuilder(await colorole.image(), {name: "colorole.png"})).reply();
			case "shortEmbed": return um.setContent("").setEmbeds(colorole.shortEmbed()).reply();
			case "fullEmbed": return um.setContent("").setEmbeds(colorole.fullEmbed()).reply();
			case "short": default: return um.reply(colorole.short());
		}
	}

	public async coloroleApply(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args);

		const {colorole, target} = await this.pickColoroleAndTarget(um);
		if (!colorole?.valid()) return um.reply("Colorole not found");
		if (!target.member) return um.reply("Couldnt find that member in this guild");

		const self = target.id === um.author.id;
		if (self) um.handle(undefined, 4)

		if (!(await colorole.applyTo(target))) return um.reply("Couldnt apply that colorole\n-# mayhaps the role is above mine or doesnt exist anymore idk");
		return um.reply(`Applied ${colorole.dbcolorole!.name} to ${self ? "you" : target.mention}`);
	}

	public async coloroleReset(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args);

		const {colorole, target} = await this.pickColoroleAndTarget(um, false);
		if (colorole && !colorole.valid()) return um.reply("Colorole not found");
		if (!target.member) return um.reply("Couldnt find that member in this guild");

		const self = target.id === um.author.id;
		if (self) um.handle(undefined, 4)

		const who = self ? "You dont" : `${target.mention} doesnt`;
		const whom = self ? "you" : target.mention;

		if (colorole) {
			if (!(await colorole.removeFrom(target))) return um.reply(`${who} have that colorole`);
			return um.reply(`Removed ${colorole.dbcolorole!.name} from ${whom}`);
		}

		if (!(await ResolvedColorole.clearFrom(um.guild, target))) return um.reply(`${who} have any colorole or i cant remove roles`);
		return um.reply(`Removed all coloroles from ${whom}`);
	}

	public async coloroleAdd(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4);

		const input = [
			await um.grab.pick("string", "color"),
			await um.grab.pick("string", "secondary", null),
			await um.grab.pick("string", "tertiary", null),
		].filter((value): value is string => !!value);
		const fuzzy = await um.grab.optionOrFlag("fuzzy");
		const colors = input.map((value) => ResolvedColor.from(value, fuzzy).primary ?? null);

		const invalid = input.find((_key, value) => !colors[value]);
		if (invalid) return um.reply(`Unknown color ${invalid}\n-# give a color name, a hex like #ff0000 or random\n-# set --fuzzy to true to allow approximate names`);
		if (colors.length > 1 && !um.guild.enhancedRoleColors) return um.reply("This guild doesnt support gradient roles");

		const name = await this.pickText(um, "name");
		if (name && ResolvedColorole.byName(um.guild, name).valid()) return um.reply("There is already a colorole with that name in this guild");

		const colorole = await ResolvedColorole.create(um.guild, colors as string[], um.author.id);
		if (!colorole) return um.reply("Couldnt create the colorole\n-# there may already be one with these colors, or i cant create roles");

		const changes = colorole.changesFrom({name, auto_name: await this.pickAutoName(um, name)});
		if (Object.keys(changes).length) {
			colorole.update(changes);
			await colorole.syncDiscordRole("Colorole add");
		}
		return um.reply(colorole.full());
	}

	public async coloroleModify(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4);

		const colorole = await this.pickColorole(um);
		if (!colorole?.valid()) return um.reply("Colorole not found");
		const before = {...colorole.dbcolorole!};

		const name = await this.pickText(um, "name");
		const clash = name && name !== before.name ? ResolvedColorole.byName(um.guild, name) : undefined;
		if (clash?.valid() && clash.id !== before.id) return um.reply("There is already another colorole with that name in this guild");

		const fuzzy = await um.grab.optionOrFlag("fuzzy");
		const primary = await this.pickColor(um, "color", fuzzy);
		if (primary === false) return um.reply(`Unknown color\n-# give a color name, a hex like #ff0000 or random\n-# set --fuzzy to true to allow approximate names`);
		const secondary = await this.pickColor(um, "secondary", fuzzy);
		if (secondary === false) return um.reply(`Unknown secondary color\n-# give a color name, a hex like #ff0000 or random\n-# set --fuzzy to true to allow approximate names`);
		const tertiary = await this.pickColor(um, "tertiary", fuzzy);
		if (tertiary === false) return um.reply(`Unknown tertiary color\n-# give a color name, a hex like #ff0000 or random\n-# set --fuzzy to true to allow approximate names`);
		if ((secondary || tertiary) && !um.guild.enhancedRoleColors) return um.reply("This guild doesnt support gradient roles");

		const changes = colorole.changesFrom({
			name,
			primary: primary ?? undefined,
			secondary,
			tertiary,
			auto_name: await this.pickAutoName(um, name),
		});
		if (!Object.keys(changes).length) return um.reply(`Nothing to modify\n-# give options like --color=#ff0000\n-# allowed options: ${OPTIONS.join(", ")}`);

		colorole.update(changes);
		await colorole.syncDiscordRole("Colorole modify");

		const after = colorole.dbcolorole!;
		const applied = Object.fromEntries(
			Object.entries(after).filter(([key, value]) => before[key as keyof DBColorole] !== value)
		) as Partial<DBColorole>;
		
		return um.reply(formatChanges(`${colorole.label} updated:`, before, applied));
	}

	public async coloroleRemove(iom: IOM, args?: Args) {
		const um = await (await UniversalMessage.fromDeferred(iom, args)).handle(undefined, 4);

		const colorole = await this.pickColorole(um);
		if (!colorole?.valid()) return um.reply("Colorole not found");

		const name = colorole.dbcolorole!.name;
		await colorole.deleteDiscordRole();
		colorole.delete();

		return um.reply(`Removed colorole ${name}`);
	}
}