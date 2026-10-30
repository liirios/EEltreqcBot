import { ApplyOptions } from "@sapphire/decorators";
import { Events, Listener } from "@sapphire/framework";
import type { Role } from "discord.js";
import { ResolvedColorole } from "../../../lib/helpers/coloroles";
import { changedFields } from "../../../lib/string";

@ApplyOptions<Listener.Options>({event: Events.GuildRoleUpdate})
export class GuildRoleUpdateEvent extends Listener<typeof Events.GuildRoleUpdate> {
	public override async run(oldRole: Role, newRole: Role) {
		const before = {name: oldRole.name, ...oldRole.colors};
		const after = {name: newRole.name, ...newRole.colors};
		if (!Object.keys(changedFields(before, after)).length) return;

		const colorole = ResolvedColorole.byRole(newRole.guild.id, newRole.id);
		if (colorole.valid()) await colorole.onDiscordRoleUpdate();
	}
}