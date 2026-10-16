import type { MessageCommandSuccessPayload } from "@sapphire/framework";
import { Listener, LogLevel } from "@sapphire/framework";
import type { Logger } from "@sapphire/plugin-logger";
import { logSuccessCommand } from "../../../../lib/utils";
import { Subcommand } from "@sapphire/plugin-subcommands";

export class UserEvent extends Listener {
	public override run(payload: MessageCommandSuccessPayload) {
		if (payload.command instanceof Subcommand) return;
		logSuccessCommand(payload);
	}

	public override onLoad() {
		this.enabled = (this.container.logger as Logger).level <= LogLevel.Debug;
		return super.onLoad();
	}
}
