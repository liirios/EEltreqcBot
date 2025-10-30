const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();


const GENDERS = Object.freeze({
    E: Object.freeze({ NAME: "Exalted", SHORT: "e" }),
    R: Object.freeze({ NAME: "Rational", SHORT: "r" }),
    MON: Object.freeze({ NAME: "Monstrous", SHORT: "mon" }),
    I: Object.freeze({ NAME: "Irrational", SHORT: "i" }),
    MAG: Object.freeze({ NAME: "Magical", SHORT: "mag" }),
    MUN: Object.freeze({ NAME: "Mundane", SHORT: "mun" }),
    A: Object.freeze({ NAME: "Abstract", SHORT: "a" })
})

const GENDERS_ANIMATES = Object.freeze({
    NAME: "Animates",
    AFFECTED: Object.freeze([
        GENDERS.E,
        GENDERS.R,
        GENDERS.MON,
        GENDERS.I
    ])
})

const GENDERS_INANIMATES = Object.freeze({
    NAME: "Inanimates",
    AFFECTED: Object.freeze([
        GENDERS.MAG,
        GENDERS.MUN,
        GENDERS.A
    ])
})

const GENDERS_ALL = Object.freeze({
    NAME: "All",
    AFFECTED: Object.freeze([
        ...GENDERS_ANIMATES.AFFECTED,
        ...GENDERS_INANIMATES.AFFECTED
    ])
})



const NUMBERS = Object.freeze({
    S: "Singular",
    D: "Dual",
    P: "Plural"
})

const MOODS = Object.freeze({
    D: "Directive",
    R: "Recessive",
})

const TARGETS = Object.freeze({
    S: "Subject",
    O: "Object",
})


const mainText = 'pronounced {name_ipa}, represented with a "{letter_rom}" in the romanized way of writing, and "{letter}" in normal. The symbol makes the sound {letter_ipa} when spoken.'
const pyricHText = 'Letters containig /ħ/ are pronounced by dragon using /h/ and breathing out fire. Humans can use a lighter or stick to the /ħ/'
const pyricVowelText = 'Some letters following by q̇ħóll are considered pyric, and pronounced by dragon breathing out fire. Humans can use a lighter or stick to alternative sound.'
const soundPath = "https://supduzz.github.io/Draconic/assets/sound/symbol-" // for other ppl to use

const allophones = {
  "before i": 'placed before "i" or "ī"',
  "before obs": "placed before obstruent",
  "word-init": "word-initially and before voiceless obstruents",
  "word-final": "placed word-finally or before obstruent",
  "intervoc": "intervocalically",
  "pyric": "placed before q̇ħóll"
}

// REGistry
REG = (() => {
  let counter = 0;
  function auto() {
    return ++counter;
  }
  return { auto };
})();

REG.VOWEL = REG.auto();
REG.CONSONANT = REG.auto();
REG.PYRIC = REG.auto();
REG.SHEET_IGNORE = REG.auto();
REG.DIFFERENT = REG.auto();
REG.OPTIONAL = REG.auto();

class Character {
  constructor({
    name, name_ipa, letter, letter_rom, letter_ipa,
    letter_glyph, letter_discord, text = mainText,
    prop = [], table_prop = {}, allophones = {}, sound = null
  }) {
    this.name = name
    this.name_ipa = name_ipa
    this.letter = letter
    this.letter_rom = letter_rom
    this.letter_ipa = letter_ipa
    this.letter_glyph = letter_glyph
    this.letter_discord = letter_discord
    this.text = text
    this.prop = prop
    this.table_prop = table_prop
    this.allophones = allophones
    this.sound = sound
  }
}


