import { Guild } from "discord.js";
import { IOM } from "../constants";
import { DBGuilds, NotNullDBGuild } from "../db/db_guilds";
import { container } from "@sapphire/framework";
import { GUILDS } from "../db/db_schema";

export class ResolvedGuild {
    public id?: string;
    public guild?: Guild | null;
    public dbguild: NotNullDBGuild;

    constructor(target?: Guild | string | IOM | null) {
        if (typeof target === "string") {
            this.id = target;
        } else if (target instanceof Guild) {
            this.id = target.id;
            this.guild = target;
        } else if (target == null) {
        } else {
            this.id = target.guild?.id;
            this.guild = target.guild;
        }
        this.dbguild = this?.id ? GLD.getOrDefault(this.id) : DBGuilds.default();
    }

    public resolve() {
        if (!this.guild || !this.id) return
        this.guild = container.client.guilds.resolve(this.id);
        
        return
    }

    // discord

    // db
    public getPrefix(): string {
        return this.dbguild.prefix;
    }

    public setPrefix(prefix: string) {
        if (!this.id) return;
        GLD.update(this.id, {prefix: prefix});
    }
}

export const GLD = new DBGuilds(GUILDS).sync();