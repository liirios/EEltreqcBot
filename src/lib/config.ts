import { ActivityType } from "discord.js";

// bot
export const AUTHOR_ID = "416062410022191104";
export const VERSION = "2.0.0 UNSTABLE";
export const PREFIX = "^";
export const ACTIVITIES = [
    {name: "custom", type: ActivityType.Custom, state: "rawr"}
]
// embeds
export const DEFAULT_EMBED_COLOR = 0xff004f;

// messages
export const MESSAGE_LIMIT = 2000;
export const MAX_EMBEDS = 10;
export const MAX_FILES = 10;
export const MAX_FILE_SIZE = 10*1024*1024;
export const MAX_IMAGES_IN_EMBED = 4;

// images
export const COLOR_TILE_WIDTH = 168;
export const COLOR_TILE_HEIGHT = 24;
export const COLOR_TILE_GAP = 3;
export const COLOR_TILE_BACKGROUND = "#808080";