// charmap
CHARACTERS = [
//row 0
  new Character({ // 0
    name: "toru", name_ipa: "/t̪oru/",
    letter: "t", letter_rom: ["t"], letter_ipa: "/t̪/", letter_glyph: "\uE000", letter_discord: "<:t_:1395014425202786386>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
        "/t̪̚/": allophones["word-final"],
    },
    sound: soundPath+"0-0.mp3"
  }),
  new Character({ // 1
    name: 'cáll',  name_ipa: "/t͡s̠ɑ̤ˁɬ/",
    letter: "c", letter_rom: ["c"], letter_ipa: "/t͡s̠/", letter_glyph: "\uE001", letter_discord: "<:c_:1395015072773836892>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/t͡ʃ/": allophones["before i"],
    },
    sound: soundPath+"0-1.mp3"
  }),
  new Character({ // 2
    name: 'kû',  name_ipa: "/kṳˁː/",
    letter: "k", letter_rom: ["k"], letter_ipa: "/k/", letter_glyph: "\uE002", letter_discord: "<:k_:1395014778065391667>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/c/": allophones["before i"],
      "/g̥/": allophones["intervoc"],
      "/k̚/": allophones["word-final"],
    },
    sound: soundPath+"0-2.mp3"
  }),
  new Character({ // 3
    name: 'qath',  name_ipa: "/qɑθ/",
    letter: "q", letter_rom: ["q"], letter_ipa: "/q/", letter_glyph: "\uE003", letter_discord: "<:q_:1395014503053135922>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/ɢ̥/": allophones["intervoc"],
      "/q̚/": allophones["word-final"]
    },
    sound: soundPath+"0-3.mp3"
  }),
  new Character({ // 4
    name: 'q̇os',  name_ipa: "/ʡos̠/",
    letter: "q̇", letter_rom: ["Q"], letter_ipa: "/ʡ/", letter_glyph: "\uE004", letter_discord: "<:Q_:1395015246292193394>",
    text: mainText+" If you struggle while pronouncing this, try looking up aryepiglottic folds, and mess around with how to contract them.",
    prop: [REG.CONSONANT],
    allophones: {
      "/ʡ̆/" :allophones["intervoc"],
      "/ʡ̚/": allophones["word-final"]
    },
    sound: soundPath+"0-4.mp3"
  }),
  new Character({ // 5
    name: 'ax',  name_ipa: "/ax/",
    letter: "'", letter_rom: ["'", "´", "`"], letter_ipa: "/ʔ/", letter_glyph: "\uE005", letter_discord: "<:__:1395015167422632027>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/ʔ̞/": allophones["intervoc"],
      "/ʔ̚/": allophones["word-final"]
    },
    sound: soundPath+"0-5.mp3"
  }),

//row 1
  new Character({ // 6
    name: 'trō',  name_ipa: "/t̪roː/",
    letter: "tr", letter_rom: ["tr"], letter_ipa: "/t̪r/", letter_glyph: "\uE006", letter_discord: "<:tr:1395014387709907006>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/t̪r̥/": "before voiceless obstruents"},
    sound: soundPath+"1-0.mp3"
  }),
  new Character({ // 7
    name: 'sēl',  name_ipa: "/s̠ēl̪/",
    letter: "s", letter_rom: ["s"], letter_ipa: "/s̠/", letter_glyph: "\uE007", letter_discord: "<:s_:1395018846015852595>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/ʃ/": allophones["before i"]},
    sound: soundPath+"1-1.mp3"
  }),
  new Character({ // 8
    name: 'kxæŋ',  name_ipa: "/k͡xaŋ/",
    letter: "kx", letter_rom: ["kx"], letter_ipa: "/k͡x/", letter_glyph: "\uE008", letter_discord: "<:kx:1395014745571987476>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/c͡ç/": allophones["before i"]},
    sound: soundPath+"1-2.mp3"
  }),
  new Character({ // 9
    name: 'qχē',  name_ipa: "/q͡χeː/",
    letter: "qχ", letter_rom: ["qX"], letter_ipa: "/q͡χ/", letter_glyph: "\uE009", letter_discord: "<:qX:1395014531406762034>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {},
    sound: soundPath+"1-3.mp3"
  }),
  new Character({ // 10
    name: 'qħán',  name_ipa: "/qˤʰɑ̤ˤn̥/",
    letter: "qħ", letter_rom: ["qH"], letter_ipa: "/qˤʰ/", letter_glyph: "\uE00a", letter_discord: "<:qH:1395014557038022746>",
    text: mainText + " " + pyricHText,
    prop: [REG.CONSONANT, REG.PYRIC],
    table_prop: {"xoffset": -10},
    allophones: {},
    sound: soundPath+"1-4.mp3"
  }),
  new Character({ // 11
    name: 'q̇ħón',  name_ipa: "/ʡˤʰo̤ˤn̥/",
    letter: "q̇ħ", letter_rom: ["QH"], letter_ipa: "/ʡˤʰ/", letter_glyph: "\uE00b", letter_discord: "<:QH:1395015276411621476>",
    table_prop: {"xoffset": 3},
    text: mainText + " " + pyricHText,
    prop: [REG.CONSONANT, REG.PYRIC],
    allophones: {},
    sound: soundPath+"1-5.mp3"
  }),

