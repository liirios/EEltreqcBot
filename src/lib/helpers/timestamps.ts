import { isNumeric, mentionTime } from "../string";
import { mapAll } from "../utils";

export type ResolvableTime = ResolvedTime | Date | number | string | null | undefined;
export type TimeStyle = "t" | "T" | "d" | "D" | "f" | "F" | "s" | "S" | "R";

export class ResolvedTime {
	public date?: Date | null;
	public style: TimeStyle = "f";
	private absolute: TimeStyle = "f";

	public constructor(target?: ResolvableTime, style?: TimeStyle) {
		if (target instanceof ResolvedTime) {
			this.date = target.date;
			this.style = target.style;
			this.absolute = target.absolute;
		} else if (target == null) {}
		else if (target instanceof Date) this.date = new Date(target.getTime());
		else if (typeof target === "number") this.date = new Date(target);
		else if (typeof target === "string") this.date = new Date(isNumeric(target.trim()) ? Number(target) : target);
		if (style) this.setStyle(style);
	}

	public valid(): boolean {
		return !!this.date && !Number.isNaN(this.date.getTime());
	}

	public resolved(): boolean {
		return this.valid();
	}

	// from
	public static from(target?: ResolvableTime, style?: TimeStyle): ResolvedTime {
		if (target instanceof ResolvedTime) return style ? target.setStyle(style) : target;
		return new ResolvedTime(target, style);
	}

	public static now(): ResolvedTime {
		return new ResolvedTime(Date.now());
	}

	public static fromUnix(seconds: number): ResolvedTime {
		return new ResolvedTime(seconds * 1000);
	}

	public static ms(targets: ResolvableTime | ResolvableTime[]): number[] {
		return mapAll(targets, (value) => ResolvedTime.from(value).ms);
	}

	// getters
	public get ms(): number | undefined {
		return this.valid() ? this.date!.getTime() : undefined;
	}

	public get unix(): number | undefined {
		const ms = this.ms;
		return ms === undefined ? undefined : Math.floor(ms / 1000);
	}

	public get iso(): string | undefined {
		return this.valid() ? this.date!.toISOString() : undefined;
	}

	// setters
	public clone(): ResolvedTime {
		return new ResolvedTime(this);
	}

	public set(target: ResolvableTime): this {
		this.date = ResolvedTime.from(target).clone().date;
		return this;
	}

	public setStyle(style: TimeStyle): this {
		this.style = style;
		if (style !== "R") this.absolute = style;
		return this;
	}

	public relative(): this {
		this.style = "R";
		return this;
	}

	public notRelative(): this {
		this.style = this.absolute;
		return this;
	}

	public shortTime(): this {
		return this.setStyle("t");
	}

	public longTime(): this {
		return this.setStyle("T");
	}

	public shortDate(): this {
		return this.setStyle("d");
	}

	public longDate(): this {
		return this.setStyle("D");
	}

	public shortDateTime(): this {
		return this.setStyle("f");
	}

	public longDateTime(): this {
		return this.setStyle("F");
	}

	public plus(ms: number): this {
		const base = this.ms;
		this.date = base === undefined ? this.date : new Date(base + ms);
		return this;
	}

	public minus(ms: number): this {
		return this.plus(-ms);
	}

	public add(ms: number): ResolvedTime {
		return this.clone().plus(ms);
	}

	// compare
	public equals(other: ResolvableTime): boolean {
		const a = this.ms, b = ResolvedTime.from(other).ms;
		return a !== undefined && a === b;
	}

	public isBefore(other: ResolvableTime): boolean {
		const a = this.ms, b = ResolvedTime.from(other).ms;
		return a !== undefined && b !== undefined && a < b;
	}

	public isAfter(other: ResolvableTime): boolean {
		const a = this.ms, b = ResolvedTime.from(other).ms;
		return a !== undefined && b !== undefined && a > b;
	}

	public isPast(): boolean {
		return this.isBefore(Date.now());
	}

	public isFuture(): boolean {
		return this.isAfter(Date.now());
	}

	public isBetween(from: ResolvableTime, to: ResolvableTime): boolean {
		return !this.isBefore(from) && !this.isAfter(to) && this.valid() && ResolvedTime.from(from).valid() && ResolvedTime.from(to).valid();
	}

	public diff(other: ResolvableTime): number | undefined {
		const a = this.ms, b = ResolvedTime.from(other).ms;
		return a === undefined || b === undefined ? undefined : a - b;
	}

	// discord
	public format(style: TimeStyle = this.style): string | undefined {
		const unix = this.unix;
		return unix === undefined ? undefined : mentionTime(unix, style);
	}

	public get mention(): string | undefined {
		return this.format();
	}

	public static mention(time: ResolvableTime, style?: TimeStyle): string | undefined {
		return ResolvedTime.from(time).format(style);
	}

	public static AnRMention(time: ResolvableTime): string {
		const t = ResolvedTime.from(time);
		const a = t.format();
		return a ? `${a} ${t.format("R")}` : "";
	}
}