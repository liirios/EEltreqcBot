import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";
import { PermError } from "../../../lib/perms";
import { ApplyOptions } from "@sapphire/decorators";
import { ResolvedUser } from "../../../lib/helpers/users";
import { Scope } from "../../../lib/db/db_enum";

@ApplyOptions<Precondition.Options>({name: "Perm"})
export class PermPrecondition extends Precondition {
	public override messageRun(message: Message, _command: unknown, context: Precondition.Context) {return this.check(message.author.id, message.guildId, context);}
	public override chatInputRun(interaction: ChatInputCommandInteraction, _command: unknown, context: Precondition.Context) {return this.check(interaction.user.id, interaction.guildId, context);}
	public override contextMenuRun(interaction: ContextMenuCommandInteraction, _command: unknown, context: Precondition.Context) {return this.check(interaction.user.id, interaction.guildId, context);}

	private check(id: string, scopeId: string | null, context: Precondition.Context) {
		const {required = 1, scope} = context as {required?: number; scope?: Scope};
		const user = ResolvedUser.from(id);
		const guild = scope === Scope.GLOBAL ? undefined : scopeId
		
		if (user.isPrivileged(required, guild)) return this.ok();

		const error = new PermError(required, user.getPerm(guild), id, id, scope);
		return this.error({identifier: error.identifier, message: error.message, context: {required, scope}});
	}
}

declare module "@sapphire/framework" {
	interface Preconditions {
		Perm: {required?: number; scope?: Scope};
	}
}