//row 2
  new Character({ // 12
    name: 'od',  name_ipa: "/oð/",
    letter: "d", letter_rom: ["d"], letter_ipa: "/ð/", letter_glyph: "\uE00c", letter_discord: "<:d_:1395015056802058312>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {},
    sound: soundPath+"2-0.mp3"
  }),
  new Character({ // 13
    name: 'ēz',  name_ipa: "/eːz̠/",
    letter: "z", letter_rom: ["z"], letter_ipa: "/z̠/", letter_glyph: "\uE00d", letter_discord: "<:z_:1395014250082078770>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/ʒ/": allophones["before i"]},
    sound: soundPath+"2-1.mp3"
  }),
  new Character({ // 14
    name: 'āg',  name_ipa: "/ɑːɣ/",
    letter: "g", letter_rom: ["g"], letter_ipa: "/ɣ/", letter_glyph: "\uE00e", letter_discord: "<:g_:1395014897850646650>",   
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/ʝ/": allophones["before i"]},
    sound: soundPath+"2-2.mp3"
  }),
  new Character({ // 15
    name: 'fe',  name_ipa: "/ɸe/",
    letter: "f", letter_rom: ["f"], letter_ipa: "/ɸ/", letter_glyph: "\uE00f", letter_discord: "<:f_:1395014923855069285>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/f/": 'when adjecent to "th"', 
      "/β/": "intervocalically or adjecent to z, g", 
      "/v/": "when adjecent to d"
    },
    sound: soundPath+"2-3.mp3"
  }),
  new Character({ // 16
    name: 'thyn',  name_ipa: "/θən̥/",
    letter: "th", letter_rom: ["th"], letter_ipa: "/θ/", letter_glyph: "\uE010", letter_discord: "<:th:1395014402004226149>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {},
    sound: soundPath+"2-4.mp3"
  }),
  new Character({ // 17
    name: 'llī',  name_ipa: "/ɬiː/",
    letter: "ll", letter_rom: ["ll"], letter_ipa: "/ɬ/", letter_glyph: "\uE011", letter_discord: "<:ll:1395014689771229345>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/ɮ/": allophones["intervoc"]},
    sound: soundPath+"2-5.mp3"
  }),

//row 3
  new Character({ // 18
    name: 'xæ',  name_ipa: "/xa/",
    letter: "x", letter_rom: ["x"], letter_ipa: "/x/", letter_glyph: "\uE012", letter_discord: "<:x_:1395014334962208829>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/ç/": allophones["before i"]},
    sound: soundPath+"3-0.mp3"
  }),
  new Character({ // 19
    name: 'χy',  name_ipa: "/χə/",
    letter: "χ", letter_rom: ["X"], letter_ipa: "/χ/", letter_glyph: "\uE013", letter_discord: "<:X_:1395015188507267084>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {},
    sound: soundPath+"3-1.mp3"
  }),
  new Character({ // 20
    name: 'har',  name_ipa: "/hɑr/",
    letter: "h", letter_rom: ["h"], letter_ipa: "/h/", letter_glyph: "\uE014", letter_discord: "<:h_:1395014873045274735>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {},
    sound: soundPath+"3-2.mp3"
  }),
  new Character({ // 21
    name: 'χħáth',  name_ipa: "/χˤʰɑ̤ˤθ/",
    letter: "χħ", letter_rom: ["XH"], letter_ipa: "/χˤʰ/", letter_glyph: "\uE015", letter_discord: "<:XH:1395015211601100870>",
    table_prop: {"size": 0.9, "xoffset": -22},
    text: mainText,
    prop: [REG.CONSONANT, REG.PYRIC],
    allophones: {},
    sound: soundPath+"3-3.mp3"
  }),
  new Character({ // 22
    name: 'ħâ',  name_ipa: "/ħɑ̤ˤː/",
    letter: "ħ", letter_rom: ["H"], letter_ipa: "/ħ/", letter_glyph: "\uE016", letter_discord: "<:H_:1395015290470797333>",
    text: mainText,
    prop: [REG.CONSONANT, REG.PYRIC],
    allophones: {},
    sound: soundPath+"3-4.mp3"
  }),
  new Character({ // 23
    name: 'rox',  name_ipa: "/r̥ox/",
    letter: "r", letter_rom: ["r"], letter_ipa: "/ɾ/", letter_glyph: "\uE017", letter_discord: "<:r_:1395014474393583687>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/r̥/": "word-init"},
    sound: soundPath+"3-5.mp3"
  }), 

