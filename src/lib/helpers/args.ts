import { Args, ArgType, ArgumentError, Identifiers, RepeatArgOptions, UserError } from "@sapphire/framework";

export class GrabError extends UserError {
    public constructor(public readonly type: string, public readonly field: string, public readonly got: any, public readonly from?: any[]) {
        got = got == null ? "" : ` (got \`${got}\`)`;
        super({
            identifier: "PermError",
            message: `You need to provide \`${type}\` at field \`${field}\`${got}` + (from?.length ? `\n-# Available: ${from.map((v) => `\`${v}\``).join(", ")}` : ""),
            context: {},
        });
    }
}

export class Grabber {
    args: Args

    public constructor(args: Args) {
        this.args = args;
    }

    public async pick<T extends keyof ArgType>(type: T, field: string, def?: ArgType[T]): Promise<ArgType[T]> {
        return this.args.pick(type).catch((e: any) => this.processCatch(e, type, field, def));
    }

    public async pickFrom<T extends keyof ArgType>(type: T, field: string, from: ArgType[T][], case_sensitive: boolean, def?: ArgType[T]): Promise<ArgType[T]> {
        this.args.save();
        const compare = (a: any, b: any) => case_sensitive || typeof a !== "string" || typeof b !== "string" ? a === b : a.toLowerCase() === b.toLowerCase();

        return this.args.pick(type).then((value) => {
            const match = from.find((o) => compare(o, value));
            if (match === undefined) throw new GrabError(type, field, value, from);
            return match;
        }).catch((e: any) => {
            this.args.restore();
            return this.processCatch(e, type, field, def, from);
        });
    }

    public async rest<T extends keyof ArgType>(type: T, field: string, def?: ArgType[T]): Promise<ArgType[T]> {
        return this.args.rest(type).catch((e: any) => this.processCatch(e, type, field, def));
    }

    public async repeat<T extends keyof ArgType>(type: T, field: string, options?: RepeatArgOptions, def?: ArgType[T][]): Promise<ArgType[T][]> {
        return this.args.repeat(type, options).catch((e: any) => this.processCatch(e, type, field, def));
    }

    private processCatch<T>(e: any, type: string, field: string, def?: T, from?: T[]): T {
        if (e?.identifier === Identifiers.ArgsMissing) {
            if (def !== undefined) return def;
            throw new GrabError(type, field, null, from);
        }
        if (e instanceof ArgumentError) throw new GrabError(type, field, e.parameter);
        throw e;;
    }
}