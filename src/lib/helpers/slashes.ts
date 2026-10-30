import { ApplicationIntegrationType, InteractionContextType, SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandNumberOption, SlashCommandStringOption, type SlashCommandAttachmentOption, type SlashCommandBooleanOption, type SlashCommandChannelOption, type SlashCommandMentionableOption, type SlashCommandRoleOption, type SlashCommandSubcommandBuilder, type SlashCommandSubcommandGroupBuilder, type SlashCommandSubcommandsOnlyBuilder, type SlashCommandUserOption } from "discord.js";
import type { Command } from "@sapphire/framework";
import type { Subcommand } from "@sapphire/plugin-subcommands";

export type AnySlashOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandUserOption;
type Choice = {name: string; value: string | number};
type Choices = readonly (string | number | Choice)[] | Readonly<Record<string, string>>;

export class OptionBuilder {
	public builder: SlashCommandBuilder | SlashCommandSubcommandBuilder;

	public constructor(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
		this.builder = builder;
	}

	// getters
	private description(name: string, description?: string): string {
		if (description) return description;
		name = name.replaceAll("_", " ")
		return name.charAt(0).toUpperCase() + name.slice(1)
	}

	private toChoices(input: Choices): Choice[] {
		if (Array.isArray(input)) return input.map((item: string | number | Choice) => typeof item === "object" ? item : {name: String(item), value: item});
		return Object.entries(input).map(([key, value]) => ({name: String(value).toLowerCase(), value: key}));
	}

	// setters
	private applyChoices(option: AnySlashOption, from: Choices) {
		const choices = this.toChoices(from);
		if (option instanceof SlashCommandStringOption) option.addChoices(...choices.map((value) => ({name: value.name, value: String(value.value)})));
		else if (option instanceof SlashCommandIntegerOption || option instanceof SlashCommandNumberOption) option.addChoices(...choices.map((value) => ({name: value.name.toLowerCase(), value: Number(value.value)})));
	}

	private prepareOption<O extends AnySlashOption>(option: O, name: string, required: boolean = false, description?: string, from?: Choices): O {
		option.setName(name.toLowerCase()).setDescription(this.description(name, description)).setRequired(required)
		if (from) this.applyChoices(option, from);
		return option;
	}

	public string(name: string = "String", required: boolean = false, description?: string, from?: Choices) {
		this.builder.addStringOption((o) => this.prepareOption(o, name, required, description, from));
		return this;
	}

	public integer(name: string = "Integer", required: boolean = false, description?: string, from?: Choices) {
		this.builder.addIntegerOption((o) => this.prepareOption(o, name, required, description, from));
		return this;
	}

	public number(name: string = "Number", required: boolean = false, description?: string, from?: Choices) {
		this.builder.addNumberOption((o) => this.prepareOption(o, name, required, description, from));
		return this;
	}

	public boolean(name: string = "Boolean", required: boolean = false, description?: string) {
		this.builder.addBooleanOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	public user(name: string = "Member", required: boolean = false, description?: string) {
		this.builder.addUserOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	public channel(name: string = "Channel", required: boolean = false, description?: string) {
		this.builder.addChannelOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	public role(name: string = "Role", required: boolean = false, description?: string) {
		this.builder.addRoleOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	public mentionable(name: string = "Mentionable", required: boolean = false, description?: string) {
		this.builder.addMentionableOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	public attachment(name: string = "Attachment", required: boolean = false, description?: string) {
		this.builder.addAttachmentOption((o) => this.prepareOption(o, name, required, description));
		return this;
	}

	// aliases smth idk
	public quiet() {
		return this.boolean("quiet", false, "Ephemeral");
	}

	public target(required: boolean = false) {
		return this.user("target", required);
	}

}

export class GroupBuilder {
	public builder: SlashCommandSubcommandGroupBuilder;

	public constructor(builder: SlashCommandSubcommandGroupBuilder) {
		this.builder = builder;
	}

	public sub(name: string, description: string, f: (o: OptionBuilder) => unknown) {
		this.builder.addSubcommand((s) => {
			f(new OptionBuilder(s));
			return s.setName(name).setDescription(description);
		});
		return this;
	}
}

export class SlashBuilder {
	public builder: SlashCommandBuilder;
	public integrationTypes = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
	public contexts = [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel];

	public constructor(public command: Subcommand | Command, integrationTypes?: ApplicationIntegrationType[], contexts?: InteractionContextType[]) {
		this.integrationTypes = integrationTypes ?? this.integrationTypes;
		this.contexts = contexts ?? this.contexts;
		this.builder = new SlashCommandBuilder().setName(command.name).setDescription(command.description).setIntegrationTypes(this.integrationTypes).setContexts(this.contexts);
	}

	// setters
	public opt(f: (o: OptionBuilder) => unknown) {
		f(new OptionBuilder(this.builder));
		return this;
	}

	public grp(name: string, description: string, f: (g: GroupBuilder) => unknown) {
		(this.builder as unknown as SlashCommandSubcommandsOnlyBuilder).addSubcommandGroup((g) => {
			f(new GroupBuilder(g));
			return g.setName(name).setDescription(description);
		});
		return this;
	}

	public sub(name: string, description: string, f: (o: OptionBuilder) => unknown) {
		(this.builder as unknown as SlashCommandSubcommandsOnlyBuilder).addSubcommand((s) => {
			f(new OptionBuilder(s));
			return s.setName(name).setDescription(description);
		});
		return this;
	}
}