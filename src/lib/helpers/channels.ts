import { BaseChannel, Channel } from "discord.js";
import { IOM } from "../constants";
import { DBChannels, NotNullDBChannel } from "../db/db_channels";
import { container } from "@sapphire/framework";
import { CHANNELS } from "../db/db_schema";

export class ResolvedChannel {
    public id?: string;
    public channel?: Channel | null;
    public dbchannel: NotNullDBChannel;

    constructor(target?: Channel | string | IOM | null) {
        if (typeof target === "string") {
            this.id = target;
        } else if (target == null) {
        } else if (target instanceof BaseChannel || "isDMBased" in target) {
            this.id = target.id;
            this.channel = target;
        } else {
            this.id = target.channel?.id;
            this.channel = target.channel;
        }
        this.dbchannel = this?.id ? CNL.getOrDefault(this.id) : DBChannels.default();
    }

    public resolve() {
        if (!this.channel || !this.id) return
        this.channel = container.client.channels.resolve(this.id);
        return
    }

    // discord

    // db
    public getPrefix(): string {
        return this.dbchannel.prefix;
    }

    public setPrefix(prefix: string) {
        if (!this.id) return;
        CNL.update(this.id, {prefix: prefix});
    }
}

export const CNL = new DBChannels(CHANNELS).sync();