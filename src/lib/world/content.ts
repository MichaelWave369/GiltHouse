import type { ChoiceDef, ItemDef, NodeDef, SceneId } from "./types.ts";

export const VIEW_W = 320;
export const VIEW_H = 180;
export const PLAYER_HALF = 7;
export const TALK_R = 36;
export const HOT_R = 28;
export const DOOR_R = 30;

export type Theme =
  | "street"
  | "gate"
  | "diner"
  | "velvet"
  | "gilt"
  | "records"
  | "arcade"
  | "books"
  | "pawn"
  | "comet"
  | "lastcall"
  | "starlight"
  | "mirage";

export type Facade = {
  id: string;
  theme: Theme;
  x: number;
  w: number;
  door: number;
  name: string;
  neon: string;
  label: string;
};

export const FACADES: Facade[] = [
  { id: "west", theme: "gate", x: 0, w: 200, door: 100, name: "WEST", neon: "#e6c36a", label: "West Gate" },
  { id: "diner", theme: "diner", x: 200, w: 380, door: 190, name: "MIDNIGHT", neon: "#ff5a7a", label: "Midnight Diner" },
  { id: "velvet", theme: "velvet", x: 580, w: 340, door: 170, name: "VELVET", neon: "#e6c36a", label: "Velvet Vintage" },
  { id: "gilt", theme: "gilt", x: 920, w: 640, door: 320, name: "GILT HOUSE", neon: "#f0d78c", label: "Gilt House" },
  { id: "records", theme: "records", x: 1560, w: 320, door: 160, name: "CELLAR", neon: "#3ec6c6", label: "Record Cellar" },
  { id: "arcade", theme: "arcade", x: 1880, w: 360, door: 180, name: "ANNEX", neon: "#ff4fd8", label: "Arcade Annex" },
  { id: "books", theme: "books", x: 2240, w: 300, door: 150, name: "PAPERBACK", neon: "#f0c27a", label: "Paperback Palace" },
  { id: "pawn", theme: "pawn", x: 2540, w: 280, door: 140, name: "2ND CHANCE", neon: "#d9d3c7", label: "Second Chance Pawn" },
  { id: "comet", theme: "comet", x: 2820, w: 300, door: 150, name: "COMET", neon: "#ffb020", label: "Copper Comet" },
  { id: "last", theme: "lastcall", x: 3120, w: 280, door: 140, name: "LAST CALL", neon: "#b388ff", label: "The Last Call" },
  { id: "star", theme: "starlight", x: 3400, w: 360, door: 180, name: "STARLIGHT", neon: "#f4ead2", label: "Starlight Palace" },
  { id: "mirage", theme: "mirage", x: 3760, w: 480, door: 240, name: "MIRAGE", neon: "#7fd1c7", label: "Grand Mirage" },
  { id: "east", theme: "gate", x: 4240, w: 200, door: 100, name: "EAST", neon: "#e6c36a", label: "East Gate" },
];

export const WORLD_W = 4440;

const ENTER: Record<string, SceneId> = {
  diner: "diner",
  velvet: "velvet",
  gilt: "gilt-lobby",
  records: "records",
  arcade: "arcade",
  books: "books",
  pawn: "pawn",
  comet: "comet",
  last: "last-call",
  star: "starlight",
  mirage: "mirage",
};

export function doorX(facadeId: string): number {
  const facade = FACADES.find((row) => row.id === facadeId);
  if (!facade) return 120;
  return facade.x + facade.door;
}

export type Portal = {
  id: string;
  scene: SceneId;
  x: number;
  label: string;
  to?: SceneId;
  spawnX?: number;
  casino?: "floor" | "training" | "workshop" | "sports" | "agents";
};

const streetDoors: Portal[] = Object.entries(ENTER).map(([facadeId, scene]) => ({
  id: `door-${facadeId}`,
  scene: "neon-block",
  x: doorX(facadeId),
  label: FACADES.find((row) => row.id === facadeId)?.label ?? "Door",
  to: scene,
  spawnX: 64,
}));

const exits: Portal[] = Object.entries(ENTER).map(([facadeId, scene]) => ({
  id: `exit-${scene}`,
  scene,
  x: 28,
  label: "To the sidewalk",
  to: "neon-block",
  spawnX: doorX(facadeId),
}));

const lobbyDoors: Portal[] = [
  { id: "lobby-floor", scene: "gilt-lobby", x: 230, label: "Gaming floor", casino: "floor" },
  { id: "lobby-pit", scene: "gilt-lobby", x: 400, label: "The Pit", casino: "workshop" },
  { id: "lobby-lab", scene: "gilt-lobby", x: 460, label: "Training Lab", casino: "training" },
];

export const PORTALS: Portal[] = [...streetDoors, ...exits, ...lobbyDoors];

export type Hotspot = {
  id: string;
  scene: SceneId;
  x: number;
  label: string;
  kind: "sign" | "radio" | "arcade" | "inspect" | "gate";
  game?: "pulse" | "memory";
  line?: string;
};

export const HOTSPOTS: Hotspot[] = [
  { id: "sign:diner", scene: "neon-block", x: doorX("diner") - 100, label: "Diner marquee", kind: "sign" },
  { id: "sign:gilt", scene: "neon-block", x: doorX("gilt") - 110, label: "Gilt House marquee", kind: "sign" },
  { id: "sign:mirage", scene: "neon-block", x: doorX("mirage") - 110, label: "Mirage marquee", kind: "sign" },
  { id: "gate:west", scene: "neon-block", x: 90, label: "West gate", kind: "gate", line: "The west gate only opens onto the block. Tonight, that is the whole map." },
  { id: "gate:east", scene: "neon-block", x: 4340, label: "East gate", kind: "gate", line: "Past the east gate the bulbs stop. The story, rudely, does not." },
  { id: "booth", scene: "diner", x: 110, label: "Red booth", kind: "inspect", line: "The vinyl is split in the shape of a coffee ring. Someone loved this seat." },
  { id: "mirror", scene: "velvet", x: 120, label: "Tall mirror", kind: "inspect", line: "The mirror is honest and a little flattering, which is the house style." },
  { id: "plaque", scene: "gilt-lobby", x: 96, label: "House plaque", kind: "inspect", line: "Play chips stay in the building. They are not cash, not credit, and not a score for becoming smarter." },
  { id: "radio", scene: "records", x: 108, label: "Cellar radio", kind: "radio" },
  { id: "bin", scene: "records", x: 150, label: "Jazz bin", kind: "inspect", line: "Hand-lettered dividers. No chart you have heard of. Harvey's handwriting judges you." },
  { id: "pulse", scene: "arcade", x: 96, label: "Pulse Line", kind: "arcade", game: "pulse" },
  { id: "memory", scene: "arcade", x: 146, label: "Marquee Memory", kind: "arcade", game: "memory" },
  { id: "stacks", scene: "books", x: 120, label: "Leaning stacks", kind: "inspect", line: "A pamphlet titled Systems That Feel True and Aren't. The margin notes are kinder than the title." },
  { id: "case", scene: "pawn", x: 116, label: "Glass case", kind: "inspect", line: "Watches, a glass eye, and a bulb that still thinks it is a sign." },
  { id: "pinball", scene: "comet", x: 116, label: "Dark pinball", kind: "inspect", line: "The playfield is a tiny district. The tilt bob is labeled PLEASE." },
  { id: "stage", scene: "starlight", x: 120, label: "Empty stage", kind: "inspect", line: "One microphone, still warm. The band is on a break that began in 1978 and might end tonight." },
  { id: "book", scene: "mirage", x: 120, label: "Guest book", kind: "inspect", line: "Most names are guests. One line, older, just says STILL OPEN." },
];

