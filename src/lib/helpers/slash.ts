import { Command } from "@sapphire/framework";
import { Subcommand } from "@sapphire/plugin-subcommands";
import { ApplicationIntegrationType, InteractionContextType, SlashCommandAttachmentOption, SlashCommandBooleanOption, SlashCommandBuilder, SlashCommandChannelOption, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, SlashCommandMentionableOption, SlashCommandNumberOption, SlashCommandRoleOption, SlashCommandStringOption, SlashCommandUserOption, SlashCommandSubcommandsOnlyBuilder, SlashCommandSubcommandGroupBuilder } from "discord.js";

export type AnySlashOption = SlashCommandAttachmentOption | SlashCommandBooleanOption | SlashCommandChannelOption | SlashCommandIntegerOption | SlashCommandMentionableOption | SlashCommandNumberOption | SlashCommandRoleOption | SlashCommandStringOption | SlashCommandUserOption;
type Choice = { name: string; value: string | number };
type Choices = readonly (string | number | Choice)[] | Readonly<Record<string, string>>;

export class OptionBuilder {
    public builder: SlashCommandBuilder | SlashCommandSubcommandBuilder;

    public constructor(builder: SlashCommandBuilder | SlashCommandSubcommandBuilder) {
        this.builder = builder;
    }

    private description(name: string, description?: string): string {
        if (description) return description;
        name = name.replaceAll("_", " ")
        return name.charAt(0).toUpperCase() + name.slice(1)
    }

    private toChoices(input: Choices): Choice[] {
        if (Array.isArray(input)) return input.map((item: string | number | Choice) => typeof item === "object" ? item : {name: String(item), value: item});
        return Object.entries(input).map(([value, name]) => ({name: String(name).toLowerCase(), value}));
    }

    private applyChoices(option: AnySlashOption, from: Choices) {
        const choices = this.toChoices(from);
        if (option instanceof SlashCommandStringOption) option.addChoices(...choices.map((c) => ({name: c.name, value: String(c.value)})));
        else if (option instanceof SlashCommandIntegerOption || option instanceof SlashCommandNumberOption) option.addChoices(...choices.map((c) => ({name: c.name.toLowerCase(), value: Number(c.value)})));
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

    public sub(name: string, description: string, fn: (o: OptionBuilder) => unknown) {
        this.builder.addSubcommand((s) => {
            fn(new OptionBuilder(s));
            return s.setName(name).setDescription(description);
        });
        return this;
    }
}

export class SlashBuilder {
    builder: SlashCommandBuilder;
    integrationTypes = [ApplicationIntegrationType.GuildInstall, ApplicationIntegrationType.UserInstall];
    contexts = [InteractionContextType.BotDM, InteractionContextType.Guild, InteractionContextType.PrivateChannel];

    public constructor(public command: Subcommand | Command, integrationTypes?: ApplicationIntegrationType[], contexts?: InteractionContextType[]) {
        this.integrationTypes = integrationTypes ?? this.integrationTypes;
        this.contexts = contexts ?? this.contexts;
        this.builder = new SlashCommandBuilder().setName(command.name).setDescription(command.description).setIntegrationTypes(this.integrationTypes).setContexts(this.contexts);
    }

    public opt(fn: (o: OptionBuilder) => unknown) {
        fn(new OptionBuilder(this.builder));
        return this;
    }

    public grp(name: string, description: string, fn: (g: GroupBuilder) => unknown) {
        (this.builder as unknown as SlashCommandSubcommandsOnlyBuilder).addSubcommandGroup((g) => {
            fn(new GroupBuilder(g));
            return g.setName(name).setDescription(description);
        });
        return this;
    }

    public sub(name: string, description: string, fn: (o: OptionBuilder) => unknown) {
        (this.builder as unknown as SlashCommandSubcommandsOnlyBuilder).addSubcommand((s) => {
            fn(new OptionBuilder(s));
            return s.setName(name).setDescription(description);
        });
        return this;
    }
}