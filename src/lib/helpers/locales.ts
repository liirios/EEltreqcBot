import { Liquid } from "liquidjs";
import { DBLocales, PerGuildDBLocales } from "../db/db_locales";
import { LOCALES, PER_GUILD_LOCALES } from "../db/db_schema";
import { readFileSync } from "fs";
import { srcDir } from "../constants";
import { join } from "path";

class BotDBLocalesCollection {
    public G: DBLocales;
    public PG: PerGuildDBLocales;
    private engine: Liquid;

    public constructor(locales: typeof LOCALES, per_guild_locales: typeof PER_GUILD_LOCALES, default_path?: string) {
        this.G = new DBLocales(locales);
        if (default_path) this.G.sync(JSON.parse(readFileSync(default_path, "utf-8")));
        this.G.sync(undefined, false)
        this.PG = new PerGuildDBLocales(per_guild_locales).sync();
        this.engine = new Liquid();

        this.engine.registerFilter("random", (input) => {
            const parts = String(input).split("|");
            return parts[Math.floor(Math.random() * parts.length)];
        });
    }

    public async getFormatted(key: string, args: Record<string, string> = {}, guild?: string, def?: any): Promise<string> {
        let loc = "";
        if (guild !== undefined) loc = this.PG.find(guild, key) ?? this.G.get(key, def);
        else loc = this.G.get(key, def)

        return await this.engine.parseAndRender(String(loc), args);
    }
}

export const LOC = new BotDBLocalesCollection(LOCALES, PER_GUILD_LOCALES, join(srcDir, "default_locales.json"))