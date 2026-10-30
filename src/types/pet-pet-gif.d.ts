declare module "pet-pet-gif" {
	interface PetPetOptions { resolution?: number; delay?: number; backgroundColor?: string | null;}
	function petPetGif(avatarUrl: string, options?: PetPetOptions): Promise<Buffer>;
	export = petPetGif;
}