//row 4
  new Character({ // 24
    name: 'lel',  name_ipa: "/l̥el̪/",
    letter: "l", letter_rom: ["l"], letter_ipa: "/l̪/", letter_glyph: "\uE018", letter_discord: "<:l_:1395014711585800212>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/l̥/": "word-init"},
    sound: soundPath+"4-0.mp3"
  }),
  new Character({ // 25
    name: 'eχ',  name_ipa: "/eχ/",
    letter: "e", letter_rom: ["e"], letter_ipa: "/e/", letter_glyph: "\uE019", letter_discord: "<:e_:1395014978045476944>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {},
    sound: soundPath+"4-1.mp3"
  }),
  new Character({ // 26
    name: 'æfu',  name_ipa: "/aɸu/",
    letter: "æ", letter_rom: ["ae"], letter_ipa: "/a/", letter_glyph: "\uE01a", letter_discord: "<:ae:1395015103774064751>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {},
    sound: soundPath+"4-2.mp3"
  }),
  new Character({ // 27
    name: 'y´',  name_ipa: "/əʔ/",
    letter: "y", letter_rom: ["y"], letter_ipa: "/ə/", letter_glyph: "\uE01b", letter_discord: "<:y_:1395014314485874718>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {},
    sound: soundPath+"4-3.mp3"
  }),
  new Character({ // 28
    name: 'a´',  name_ipa: "/ɑʔ/",
    letter: "a", letter_rom: ["a"], letter_ipa: "/ɑ/", letter_glyph: "\uE01c", letter_discord: "<:a_:1395018584186687571>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {"/ɑ̤ˤ/ (á)": allophones["pyric"]},
    sound: soundPath+"4-4.mp3"
  }),
  new Character({ // 29
    name: 'o´',  name_ipa: "/oʔ/",
    letter: "o", letter_rom: ["o"], letter_ipa: "/o/", letter_glyph: "\uE01d", letter_discord: "<:o_:1395014600868495360>",
    text: mainText,
    prop: [REG.VOWEL],
    table_prop: {"size": 0.9, "xoffset": -22},
    allophones: {"/o̤ˤ/ (ó)": allophones["pyric"]},
    sound: soundPath+"4-5.mp3"
  }), 

//row 5
  new Character({ // 30
    name: 'u´',  name_ipa: "/uʔ/",
    letter: "u", letter_rom: ["u"], letter_ipa: "/u/", letter_glyph: "\uE01e", letter_discord: "<:u_:1395014366511763506>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {"/ṳˤ/ (ú)": allophones["pyric"]},
    sound: soundPath+"5-0.mp3"
  }),
  new Character({ // 31
    name: 'i´',  name_ipa: "/iʔ/",
    letter: "i", letter_rom: ["i"], letter_ipa: "/i/", letter_glyph: "\uE01f", letter_discord: "<:i_:1395014840963043541>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {},
    sound: soundPath+"5-1.mp3"
  }),
  new Character({ // 32
    name: 'ē´',  name_ipa: "/eːʔ/",
    letter: "ē", letter_rom: ["ee"], letter_ipa: "/eː/", letter_glyph: "\uE020", letter_discord: "<:ee:1395014959481622528>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {},
    sound: soundPath+"5-2.mp3"
  }),
  new Character({ // 33
    name: 'ā´',  name_ipa: "/ɑːʔ/",
    letter: "ā", letter_rom: ["aa"], letter_ipa: "/ɑː/", letter_glyph: "\uE021", letter_discord: "<:aa:1395015126322512033>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {"/ɑ̤ˤː/ (â)": allophones["pyric"]},
    sound: soundPath+"5-3.mp3"
  }),
  new Character({ // 34
    name: 'ō´',  name_ipa: "/oːʔ/",
    letter: "ō", letter_rom: ["oo"], letter_ipa: "/oː/", letter_glyph: "\uE022", letter_discord: "<:oo:1395014573010190427>",
    text: mainText,
    prop: [REG.VOWEL],
    allophones: {"/o̤ˤː/ (ô)": allophones["pyric"]},
    sound: soundPath+"5-4.mp3"
  }),
  new Character({ // 35
    name: 'ū´',  name_ipa: "/uːʔ/",
    letter: "ū", letter_rom: ["uu"], letter_ipa: "/uː/", letter_glyph: "\uE023", letter_discord: "<:uu:1395014349130563735>",
    text: mainText,
    prop: [REG.VOWEL],
    table_prop: {"size": 0.9, "xoffset": -14},
    allophones: {"/ṳˁː/ (û)": allophones["pyric"]},
    sound: soundPath+"5-5.mp3"
  }), 