export const SIGN_IDS = ["sign:diner", "sign:gilt", "sign:mirage"] as const;

export type LocationDef = {
  id: SceneId;
  name: string;
  theme: Theme;
  width: number;
  shop: string[];
  keeper?: string;
};

export const LOCATIONS: Record<SceneId, LocationDef> = {
  "neon-block": { id: "neon-block", name: "The Neon Block", theme: "street", width: WORLD_W, shop: ["sticker"], keeper: "stan" },
  diner: { id: "diner", name: "Midnight Diner", theme: "diner", width: 320, shop: ["coffee", "pancakes", "burger", "milkshake", "midnight-special", "giant-platter"], keeper: "dottie" },
  velvet: { id: "velvet", name: "Velvet Vintage", theme: "velvet", width: 320, shop: ["leather-jacket", "champagne-blazer", "teal-shell", "night-shades", "room-hat", "ruby-ear", "evening-dress", "two-tone-shoes"], keeper: "sable" },
  "gilt-lobby": { id: "gilt-lobby", name: "Gilt House", theme: "gilt", width: 520, shop: [], keeper: "ace" },
  records: { id: "records", name: "Record Cellar", theme: "records", width: 320, shop: ["alley-brass", "static-hour", "comet-wax", "griddle-jazz"], keeper: "harvey" },
  arcade: { id: "arcade", name: "Arcade Annex", theme: "arcade", width: 320, shop: [], keeper: "switch" },
  books: { id: "books", name: "Paperback Palace", theme: "books", width: 320, shop: ["house-edge", "cipher-notes", "bad-systems"], keeper: "luckless" },
  pawn: { id: "pawn", name: "Second Chance Pawn", theme: "pawn", width: 320, shop: ["neon-bulb", "lucky-tooth"], keeper: "cleo" },
  comet: { id: "comet", name: "Copper Comet", theme: "comet", width: 320, shop: [], keeper: "pip" },
  "last-call": { id: "last-call", name: "The Last Call", theme: "lastcall", width: 320, shop: ["night-soda"], keeper: "moth" },
  starlight: { id: "starlight", name: "Starlight Palace", theme: "starlight", width: 320, shop: [], keeper: "vinny" },
  mirage: { id: "mirage", name: "Grand Mirage", theme: "mirage", width: 320, shop: [], keeper: "ivo" },
};

