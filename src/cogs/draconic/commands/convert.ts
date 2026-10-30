import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../../lib/perms";
import { CHARCOAL, entriesToCustomDiscord, NUMBER_SOURCES, NUMBER_TARGETS, NUMBERS, TEXT_TARGETS } from "../../../lib/draconic";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import type { IOM } from "../../../lib/constants";

@ApplyOptions<Subcommand.Options>({
	name: "convert", description: "Convert",
	subcommands: [
		{name: "text", chatInputRun: "convertText", messageRun: "convertText"},
		{name: "texts", chatInputRun: "convertText", messageRun: "convertText"},
		{name: "number", chatInputRun: "convertNumber", messageRun: "convertNumber"},
		{name: "numbers", chatInputRun: "convertNumber", messageRun: "convertNumber"}
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
		const um = UniversalMessage.from(iom, args)
		
		const to = await um.grab.pickFromList("string", "to", Object.values(TEXT_TARGETS), false);
		let value = await um.grab.rest("string", "text", null);
		if (value === null && um.reference?.valid()) value = (await um.reference.resolve()).content;
		if (!value) return um.reply("No text provided")

		let content = "";
		switch (to) {
			case "Regular": {content = CHARCOAL.entriesToText(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "Romanized": {content = CHARCOAL.entriesToRom(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "Emojis": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(value)); break;}
			case "Glyphs": {content = CHARCOAL.entriesToGlyphs(CHARCOAL.textToEntriesByAnyText(value)); break;}
		}
		
		return um.reply(`> ${content}`);
	}

	public async convertNumber(iom: IOM, args?: Args) {
		const um = UniversalMessage.from(iom, args)
		
		const from = await um.grab.pickFromList("string", "from", Object.values(NUMBER_SOURCES), false);
		const to = await um.grab.pickFromList("string", "to", Object.values(NUMBER_TARGETS), false);
		let value = await um.grab.rest("string", "text", null);
		if (value === null && um.reference?.valid()) value = (await um.reference.resolve()).content;
		if (!value) return um.reply("No number provided")

		let number;
		switch (from) {
			case "Integer": {number = parseInt(value); break;}
			case "Short": {number = NUMBERS.textToNumberShort(value); break;}
		}

		let content = "";
		switch (to) {
			case "Integer": {content = number.toString(); break;}
			case "Draconic": {content = NUMBERS.numberToText(number); break;}
			case "DraconicEmojis": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(NUMBERS.numberToText(number))); break;}
			case "Short": {content = NUMBERS.numberToTextShort(number); break;}
			case "ShortEmojis": {content = entriesToCustomDiscord(CHARCOAL.textToEntriesByAnyText(NUMBERS.numberToTextShort(number))); break;}
		}

		return um.reply(`> ${content}`);
	}
}