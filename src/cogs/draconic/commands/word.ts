import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { type IOM } from "../../../lib/constants";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../../lib/perms";
import { AFFIXES, DICTIONARY, IDS, DRACONIC } from "../../../lib/draconic";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { randomFrom } from "../../../lib/utils";
import { highlight } from "../../../lib/string";

const { Noun, ConjugatedNoun, ConjugatedVerb, ConjugatedAdjective } = DRACONIC;

const WORD_TYPES: string[] = Object.values(IDS.WORDS);
const CONJUGATED: Record<string, any> = {
	[IDS.WORDS.N]: ConjugatedNoun,
	[IDS.WORDS.V]: ConjugatedVerb,
	[IDS.WORDS.ADJ]: ConjugatedAdjective
};

const OPTIONS = ["amount", "word"]
const FLAGS = ["word"]

@ApplyOptions<Subcommand.Options>({
	name: "word", description: "Word",
	options: OPTIONS, flags: FLAGS,
	subcommands: [
		{name: "fetch", chatInputRun: "wordFetch", messageRun: "wordFetch"},
		{name: "random", chatInputRun: "wordRandom", messageRun: "wordRandom"},
		{name: "conjugate", chatInputRun: "wordConjugate", messageRun: "wordConjugate"}
	],
	preconditions: [prePerm(1)]
})
export class WordCommand extends Subcommand {
	public override registerApplicationCommands(registry: Subcommand.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this)
			.sub("fetch", "Fetch word in dictionary", (o) => o
				.string("text", true)
				.integer("amount", false, "Amount of results")
				.boolean("is_word", false, "Whether the text is a Draconic word")
				.quiet())
			.sub("random", "Random word", (o) => o.string("type", false, "Word type", WORD_TYPES).quiet())
			.sub("conjugate", "Conjugate word", (o) => o.string("stem", true).string("prefix").string("suffix").quiet())
			.builder
		);
	}

	public async wordFetch(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		let query: string | null | undefined = await um.grab.rest("string", "text", null);
		if (!query) query = (await um.reference?.resolve())?.content
		if (!query) return um.reply("You need to provide text");
		let amount = await um.grab.option("number", "amount", 5);
		const isWord = await um.grab.optionOrFlag("word");
		
		if (!um.author.isPrivileged(2)) amount = Math.min(amount, 7);
		
		const results = isWord ? DICTIONARY.fuzzyFetchByWord(query, amount) : DICTIONARY.fuzzyFetchByDefinition(query, amount);
		const lines = results.map((value: any) => {
			const def = value instanceof Noun ? value.definition.replace("\n", ".   ") : value.definition;
			return `> ${value.word} - ${value.type} - ${def}.`;
		});
		
		return um.reply(`Fetch^${isWord ? "byWord^" : ""}\`${query}\`:\n${highlight(query, lines.join("\n") || "> No results")}`);
	}

	public async wordRandom(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const type = await um.grab.pickFromList("string", "type", WORD_TYPES, true, randomFrom(WORD_TYPES));

		let word, def;
		if (CONJUGATED[type]) {
			const conjugated = new CONJUGATED[type]().random();
			word = conjugated.conjugate();
			def = conjugated.definition();
		} else {
			const entry: any = randomFrom(Object.values(DICTIONARY[type].MAP));
			word = entry.text;
			def = entry.definition;
		}

		return um.reply(`> ${word} - ${type} - ${def}.`);
	}

	public async wordConjugate(iom: IOM, args?: Args) {
		const um = await UniversalMessage.fromDeferred(iom, args)

		const prefix = await um.grab.pick("string", "prefix", "")
		const stem = await um.grab.pick("string", "stem", "")
		const suffix = await um.grab.pick("string", "suffix", "")

		return um.reply(`> ${AFFIXES.connect(prefix, stem, suffix)}`);
	}
}