export const ITEMS: Record<string, ItemDef> = {
  coffee: { id: "coffee", name: "Counter Coffee", price: 8, kind: "food", blurb: "Bitter, honest, and hot enough to restart a walk.", use: { energy: 22, note: "The coffee lands like a small sunrise." } },
  pancakes: { id: "pancakes", name: "Stack at 2 A.M.", price: 14, kind: "food", blurb: "Three pancakes, too much butter, no apology.", use: { energy: 32, note: "You feel like a person with plans again." } },
  burger: { id: "burger", name: "Block Burger", price: 12, kind: "food", blurb: "Diner onion, melted cheddar, a pickle with opinions.", use: { energy: 26, note: "Solid food. The sidewalk looks shorter." } },
  milkshake: { id: "milkshake", name: "Pink Milkshake", price: 11, kind: "food", blurb: "Strawberry, extra thick, served with a raised eyebrow.", use: { energy: 16, charm: 1, note: "You are slightly more charming and much colder." } },
  "midnight-special": { id: "midnight-special", name: "Midnight Special", price: 20, kind: "food", blurb: "Dottie's off-menu plate. She will not write down the recipe.", use: { energy: 40, note: "Whatever was in that, it worked." } },
  "giant-platter": { id: "giant-platter", name: "Giant Breakfast Platter", price: 26, kind: "food", blurb: "Eggs, hash, toast, and a dare.", use: { energy: 52, note: "You could walk to the east gate and back." } },
  "night-soda": { id: "night-soda", name: "Night Soda", price: 7, kind: "food", blurb: "Lime, bitters, no lecture. Moth slides it like a secret.", use: { energy: 14, note: "The bubbles sound a little like a marquee." } },
  "leather-jacket": { id: "leather-jacket", name: "Alley Leather", price: 36, kind: "wear", unique: true, blurb: "Broken in by somebody who knew the side streets.", equip: { slot: "jacket", value: "leather" } },
  "champagne-blazer": { id: "champagne-blazer", name: "Champagne Blazer", price: 48, kind: "wear", unique: true, blurb: "Gold thread, quiet shoulders, lobby-ready.", equip: { slot: "jacket", value: "champagne" } },
  "teal-shell": { id: "teal-shell", name: "Teal Shell", price: 32, kind: "wear", unique: true, blurb: "A windbreaker the color of a motel pool at night.", equip: { slot: "jacket", value: "teal" } },
  "night-shades": { id: "night-shades", name: "Night Shades", price: 14, kind: "wear", unique: true, blurb: "You can still see the signs. The signs cannot see you flinch.", equip: { slot: "accessory", value: "shades" } },
  "room-hat": { id: "room-hat", name: "Room Hat", price: 18, kind: "wear", unique: true, blurb: "A short brim for people who arrive after the headliner.", equip: { slot: "accessory", value: "hat" } },
  "ruby-ear": { id: "ruby-ear", name: "Ruby Ear", price: 16, kind: "wear", unique: true, blurb: "One earring. It catches neon like it was hired to.", equip: { slot: "accessory", value: "earring" } },
  "evening-dress": { id: "evening-dress", name: "Evening Column", price: 42, kind: "wear", unique: true, blurb: "A dark column of a dress. The sidewalk makes room.", equip: { slot: "outfit", value: "dress" } },
  "two-tone-shoes": { id: "two-tone-shoes", name: "Two-Tone Shoes", price: 20, kind: "wear", unique: true, blurb: "Spectator shoes. They know the tempo.", equip: { slot: "shoes", value: "two-tone" } },
  "alley-brass": { id: "alley-brass", name: "Alley Brass", price: 18, kind: "record", unique: true, blurb: "Original pressing, fictional band, real mood. A walking jazz loop.", jukebox: "alley" },
  "static-hour": { id: "static-hour", name: "Static Hour", price: 18, kind: "record", unique: true, blurb: "Ruby swears this one was recorded under a live antenna.", jukebox: "static" },
  "comet-wax": { id: "comet-wax", name: "Comet Pin", price: 16, kind: "record", unique: true, blurb: "Fast drums and a copper-bright hook for the arcade stretch.", jukebox: "comet" },
  "griddle-jazz": { id: "griddle-jazz", name: "Griddle Jazz", price: 16, kind: "record", unique: true, blurb: "A breakfast combo that learned to swing. Dottie wants it back on the shelf by the pass.", jukebox: "griddle" },
  "house-edge": { id: "house-edge", name: "The House Edge", price: 15, kind: "book", unique: true, blurb: "A short book on why a fair-feeling game can still be tilted.", use: { knowledge: 1, flag: "book:edge", note: "The edge is a price, not a curse. You can see it and still play for fun." } },
  "cipher-notes": { id: "cipher-notes", name: "Cipher Notes", price: 12, kind: "book", unique: true, blurb: "Margin math about repeating signals. Not magic. Pattern.", use: { knowledge: 1, flag: "book:cipher", note: "Threes and nines can be a code, a habit, or a maintenance schedule." } },
  "bad-systems": { id: "bad-systems", name: "Bad Systems", price: 12, kind: "book", unique: true, blurb: "Martingales, hot numbers, and other stories the wheel does not read.", use: { knowledge: 1, flag: "book:systems", note: "A system that needs a bigger bet after a loss is a story about your purse, not the odds." } },
  "neon-bulb": { id: "neon-bulb", name: "Spare Neon Bulb", price: 9, kind: "souvenir", unique: true, blurb: "Still good. Switch can seat it. It will not change a game." },
  "lucky-tooth": { id: "lucky-tooth", name: "Lucky Tooth", price: 6, kind: "souvenir", unique: true, blurb: "Lou says it won a fortune. The fortune has not checked in." },
  sticker: { id: "sticker", name: "Honest Sticker", price: 1, kind: "souvenir", unique: true, blurb: "It says I KNOW. It does not say what. Stan is, unfortunately, sincere." },
  locket: { id: "locket", name: "Chrome Locket", price: 0, kind: "key", unique: true, blurb: "Cleo's locket. It opens onto a tiny photo of a roof antenna." },
  photo: { id: "photo", name: "Lost Photograph", price: 0, kind: "key", unique: true, blurb: "A tourist's picture of a marquee, mid-flicker." },
  "gilt-pin": { id: "gilt-pin", name: "Still-Open Pin", price: 0, kind: "wear", unique: true, blurb: "A small pin from the night desk. It means the door was meant to be found.", equip: { slot: "pin", value: true } },
};

export type QuestDef = {
  title: string;
  steps: string[];
  done: string;
};

export const QUESTS: Record<string, QuestDef> = {
  "q-welcome": {
    title: "Arrival",
    steps: ["Speak to Kit Marquee under the west gate."],
    done: "Kit sent you toward the signs that will not sit still.",
  },
  "q-flicker": {
    title: "Three Stutters",
    steps: ["Read the marquees at the diner, Gilt House, and the Grand Mirage."],
    done: "Three signs. The same stutter: three, six, nine.",
  },
  "q-frequency": {
    title: "Low Band",
    steps: ["Talk to Ruby Static.", "Listen to the radio in the Record Cellar."],
    done: "The cellar radio is counting with the signs.",
  },
  "q-signal": {
    title: "The Midnight Signal",
    steps: [
      "Tell Switch what the radio counted.",
      "Ask Professor Luckless what the count is for.",
      "Ask the Night Clerk what the roof remembers.",
    ],
    done: "The signal is a beacon the block's builder left so night people could find the doors that were still open.",
  },
  "q-griddle": {
    title: "Griddle Jazz",
    steps: ["Buy Griddle Jazz from Harvey Wax.", "Bring it back to Dottie Midnight."],
    done: "The diner has its song back. So do you, if you kept a copy in your head.",
  },
  "q-lou": {
    title: "Almost a System",
    steps: ["Hear Lucky Lou out, then decide what a wheel can remember."],
    done: "You left Lou's system on the sidewalk, where it cannot spend anything.",
  },
  "q-locket": {
    title: "Chrome Locket",
    steps: ["Show Cleo's locket to the Night Clerk."],
    done: "The locket belonged to the builder. The clerk kept the pin she used to wear.",
  },
  "q-photo": {
    title: "Lost Frame",
    steps: ["Return the tourist's photograph to the Grand Mirage desk."],
    done: "The picture is back with the desk. The tourist can collect both.",
  },
};

export type ActorDef = {
  id: string;
  name: string;
  title: string;
  scene: SceneId;
  x: number;
  wander?: number;
  body: string;
  hair: string;
  hat?: boolean;
  root: string;
  nodes: Record<string, NodeDef>;
};

const leave = (text = "Step back."): ChoiceDef => ({ id: "leave", text });

function nodes(map: Record<string, NodeDef>): Record<string, NodeDef> {
  return map;
}

