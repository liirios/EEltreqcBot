import { ApplyOptions } from "@sapphire/decorators";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { type IOM } from "../../lib/constants";
import { highlight, isMessage, isSlash, universalReply } from "../../lib/utils";
import { Args } from "@sapphire/framework";
import { prePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import { AFFIXES, DICTIONARY, IDS, DRACONIC } from "../../lib/draconic";
import { SlashBuilder } from "../../lib/helpers/slash";
import { ResolvedUser } from "../../lib/helpers/users";

const { Noun, ConjugatedNoun, ConjugatedVerb, ConjugatedAdjective } = DRACONIC;

const MAX_LIMITED_RESULTS = 7;
const TRUSTED_PERM = 2;

const WORD_TYPES: string[] = Object.values(IDS.WORDS);
const CONJUGATED: Record<string, any> = {
	[IDS.WORDS.N]: ConjugatedNoun,
	[IDS.WORDS.V]: ConjugatedVerb,
	[IDS.WORDS.ADJ]: ConjugatedAdjective
};

const pick = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)];

@ApplyOptions<Subcommand.Options>({
	name: "word", description: "Word",
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
				.integer("amount", false, "Number of results")
				.boolean("is_word", false, "Whether the text is a Draconic word")
				.quiet())
			.sub("random", "Random word", (o) => o
				.string("type", false, "Word type", WORD_TYPES)
				.quiet())
			.sub("conjugate", "Conjugate word", (o) => o
				.string("stem", true)
				.string("prefix")
				.string("suffix")
				.quiet())
			.builder
		);
	}

	public async wordFetch(iom: IOM, args?: Args) {
		const author = ResolvedUser.authorFromIOM(iom);
		let query, amount, isWord
		if (isSlash(iom)) {
			query = iom.options.getString("text", true);
			amount = iom.options.getInteger("amount") ?? 5;
			isWord = iom.options.getBoolean("is_word") ?? false;
		} else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			amount = await grab.pick("integer", "amount");
			isWord = await grab.pickFrom("boolean", "is_word", [true, false], true);
			const def = iom.reference?.messageId ? (await iom.channel.messages.fetch(iom.reference.messageId)).content : undefined;
			query = await grab.rest("string", "text", def?.length ? def : undefined);
		} else return;

		if (!author.isPrivileged(TRUSTED_PERM)) amount = Math.min(amount, MAX_LIMITED_RESULTS);

		const results = isWord ? DICTIONARY.fuzzyFetchByWord(query, amount) : DICTIONARY.fuzzyFetchByDefinition(query, amount);
		const lines = results.map((s: any) => {
			const def = s instanceof Noun ? s.definition.replace(/\n/g, ".   ") : s.definition;
			return `> ${s.word} - ${s.type} - ${def}.`;
		});

		const results_text = highlight(query, lines.join("\n") || "> No results");
		return universalReply(iom, `Fetch^\`${query}\`:\n${results_text}`, undefined, true);
	}

	public async wordRandom(iom: IOM, args?: Args) {
		let type;
		if (isSlash(iom)) {
			type = iom.options.getString("type") ?? pick(WORD_TYPES);
		} else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			type = await grab.pickFrom("string", "type", WORD_TYPES, true, pick(WORD_TYPES));
		} else return;

		let word, def;
		if (CONJUGATED[type]) {
			const conjugated = new CONJUGATED[type]().random();
			word = conjugated.conjugate();
			def = conjugated.definition();
		} else {
			const entry: any = pick(Object.values(DICTIONARY[type].MAP));
			word = entry.text;
			def = entry.definition;
		}

		return universalReply(iom, `> ${word} - ${type} - ${def}.`, undefined, true);
	}

	public async wordConjugate(iom: IOM, args?: Args) {
		let stem, prefix, suffix;
		if (isSlash(iom)) {
			stem = iom.options.getString("stem", true);
			prefix = iom.options.getString("prefix") ?? "";
			suffix = iom.options.getString("suffix") ?? "";
		} else if (isMessage(iom) && args) {
			const grab = new Grabber(args);
			prefix = await grab.pick("string", "prefix");
			stem = await grab.pick("string", "stem");
			suffix = await grab.pick("string", "suffix");
		} else return;

		return universalReply(iom, `> ${AFFIXES.connect(prefix, stem, suffix)}`, undefined, true);
	}
}