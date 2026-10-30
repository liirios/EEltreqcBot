import { ChatInputCommandInteraction, CommandInteractionOptionResolver, ContextMenuCommandInteraction, Message } from "discord.js";
import { Args, ArgumentError, Identifiers, UserError, container, type ArgType, type Argument, type RepeatArgOptions } from "@sapphire/framework";
import type { IOM } from "../constants";
import { compare } from "../string";

export class GrabArgumentError extends UserError {
	public constructor(type: string, field: string, got: any, from?: any[]) {
		if (!from && type === "boolean") from = ["true", "false"]
		super({
			identifier: "GrabArgumentError",
			message: `You need to provide \`${type}\` at field \`${field}\`${got == null ? "" : ` (got \`${got}\`)`}` + (from?.length ? `\n-# Available: ${from.map((v) => `\`${v}\``).join(", ")}` : ""),
			context: {}
		});
	}
}

export class GrabUndeclaredError extends UserError {
	public constructor(type: string, field: string) {
		super({
			identifier: "GrabUndeclaredError",
			message: `This command has undeclared \`${type}\` option/flag \`${field}\`, please contact bot developer`,
			context: {}
		});
	}
}

export class GrabRangeError extends UserError {
	public constructor(field: string, got: number, min?: number, max?: number) {
		const range = min !== undefined && max !== undefined ? `between ${min} and ${max}` : min !== undefined ? `at least ${min}` : `at most ${max}`;
		super({
			identifier: "GrabRangeError",
			message: `Field \`${field}\` must be ${range} (got \`${got}\`)`,
			context: {}
		});
	}
}

export type AOO = Args | ChatInputCommandInteraction["options"];
export type ResolvableGrabber = Grabber | AOO | IOM | ContextMenuCommandInteraction["options"];

export class Grabber {
	public aoo?: AOO;

	public constructor(target?: ResolvableGrabber | null) {
		if (target == null) return;
		if (target instanceof Grabber) this.aoo = target.aoo;
		else if (target instanceof Message) throw new Error("Message class doesnr have args cause screw me");
		else if (target instanceof Args) this.aoo = target;
		else if ("options" in target) {
			if (target instanceof ContextMenuCommandInteraction) throw new Error("ContextMenuCommand doesnt have any arguments");
			this.aoo = target.options;
		} else throw new Error("Provided Grabber target is invalid");
	}

	public valid(): boolean {
		return this.aoo != null;
	}

	// from
	public static from(target?: ResolvableGrabber | null): Grabber {
		return target instanceof Grabber ? target : new Grabber(target);
	}

	// getters
	public get isArgs(): boolean {
		return this.aoo instanceof Args;
	}

	public get isOptions(): boolean {
		return this.aoo instanceof CommandInteractionOptionResolver;
	}

	public get args(): Args {
		if (!(this.aoo instanceof Args)) throw new Error("Not a message command");
		return this.aoo;
	}

	public get options(): ChatInputCommandInteraction["options"] {
		if (!this.aoo || this.aoo instanceof Args) throw new Error("Not a slash command");
		return this.aoo;
	}

	public getArgumentRunner<T extends keyof ArgType>(type: T): Argument | undefined {
		return container.stores.get("arguments").get(type);
	}

	public isDeclared(name: string | string[]): boolean {
		const names = Array.isArray(name) ? name : [name]
		const declared = this.args.command.options.options;
		if (declared === true) return true;
		if (!declared) return false;
		return names.some((value) => declared.includes(value))
	}

	private async parse<T extends keyof ArgType>(type: T, field: string, raw: string, context: object = {}): Promise<ArgType[T]> {
		if (type === "string") return raw as ArgType[T];

		const argument = this.getArgumentRunner(type);
		if (!argument) throw new Error(`Unknown argument type "${type}"`);

		const result = await argument.run(raw, {argument, ...context} as any);
		if (result.isErr()) throw new GrabArgumentError(type, field, raw);
		return result.unwrap() as ArgType[T];
	}

