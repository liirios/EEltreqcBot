import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { NUMBER_SOURCES, NUMBER_TARGETS, NumberSource, NumberTarget, TEXT_TARGETS, TextTarget, type IOM } from "../../lib/constants";
import { isMessage, isSlash, keyFromLabel, universalReply } from "../../lib/utils";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import { CHARCOAL, entriesToCustomDiscord, NUMBERS } from "../../lib/draconic";
import { SlashBuilder } from "../../lib/helpers/slash";

@ApplyOptions<Subcommand.Options>({
	name: "convert", description: "Convert",
	subcommands: [
		{name: "text", chatInputRun: "convertText", messageRun: "convertText"},
		{name: "number", chatInputRun: "convertNumber", messageRun: "convertNumber"}
	],
	preconditions: [prePerm(1)]
})
export class ConvertCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("text", "Convert draconic text to desired format", (o) => o
				.string("to", true, "Resulting text format", TEXT_TARGETS)
				.string("text", true, "Text to convert")
				.quiet())
			.sub("number", "Convert number to desired format", (o) => o
				.string("from", true, "Original number's format", NUMBER_SOURCES)
				.string("to", true, "Resulting number format", NUMBER_TARGETS)
				.string("number", true, "Number to convert")
				.quiet())
			.builder
		);
	}

	public async convertText(iom: IOM, args?: Args) {
		let value, to;
		if (isSlash(iom)) {
			to = iom.options.getString("to", true) as TextTarget;
			value = iom.options.getString("value", true);
		} else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			to = keyFromLabel(TEXT_TARGETS, await grab.pickFrom("string", "to", Object.values(TEXT_TARGETS), false)) as TextTarget;
			const def = iom.reference?.messageId ? (await iom.channel.messages.fetch(iom.reference.messageId)).content : undefined
			value = await grab.rest("string", "value", def && def?.length > 0 ? def : undefined);
		} else return;

		let content = "";
		switch (to) {
			case "regular": {content = CHARCOAL.entriesToText(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "romanized": {content = CHARCOAL.entriesToRom(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "emojis": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "glyphs": {content = CHARCOAL.entriesToGlyphs(CHARCOAL.textToEntriesByAnyText(value)); break;}
		}
		return universalReply(iom, `> ${content}`, undefined, true);
	}

	public async convertNumber(iom: IOM, args?: Args) {
		let value, from, to;
		if (isSlash(iom)) {
			from = iom.options.getString("from", true) as NumberSource;
			to = iom.options.getString("to", true) as NumberTarget;
			value = iom.options.getString("value", true);
		} else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			from = keyFromLabel(NUMBER_SOURCES, await grab.pickFrom("string", "from", Object.values(NUMBER_SOURCES), false)) as NumberSource;
			to = keyFromLabel(NUMBER_TARGETS, await grab.pickFrom("string", "to", Object.values(NUMBER_TARGETS), false)) as NumberTarget;
			const def = iom.reference?.messageId ? (await iom.channel.messages.fetch(iom.reference.messageId)).content : undefined
			value = await grab.rest("string", "value", typeof def === "string" && def?.length > 0 ? def : undefined);
		} else return;

		let number;
		switch (from) {
			case "integer": {number = parseInt(value); break;}
			case "short": {number = NUMBERS.textToNumberShort(value); break;}
		}

		let content = "";
		switch (to) {
			case "integer": {content = number.toString(); break;}
			case "draconic": {content = NUMBERS.numberToText(number); break;}
			case "draconic_em": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(NUMBERS.numberToText(number))); break;}
			case "short": {content = NUMBERS.numberToTextShort(number); break;}
			case "short_em": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(NUMBERS.numberToTextShort(number))); break;}
		}

		return universalReply(iom, `> ${content}`, undefined, true);
	}
}