//row 6
  new Character({ // 36
    name: 'ī´',  name_ipa: "/iːʔ/",
    letter: "ī", letter_rom: ["ii"], letter_ipa: "/iː/", letter_glyph: "\uE024", letter_discord: "<:ii:1395014804724518974>",
    text: mainText,
    prop: [REG.VOWEL],
    table_prop: {"xoffset": -12},
    allophones: {},
    sound: soundPath+"6-0.mp3"
  }),
  new Character({ // 37
    name: 'má',  name_ipa: "/m̥ɑ̤ˤ/",
    letter: "m", letter_rom: ["m"], letter_ipa: "/m/", letter_glyph: "\uE025", letter_discord: "<:m_:1395014667578904659>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {"/m̥/": "word-init"},
    sound: soundPath+"6-1.mp3"
  }),
  new Character({ // 38
    name: 'naχ',  name_ipa: "/n̥ɑχ/",
    letter: "n", letter_rom: ["n"], letter_ipa: "/n/", letter_glyph: "\uE026", letter_discord: "<:n_:1395014646955769939>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/n̥/": "word-initially, word-finally or before voicelss obstruent",
      "/n̪/": "before dentals",
      "/ŋ/": "before velars and uvulars"
    },
    sound: soundPath+"6-2.mp3"
  }),
  new Character({ // 39
    name: 'yŋ',  name_ipa: "/əŋ/",
    letter: "ŋ", letter_rom: ["ng"], letter_ipa: "/ŋ/", letter_glyph: "\uE027", letter_discord: "<:ng_:1395014626369863700>",
    text: mainText,
    prop: [REG.CONSONANT],
    allophones: {
      "/ŋ̥/": "before voiceless velars",
      "/ɴ̥/": "before uvulars"
    },
    sound: soundPath+"6-3.mp3"
  }),
  new Character({ // 40
    name: 'á´',  name_ipa: "/ɑ̤ˤʔ/",
    letter: "á", letter_rom: ["A"], letter_ipa: "/ɑ̤ˤ/", letter_glyph: "\uE01c\uE028", letter_discord: ":a_:<:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.75, "xoffset": -20},
    sound: soundPath+"6-5.mp3"
  }),
  new Character({ // 41
    name: 'ó´',  name_ipa: "/o̤ˤʔ/",
    letter: "ó", letter_rom: ["O"], letter_ipa: "/o̤ˤ/", letter_glyph: "\uE01d\uE028", letter_discord: "<:o_:1395014600868495360><:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.55, "xoffset": -45},
    sound: soundPath+"7-0.mp3"
  }),