	private async getChatInputOption<T extends keyof ArgType>(type: T, name: string, options: ChatInputCommandInteraction["options"]): Promise<ArgType[T] | null> {
		switch (type) {
			case "boolean": return options.getBoolean(name) as ArgType[T] | null;
			case "channel": return options.getChannel(name) as ArgType[T] | null;
			case "integer": return options.getInteger(name) as ArgType[T] | null;
			case "member": return options.getMember(name) as ArgType[T] | null;
			case "number": return options.getNumber(name) as ArgType[T] | null;
			case "role": return options.getRole(name) as ArgType[T] | null;
			case "string": return options.getString(name) as ArgType[T] | null;
			case "user": return options.getUser(name) as ArgType[T] | null;
			default: {
				const str = options.getString(name);
				return str === null ? null : this.parse(type, name, str)
			}
            // AH yes, what a wholesome system, imagine you cant just filter out channel types in getChannel
            // or provide emojis with getEmoji
            // or provide a valid url with getUrl
            // or provide date using getDate, just add more argument types to slash commands and devs would be happy oh my god
            // is it THAT difficult to make a couple more guis? YOU ALREADY HAVE EMOJI PICKER GUI
            // sapphire has so much of those: boolean, channel, date, dmChannel, emoji, enum, float, guildCategoryChannel, guildChannel, guildNewsChannel, guildNewsThreadChannel, guildPrivateThreadChannel, guildPublicThreadChannel, guildStageVoiceChannel, guildTextChannel, guildThreadChannel, guildVoiceChannel, hyperlink, integer, member, message, number, role, string, url, user
            // while discord has its puny bool, channel, int, member, number (floats too i assume), role, string and user
            // and why theres no color picker in both? having mentionable color in chats would be so awesome
            // and native discord js doesnt have prefix commands???? like wtf, discord.py has them, even tho you need another class for it
		}
	}

