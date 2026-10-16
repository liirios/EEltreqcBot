import { UserError } from "@sapphire/framework";
import { USR } from "./helpers/users";

export class PermError extends UserError {
    public constructor(public readonly required: number, public readonly got: number) {
        super({
            identifier: "PermError",
            message: `You need perm^${required} (you got perm^${got})`,
            context: {},
        });
    }
}

export function requirePerm(id: string, required: number) {
    const perm = USR.getOrDefault(id).perm;
    if (perm < required) throw new PermError(required, perm);
}

export const prePerm = (required: number) => ({ name: "Perm" as const, context: { required } });