// row 7
  new Character({ // 42
    name: 'ú´',  name_ipa: "/ṳˤʔ/",
    letter: "ú", letter_rom: ["U"], letter_ipa: "/ṳˤ/", letter_glyph: "\uE01e\uE028", letter_discord: "<:u_:1395014366511763506><:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.70, "xoffset": -15},
    sound: soundPath+"7-1.mp3"
  }),
  new Character({ // 43
    name: 'â´',  name_ipa: "/ɑ̤ˤːʔ/",
    letter: "â", letter_rom: ["AA"], letter_ipa: "/ɑ̤ˤː/", letter_glyph: "\uE021\uE028", letter_discord: "<:aa:1395015126322512033><:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.75, "xoffset": -20},
    sound: soundPath+"7-2.mp3"
  }),
  new Character({ // 44
    name: 'ô´',  name_ipa: "/o̤ˤːʔ/",
    letter: "ô", letter_rom: ["OO"], letter_ipa: "/o̤ˤː/", letter_glyph: "\uE022\uE028", letter_discord: "<:oo:1395014573010190427><:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.75, "xoffset": -20},
    sound: soundPath+"7-3.mp3"
  }),
  new Character({ // 45
    name: 'û´',  name_ipa: "/ṳˤːʔ/",
    letter: "û", letter_rom: ["UU"], letter_ipa: "/ṳˤː/", letter_glyph: "\uE023\uE028", letter_discord: "<:uu:1395014349130563735><:_pyr:1395015152100708445>",
    text: mainText + " " + pyricVowelText,
    prop: [REG.VOWEL, REG.PYRIC],
    table_prop: {"size": 0.60, "xoffset": -40},
    sound: soundPath+"7-4.mp3"
  }),
  new Character({ // 46
    name: 'q̇em',  name_ipa: "/ʡem/",
    letter: "", letter_rom: [""], letter_ipa: "", letter_glyph: "\uE029", letter_discord: "<:Qem:1395015230228136056>",
    text: `pronounced {name_ipa}, unlike most of the other symbols, this one doesn't have a direct translation to a romanized way of writing. \n
    In draconic the symbol has three different uses, it can be used as a rough equivelent of a hyphen, which means it can be optionally used to connect compounds or conjoin propositions to their nouns.\n
    It can also stand in for the number 0, or proceed a string of letters to indicate that they are numbers.\n
    In shorthand writing, it can also stand in for the word q̇e that means 'none'`,
    prop: [REG.DIFFERENT],
    table_prop: {"size": 0.75, "yoffset": -20},
  }),
  new Character({ // 47
    name: 'seleŋ',  name_ipa: "/s̠el̪eŋ/",
    letter: "", letter_rom: [""], letter_ipa: "", letter_glyph: "\uE02a", letter_discord: ":seleng:",
    text: `pronounced {name_ipa}, unlike most of the other symbols, this one doesn't have a direct translation to a romanized way of writing. \n
    It can however be used as a rough equivalent of a quotation mark or an asterisk. It can optionally be used to mark parentheticals, quotes, proper nouns, or even just for emphasis. \n
    Though it is seldom used in formal writing.`,
    prop: [REG.DIFFERENT],
    table_prop: {"size": 0.75, "yoffset": 15},
  }),
  //row 8
  new Character({ // 48
    name: 'q̇ħóll',  name_ipa: "/ʡho̤ˤɬ/",
    letter: "", letter_rom: [""], letter_ipa: "", letter_glyph: "\uE028", letter_discord: "<:_pyr:1395015152100708445>",
    text: "{name} pronounced {name_ipa} is the symbol representing pyrification it does not do anything in and of its own. It however changes vowels to pyric vowels when placed after one. Pyric letters pronounced are by dragons breathing out fire, humans can use a ligher or stick to alternative sound (see allophones).",
    prop: [REG.SHEET_IGNORE],
    table_prop: {"size": 0.85, "yoffset": -7},
    allophones: {
      'a pronounced /ɑ/': 'á pronounced /ɑ̤ˤ/',
      'o pronounced /o/': 'ó pronounced /o̤ˤ/',
      'u pronounced /u/': 'ú pronounced /ṳˤ/',
      'ā pronounced /ɑː/': 'â pronounced /ɑ̤ˤː/',
      'ō pronounced /oː/': 'ô pronounced /o̤ˤː/',
      'ū pronounced /uː/': 'û pronounced /ṳˁː/'
    },
    sound: soundPath+"6-4.mp3"
  }),
  new Character({ // 49
    name: ' ',  name_ipa: "",
    letter: " ", letter_rom: [" "], letter_ipa: "", letter_glyph: " ", letter_discord: "   ",
    text: "SPACEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEEE",
    prop: [REG.SHEET_IGNORE],
  })
];

function description(entry){
  if(!entry.text) return '';
  return entry.text
    .replaceAll('{name}', entry.name||'')
    .replaceAll('{name_ipa}', entry.name_ipa||'')
    .replaceAll('{letter_rom}', entry.letter_rom?.join('" or a "')||'')
    .replaceAll('{letter_ipa}', entry.letter_ipa||'')
    .replaceAll('{letter}', entry.letter||'');
}

