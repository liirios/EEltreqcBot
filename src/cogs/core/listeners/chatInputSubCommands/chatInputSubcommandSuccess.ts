import { Listener, LogLevel } from "@sapphire/framework";
import type { Logger } from "@sapphire/plugin-logger";
import type { ChatInputSubcommandSuccessPayload } from "@sapphire/plugin-subcommands";
import { logSuccessCommand } from "../../../../lib/utils";

export class UserEvent extends Listener {
	public override run(payload: ChatInputSubcommandSuccessPayload) {
		logSuccessCommand(payload);
	}

	public override onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
