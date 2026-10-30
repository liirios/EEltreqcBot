import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Role } from "discord.js";
import { ResolvedColorole } from "../../../lib/helpers/coloroles";

@ApplyOptions<Listener.Options>({event: Events.GuildRoleDelete})
export class GuildRoleDeleteEvent extends Listener<typeof Events.GuildRoleDelete> {
	public override async run(role: Role) {
		const colorole = ResolvedColorole.byRole(role.guild.id, role.id);
		if (colorole.valid()) colorole.onDiscordRoleDelete();
	}
}