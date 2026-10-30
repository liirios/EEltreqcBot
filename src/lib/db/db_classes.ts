import { UserError } from "@sapphire/framework";

export class DBInitError extends UserError {
	public constructor(name: string) {
		super({
			identifier: "DBInitError",
			message: `${name} is not initialized properly`,
			context: {}
		});
	}
}

export abstract class DBBase<TBL, R, T = R, Cache extends object = Record<string, T>> {
	protected cache: Cache = {} as Cache;

	public constructor(protected table?: TBL) {}

	protected get ready(): TBL {
		if (this.table == null) throw new DBInitError(this.constructor.name);
		return this.table;
	}

	protected abstract load(table: TBL): R[];
	protected abstract store(row: R): T;
	protected abstract upsert(...args: any[]): R;
	public abstract get(...args: any[]): unknown;

	public sync(source: R[] | null = null, clear: boolean = true) {
		if (clear) this.cache = {} as Cache;
		(source ?? this.load(this.ready)).forEach((value) => this.store(value));
		return this;
	}
}

export abstract class NotNullDBBase<TBL, R extends {id: string}, I extends {id: string} = R, T = {[K in keyof R]: NonNullable<R[K]>}> extends DBBase<TBL, R, T> {
	public abstract default(id: string): T;
	public abstract normalize(row: R): T;
	protected abstract override upsert(id: string, data: Partial<Omit<I, "id">>): R;

	protected override store(row: R) {
		return this.cache[row.id] = this.normalize(row);
	}

	public override get(id: string): T | undefined {
		return this.cache[id];
	}

	public getOrDefault(id: string): T {
		return this.get(id) ?? this.default(id);
	}

	public update(id: string, data: Partial<Omit<I, "id">> = {}) {
		if (Object.keys(data).length === 0) return;
		this.store(this.upsert(id, data));
	}
}