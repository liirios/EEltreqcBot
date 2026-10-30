import { UserError } from "@sapphire/framework";
import { ResolvedUser, type ResolvableUser } from "./helpers/users";
import { Scope } from "./db/db_enum";

export class PermError extends UserError {
	public constructor(public readonly required: number, public readonly got: number, public readonly user?: ResolvableUser, authorId?: string, scope?: typeof Scope[keyof typeof Scope]) {
		const id = ResolvedUser.from(user).id;
		super({
			identifier: "PermError",
			message: `${id && id !== authorId ? `${ResolvedUser.mention(id)}` : "You"} need perm^${required}${scope === Scope.CHANNEL ? " in this channel" : scope === Scope.GUILD ? " in this guild" : ""} (${id && id !== authorId ? "they" : "you"} got perm^${got})`,
			context: {},
		});
	}
}

export const prePerm = (required: number, scope?: typeof Scope[keyof typeof Scope]) => ({name: "Perm" as const, context: {required, scope}});