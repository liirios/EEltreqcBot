import { ApplyOptions } from "@sapphire/decorators";
import { Args, Command } from "@sapphire/framework";
import { AttachmentBuilder, EmbedBuilder, Message } from "discord.js";
import petPetGif from "pet-pet-gif";
import type { IOM } from "../../../lib/constants";
import { prePerm } from "../../../lib/perms";
import { ResolvedUser } from "../../../lib/helpers/users";
import { SlashBuilder } from "../../../lib/helpers/slashes";
import { UniversalMessage } from "../../../lib/helpers/universals";
import { DEFAULT_EMBED_COLOR } from "../../../lib/config";

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
		const um = new UniversalMessage(iom, args ?? iom);
		const fallback = um.isSlash ? um.author : await ResolvedUser.fromMessageReference<never>(um.message);
		const target = await ResolvedUser.from(await um.grab.pick("user", "target", fallback?.user ?? undefined)).resolve(iom);
		const author = await um.author.resolve(iom);

		if (author.id === target.id) return um.setContent("you silly").setFiles().setEmbeds().reply();
		await um.defer();

		const gif = await petPetGif(target.getAvatarUrl({extension: "png", size: 256})!, {resolution: 128, delay: 20});
		const embed = new EmbedBuilder()
			.setColor(target.getColor(DEFAULT_EMBED_COLOR))
			.setDescription(`${author.user} pet ${target.user} :3`)
			.setAuthor({name: author.getName(), iconURL: author.getAvatarUrl({extension: "png", size: 256})})
			.setImage("attachment://pet.gif");

		return um.setContent("").setFiles(new AttachmentBuilder(gif, {name: "pet.gif"})).setEmbeds(embed).reply();
	}
}