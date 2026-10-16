import { Precondition } from "@sapphire/framework";
import type { ChatInputCommandInteraction, ContextMenuCommandInteraction, Message } from "discord.js";
import { PermError } from "../lib/perms";
import { ApplyOptions } from "@sapphire/decorators";
import { USR } from "../lib/helpers/users";

@ApplyOptions<Precondition.Options>({name: "Perm"})
export class PermPrecondition extends Precondition {
    public override messageRun(message: Message, _command: unknown, context: Precondition.Context) {return this.check(message.author.id, context);}
    public override chatInputRun(interaction: ChatInputCommandInteraction, _command: unknown, context: Precondition.Context) {return this.check(interaction.user.id, context);}
    public override contextMenuRun(interaction: ContextMenuCommandInteraction, _command: unknown, context: Precondition.Context) {return this.check(interaction.user.id, context);}

    private check(id: string, context: Precondition.Context) {
        const required = (context as {required?: number}).required ?? 1;
        const perm = USR.getOrDefault(id).perm;
        if (perm >= required) return this.ok();

        const error = new PermError(required, perm);
        return this.error({identifier: error.identifier, message: error.message, context: {required: required}});
    }
}

declare module "@sapphire/framework" {
    interface Preconditions {
        Perm: { required?: number };
    }
}
