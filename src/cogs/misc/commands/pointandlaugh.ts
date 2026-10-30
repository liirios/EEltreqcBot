// import { ApplyOptions } from "@sapphire/decorators";
// import { Args, Command } from "@sapphire/framework";
// import { EmbedBuilder, GuildMember, Message, User } from "discord.js";
// import { type IOM } from "../../../lib/constants";
// import { isMessage, isSlash, universalReply } from "../../../lib/utils";
// import { prePerm } from "../../../lib/perms";
// import { Grabber } from "../../../lib/helpers/grab";
// import { SlashBuilder } from "../../../lib/helpers/slash";

// @ApplyOptions<Command.Options>({
// 	name: "pointandlaugh", description: "pointandlaugh",
// 	preconditions: [prePerm(1)]
// })
// export class PointAndLaughCommand extends Command {
// 	public override registerApplicationCommands(registry: Command.Registry) {
// 			registry.registerChatInputCommand(new SlashBuilder(this).opt((o) => o.string().quiet()).builder);
// 	}

// 	public override chatInputRun(iom: Command.ChatInputCommandInteraction) {return this.pointandlaugh(iom);}
// 	public override messageRun(iom: Message, args: Args) {return this.pointandlaugh(iom, args);}

// 	private async pointandlaugh(iom: IOM, args?: Args) {
// 		let value: string, author_member: GuildMember | null, author_user: User;
// 		if (isSlash(iom)) {
// 			value = iom.options.getString("string") ?? ""
// 			author_member = iom.member instanceof GuildMember ? iom.member : null;
// 			author_user = iom.user;
// 		} else if (isMessage(iom) && args) {
// 			value = await new Grabber(args).rest("string", "string", "");
// 			author_member = iom.member;
// 			author_user = iom.author;
// 		} else return;

// 		const embed = new EmbedBuilder()
// 			.setColor(author_member?.displayColor || 0xAABBFF)
// 			.setAuthor({name: author_member?.displayName ?? author_user.displayName, iconURL: (author_member ?? author_user).displayAvatarURL()})
// 			.setImage("https://media.discordapp.net/attachments/1441357622086471682/1540146393463783566/proxy-image.png?ex=6a88e49a&is=6a87931a&hm=fdca9f14ac953335685b0a6e4569d451533e1635177a51838821c36ff5e1cb0c&=&format=webp&quality=lossless&width=384&height=358");
// 		if (value.length > 0) embed.setDescription(value) 

// 		return universalReply(iom, "", undefined, true, {embeds: [embed]});
// 	}
// }