export const NPCS: ActorDef[] = [
  {
    id: "kit",
    name: "Kit Marquee",
    title: "Sign walker",
    scene: "neon-block",
    x: 150,
    body: "#8c2436",
    hair: "#1a120e",
    root: "root",
    nodes: nodes({
      root: {
        text: "You showed up between flickers. Most people wait for a sign that stays lit. The block doesn't work like that.",
        choices: [
          {
            id: "job",
            text: "The lights are wrong.",
            next: "sent",
            quest: "q-welcome",
            effects: [
              { op: "quest", id: "q-welcome", status: "complete", step: 1 },
              { op: "quest", id: "q-flicker", status: "active", step: 0 },
              { op: "tokens", n: 15 },
              { op: "flag", key: "kit:met", value: true },
              { op: "rep", faction: "block", n: 1 },
            ],
          },
          { id: "about", text: "What is this place?", next: "about" },
          leave("Keep walking."),
        ],
      },
      about: {
        text: "The Neon Block. Diner, vintage, a cellar of records, an arcade that tells the truth, and Gilt House — play chips only. Street tokens buy breakfast and jackets. They do not buy the chips, and the chips do not buy anything out here.",
        choices: [{ id: "back", text: "Good to know.", next: "root" }, leave()],
      },
      sent: {
        text: "Then count them. Diner, Gilt House, the Mirage. Same stutter, if you're patient. Fifteen tokens for the walk. Dottie will pretend she doesn't run a tab.",
        choices: [leave("I'll count.")],
      },
    }),
  },
  {
    id: "ford",
    name: "Ford Ives",
    title: "Cabbie",
    scene: "neon-block",
    x: 72,
    body: "#3d4a55",
    hair: "#c8c2b4",
    hat: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "Meter's off. I'm only here because the east gate looks like a place a fare would invent. You walking, or you haunting?",
        choices: [
          { id: "walk", text: "Walking.", next: "walk" },
          leave(),
        ],
      },
      walk: {
        text: "Then stay on the sidewalk. The cars are decoration with bad intentions. If a man named Lou sells you a sure thing, the sure thing is that he is lonely.",
        choices: [leave("Noted.")],
      },
    }),
  },
  {
    id: "couple",
    name: "Nia and Sol",
    title: "Out too late",
    scene: "neon-block",
    x: 500,
    body: "#6b3a78",
    hair: "#f0d59a",
    root: "root",
    nodes: nodes({
      root: {
        text: "Nia: We got married at the diner because the chapel was closed. Sol: The pancakes witnessed it. We're still deciding if that counts.",
        choices: [
          { id: "counts", text: "It counts.", next: "yes" },
          leave("Congratulations either way."),
        ],
      },
      yes: {
        text: "Sol: Hear that? A stranger on a sidewalk just married us harder. Nia: Go eat something. You look like the night is winning.",
        choices: [leave("I might.")],
      },
    }),
  },
  {
    id: "gus",
    name: "Gus Bell",
    title: "Doorman",
    scene: "neon-block",
    x: doorX("gilt") + 72,
    body: "#2a2118",
    hair: "#d8d2c6",
    hat: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "Gilt House is open. Shoes on. Systems off the doorstep. The chips inside are toys with rules. They do not cash, travel, or turn into anything a bank would recognize.",
        choices: [
          { id: "inside", text: "What's through the door?", next: "inside" },
          leave("Evening, Gus."),
        ],
      },
      inside: {
        text: "A lobby, then the floor you already know if you've been here before: shoe, wheel, rail, salon, draw, reels, cage, wire, the Pit, the Lab, the agents. Leave whenever you like. The sidewalk keeps your place.",
        choices: [leave("I'll see it from the lobby.")],
      },
    }),
  },
  {
    id: "ruby",
    name: "Ruby Static",
    title: "Night DJ",
    scene: "neon-block",
    x: doorX("records") - 80,
    body: "#143f3f",
    hair: "#ff4fd8",
    root: "root",
    nodes: nodes({
      root: {
        text: "You're hearing it too, or you're about to pretend you are. The band under the music is not a song. It's a count. I won't say it for you. Counts are personal.",
        choices: [
          {
            id: "heard",
            text: "The signs are stuttering in a pattern.",
            next: "heard",
            quest: "q-frequency",
            questStep: 0,
            effects: [
              { op: "flag", key: "ruby:heard", value: true },
              { op: "quest", id: "q-frequency", status: "active", step: 1 },
            ],
          },
          { id: "who", text: "Who are you broadcasting to?", next: "who" },
          leave(),
        ],
      },
      heard: {
        text: "Good. Then go bother Harvey's radio. It should be dead and it isn't. If it counts three, six, nine, don't applaud. Take it to Switch. He speaks electricity without making it romantic.",
        choices: [leave("The cellar, then.")],
      },
      who: {
        text: "Night shift. Cooks, clerks, repair techs, anyone still kind at two. A retired builder asked me to leave the low band on. I get a free booth at the diner. The deal remains excellent.",
        choices: [leave("That's a good deal.")],
      },
    }),
  },
  {
    id: "lou",
    name: "Lucky Lou",
    title: "Cheerful disaster",
    scene: "neon-block",
    x: 1480,
    wander: 64,
    body: "#c4552a",
    hair: "#1b1b1b",
    root: "root",
    nodes: nodes({
      root: {
        text: "Friend. Pal. Future legend. I have a roulette system so clean it should be illegal, which is how you know it's art. No chips required to hear it. I only need your attention, which is already a loss.",
        choices: [
          {
            id: "hear",
            text: "All right. Say it.",
            next: "pitch",
            absentFlag: "lou:done",
            effects: [{ op: "quest", id: "q-lou", status: "active", step: 0 }],
          },
          { id: "no", text: "Not today, Lou.", next: "shrug" },
          leave(),
        ],
      },
      pitch: {
        text: "You wait for red. When black hits, you bet red again, double. Eventually red arrives and you are rich, spiritually. I have explained this to seventeen people. Three of them hugged me. None of them were richer.",
        choices: [
          {
            id: "reject",
            text: "The wheel doesn't remember the last spin.",
            next: "good",
            effects: [
              { op: "quest", id: "q-lou", status: "complete", step: 1 },
              { op: "flag", key: "lou:done", value: true },
              { op: "knowledge", n: 1 },
              { op: "tokens", n: 6 },
              { op: "rep", faction: "block", n: 1 },
            ],
          },
          {
            id: "book",
            text: "That's a martingale. The book warned me.",
            next: "good",
            requireFlag: "book:systems",
            effects: [
              { op: "quest", id: "q-lou", status: "complete", step: 1 },
              { op: "flag", key: "lou:done", value: true },
              { op: "knowledge", n: 1 },
              { op: "tokens", n: 8 },
              { op: "charm", n: 1 },
            ],
          },
          { id: "nod", text: "Maybe I'll try it sometime.", next: "nod" },
        ],
      },
      good: {
        text: "Lou blinks, then grins like you took his wallet and replaced it with a better story. 'Keep the tokens. I found them in a planter. They are not from the wheel. The wheel and I are not speaking.'",
        choices: [leave("Spend them on food.")],
      },
      nod: {
        text: "He lights up. Nothing in your pockets moves. No chip is bet. The wheel, somewhere inside, remains magnificently indifferent. You can still walk away smarter.",
        choices: [
          { id: "back", text: "Wait. Say it again.", next: "pitch" },
          leave("I'm done listening."),
        ],
      },
      shrug: {
        text: "Your loss, which is also, historically, my whole personality. The diner is still the best bet on the block and it is not a bet.",
        choices: [leave()],
      },
    }),
  },
  {
    id: "marlowe",
    name: "Marlowe Vetch",
    title: "Tired investigator",
    scene: "neon-block",
    x: doorX("pawn") - 90,
    body: "#4a5560",
    hair: "#6b6258",
    hat: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "If you're here about a missing person, the interesting version is a rumor. The true version is a retirement. I prefer the true one. It pays worse and sleeps better.",
        choices: [
          {
            id: "who",
            text: "Who retired?",
            next: "mara",
            quest: "q-signal",
            effects: [{ op: "flag", key: "marlowe:hint", value: true }],
          },
          { id: "quiet", text: "Rough night?", next: "quiet" },
          leave(),
        ],
      },
      mara: {
        text: "Mara Gilt. Built half the marquees, then left the roof antenna talking so the night shift could find each other. People say vanished because vanished sells. The night clerk is family. Be polite. They're tired of the legend.",
        choices: [leave("I'll be polite.")],
      },
      quiet: {
        text: "Every night is a rough draft. If a tourist lost a photograph, the Mirage desk keeps the things people drop. I keep the things people lie about.",
        choices: [leave("Good division of labor.")],
      },
    }),
  },
  {
    id: "stan",
    name: "Sticker Stan",
    title: "Honest scam",
    scene: "neon-block",
    x: doorX("star") - 100,
    body: "#245c45",
    hair: "#111",
    root: "root",
    nodes: nodes({
      root: {
        text: "Sticker. One token. It does nothing, changes nothing, and will not help you at a table. That is the entire sales pitch. I have a code.",
        choices: [
          { id: "shop", text: "Show me the sticker.", shop: true },
          leave("I'll admire it from here."),
        ],
      },
    }),
  },
  {
    id: "reese",
    name: "Reese Quan",
    title: "Bellhop",
    scene: "neon-block",
    x: doorX("mirage") + 84,
    body: "#1f4d4a",
    hair: "#e6c36a",
    hat: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "Bags? No bags. People keep arriving with questions instead. The desk is inside. Ivo has the patience of a closed restaurant and the keys to nothing dangerous.",
        choices: [leave("I'll go in quietly.")],
      },
    }),
  },
  {
    id: "dottie",
    name: "Dottie Midnight",
    title: "Cook and memory",
    scene: "diner",
    x: 214,
    body: "#a33b45",
    hair: "#f2e2c4",
    root: "root",
    nodes: nodes({
      root: {
        text: "Sit or order. The booths are red because I refuse to look at a beige life. If Kit sent you, the coffee is already conceptually yours.",
        choices: [
          { id: "menu", text: "What's cooking?", shop: true },
          {
            id: "tired",
            text: "I'm running on fumes.",
            next: "coffee",
            absentFlag: "dottie:coffee",
            effects: [
              { op: "item", id: "coffee", n: 1 },
              { op: "flag", key: "dottie:coffee", value: true },
            ],
          },
          {
            id: "errand",
            text: "Need anything from the block?",
            next: "errand",
            requireFlag: "kit:met",
            absentFlag: "griddle:started",
            effects: [
              { op: "quest", id: "q-griddle", status: "active", step: 0 },
              { op: "flag", key: "griddle:started", value: true },
              { op: "tokens", n: 10 },
            ],
          },
          {
            id: "deliver",
            text: "I found Griddle Jazz.",
            next: "thanks",
            quest: "q-griddle",
            hasItem: "griddle-jazz",
            effects: [
              { op: "take", id: "griddle-jazz", n: 1 },
              { op: "quest", id: "q-griddle", status: "complete", step: 2 },
              { op: "item", id: "giant-platter", n: 1 },
              { op: "tokens", n: 12 },
              { op: "rep", faction: "diner", n: 2 },
              { op: "flag", key: "griddle:done", value: true },
            ],
          },
          leave("Just the room for a minute."),
        ],
      },
      coffee: {
        text: "She slides a cup you did not pay for. 'Use it before it becomes a personality. The rest of the menu costs tokens, not chips. I don't speak chip.'",
        choices: [leave("Thank you.")],
      },
      errand: {
        text: "Harvey has a record called Griddle Jazz and he is holding it hostage because he thinks I called his trumpet bin 'seasoning.' Ten tokens so you can afford the thing. Bring it home.",
        choices: [{ id: "menu", text: "I'll look at the menu too.", shop: true }, leave("On my way.")],
      },
      thanks: {
        text: "She listens to three seconds of memory and nods like a critic who has decided to be kind. 'Platter's on the house. Eat it from your bag when the street gets long. And tell Harvey his trumpet bin is still seasoning.'",
        choices: [leave("Worth the walk.")],
      },
    }),
  },
  {
    id: "sable",
    name: "Sable Voss",
    title: "Velvet Vintage",
    scene: "velvet",
    x: 214,
    body: "#6a2040",
    hair: "#111",
    root: "root",
    nodes: nodes({
      root: {
        text: "Clothes are a conversation you have before you speak. They will not move a single odd on a wheel. They will change who waves at you. I consider that the better magic.",
        choices: [
          { id: "shop", text: "Show me what walks.", shop: true },
          { id: "style", text: "What should I try first?", next: "style" },
          leave(),
        ],
      },
      style: {
        text: "A jacket, then something small near your face. Equip them. If you only buy and leave them in the bag, the sidewalk can't see your effort and Vinny certainly won't.",
        choices: [{ id: "shop", text: "Open the rack.", shop: true }, leave()],
      },
    }),
  },
  {
    id: "nell",
    name: "Nell Voss",
    title: "Lobby host",
    scene: "gilt-lobby",
    x: 160,
    body: "#7a1f32",
    hair: "#f7edd6",
    root: "root",
    nodes: nodes({
      root: {
        text: "Welcome in. The gaming floor is through the gold arch. Chips are play chips. If anyone tells you they leave this building as money, they are lost or lying, and both are sad.",
        choices: [
          { id: "floor", text: "Take me to the floor.", casino: "floor" },
          { id: "lab", text: "Where do people learn the odds?", next: "lab" },
          leave("I'll look around the lobby."),
        ],
      },
      lab: {
        text: "Ace teaches in the corner. The Pit is a workshop. The Training Lab keeps score of answers, not of purses. A hot streak is not a diploma.",
        choices: [
          { id: "lab", text: "Open the Training Lab.", casino: "training" },
          { id: "pit", text: "Open the Pit.", casino: "workshop" },
          leave(),
        ],
      },
    }),
  },
  {
    id: "ace",
    name: "Ace Marconi",
    title: "Former dealer",
    scene: "gilt-lobby",
    x: 330,
    body: "#1d3d36",
    hair: "#222",
    root: "root",
    nodes: nodes({
      root: {
        text: "I dealt sixteen years and the cards never once owed me a favor. I teach that now, for free, because the alternative is Lou.",
        choices: [
          {
            id: "coin",
            text: "Ask me something sharp.",
            next: "coin",
            absentFlag: "ace:coin",
          },
          { id: "lab", text: "Open the Training Lab.", casino: "training" },
          { id: "floor", text: "I still want to play.", next: "play" },
          leave(),
        ],
      },
      coin: {
        text: "A fair coin lands heads three times. What is the chance the next flip is heads? Don't dress it up.",
        choices: [
          { id: "eight", text: "One in eight. The streak is rare.", next: "nope" },
          {
            id: "half",
            text: "One in two. The coin doesn't keep a diary.",
            next: "yes",
            effects: [
              { op: "knowledge", n: 1 },
              { op: "flag", key: "ace:coin", value: true },
              { op: "rep", faction: "gilt", n: 1 },
            ],
          },
          { id: "due", text: "Zero. Tails is due.", next: "nope" },
        ],
      },
      yes: {
        text: "There it is. The past spins are weather. The next one is still a half. If you play, play because the room is beautiful, not because it owes you a correction.",
        choices: [
          { id: "lab", text: "Give me more of that in the Lab.", casino: "training" },
          leave("I'll remember."),
        ],
      },
      nope: {
        text: "That's the story the room tells when it wants your next bet. Try the question again when you want. I don't charge tuition, and I don't take a piece of your chips.",
        choices: [
          { id: "again", text: "Let me answer again.", next: "coin" },
          leave(),
        ],
      },
      play: {
        text: "Then play small, know the price of the game, and leave while you still like the music. The floor is that way. Your street life stays where you left it.",
        choices: [{ id: "go", text: "Open the gaming floor.", casino: "floor" }, leave()],
      },
    }),
  },
  {
    id: "harvey",
    name: "Harvey Wax",
    title: "Cellar keeper",
    scene: "records",
    x: 214,
    body: "#5a3a28",
    hair: "#eee",
    root: "root",
    nodes: nodes({
      root: {
        text: "If you hum it, I will not have it. If you describe a feeling, I might. The radio in the corner is not part of the inventory. It has been opinionated all week.",
        choices: [
          { id: "shop", text: "Let me dig.", shop: true },
          {
            id: "griddle",
            text: "Dottie wants Griddle Jazz.",
            next: "griddle",
            quest: "q-griddle",
          },
          { id: "radio", text: "What's the radio doing?", next: "radio" },
          leave(),
        ],
      },
      griddle: {
        text: "Of course she does. Tell her the trumpet bin is a curated ecosystem, not seasoning. The record is in the bin, priced like a record, not like a favor.",
        choices: [{ id: "shop", text: "Show me the bin.", shop: true }, leave()],
      },
      radio: {
        text: "It counts when it should hiss. I unplugged it once. It counted anyway, which I disliked on a professional level. Ruby says that's the point. Ruby says a lot of things with reverb.",
        choices: [leave("I'll listen myself.")],
      },
    }),
  },
  {
    id: "switch",
    name: "Switch",
    title: "Arcade tech",
    scene: "arcade",
    x: 230,
    body: "#20242c",
    hair: "#3ec6c6",
    root: "root",
    nodes: nodes({
      root: {
        text: "If it sparks, it's mine. If it pays tokens, it's a game of hands, not a purse. Pulse Line wants timing. Marquee Memory wants your eyes. Neither one talks to the casino cage.",
        choices: [
          {
            id: "count",
            text: "The radio counted three, six, nine.",
            next: "count",
            quest: "q-signal",
            questStep: 0,
            effects: [{ op: "quest", id: "q-signal", status: "active", step: 1 }],
          },
          {
            id: "bulb",
            text: "I brought a spare bulb.",
            next: "bulb",
            hasItem: "neon-bulb",
            absentFlag: "switch:bulb",
            effects: [
              { op: "take", id: "neon-bulb", n: 1 },
              { op: "flag", key: "switch:bulb", value: true },
              { op: "rep", faction: "arcade", n: 1 },
              { op: "tokens", n: 5 },
            ],
          },
          { id: "why", text: "Why is the block flickering?", next: "why" },
          leave(),
        ],
      },
      count: {
        text: "That's not a fault. That's a beacon duty cycle. Mara built it. Luckless can say it in professor. I can say it in wire: the antenna on the Mirage still has a job. Go hear the version with footnotes.",
        choices: [leave("Paperback Palace.")],
      },
      bulb: {
        text: "Switch seats the bulb in a dead socket by the door. A small letter M comes back, pink and unashamed. 'Five tokens. Labor credit. Not a jackpot.'",
        choices: [leave("Fair.")],
      },
      why: {
        text: "Because somebody wanted night workers to look up at the same time. You can play a cabinet while you think about it. Winning is optional. Noticing is the point.",
        choices: [leave("I'll try a cabinet.")],
      },
    }),
  },
  {
    id: "luckless",
    name: "Professor Luckless",
    title: "Resident mathematician",
    scene: "books",
    x: 214,
    body: "#2c3358",
    hair: "#c9b89a",
    root: "root",
    nodes: nodes({
      root: {
        text: "Luck is a story we tell about a distribution we haven't looked at. I have the books. I also have opinions, which are cheaper and less reliable.",
        choices: [
          { id: "shop", text: "Show me the shelf.", shop: true },
          {
            id: "signal",
            text: "Switch said the count is a beacon.",
            next: "signal",
            quest: "q-signal",
            questStep: 1,
            effects: [
              { op: "quest", id: "q-signal", status: "active", step: 2 },
              { op: "knowledge", n: 1 },
            ],
          },
          { id: "lab", text: "I'd like a real drill.", casino: "training" },
          leave(),
        ],
      },
      signal: {
        text: "Three, six, nine. Not mysticism. A pattern short enough to see from a moving car and specific enough not to be an accident. Mara Gilt published nothing and built everything. The night clerk at the Mirage can finish this without a chalkboard. Ask kindly.",
        choices: [
          { id: "lab", text: "Drill me after.", casino: "training" },
          leave("To the hotel."),
        ],
      },
    }),
  },
  {
    id: "cleo",
    name: "Cleo Chrome",
    title: "Pawn proprietor",
    scene: "pawn",
    x: 214,
    body: "#3a3a3a",
    hair: "#9aa0a6",
    root: "root",
    nodes: nodes({
      root: {
        text: "I don't buy regrets. I hold them until they become interesting objects. If you need a bulb, a tooth, or a story with a hinge, you're in the right bad lighting.",
        choices: [
          { id: "shop", text: "What's in the case?", shop: true },
          {
            id: "locket",
            text: "Anything I should carry?",
            next: "locket",
            absentFlag: "cleo:locket",
            effects: [
              { op: "item", id: "locket", n: 1 },
              { op: "quest", id: "q-locket", status: "active", step: 0 },
              { op: "flag", key: "cleo:locket", value: true },
            ],
          },
          leave(),
        ],
      },
      locket: {
        text: "Cleo presses a chrome locket into your hand. Inside: a roof, an antenna, a woman laughing at her own work. 'Night clerk knows the face. I kept it too long because it was pretty. That's not a good reason.'",
        choices: [leave("I'll take it across the street.")],
      },
    }),
  },
  {
    id: "pip",
    name: "Pip Coil",
    title: "Pinball poet",
    scene: "comet",
    x: 214,
    body: "#7a3e12",
    hair: "#ffb020",
    root: "root",
    nodes: nodes({
      root: {
        text: "Copper Comet. The balls are silver, the ramps are a city, and the power comes from the same stubborn cable as the arcade. I am the glamorous end of Switch's screwdriver.",
        choices: [
          { id: "play", text: "Can I play a table?", next: "play" },
          { id: "signal", text: "Have the lights been odd?", next: "odd" },
          leave(),
        ],
      },
      play: {
        text: "The live table is in pieces on purpose. Go next door and beat Pulse Line if you want a game that can actually be finished tonight. Tell them Pip sent you only if you win.",
        choices: [leave("Next door, then.")],
      },
      odd: {
        text: "Odd is the house style. The useful kind of odd repeats. If you can say the repeat out loud, you're halfway to the roof already.",
        choices: [leave("Three, six, nine.")],
      },
    }),
  },
  {
    id: "moth",
    name: "Moth",
    title: "Last Call",
    scene: "last-call",
    x: 214,
    body: "#241833",
    hair: "#d7c4ff",
    root: "root",
    nodes: nodes({
      root: {
        text: "We stop serving questions at dawn. Until then: one soda, no prophecy, and a single true sentence if you look like you can carry it.",
        choices: [
          { id: "shop", text: "I'll take the soda.", shop: true },
          { id: "true", text: "I'll take the sentence.", next: "true" },
          leave(),
        ],
      },
      true: {
        text: "The roof has been talking since before the hotel had a brochure. If you already know the count, the clerk will not pretend they don't. If you don't, the soda is still cold.",
        choices: [leave("That's enough true.")],
      },
    }),
  },
  {
    id: "vinny",
    name: "Vinny Velvet",
    title: "Lounge host",
    scene: "starlight",
    x: 214,
    body: "#4a1030",
    hair: "#f7edd6",
    root: "root",
    nodes: nodes({
      root: {
        text: "Starlight Palace. The band is late, the room is early, and I already know your name or I will invent a better one. You may keep yours.",
        choices: [
          {
            id: "back",
            text: "Can I stand by the brass?",
            next: "back",
            minStyle: 4,
            absentFlag: "vinny:back",
            effects: [
              { op: "flag", key: "vinny:back", value: true },
              { op: "charm", n: 1 },
              { op: "rep", faction: "gilt", n: 1 },
            ],
          },
          { id: "who", text: "Who comes in here?", next: "who" },
          leave("Just passing through the gold."),
        ],
      },
      back: {
        text: "Vinny clocks the outfit and opens the rope on a smile he saves for people who dressed on purpose. 'You don't have to sing. Standing well is a contribution. Mara used to stand right there and listen for the antenna between songs.'",
        choices: [leave("I'll stand a minute.")],
      },
      who: {
        text: "Dealers after shift, cooks before shift, one mathematician who refuses to clap on two and four, and Gus when he is off the door and willing to dance very carefully.",
        choices: [
          { id: "style", text: "What gets me past the rope?", next: "style" },
          leave(),
        ],
      },
      style: {
        text: "A jacket with a point of view and one small thing near the face. Sable has both. I have standards and a soft heart, in that order.",
        choices: [leave("I'll go see Sable.")],
      },
    }),
  },
  {
    id: "ivo",
    name: "Ivo Lane",
    title: "Night clerk",
    scene: "mirage",
    x: 220,
    body: "#102824",
    hair: "#cfd8d5",
    root: "root",
    nodes: nodes({
      root: {
        text: "Grand Mirage, desk of the unlost. If you are checking in, we are full of echoes. If you are checking a story, I might have the end of it.",
        choices: [
          {
            id: "signal",
            text: "What does the roof remember?",
            next: "signal",
            quest: "q-signal",
            questStep: 2,
            effects: [
              { op: "quest", id: "q-signal", status: "complete", step: 3 },
              { op: "flag", key: "signal:known", value: true },
              { op: "knowledge", n: 1 },
              { op: "tokens", n: 20 },
              { op: "item", id: "gilt-pin", n: 1 },
              { op: "rep", faction: "night", n: 2 },
            ],
          },
          {
            id: "locket",
            text: "Cleo sent this locket.",
            next: "locket",
            quest: "q-locket",
            hasItem: "locket",
            effects: [
              { op: "take", id: "locket", n: 1 },
              { op: "quest", id: "q-locket", status: "complete", step: 1 },
              { op: "charm", n: 1 },
              { op: "rep", faction: "night", n: 1 },
              { op: "flag", key: "locket:done", value: true },
            ],
          },
          {
            id: "photo",
            text: "A tourist lost this photograph.",
            next: "photo",
            quest: "q-photo",
            hasItem: "photo",
            effects: [
              { op: "take", id: "photo", n: 1 },
              { op: "quest", id: "q-photo", status: "complete", step: 1 },
              { op: "tokens", n: 8 },
              { op: "rep", faction: "night", n: 1 },
            ],
          },
          { id: "familiar", text: "Have we met?", next: "familiar" },
          leave("Good night, then."),
        ],
      },
      signal: {
        text: "Ivo's voice drops the lobby voice. 'Mara Gilt was my aunt. She tuned the signs to a count the night shift could share: three, six, nine. Not a spell. A way to say the doors are still open. You heard her. That was the whole mystery. Twenty tokens from the lost-and-found jar, and her pin. It doesn't spend. It just shows.'",
        choices: [leave("Still open. I like that.")],
      },
      locket: {
        text: "They close their hand around the chrome, then open it again so you can see the laugh. 'She hated posing. She liked antennas. Thank you for walking it home. Cleo keeps beautiful things too long. So do I.'",
        choices: [leave("It wanted the desk.")],
      },
      photo: {
        text: "The photograph goes into a labeled envelope. 'They'll come back embarrassed and I'll pretend I didn't see the pose. Eight tokens. The jar is for finders, not for winners.'",
        choices: [leave("I'll tell the sidewalk it's handled.")],
      },
      familiar: {
        text: "You have the face of someone who walks into a city and expects it to talk back. Mara had that face. I have the night shift. Between us the block stays lit.",
        choices: [leave("Then I'll keep walking it.")],
      },
    }),
  },
];