CHARACTERS.forEach((e) => {e.description = description(e);})


function get_random_entry(vowels = true, consonants = true, pyric_vowels = true, pyric_consonants = true) {
  const pool = [];

  for (const e of CHARACTERS) {
    if (!e.name) continue;

    if (e.prop.includes(REG.CONSONANT) && consonants) pool.push(e);
    if (e.prop.includes(REG.PYRIC) && pyric_consonants) pool.push(e);
    if (e.prop.includes(REG.VOWEL) && vowels) pool.push(e);
    if (e.prop.includes(REG.VOWEL) && pyric_vowels && e.prop.includes(REG.PYRIC)) pool.push(e);
  }

  if (!pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

function entries_from_field(text, fieldNames, filter_brackets = false) {
  const result = [];
  let i = 0;

  while (i < text.length) {
    let best = null;
    let bestValLen = -1;
    let bestAdvance = 0;
    let bestIsParenthesized = false;

    for (const e of CHARACTERS) {
      for (const field of fieldNames) {
        const values = Array.isArray(e[field]) ? e[field] : [e[field]];
        for (const val of values) {
          if (!val) continue;

          const valLen = val.length;
          
          const plainSlice = text.slice(i, i + valLen);
          if (plainSlice === val) {
            const advance = valLen;
            if (valLen > bestValLen || (valLen === bestValLen && advance > bestAdvance)) {
              const match = { ...e };
              match._advance = advance;
              match._isParenthesized = false;
              best = match;
              bestValLen = valLen;
              bestAdvance = advance;
              bestIsParenthesized = false;
            }
          }

          if (i < text.length - valLen - 1 && text[i] === '(') {
            const parenSlice = text.slice(i, i + valLen + 2);
            if (parenSlice[parenSlice.length - 1] === ')' && 
                parenSlice.slice(1, 1 + valLen) === val) {
              
              const advance = valLen + 2;
              const match = { ...e };
              match.prop = [...(match.prop || []), REG.OPTIONAL];
              match._advance = advance;
              match._isParenthesized = true;
              
              const isBetter = valLen > bestValLen || 
                             (valLen === bestValLen && advance > bestAdvance) ||
                             (valLen === bestValLen && bestIsParenthesized === false);
              
              if (isBetter) {
                best = match;
                bestValLen = valLen;
                bestAdvance = advance;
                bestIsParenthesized = true;
              }
            }
          }
        }
      }
    }

    if (best) {
      const advance = best._advance;
      delete best._advance;
      
      if (filter_brackets && best._isParenthesized) {
        delete best._isParenthesized;
        result.push(best);
      } else {
        delete best._isParenthesized;
        result.push(best);
      } // tff???????
      
      i += advance;
    } else {
      i++;
    }
  }

  return result;
}

function any_text_to_entries(text) {
  return entries_from_field(text, ["letter", "letter_rom", "letter_discord", "letter_glyph"]);
}

function text_to_entries(text) {
  return entries_from_field(text, ["letter", "letter_rom"]);
}

function discord_to_entries(text) {
  return entries_from_field(text, ["letter_discord"]);
}

function glyphs_to_entries(text) {
  return entries_from_field(text, ["letter_glyph"]);
}

function entries_to_glyphs(entries, ignore_optional = false) {
  return entries
    .filter(e => !(ignore_optional && e.prop?.includes(REG.OPTIONAL)))
    .map(e => e.letter_glyph || "")
    .join("");
}

function entries_to_rom(entries, ignore_optional = false) {
  return entries
    .filter(e => !(ignore_optional && e.prop?.includes(REG.OPTIONAL)))
    .map(e => e.letter_rom || "")
    .join("");
}

function entries_to_text(entries, ignore_optional = false) {
  return entries
    .filter(e => !(ignore_optional && e.prop?.includes(REG.OPTIONAL)))
    .map(e => e.letter || "")
    .join("");
}

function entries_to_discord(entries, ignore_optional = false) {
  return entries
    .filter(e => !(ignore_optional && e.prop?.includes(REG.OPTIONAL)))
    .map(e => e.letter_discord || "")
    .join("");
}
// TODO: REDO

function get_entry_by_id(id) {
  return CHARACTERS[id] || null;
}

function get_entry_by_field(text, field, arrayField = false) {
  let match = null;
  let matchLength = 0;

  for (const e of CHARACTERS) {
    const values = arrayField ? e[field] || [] : [e[field]];
    for (const val of values) {
      if (!val) continue;
      if (text.startsWith(val) && val.length > matchLength) {
        match = e;
        matchLength = val.length;
      }
    }
  }

  return match;
}

function get_entry_by_letter(text) {
  return get_entry_by_field(text, "letter");
}

function get_entry_by_rom(text) {
  return get_entry_by_field(text, "letter_rom", true);
}

function get_entry_by_glyph(text) {
  return get_entry_by_field(text, "letter_glyph");
}

function get_entry_by_discord(text) {
  return get_entry_by_field(text, "letter_discord");
}

function get_pyric_equivalent(entry) {
    if (!entry || !entry.prop.includes(REG.VOWEL)) return null;
    return CHARACTERS.find(e =>
        e.prop.includes(REG.VOWEL) &&
        e.prop.includes(REG.PYRIC) &&
        e.letter_rom.some(l => l.toLowerCase() === entry.letter_rom[0].toLowerCase())
    ) || null;
}

const DIGITS = ["q̇em","χu","eχ","fo","se","aq","qah","hog","xēχ","χyz","ez","fyz","selz","agz","qaz","hyz"]; // 0-15
const DIGITS_SUFFIXES = ["","u","eχ","o","ys","aq","ga","yg"];
const DIGITS_MULTIPLES = {16:"sē",24:"fōrz",32:"sēlz",40:"qāz",48:"qōz",56:"hōz",64:"lān"};
const DIGITS_POWERS = {512: "lāran", 4_096: "xeglārn", 32_768: "táħû", 262_144: "torħû"};

function numberToDraconic(n) {
    if (n === 0) return DIGITS[0];
    
    let parts = [];
    let remaining = n;
    
    const powers = [262_144, 32_768, 4_096, 512];
    for (let power of powers) {
        if (remaining >= power) {
            let count = Math.floor(remaining / power);
            remaining = remaining % power;
            
            if (count === 1) {
                parts.push(DIGITS_POWERS[power]);
            } else {
                let countStr = numberToDraconic(count);
                parts.push(countStr + " " + DIGITS_POWERS[power]);
            }
        }
    }
    
    const multiples = [64, 56, 48, 40, 32, 24, 16];
    
    for (let mult of multiples) {
        if (remaining >= mult) {
            let count = Math.floor(remaining / mult);
            remaining = remaining % mult;
            
            if (count === 1) {
                parts.push(DIGITS_MULTIPLES[mult]);
            } else {
                let countStr = numberToDraconic(count);
                parts.push(countStr + " " + DIGITS_MULTIPLES[mult]);
            }
        }
    }
    
    if (remaining > 0 && remaining <= 15) {
        if (parts.length > 0 && remaining <= 7) {
            parts[parts.length - 1] += DIGITS_SUFFIXES[remaining];
        } else {
            parts.push(DIGITS[remaining]);
        }
    }
    
    return parts.join(" si ");
}


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const commands = [
  new SlashCommandBuilder()
    .setName('transcribe')
    .setDescription('Transcribe text to Draconic')
    .addStringOption(option =>
      option
        .setName('text')
        .setDescription('Text to transcribe')
        .setRequired(true)
    ),
  
  new SlashCommandBuilder()
    .setName('number')
    .setDescription('Convert number to Draconic')
    .addIntegerOption(option =>
      option
        .setName('number')
        .setDescription('Number to convert')
        .setRequired(true)
    ),
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands },
    );

  } catch (error) {
    console.error('Startup Err:', error);
  }
})();

client.once('ready', () => {
  console.log(`${client.user.tag} started`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName } = interaction;

try {
  if (commandName === 'transcribe') {
    await interaction.reply(`> ${entries_to_discord(any_text_to_entries(text))}`);
  }

  else if (commandName === 'number') {
    const ping = client.ws.ping;
    await interaction.reply(`> ${number}: ${numberToDraconic(number)}`);
  }
} catch (error) {
  console.error('Err:', error);
  await interaction.reply({ content: `Err ${error}`, ephemeral: true });
}
});

client.on('error', error => {
  console.error('Discord Err:', error);
});

process.on('unhandledRejection', error => {
  console.error('Err:', error);
});

client.login(process.env.DISCORD_TOKEN);