import { Guild, GuildMember, ImageURLOptions, Message, User } from "discord.js";
import { container } from "@sapphire/framework";
import { DBUsers, NotNullDBUser } from "../db/db_users";
import { PermError } from "../perms";
import { IOM } from "../constants";
import { isMessage } from "../utils";
import { USERS } from "../db/db_schema";

export class ResolvedUser {
    public id: string;
    public member: GuildMember | null = null;
    public user: User;
    public dbuser: NotNullDBUser;

    constructor(target: GuildMember | User) {
        this.id = target.id;
        this.user = target as User;
        this.dbuser = USR.getOrDefault(this.id);
        if (target instanceof GuildMember) {
            this.user = target.user
            this.member = target;
        }
    }

    public static authorFromIOM(iom: IOM): ResolvedUser {
        if (isMessage(iom)) return new ResolvedUser(iom.author);
        return new ResolvedUser(iom.user);
    }

    public static async fromMessageReference<T>(message: Message, def?:T): Promise<ResolvedUser | T | undefined> {
        const refId = message.reference?.messageId;
        const ref = refId ? await message.channel.messages.fetch(refId).catch(() => undefined) : undefined;
        const refMember = ref ? await message.guild?.members.fetch(ref.author.id).catch(() => undefined) : undefined;
        if (!refMember) return def;
        return new ResolvedUser(refMember);
    }

    public async resolve(guild: Guild | IOM | string) {
        if (this.member != null) return;
        this.member = await this.resolveMember(this.user.id, guild);
    }

    private async resolveMember(id: string, guild: Guild | IOM | null | undefined | string): Promise<GuildMember | null> {
        if (typeof guild === "string") guild = await container.client.guilds.resolve(guild);
        else if (guild instanceof Guild) {}
        else guild = guild?.guild
        if (guild == null) return null;
        return guild.members.fetch(id).catch(() => null);
    }

    // discord
    public getColor<T>(def: T): number | T {
        return this.member?.displayColor ?? def;
    }

    public getName(def?: string): string {
        return (this.member ?? this.user).displayName ?? def;
    }

    public getAvatarUrl(options?: ImageURLOptions, def?: string): string {
        return (this.member ?? this.user).displayAvatarURL(options) ?? def;
    }

    // db
    public getPerm(): number {
        return this.dbuser.perm;
    }

    public isPrivileged(perm: number): boolean {
        return this.getPerm() >= perm;
    }

    public requirePerm(perm: number) {
        if (!this.isPrivileged(perm)) throw new PermError(perm, this.getPerm());
    }

    public setPerm(perm: number) {
        USR.update(this.user.id, {perm: perm});
    }

}

export const USR = new DBUsers(USERS).sync();