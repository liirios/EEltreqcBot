import { Listener, UserError } from "@sapphire/framework";
import { SubcommandPluginEvents, type ChatInputSubcommandErrorPayload } from "@sapphire/plugin-subcommands";
import { MessageFlags } from "discord.js";

export class UserEvent extends Listener<typeof SubcommandPluginEvents.ChatInputSubcommandError> {
	public override async run(error: unknown, {interaction}: ChatInputSubcommandErrorPayload) {
		if (!(error instanceof UserError)) console.error(error);
		else if (Reflect.get(Object(error.context), "silent")) return;

		const content = error instanceof UserError ? error.message : "Something went wrong";
		if (interaction.deferred || interaction.replied) return interaction.editReply({content, allowedMentions: {users: [interaction.user.id], roles: []}});
		return interaction.reply({content, allowedMentions: {users: [interaction.user.id], roles: []}, flags: MessageFlags.Ephemeral});
	}
}