	public async pickChatInputOption<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const value = await this.getChatInputOption(type, name, this.options);
		if (value !== null) return value;
		return this.fallback(type, name, def);
	}

	public async pickMessageOption<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const args = this.args;
		if (!this.isDeclared(name)) throw new GrabUndeclaredError(type, name);

		const str = args.getOption(name);
		if (str == null) return this.fallback(type, name, def);

		return this.parse(type, name, str, {
			args,
			message: args.message,
			command: args.command,
			commandContext: args.commandContext
		});
	}

	public async pickChatInputFlag<T = never>(name: string, def: boolean | T = false): Promise<boolean | T> {
		return this.pickChatInputOption("boolean", name, def)
	}

	public async pickMessageFlag<T = never>(name: string, def: boolean | T = false): Promise<boolean | T> {
		return this.args.getFlags(name) ? true : def;
	}

	public async pick<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		if (!this.valid()) return this.fallback(type, name, def);
		if (this.isArgs) return this.args.pick(type).catch((e: any) => this.catch<ArgType[T] | T2>(e, type, name, def));
		return this.pickChatInputOption(type, name, def)
	}

	public async option<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		if (!this.valid()) return this.fallback(type, name, def);
		if (this.isArgs) return this.pickMessageOption(type, name, def);
		return this.pickChatInputOption(type, name, def);
	}

	public async flag<T = never>(name: string, def: boolean | T = false): Promise<boolean | T> {
		if (!this.valid()) return this.fallback("boolean", name, def);
		if (this.isArgs) return this.pickMessageFlag(name, def);
		return this.pickChatInputFlag(name, def);
	}
    // awesome i love how sapphire implemented flags and options for messages :3

	public async pickOrOption<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const pick = await this.pick(type, name, null);
		if (pick !== null) return pick;
		return this.option(type, name, def);
	}

	public async pickOrOptionOrFlag<T = never>(name: string, def: boolean | T = false): Promise<boolean | T> {
		const pick = await this.pickOrOption("boolean", name, null);
		if (pick !== null) return pick;
		return this.flag(name, def);
	}

	public async optionOrFlag<T = never>(name: string, def: boolean | T = false): Promise<boolean | T> {
		const pick = await this.option("boolean", name, null);
		if (pick !== null) return pick;
		return this.flag(name, def);
	}

	public async rest<T extends keyof ArgType, T2 = never>(type: T, name: string, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		if (!this.valid()) return this.fallback(type, name, def);
		if (this.isArgs) return this.args.rest(type).catch((e: any) => this.catch<ArgType[T] | T2>(e, type, name, def));
		return this.pickChatInputOption(type, name, def);
	}

	public async repeat<T extends keyof ArgType, T2 = never>(type: T, name: string, options: RepeatArgOptions = {}, divider: string | RegExp = " ", def?: ArgType[T][] | T2): Promise<ArgType[T][] | T2> {
		if (!this.valid()) return this.fallback(type, name, def);
		if (this.isArgs) return this.args.repeat(type, options).catch((e: any) => this.catch<ArgType[T][] | T2>(e, type, name, def));

		const str = this.options.getString(name);
		if (str === null) return this.fallback(type, name, def);

		const parts = str.split(divider).map((value) => value.trim()).filter(Boolean).slice(0, options.times ?? 10);
		if (!parts.length) return this.fallback(type, name, def);
		return Promise.all(parts.map((value) => this.parse(type, name, value)));
	}
    // i have no clue on how to make better repeat for slash command options

	private fromRange<T = never>(field: string, value: number, min?: number, max?: number, def?: T): number | T {
		if ((min !== undefined && value < min) || (max !== undefined && value > max)) {
			if (def !== undefined) return def;
			throw new GrabRangeError(field, value, min, max);
		}
		return value;
	}
    // imagine not being able to limit number to some range in slash command options

	public async pickFromRange<T2 = never>(type: "number" | "integer", name: string, min?: number, max?: number, def?: number | T2): Promise<number | T2> {
		const pick = await this.pick(type, name, null);
		if (pick === null) return this.fallback(type, name, def);
		return this.fromRange(name, pick, min, max, def)
	}

	public async optionFromRange<T2 = never>(type: "number" | "integer", name: string, min?: number, max?: number, def?: number | T2): Promise<number | T2> {
		const pick = await this.option(type, name, null);
		if (pick === null) return this.fallback(type, name, def);
		return this.fromRange(name, pick, min, max, def)
	}

	public async pickOrOptionFromRange<T2 = never>(type: "number" | "integer", name: string, min?: number, max?: number, def?: number | T2): Promise<number | T2> {
		const pick = await this.pickOrOption(type, name, null);
		if (pick === null) return this.fallback(type, name, def);
		return this.fromRange(name, pick, min, max, def)
	}

	private fromList<T = never, T2 = never>(type: string, name: string, value: T, from: T[], caseSensitive?: boolean, def?: T2): T | T2 {
		const found = from.find((val) => compare(val, value, caseSensitive));
		if (found === undefined) {
			if (def !== undefined) return def;
			throw new GrabArgumentError(type, name, value, from);
		}
		return found;
	}
    // why dont you allow me to select MULTIPLE things from some list?
    // that would be so handy to just be able to get list of switches or flags in string[]
    // or list of users to do action on
    // or list of channels, roles, maybe ANYTHING MENTIONABLE????
    // smh

	public async pickFromList<T extends keyof ArgType, T2 = never>(type: T, name: string, from: ArgType[T][], caseSensitive: boolean, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const pick = await this.pick(type, name, null);
		if (pick === null) return this.fallback(type, name, def, from);
		return this.fromList(type, name, pick, from, caseSensitive, def)
	}

	public async optionFromList<T extends keyof ArgType, T2 = never>(type: T, name: string, from: ArgType[T][], caseSensitive: boolean, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const pick = await this.option(type, name, null);
		if (pick === null) return this.fallback(type, name, def, from);
		return this.fromList(type, name, pick, from, caseSensitive, def)
	}

	public async pickOrOptionFromList<T extends keyof ArgType, T2 = never>(type: T, name: string, from: ArgType[T][], caseSensitive: boolean, def?: ArgType[T] | T2): Promise<ArgType[T] | T2> {
		const pick = await this.pickOrOption(type, name, null);
		if (pick === null) return this.fallback(type, name, def, from);
		return this.fromList(type, name, pick, from, caseSensitive, def)
	}

	// errors
	private fallback<T = never>(type: string, field: string, def?: T, from?: any[]): T {
		if (def !== undefined) return def;
		throw new GrabArgumentError(type, field, null, from);
	}

	private catch<T = never>(e: any, type: string, field: string, def?: T, from?: any[]): T {
		if (e?.identifier === Identifiers.ArgsMissing) return this.fallback(type, field, def, from);
		if (e instanceof ArgumentError) throw new GrabArgumentError(type, field, e.parameter);
		throw e
	}
}