export type EncounterDef = {
  id: string;
  name: string;
  title: string;
  weight: number;
  once: boolean;
  requireFlag?: string;
  absentFlag?: string;
  root: string;
  nodes: Record<string, NodeDef>;
};

export const ENCOUNTERS: EncounterDef[] = [
  {
    id: "tourist",
    name: "Pam Deck",
    title: "Tourist",
    weight: 3,
    once: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "A woman with a paper map she does not need stops you. 'Is the big gold building a real casino? Everyone I asked tried to sell me a feeling.'",
        choices: [
          {
            id: "plain",
            text: "Play chips only. They never become cash.",
            next: "thanks",
            effects: [
              { op: "charm", n: 1 },
              { op: "rep", faction: "block", n: 1 },
              { op: "flag", key: "tourist:helped", value: true },
            ],
          },
          { id: "lou", text: "Find Lucky Lou. He has a system.", next: "lou" },
          { id: "walk", text: "Just keep walking east.", next: "walk" },
        ],
      },
      thanks: {
        text: "She folds the map wrong, on purpose, relieved. 'Breakfast, then. I can spend on pancakes without pretending I'm investing.'",
        choices: [leave("The diner is west of the gold.")],
      },
      lou: {
        text: "You point. She does not go. 'I asked for a building, not a hobby. I'll find pancakes myself.' Nobody's purse opens.",
        choices: [leave("Fair.")],
      },
      walk: {
        text: "She walks east, map up, already doing better than the advice she was offered earlier.",
        choices: [leave()],
      },
    }),
  },
  {
    id: "photo",
    name: "A hurried guest",
    title: "Lost frame",
    weight: 2,
    once: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "Someone pats every pocket twice. 'I had a picture of the marquee and now I have a lining. If you see it, the Mirage desk takes strays.' They leave before you answer. The photograph is suddenly in your hand, as these things go.",
        choices: [
          {
            id: "keep",
            text: "I'll get it to the desk.",
            next: "ok",
            effects: [
              { op: "item", id: "photo", n: 1 },
              { op: "quest", id: "q-photo", status: "active", step: 0 },
              { op: "flag", key: "photo:held", value: true },
            ],
          },
        ],
      },
      ok: {
        text: "It's a good picture. The sign is caught mid-stutter, which is the only honest way to photograph it.",
        choices: [leave("Desk it is.")],
      },
    }),
  },
  {
    id: "magician",
    name: "Ozzie Palm",
    title: "Street magician",
    weight: 2,
    once: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "Ozzie shows two closed hands and a smile with too many teeth. 'The coin is in one of them. Observation, not magic. Where?'",
        choices: [
          { id: "left", text: "Left.", next: "wrong" },
          { id: "right", text: "Right.", next: "wrong" },
          {
            id: "neither",
            text: "Neither. You already moved it.",
            next: "right",
            effects: [
              { op: "knowledge", n: 1 },
              { op: "tokens", n: 4 },
              { op: "flag", key: "ozzie:seen", value: true },
            ],
          },
        ],
      },
      right: {
        text: "Both hands open, empty. The coin is on your shoulder, which he plucks without touching your wallet. 'Four tokens from the hat. The hat is not a cage.'",
        choices: [leave("Nice hands.")],
      },
      wrong: {
        text: "He had it behind your ear the whole time and gives it back. No fee. No lesson you didn't already start. The wallet stays yours.",
        choices: [leave("Again, someday.")],
      },
    }),
  },
  {
    id: "envelope",
    name: "A paper corner",
    title: "Under the newsstand",
    weight: 1,
    once: true,
    requireFlag: "ruby:heard",
    absentFlag: "envelope:read",
    root: "root",
    nodes: nodes({
      root: {
        text: "An envelope with no name sticks out from under a newsstand. Inside: a roof sketch, an antenna, and two words. STILL OPEN.",
        choices: [
          {
            id: "take",
            text: "Keep the sketch in mind.",
            next: "ok",
            effects: [{ op: "flag", key: "envelope:read", value: true }],
          },
        ],
      },
      ok: {
        text: "No money in it. No demand. Just a direction upward, which on this block means the Mirage.",
        choices: [leave("Still open.")],
      },
    }),
  },
  {
    id: "performer",
    name: "June Glass",
    title: "Singer between sets",
    weight: 2,
    once: true,
    root: "root",
    nodes: nodes({
      root: {
        text: "June has lipstick on one tooth and a trumpet case she does not play. 'Vinny needs bodies in the room who aren't auditioning. If you own a jacket, you are already overqualified.'",
        choices: [
          {
            id: "ok",
            text: "I'll look in at Starlight.",
            next: "ok",
            effects: [
              { op: "tokens", n: 2 },
              { op: "flag", key: "june:asked", value: true },
            ],
          },
          leave("Maybe after the diner."),
        ],
      },
      ok: {
        text: "She presses two tokens into your palm like a tip she is paying forward. 'Don't gamble them. Buy a reed or a fry. I'm not your manager.'",
        choices: [leave("Fries, then.")],
      },
    }),
  },
];

export function sceneY(scene: SceneId): number {
  return scene === "neon-block" ? 158 : 150;
}

export function actorById(id: string): ActorDef | undefined {
  return NPCS.find((npc) => npc.id === id);
}

export function encounterById(id: string): EncounterDef | undefined {
  return ENCOUNTERS.find((row) => row.id === id);
}
