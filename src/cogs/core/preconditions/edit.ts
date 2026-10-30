import { ApplyOptions } from "@sapphire/decorators";
import { Precondition, type Command } from "@sapphire/framework";
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";

const MAX = 5000;
const seen = new Set<string>();

@ApplyOptions<Precondition.Options>({name: "Edit", position: 5})
export class EditPrecondition extends Precondition {
	public override messageRun(message: Message, command: Command) {
		if (!!message.editedTimestamp && (command.options.editable === false || !seen.has(message.id))) return this.error({context: {silent: true}});

		seen.add(message.id);
		if (seen.size > MAX) seen.delete(seen.values().next().value!);

		return this.ok();
	}

	public override chatInputRun(_interaction: ChatInputCommandInteraction, _command: Command) {return this.ok();}
	public override contextMenuRun(_interaction: ContextMenuCommandInteraction, _command: Command) {return this.ok();}
}

declare module "@sapphire/framework" {
	interface CommandOptions {
		editable?: boolean;
	}
}