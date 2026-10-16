import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command } from "@sapphire/framework";
import { AttachmentBuilder, EmbedBuilder, GuildMember, Message, MessageFlags } from "discord.js";
import { type IOM } from "../../lib/constants";
import { getQuiet, isMessage, isSlash, universalReply } from "../../lib/utils";
import { prePerm } from "../../lib/perms";
import { Grabber } from "../../lib/helpers/args";
import petPetGif from "pet-pet-gif";
import { ResolvedUser } from "../../lib/helpers/users";
import { SlashBuilder } from "../../lib/helpers/slash";

@ApplyOptions<Command.Options>({
	name: "petpet", description: "petpet",
	preconditions: [prePerm(1)]
})
export class PetPetCommand extends Command {
	public override registerApplicationCommands(registry: Command.Registry) {
		registry.registerChatInputCommand(new SlashBuilder(this).opt((o) => o.target().quiet()).builder);
	}

	public override chatInputRun(iom: Command.ChatInputCommandInteraction) {return this.petpet(iom);}
	public override messageRun(iom: Message, args: Args) {return this.petpet(iom, args);}

	private async petpet(iom: IOM, args?: Args) {
		const author = ResolvedUser.authorFromIOM(iom);
		await author.resolve(iom);

		let target; 
		if (isSlash(iom)) {
			await iom.deferReply({flags: getQuiet(iom) ? MessageFlags.Ephemeral : undefined});
			target = iom.options.getUser("target") ?? iom.user
		}
		else if (isMessage(iom) && args) {
			const ref = iom.reference?.messageId ? await iom.channel.messages.fetch(iom.reference.messageId) : undefined;
			target = await new Grabber(args).pick("member", "target", ref?.member as GuildMember)
		}
		else return;
		target = new ResolvedUser(target)
		target.resolve(iom)

		if (author.user.id === target.user.id) return universalReply(iom, "you silly");

		const gifBuffer = await petPetGif(target.getAvatarUrl({extension: "png", size: 256}), {resolution: 128, delay: 20});
		const attachment = new AttachmentBuilder(gifBuffer, {name: "pet.gif"});

		const embed = new EmbedBuilder()
			.setColor(target.getColor(0xAABBFF))
			.setDescription(`${author.user} pet ${target.user} :3`)
			.setAuthor({name: author.getName(), iconURL: author.getAvatarUrl({extension: "png", size: 256})})
			.setImage("attachment://pet.gif");

		return universalReply(iom, "", undefined, true, {embeds: [embed], files: [attachment]});
	}
}