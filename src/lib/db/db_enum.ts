export const Scope = {GLOBAL: "global", GUILD: "guild", CHANNEL: "channel"} as const;
export type Scope = typeof Scope[keyof typeof Scope];
export const SCOPES = Object.values(Scope) as [Scope, ...Scope[]];

export const ExpEvent = {MESSAGE: "message", GOT_REACTION: "got_reaction", REACTED: "reacted"} as const;
export type ExpEvent = typeof ExpEvent[keyof typeof ExpEvent];
export const EXP_EVENTS = Object.values(ExpEvent) as [ExpEvent, ...ExpEvent[]];