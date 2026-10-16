import { container } from "@sapphire/framework";

type Entry = { name: string };

const DIALECT = "dr_dr";

let loaded: any;

export let CHARCOAL: any; // im so silly
export let DICTIONARY: any;
export let NUMBERS: any;
export let AFFIXES: any;
export let IDS: any;

export async function loadDraconic(dialect?: string) {
    dialect ??= DIALECT;
    await fetch("https://draconicconlang.github.io/APIs/dialects/DialectLoader.js")
    .then(res => res.text())
    .then(src => import(`data:text/javascript,${encodeURIComponent(src)}`))
    .then(({ DIALECTS }) => {
        container.logger.info(`Loading dialect^${DIALECT}`);
        return DIALECTS.load(DIALECT) as Promise<any>;
    })
    .then(dialect => {
        loaded = dialect;
        Object.assign(globalThis, dialect);
        container.logger.info(`Loaded dialect^${DIALECT}`);
        CHARCOAL = DRACONIC.CHARACTERS;
        DICTIONARY = DRACONIC.DICTIONARY;
        NUMBERS = DRACONIC.NUMBERS;
        AFFIXES = DRACONIC.AFFIXES;
        IDS = DRACONIC.IDS;
        return dialect;
    });
}

export const DRACONIC: any = new Proxy({}, {
    get: (_, key) => {
        if (!loaded) throw new Error("Dialect not loaded yet, await `loadDraconic()` first");
        const value = Reflect.get(loaded, key);
        return typeof value === "function" ? value.bind(loaded) : value;
    },
    has: (_, key) => !!loaded && key in loaded,
    ownKeys: () => (loaded ? Reflect.ownKeys(loaded) : []),
    getOwnPropertyDescriptor: (_, key) =>
        loaded ? Reflect.getOwnPropertyDescriptor(loaded, key) : undefined,
});

export const newDiscords: string[] = [
    "<:t_:1395014425202786386>", "<:c_:1395015072773836892>", "<:k_:1395014778065391667>", "<:q_:1395014503053135922>", "<:Q_:1395015246292193394>", "<:__:1395015167422632027>",
    "<:tr:1395014387709907006>", "<:s_:1395018846015852595>", "<:kx:1395014745571987476>", "<:qX:1395014531406762034>", "<:qH:1395014557038022746>", "<:QH:1395015276411621476>",
    "<:d_:1395015056802058312>", "<:z_:1395014250082078770>", "<:g_:1395014897850646650>", "<:f_:1395014923855069285>", "<:th:1395014402004226149>", "<:ll:1395014689771229345>",
    "<:x_:1395014334962208829>", "<:X_:1395015188507267084>", "<:h_:1395014873045274735>", "<:XH:1395015211601100870>", "<:H_:1395015290470797333>", "<:r_:1395014474393583687>",
    "<:l_:1395014711585800212>", "<:e_:1395014978045476944>", "<:ae:1395015103774064751>", "<:y_:1395014314485874718>", "<:a_:1395018584186687571>", "<:o_:1395014600868495360>",
    "<:u_:1395014366511763506>", "<:i_:1395014840963043541>", "<:ee:1395014959481622528>", "<:aa:1395015126322512033>", "<:oo:1395014573010190427>", "<:uu:1395014349130563735>",
    "<:ii:1395014804724518974>", "<:m_:1395014667578904659>", "<:n_:1395014646955769939>", "<:ng_:1395014626369863700>", "<:a_:1395018584186687571><:_pyr:1395015152100708445>",
    "<:o_:1395014600868495360><:_pyr:1395015152100708445>", "<:u_:1395014366511763506><:_pyr:1395015152100708445>", "<:aa:1395015126322512033><:_pyr:1395015152100708445>",
    "<:oo:1395014573010190427><:_pyr:1395015152100708445>", "<:uu:1395014349130563735><:_pyr:1395015152100708445>", "<:Qem:1395015230228136056>", ":seleng:", "<:_pyr:1395015152100708445>",
    "     "
];

export function entriesToCustomDiscord(map: Map<unknown, Entry>): string {
    const names = Object.keys(DRACONIC.CHARACTERS.MAP);
    return [...map.values()]
        .map(v => newDiscords[names.indexOf(v.name)] ?? "")
        .join("");
}