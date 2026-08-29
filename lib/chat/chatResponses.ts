// ============================================================================
// PORTFOLIO CHAT: CONTENT
// ============================================================================
//
// This is the only file you need to touch to add an Easter egg. Add an entry
// to CHAT_ENTRIES and it works everywhere (matching, /help, /random, the
// discovery counter). The UI never needs to change.
//
//   {
//     id: "new-person",                       // unique
//     category: "people",                     // me | people | anime | cyber | project | general | secret
//     triggers: ["name", "nickname"],         // whole words / phrases, any case, punctuation ignored
//     responses: ["response one", "two"],     // one is picked at random, never the same twice in a row
//                                             // ([] = no text: the media IS the reply)
//     media: { type: "image", src: "/chat/name.webp", alt: "name" },   // optional (or an array)
//                                             // type "video" pops up in the site's video modal, with sound
//     links: [{ label: "github", href: "https://..." }],               // optional
//     project: "netwraith",                   // optional: a slug from lib/projects, or an inline card
//     effect: "glitch",                       // optional: "glitch" | "shake" | "flash"
//     sound: "/chat/sfx/name.mp3",            // optional: plays once when the reply lands
//     followUps: { why: "...", "who is your favorite": ["...", "..."] },  // optional, context-aware
//     hidden: true,                           // optional: keeps it out of /help
//   }
//
// Media goes in /public/chat/ (see /public/chat/README.md). Paths that start
// with /assets/ are the site's existing sprites and videos.
//
// Matching is whole-token: "john" matches "John!" and "john's" but never
// "johnson". Longer phrases beat shorter ones ("threat intelligence" wins over
// "intelligence"). A trailing "s" is forgiven ("hackers" -> "hacker").
// ============================================================================

import type { ChatEntry, ChatSuggestion } from "./types";

export const BOT_NAME = "abrar";

/** First thing shown when the chat opens. */
export const WELCOME_MESSAGE =
  "yo. ask me something. a project, a show, a name, a cyber word. see what happens.";

/** Chips shown while the conversation is empty. Clicking sends `send` verbatim. */
export const SUGGESTIONS: ChatSuggestion[] = [
  { label: "try: arkham", send: "arkham" },
  { label: "try: hacker", send: "hacker" },
  { label: "try: bleach", send: "bleach" },
  { label: "try someone's name", send: "someone's name" },
  { label: "try: what do you build?", send: "what do you build?" },
];

/** Rotating placeholder text in the input. */
export const INPUT_PLACEHOLDERS = [
  "ask abrar something…",
  "try: netwraith",
  "try: gojo",
  "try: ctf",
  "try: who are you",
  "try: /random",
];

/**
 * Used when nothing matches. Pure brainrot. It never explains itself and it
 * never says what it is; it just says something unhinged and moves on.
 */
export const FALLBACK_RESPONSES = [
  "67",
  "6 7 🤷",
  "sigma balls",
  "ouu shi",
  "tuntuntun",
  "tung tung tung tung sahur",
  "bombaaclattttt",
  "chat is this real 😭",
  "erm what the sigma",
  "what the helly",
  "skibidi",
  "ohio behavior",
  "aura -100",
  "fanum tax",
  "gyatt",
  "huzz",
  "sybau 🥀",
  "ts pmo 💔",
  "nah bro 💀",
  "crashing out rn",
  "lowkey no",
  "no cap",
  "goofy ahh",
  "bro is NOT locked in",
  "you're cooked",
  "it's so over",
  "we're so back",
  "delulu",
  "who let bro cook",
  "twin where you been",
  "gng 💔",
  "unc behavior",
  "caught in 4k 📸",
  "on skibidi",
  "ratio",
  "🗿",
  "🥀💔",
  "nah that's crazy",
  "get rizzed up",
  "rizzler",
  "bombardino crocodilo",
  "tralalero tralala",
  "brr brr patapim",
  "ballerina cappuccina",
  "chimpanzini bananini",
  "lirili larila",
  "just put the fries in the bag bro",
];

export const CHAT_ENTRIES: ChatEntry[] = [
  // ==========================================================================
  // ME
  // ==========================================================================
  {
    id: "abrar",
    category: "me",
    priority: 1,
    triggers: [
      "abrar",
      "abrar sarwar",
      "abrar tahir sarwar",
      "sarwar",
      "bro",
      "your name",
      "whats your name",
      "abrartsarwar",
    ],
    responses: [
      "yeah that's me 😭",
      "you found the main character",
      "bro searched my own name on my portfolio 💀",
      "present. what's up.",
      "yeah that's me. main character. aura through the roof.",
    ],
    // Pops up in the video modal the moment the reply lands.
    media: { type: "video", src: "/assets/videos/hacker.mp4", alt: "Abrar, hacker arc" },
    followUps: {
      why: "because it's my portfolio. i get to be the main character here.",
      who: "me. abrar. it's at the top of the page 😭",
      where: "atlanta. the /myworld page has the rest of the map.",
    },
  },
  {
    id: "who-are-you",
    category: "general",
    triggers: [
      "who are you",
      "who r u",
      "who is this",
      "who am i talking to",
      "what are you",
      "are you real",
      "are you a bot",
      "are you an ai",
      "are you ai",
      "is this ai",
      "is this an ai",
      "are you chatgpt",
      "are you human",
    ],
    responses: [
      "abrar. name's at the top of the page 😭",
      "abrar. who else would it be.",
      "the guy whose name is on the website. hi.",
      "abrar. atlanta. cyber. type a project and i'll prove it.",
    ],
    followUps: {
      why: "because it's my website. who else would answer.",
      how: "type something and find out.",
      "prove it": "netwraith, tripwire, leek, counterstack, arkham. type one. receipts are on the card.",
    },
  },

  // ==========================================================================
  // PEOPLE
  // ==========================================================================
  {
    id: "kevin",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["kevin"],
    responses: [
      "oh you know kevin? interesting...",
      "kevin. noted. 📝",
      "kevin mentioned. the group chat has been notified.",
    ],
    media: { type: "video", src: "/assets/videos/kevin.mp4", alt: "Kevin" },
  },
  {
    id: "jared",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["jared"],
    responses: [],
    media: { type: "gif", src: "/assets/sprites/jared.gif", alt: "Jared", aspect: "1 / 1" },
  },
  {
    id: "luigi",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["luigi", "luigi fernandez"],
    responses: ["luigi mentioned 🫡", "oh you know luigi? 😭", "luigi. the man, the myth."],
    media: { type: "video", src: "/assets/videos/luigi.mp4", alt: "Luigi" },
  },
  {
    id: "natasha",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["natasha"],
    responses: [],
    media: { type: "gif", src: "/assets/sprites/bignash.gif", alt: "Natasha", aspect: "1 / 1" },
  },
  {
    id: "liam",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["liam"],
    responses: ["liam. yeah. that guy.", "liam has been summoned.", "oh you know liam? we should talk."],
    // The picture stays on the stage; the clip pops the video popup over it and
    // closes itself when it ends, leaving the picture behind.
    media: [
      { type: "image", src: "/assets/sprites/liam.png", alt: "Liam", aspect: "942 / 1670" },
      { type: "video", src: "/assets/videos/liam.mp4", alt: "Liam" },
    ],
  },
  {
    id: "john",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["john"],
    responses: [
      "john. there's a button on the fun page with his name on it. i'm not explaining it.",
      "john lore detected.",
      "john? which one. actually, don't answer that.",
    ],
    media: { type: "video", src: "/assets/videos/john.mp4", alt: "John" },
  },
  {
    // The letter. First "carolina" of a visit takes the whole screen and runs
    // to the end of the track; after that the entry just answers, quietly.
    // Reloading the page arms it again.
    id: "carolina",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["carolina"],
    responses: ["..."],
    portrait: "/assets/sprites/ren.png",
    letter: {
      audio: "/assets/videos/carolina.mp3",
      portrait: "/assets/sprites/ren.png",
      // The track is 34.9s and the lines are spread to use all of it: the last
      // one starts at 31.0 and finishes typing around 32.6, so it gets a beat
      // to land rather than leaving the music playing over an empty screen.
      duration: 35.4,
      lines: [
        { at: 1.5, text: "hey nana" },
        { at: 6.2, text: "I know it has been quite sometime since we last spoken and things like that" },
        { at: 11.2, text: "there has been so many things that has happened to me as you can see" },
        { at: 16.2, text: "just know that as all of these new experiences occur to me" },
        { at: 21.2, text: "i still think about you to this day" },
        { at: 26.1, text: "i always want you to be happy" },
        { at: 31.0, text: "I will never forget what you are to me ever carolina" },
      ],
    },
  },
  {
    id: "sarah",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["sarah", "sara"],
    responses: [
      "sarah. she's marrying my man.",
      "she shoulda been me. next to kevin.",
      "sarah? she's marrying my man. i'm happy for them. allegedly.",
    ],
  },
  {
    id: "joey",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["joey"],
    responses: [],
    media: { type: "image", src: "/assets/sprites/joey.jpg", alt: "Joey", aspect: "4 / 3" },
  },
  {
    id: "jeremiah",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["jeremiah"],
    responses: [
      "jeremiah lore detected.",
      "jeremiah? interesting...",
      "jeremiah mentioned. the prophecy continues.",
    ],
  },
  {
    id: "ishan",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["ishan"],
    responses: [],
    media: { type: "gif", src: "/assets/sprites/ishan.gif", alt: "Ishan", aspect: "1 / 1" },
  },
  {
    id: "arhaan",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["arhaan", "arhan"],
    responses: [],
    media: { type: "image", src: "/assets/sprites/arhaan.jpg", alt: "Arhaan", aspect: "447 / 552" },
  },
  {
    id: "charan",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["charan"],
    responses: [],
    media: { type: "image", src: "/assets/sprites/charan.png", alt: "Charan", aspect: "468 / 664" },
  },
  {
    id: "poorav",
    category: "people",
    priority: 1,
    hidden: true,
    triggers: ["poorav"],
    responses: [],
    media: { type: "image", src: "/assets/sprites/poorav.png", alt: "Poorav", aspect: "1290 / 2383" },
  },
  {
    id: "someones-name",
    category: "general",
    priority: -1,
    triggers: [
      "someones name",
      "someone's name",
      "a name",
      "name",
      "names",
      "who do you know",
      "your friends",
      "friends",
    ],
    responses: [
      "go on. type one. i'm not telling you which ones work 👀",
      "a name. any name. some of them are in here.",
      "type a name. some of them are in here. some of them are cooked.",
    ],
  },

  // ==========================================================================
  // ANIME
  // ==========================================================================
  {
    id: "jjk",
    category: "anime",
    priority: 1,
    triggers: ["jujutsu kaisen", "jjk", "jujutsu", "cursed energy", "domain expansion"],
    responses: [
      "that show is peak.",
      "gojo deserved better. i'm not discussing this further.",
      "jjk. there's a gojo video on my home page for a reason.",
    ],
    followUps: {
      why: "because it is. next question.",
      "favorite character": "gojo. obviously. mahoraga if we're counting things that adapt.",
      "favourite character": "gojo. obviously. mahoraga if we're counting things that adapt.",
      "who is your favorite": "gojo. obviously.",
      "who is your favourite": "gojo. obviously.",
      "best character": "gojo. this isn't a debate.",
      "season 3": "yes. i'm not okay about it either.",
    },
  },
  {
    id: "gojo",
    category: "anime",
    priority: 1,
    triggers: ["gojo", "satoru", "satoru gojo", "gojo satoru", "six eyes", "limitless", "infinity"],
    responses: [
      "gojo deserved better. i'm not discussing this further.",
      "nah, i'd win.",
      "the strongest. throughout heaven and earth.",
    ],
    media: { type: "image", src: "/assets/sprites/gojo.png", alt: "Gojo", aspect: "1 / 1" },
    followUps: {
      why: "domain expansion. that's why.",
      "did he win": "nah. but he'd win.",
      "would he win": "nah, i'd win.",
      "vs sukuna": "we don't talk about the outcome. we talk about the fight.",
    },
  },
  {
    id: "sukuna",
    category: "anime",
    priority: 1,
    triggers: ["sukuna", "ryomen", "ryomen sukuna", "king of curses", "malevolent shrine"],
    responses: [
      "sukuna. tripwire's whole aesthetic. the domain closes and you don't get a say.",
      "stand proud. you're strong.",
      "cleave. dismantle. next.",
    ],
    media: { type: "image", src: "/assets/sprites/sukuna.png", alt: "Sukuna", aspect: "1 / 1" },
    links: [{ label: "see tripwire", href: "#projects" }],
    followUps: {
      why: "because guaranteed hit, every time, on the defender's terms is exactly what tripwire does.",
      "why tripwire": "open the domain, every cut lands. tripwire opens the domain on your aws account.",
    },
  },
  {
    id: "mahoraga",
    category: "anime",
    hidden: true,
    triggers: ["mahoraga", "makora", "adapt", "adaptation", "with this treasure"],
    responses: [
      "mahoraga adapts. so does my resume.",
      "with this treasure i summon… a response you didn't expect.",
      "the wheel turns. the site keeps working. that's the whole metaphor.",
    ],
    media: { type: "image", src: "/assets/sprites/mahoraga.png", alt: "Mahoraga", aspect: "1 / 1" },
  },
  {
    id: "bleach",
    category: "anime",
    priority: 1,
    triggers: ["bleach", "soul society", "bankai", "tybw", "thousand year blood war", "shinigami"],
    responses: ["10/10. no debate.", "bleach. the drip alone is a 10.", "bankai. that's the whole review."],
    media: { type: "gif", src: "/assets/sprites/ichigoglint.gif", alt: "Ichigo", aspect: "1 / 1" },
    followUps: {
      why: "soul society alone clears half your watchlist.",
      "favorite character": "aizen. and i'm aware of what that says about me.",
      "favourite character": "aizen. and i'm aware of what that says about me.",
      "who is your favorite": "aizen. and i'm aware of what that says about me.",
      "who is your favourite": "aizen. and i'm aware of what that says about me.",
      "best character": "aizen. sit down.",
      "favorite arc": "soul society. it's not close.",
      "best arc": "soul society. it's not close.",
      "the fillers": "we skip those. together. as a community.",
      filler: "we skip those. together. as a community.",
    },
  },
  {
    id: "ichigo",
    category: "anime",
    priority: 1,
    triggers: ["ichigo", "kurosaki", "ichigo kurosaki", "getsuga", "getsuga tenshou", "zangetsu"],
    responses: [
      "ichigo. a protagonist who actually trains. rare.",
      "getsuga tenshou. that's all i've got.",
      "orange hair, oversized sword, zero chill. respect.",
    ],
    media: { type: "image", src: "/assets/sprites/ichigo.png", alt: "Ichigo", aspect: "1 / 1" },
  },
  {
    id: "aizen",
    category: "anime",
    priority: 1,
    triggers: ["aizen", "sosuke aizen", "aizen sosuke", "kyoka suigetsu", "hogyoku", "since when"],
    responses: [
      "this conversation was part of aizen's plan.",
      "this was all according to plan.",
      "since when were you under the impression you were in control of this conversation?",
    ],
    effect: "glitch",
    followUps: {
      why: "you were under the impression you had a choice in this conversation. you didn't.",
      "what plan": "the one you're currently inside of.",
    },
  },
  {
    id: "anime",
    category: "anime",
    priority: -1,
    triggers: ["anime", "manga", "favorite anime", "favourite anime", "best anime", "weeb", "otaku", "what anime", "shows", "show"],
    responses: [
      "core rotation: jjk, bleach, berserk, one piece, jojo. type any of them.",
      "anime? yeah. this site has more references than a wikipedia article. try a character.",
    ],
    followUps: {
      "favorite": "bleach. no debate. jjk is peak but bleach raised me.",
      "favourite": "bleach. no debate. jjk is peak but bleach raised me.",
      why: "because the projects page is literally cast with anime characters. it's load-bearing.",
    },
  },
  {
    id: "naruto",
    category: "anime",
    hidden: true,
    triggers: ["naruto", "sasuke", "kakashi", "hokage", "sharingan"],
    responses: ["naruto's fine. bleach is better. i said what i said.", "believe it. or don't. bleach is still better."],
  },
  {
    id: "aot",
    category: "anime",
    hidden: true,
    triggers: ["attack on titan", "aot", "eren", "levi", "titan", "titans"],
    responses: ["aot. the ending happened. we don't talk about it.", "tatakae. that's the review."],
  },
  {
    id: "dragon-ball",
    category: "anime",
    hidden: true,
    triggers: ["dragon ball", "dbz", "goku", "vegeta", "super saiyan"],
    responses: ["goku vs gojo? gojo. don't @ me.", "dragon ball walked so everything else could power up for six episodes."],
  },
  {
    id: "demon-slayer",
    category: "anime",
    hidden: true,
    triggers: ["demon slayer", "tanjiro", "kimetsu", "nezuko"],
    responses: ["gorgeous animation. that's the review.", "demon slayer. the fights are art. the plot is a fight."],
  },
  {
    id: "one-piece",
    category: "anime",
    hidden: true,
    triggers: ["one piece", "luffy", "monkey d luffy", "gear 5", "gear five", "nika", "straw hat", "straw hats"],
    responses: [
      "gear 5. the projects page has me as luffy. that's canon now.",
      "one piece. yes it's long. yes it's worth it.",
    ],
    media: { type: "image", src: "/assets/sprites/abrarluffy.png", alt: "Abrar as Luffy", aspect: "1 / 1" },
    followUps: {
      why: "because a rubber man punched a god and it was the best episode of anything that year.",
      "how long": "long. that's the point.",
    },
  },
  {
    id: "shanks",
    category: "anime",
    hidden: true,
    triggers: ["shanks", "red hair", "red haired", "haki"],
    responses: ["conqueror's haki. that's the whole strategy.", "shanks showed up, said one line, and left. goals."],
    media: { type: "gif", src: "/assets/sprites/shanks.gif", alt: "Shanks", aspect: "1 / 1" },
  },
  {
    id: "berserk",
    category: "anime",
    hidden: true,
    triggers: ["berserk", "guts", "band of the hawk", "behelit", "dragonslayer"],
    responses: [
      "berserk. the eclipse is on my home page. that's how much i trust you.",
      "guts. the sword is bigger than the plot and the plot is huge.",
    ],
  },
  {
    id: "griffith",
    category: "anime",
    hidden: true,
    triggers: ["griffith", "eclipse", "femto"],
    responses: [
      "griffith did nothing wr... no. no, he did not.",
      "griffith. the eclipse on the home page is his fault too.",
    ],
    effect: "flash",
    sound: "/assets/videos/griffith.mp3",
  },
  {
    id: "jojo",
    category: "anime",
    hidden: true,
    triggers: ["jojo", "jojos bizarre adventure", "jjba", "za warudo", "the world", "stand user", "stands"],
    responses: [
      "jojo. jotaro walks across my home page every 30 seconds. he's not lost.",
      "jojo. every pose on this site is intentional.",
    ],
    media: { type: "gif", src: "/assets/sprites/jotaropage.gif", alt: "Jotaro walking", aspect: "1 / 1" },
  },
  {
    id: "jotaro",
    category: "anime",
    hidden: true,
    triggers: ["jotaro", "star platinum", "ora ora", "yare yare", "yare yare daze"],
    responses: ["yare yare daze.", "jotaro. he's on the home page, walking. always walking."],
    media: { type: "gif", src: "/assets/sprites/jotaropage.gif", alt: "Jotaro walking", aspect: "1 / 1" },
  },
  {
    id: "dio",
    category: "anime",
    hidden: true,
    triggers: ["dio", "dio brando", "kono dio da", "muda", "muda muda", "wryyy"],
    responses: [
      "you thought it was a chatbot, but it was me, DIO!",
      "dio locked down the /myworld page once. it's a whole thing.",
    ],
    media: { type: "image", src: "/assets/sprites/shadowdiooo.png", alt: "Dio", aspect: "1 / 1" },
    effect: "shake",
  },
  {
    id: "dante",
    category: "anime",
    hidden: true,
    triggers: ["dante", "devil may cry", "dmc", "devil trigger", "vergil", "sss rank"],
    responses: [
      "dante. netwraith's whole personality. sss rank or nothing.",
      "devil trigger. that's what the netwraith dashboard does when someone goes full kill chain.",
    ],
    media: { type: "image", src: "/assets/sprites/dante.png", alt: "Dante", aspect: "1 / 1" },
    links: [{ label: "see netwraith", href: "#projects" }],
  },
  {
    id: "chrollo",
    category: "anime",
    hidden: true,
    triggers: ["chrollo", "hunter x hunter", "hxh", "hisoka", "phantom troupe", "killua", "gon", "nen"],
    responses: [
      "chrollo's notebook is the entire leek methodology. study it, write it down, then use it.",
      "hunter x hunter. the troupe moves as one. that's exactly how i built the leek dossier.",
    ],
    media: { type: "image", src: "/assets/sprites/glint.jpg", alt: "Leek (Chrollo)", aspect: "16 / 9" },
    links: [{ label: "see leek", href: "#projects" }],
  },
  {
    id: "gambit",
    category: "anime",
    hidden: true,
    triggers: ["gambit", "x men", "xmen", "remy lebeau", "remy"],
    responses: [
      "gambit. counterstack energy. charged cards, no refunds.",
      "gambit. the projects page has me as him. the trench coat was earned.",
    ],
    media: { type: "image", src: "/assets/sprites/abrargambit.png", alt: "Abrar as Gambit", aspect: "1 / 1" },
    links: [{ label: "see counterstack", href: "#projects" }],
  },
  {
    id: "garou",
    category: "anime",
    hidden: true,
    triggers: ["garou", "one punch man", "opm", "saitama", "hero hunter"],
    responses: ["garou's on the /myworld page. hero hunting on a globe.", "one punch. one commit. same energy."],
    media: { type: "image", src: "/assets/sprites/garouworld-removebg-preview.png", alt: "Garou", aspect: "1 / 1" },
  },
  {
    id: "sonic",
    category: "secret",
    hidden: true,
    triggers: ["sonic", "gotta go fast", "hedgehog"],
    responses: ["gotta go fast. like this site's lighthouse score. mostly.", "sonic's on the home page. blink and you miss him."],
    media: { type: "gif", src: "/assets/sprites/sonic.gif", alt: "Sonic", aspect: "1 / 1" },
  },
  {
    id: "superman",
    category: "secret",
    hidden: true,
    triggers: ["superman", "clark kent", "kryptonite", "man of steel"],
    responses: ["there's a superman flying around /myworld. he's not lost. he's patrolling.", "superman. faster than a speeding lighthouse audit."],
    media: { type: "image", src: "/assets/sprites/superman.png", alt: "Superman", aspect: "1 / 1" },
    links: [{ label: "go to my world", href: "/myworld" }],
  },
  {
    id: "spiderman",
    category: "secret",
    hidden: true,
    triggers: ["spiderman", "spider man", "peter parker", "miles morales"],
    responses: ["with great power comes a fun page where you throw shuriken at my head.", "spider-man. the shuriken on the fun page is filed under his name. long story."],
    links: [{ label: "go to fun", href: "#fun" }],
  },
  {
    id: "dark-souls",
    category: "secret",
    hidden: true,
    triggers: ["dark souls", "bonfire", "elden ring", "fromsoft", "praise the sun", "souls"],
    responses: ["bonfire lit. rest here.", "you died. (of curiosity. keep typing.)"],
    media: { type: "gif", src: "/assets/sprites/bonfire.gif", alt: "Bonfire", aspect: "1 / 1" },
  },
  {
    id: "minecraft",
    category: "general",
    hidden: true,
    triggers: ["minecraft", "lan server", "lan party"],
    responses: [
      "the origin story. i was the kid running the minecraft LAN server for my friends. it's in the bio.",
      "minecraft. where the whole 'i can fix the network' thing started.",
    ],
  },
  {
    id: "money",
    category: "secret",
    hidden: true,
    triggers: ["money", "rich", "salary", "broke", "cash"],
    responses: ["money. the goal is to build things good enough that it follows.", "money.gif. that's the plan.", "fanum tax is real. build accordingly."],
    media: { type: "gif", src: "/assets/sprites/money.gif", alt: "money", aspect: "1 / 1" },
  },

  // ==========================================================================
  // CYBER, real information about the work, delivered casually.
  // ==========================================================================
  {
    id: "hacker",
    category: "cyber",
    triggers: ["hacker", "hacking", "hack", "hack me", "can you hack", "hacked", "hackerman"],
    responses: [
      "depends who's asking 👀",
      "defensively. mostly.",
      "i build the things that catch them. mostly.",
      "bro typed hacker into a portfolio like it's a cheat code 💀 defensively. mostly.",
    ],
    // Same clip the "abrar" entry plays. It pops up in the video modal the
    // moment the reply lands; the scan types itself out on the stage under it.
    media: [
      { type: "video", src: "/assets/videos/hacker.mp4", alt: "Abrar, hacker arc" },
      {
        type: "terminal",
        title: "visitor scan",
        lines: [
          "$ whoami",
          "visitor",
          "$ nmap -sV visitor",
          "22/tcp   closed",
          "443/tcp  open   curiosity",
          "$ verdict",
          "harmless. probably.",
        ],
      },
    ],
    followUps: {
      why: "because 'depends who's asking' is the only correct answer to that word.",
      who: "you, apparently. typing 'hacker' into a portfolio at this hour.",
      me: "then no. respectfully.",
      "hack me": "i just did. scroll up. 443 open.",
    },
  },
  {
    id: "cybersecurity",
    category: "cyber",
    triggers: ["cybersecurity", "cyber security", "cyber", "infosec", "information security", "security"],
    responses: [
      "cybersecurity is the whole personality. detection engineering, cloud auto-response, threat intel. pick one and i'll go deeper.",
      "security. i build detection engines (netwraith), aws auto-response (tripwire), and threat intel (leek, arkham). type any of them.",
    ],
    followUps: {
      why: "because someone has to catch the guy chaining a scan into an exploit at 3am.",
      detection: "detection is netwraith: c++ ids, per-source kill chain scoring, dante-approved.",
      "detection engineering": "detection is netwraith: c++ ids, per-source kill chain scoring, dante-approved.",
      cloud: "cloud is tripwire: five aws tripwires, sub-60-second auto response.",
      "cloud auto response": "cloud is tripwire: five aws tripwires, sub-60-second auto response.",
      "threat intel": "threat intel is leek + arkham. one's a dossier, one's a briefing system.",
      "which one": "netwraith if you like packets. tripwire if you like aws. leek if you like reading. counterstack if you like winning.",
    },
  },
  {
    id: "pentesting",
    category: "cyber",
    triggers: ["pentesting", "pentest", "pen testing", "pen test", "penetration testing", "red team", "offensive security", "offsec"],
    responses: [
      "more blue than red. i'd rather build the thing that catches the pentester. but you have to know both sides of the wire.",
      "pentesting is how you learn what the detection has to catch. i live on the catching side.",
    ],
    media: {
      type: "terminal",
      title: "engagement",
      lines: ["$ scope", "this portfolio", "$ findings", "0 critical, 1 chatbot with attitude"],
    },
  },
  {
    id: "ctf",
    category: "cyber",
    triggers: ["ctf", "capture the flag", "hackthebox", "htb", "tryhackme", "picoctf"],
    responses: [
      "ctfs are where the fun is. flag{you_typed_ctf_on_a_portfolio}",
      "capture the flag. here, have one: flag{curiosity_is_the_exploit}",
    ],
    followUps: {
      flag: "you already have it. scroll up.",
      "is that real": "as real as any flag. submit it somewhere and find out.",
      why: "because nothing teaches faster than a puzzle that fights back.",
    },
  },
  {
    id: "malware",
    category: "cyber",
    triggers: ["malware", "virus", "ransomware", "trojan", "botnet", "worm", "rootkit"],
    responses: [
      "malware is what everything i build is pointed at. netwraith watches the wire, tripwire watches the account.",
      "malware. the thing on the other side of every detection rule i've ever written.",
    ],
  },
  {
    id: "soc",
    category: "cyber",
    triggers: ["soc", "security operations", "security operations center", "soc analyst", "blue team", "blueteam", "defender", "defensive"],
    responses: [
      "soc energy: alerts, triage, coffee. netwraith exists so a soc sees one rising threat instead of 400 flat alerts.",
      "blue team. i'd rather write the detection than stare at the dashboard, but i respect the dashboard.",
    ],
  },
  {
    id: "siem",
    category: "cyber",
    triggers: ["siem", "splunk", "sentinel", "elastic", "logs", "log analysis", "detection engineering", "detection", "alerts", "alert fatigue"],
    responses: [
      "siem: where logs go to become alerts. i'd rather write the detection than read the dashboard. that's netwraith's whole pitch.",
      "detection engineering. score the source, not the packet. that one idea is most of netwraith.",
    ],
    links: [{ label: "see netwraith", href: "#projects" }],
  },
  {
    id: "threat-intel",
    category: "cyber",
    triggers: ["threat intelligence", "threat intel", "cti", "cyber threat intelligence", "osint", "ioc", "indicators of compromise", "intel"],
    responses: [
      "threat intel is two things here: leek (the cyberleek case file) and arkham (my briefing system). same instinct, different flavor.",
      "know your enemy. leek takes one campaign apart; arkham briefs me on all of them.",
    ],
    links: [
      { label: "see leek", href: "#projects" },
      { label: "arkham", href: "https://github.com/abrar-sarwar/arkham" },
    ],
    followUps: {
      why: "because detection without context is guessing with extra steps.",
      "which one": "leek if you want a story. arkham if you want a routine.",
    },
  },
  {
    id: "intelligence",
    category: "cyber",
    hidden: true,
    triggers: ["intelligence", "smart", "iq", "genius"],
    responses: ["artificial or threat? because i only do one of those.", "intelligence. threat, specifically. type it with the other word."],
  },
  {
    id: "ai",
    category: "general",
    triggers: ["ai", "chatgpt", "gpt", "llm", "openai", "claude", "gemini", "artificial intelligence", "machine learning"],
    responses: [
      "ai? the only intelligence i deal with is threat intelligence. type it.",
      "chatgpt could never. type a project.",
      "ai. cool. anyway. netwraith. type it.",
    ],
    followUps: {
      why: "because threat intel is the fun kind.",
      really: "really. type threat intel.",
    },
  },
  {
    id: "aws",
    category: "cyber",
    triggers: ["aws", "cloud", "lambda", "cloudtrail", "s3", "serverless", "iam", "amazon web services"],
    responses: [
      "aws is tripwire territory. root login, public bucket, open security group, cloudtrail killed. trip a wire and it responds in under 60 seconds.",
      "cloud security here means tripwire: serverless detection that reverses the attack before the alert even lands.",
    ],
    links: [{ label: "see tripwire", href: "#projects" }],
  },
  {
    id: "network",
    category: "cyber",
    triggers: ["c++", "cpp", "libpcap", "packet", "packets", "ids", "intrusion detection", "wireshark", "network security", "network", "kill chain"],
    responses: [
      "packets are netwraith territory: a c++ ids that scores every source as it moves, d rank to sss.",
      "network security here is netwraith. per-source kill chain correlation, so a scan-then-exploit reads as one rising threat.",
    ],
    links: [{ label: "see netwraith", href: "#projects" }],
  },
  {
    id: "nist",
    category: "cyber",
    hidden: true,
    triggers: ["nist", "compliance", "security controls", "controls"],
    responses: ["nist controls as a card game. spades detect, diamonds harden. that's counterstack.", "compliance can be fun. i have a hackathon trophy that says so. type counterstack."],
    links: [{ label: "see counterstack", href: "#projects" }],
  },
  {
    id: "sqli",
    category: "secret",
    hidden: true,
    triggers: ["sql injection", "sqli", "drop table", "xss", "script", "inject", "injection", "union select", "or 1=1", "robert tables"],
    responses: [
      "nice try. this chat has no database. there's nothing to drop 😌",
      "injection attempt logged. the waf is unbothered.",
    ],
    media: {
      type: "terminal",
      title: "waf",
      lines: ["$ payload received", "$ database lookup", "error: no database", "$ status", "unbothered"],
    },
  },
  {
    id: "sudo",
    category: "secret",
    hidden: true,
    triggers: ["sudo", "rm -rf", "rm rf", "chmod", "root", "admin", "administrator"],
    responses: ["permission denied. nice try though.", "you are not root here.", "sudo: visitor is not in the sudoers file. this incident will be reported. (it won't.)", "sudo? bro thinks he's the admin 💀 permission denied."],
  },
  {
    id: "nmap",
    category: "secret",
    hidden: true,
    triggers: ["nmap", "port scan", "scan", "recon", "enumerate"],
    responses: ["scanning you back.", "recon on a portfolio. bold. here's what i see:"],
    media: {
      type: "terminal",
      title: "reverse scan",
      lines: ["$ nmap -A you", "os: curious", "ports: all of them, apparently", "risk: low", "recommendation: keep typing"],
    },
  },
  {
    id: "zero-day",
    category: "secret",
    hidden: true,
    triggers: ["zero day", "0day", "0 day", "exploit", "cve", "vulnerability", "vuln"],
    responses: ["if you have a zero day for a static portfolio, i'd honestly be impressed. email me.", "the only vulnerability here is how long you'll spend typing words into this box."],
  },
  {
    id: "password",
    category: "secret",
    hidden: true,
    triggers: ["password", "passwd", "credentials", "creds"],
    responses: ["i'm not storing anything you type. not even that.", "hunter2. classic."],
  },
  {
    id: "encryption",
    category: "secret",
    hidden: true,
    triggers: ["encryption", "encrypt", "encrypted", "cryptography", "crypto", "hash", "aes", "rsa"],
    responses: ["encrypted at rest, in transit, and in my dms.", "cryptography. the one field where 'trust me bro' is the wrong answer."],
  },
  {
    id: "phishing",
    category: "secret",
    hidden: true,
    triggers: ["phishing", "phish", "social engineering"],
    responses: ["phishing works because people are busy. i build the stuff that catches it when someone clicks anyway.", "no links to click here. except the ones i put there. those are fine. probably."],
  },
  {
    id: "linux",
    category: "secret",
    hidden: true,
    triggers: ["linux", "kali", "arch", "ubuntu", "terminal", "bash", "shell", "cli"],
    responses: ["this chat is the closest thing to a terminal on the site. enjoy.", "arch btw. (i'm legally required to say that in any terminal-adjacent context.)"],
  },

  // ==========================================================================
  // PROJECTS, cards are auto-filled from lib/projects + lib/professional.
  // ==========================================================================
  {
    id: "netwraith",
    category: "project",
    priority: 1,
    triggers: ["netwraith", "net wraith", "wraith"],
    responses: ["netwraith mentioned. sss rank behavior.", "netwraith. dante would approve."],
    project: "netwraith",
    followUps: {
      why: "because a lone ping and a full kill chain shouldn't look the same on a dashboard.",
      how: "c++ on libpcap for the engine, next.js for the dashboard. per-source scoring, d to sss.",
      tech: "c++ on libpcap for the engine, next.js for the dashboard. per-source scoring, d to sss.",
      stack: "c++ on libpcap for the engine, next.js for the dashboard. per-source scoring, d to sss.",
      "why dante": "he turns a horde into a style contest. netwraith does that to a network.",
    },
  },
  {
    id: "tripwire",
    category: "project",
    priority: 1,
    triggers: ["tripwire", "trip wire"],
    responses: ["tripwire mentioned. the domain's already closed.", "tripwire. five wires, sixty seconds, no negotiation."],
    project: "tripwire",
    followUps: {
      why: "because by the time a human reads the alert, the bucket's been public for an hour.",
      how: "aws lambda + cloudtrail events. serverless, so it's already awake when you aren't.",
      tech: "aws lambda + cloudtrail events. serverless, so it's already awake when you aren't.",
      stack: "aws lambda + cloudtrail events. serverless, so it's already awake when you aren't.",
      "which wires": "root login, public bucket, open security group, cloudtrail killed, and a fifth the readme explains.",
      "why sukuna": "open the domain, every cut lands. that's the response model.",
    },
  },
  {
    id: "leek",
    category: "project",
    priority: 1,
    // "glint" stays as an alias, it's the old name, and the repo still redirects.
    triggers: ["leek", "glint"],
    responses: [
      "leek mentioned. chrollo's notebook energy.",
      "leek. read first, then act.",
      "leek. cyberleek, technically. the gta vi leak, taken apart.",
    ],
    project: "leek",
    followUps: {
      why: "because nobody actually knows how they got the build, and most of the coverage wrote like they did.",
      how: "osint. every claim graded, every fact sourced, every unknown left as an unknown.",
      tech: "osint. every claim graded, every fact sourced, every unknown left as an unknown.",
      "why chrollo": "he studies the ability, writes it down, then uses it. that's the whole method.",
      "why leek": "leek. leak. it's a pun. i'm not sorry.",
      "why the name": "leek. leak. it's a pun. i'm not sorry.",
      glint: "old name. the repo still redirects.",
      "gta 6": "eighteen drops, four take-two subpoenas, and still no answer on how they got in.",
      "gta vi": "eighteen drops, four take-two subpoenas, and still no answer on how they got in.",
      rockstar: "eighteen drops, four take-two subpoenas, and still no answer on how they got in.",
      cyberleek: "the name the actor publishes under. that's whose campaign the case file tracks.",
    },
  },
  {
    id: "counterstack",
    category: "project",
    priority: 1,
    triggers: ["counterstack", "counter stack", "hacklanta", "hackathon"],
    responses: ["counterstack mentioned. good choice. we won with it.", "counterstack. security training you actually play."],
    project: "counterstack",
    followUps: {
      why: "because security training shouldn't feel like a lecture.",
      how: "nist controls as a deck. spades detect, diamonds harden. built in 12 hours at hacklanta.",
      tech: "nist controls as a deck. spades detect, diamonds harden. built in 12 hours at hacklanta.",
      "did you win": "yes. that's the whole tagline.",
      "did it win": "yes. that's the whole tagline.",
    },
  },
  {
    id: "arkham",
    category: "project",
    priority: 1,
    triggers: ["arkham", "arkham briefing", "briefing system"],
    responses: [
      "arkham mentioned. good choice.",
      "arkham. my open-source cyber threat intelligence briefing system. newest thing on the board.",
    ],
    // Card is auto-filled from lib/projects + lib/professional, like the others.
    project: "arkham",
    followUps: {
      why: "because reading twelve feeds every morning is a job, and i'd rather automate the job.",
      how: "open source. the github link's on the card.",
      tech: "open source. the github link's on the card.",
      "is it done": "it's personal software. it's never done.",
    },
  },
  {
    id: "projects",
    category: "project",
    triggers: ["projects", "project", "your work", "what have you built", "what have you made", "show me your projects", "your projects", "portfolio projects"],
    responses: [
      "five on the board: arkham, netwraith, tripwire, leek, counterstack. type one, or /projects for the whole lineup.",
    ],
    links: [{ label: "go to projects", href: "#projects" }],
  },

  // ==========================================================================
  // GENERAL, questions people actually ask.
  // ==========================================================================
  {
    id: "what-do-you-build",
    category: "general",
    triggers: [
      "what do you do",
      "what do you build",
      "what do you make",
      "what do you work on",
      "what do u do",
      "what do u build",
      "what do you develop",
      "what kind of work",
    ],
    responses: [
      "detection engines, security automation, and the occasional card game that wins hackathons. type a project name for receipts.",
      "i build the stuff that catches attackers: a c++ ids, aws auto-response, threat intel tooling. and this website, apparently.",
    ],
    links: [{ label: "go to projects", href: "#projects" }],
    followUps: {
      why: "because alerts without context are noise, and i hate noise.",
      how: "c++ when it needs to be fast, typescript when it needs a face, aws when it needs to run without me.",
      "for who": "for whoever's on call at 3am. i've been that person.",
    },
  },
  {
    id: "working-on",
    category: "general",
    triggers: [
      "what are you working on",
      "what are you building",
      "what are u working on",
      "currently working on",
      "current project",
      "working on",
      "whatcha working on",
      "what are you up to",
    ],
    responses: [
      "lately: arkham, a threat intel briefing system. type arkham if you want the pitch.",
      "this chat, for one. and arkham. and whatever netwraith needs next.",
    ],
  },
  {
    id: "favorite-project",
    category: "general",
    triggers: ["favorite project", "favourite project", "best project", "proudest", "which project", "fav project", "your best work"],
    responses: [
      "picking a favorite is illegal, but netwraith is the one that kept me up. counterstack is the one that won.",
      "netwraith, if i'm honest. it's the one where the idea and the code finally matched.",
    ],
    links: [{ label: "go to projects", href: "#projects" }],
  },
  {
    id: "favorite",
    category: "general",
    priority: -1,
    hidden: true,
    triggers: ["favorite", "favourite", "fav"],
    responses: ["favorite what? project, show, character. be specific.", "favorite… project? anime? you have to finish the sentence.", "favorite what gang. finish the sentence."],
  },
  {
    id: "github",
    category: "general",
    triggers: ["github", "git hub", "repo", "repos", "source code", "code", "git"],
    responses: ["github.com/abrar-sarwar. the commits are honest.", "it's all on github. the readmes are better than the commit messages."],
    links: [{ label: "github.com/abrar-sarwar", href: "https://github.com/abrar-sarwar" }],
  },
  {
    id: "resume",
    category: "general",
    triggers: ["resume", "cv", "curriculum vitae", "experience", "background", "skills"],
    responses: [
      "the recruiter version of me lives at /professional. crisp paper, no anime.",
      "resume-shaped answer: /professional. this page is the personality-shaped one.",
    ],
    links: [{ label: "open /professional", href: "/professional" }],
  },
  {
    id: "contact",
    category: "general",
    triggers: ["contact", "email", "reach you", "reach out", "get in touch", "linkedin", "talk to you", "message you", "dm", "socials"],
    responses: [
      "email: abrartsarwar@gmail.com. linkedin's below. or just book a call.",
      "abrartsarwar@gmail.com. i actually read it.",
    ],
    links: [
      { label: "email", href: "mailto:abrartsarwar@gmail.com" },
      { label: "linkedin", href: "https://linkedin.com/in/abrar-sarwar/" },
      { label: "book a call", href: "https://calendly.com/abrartsarwar/30min" },
    ],
  },
  {
    id: "hire",
    category: "general",
    triggers: ["hire you", "hire", "hiring", "job", "recruiter", "open to work", "available", "internship", "intern", "opportunity", "opportunities", "work with you"],
    responses: [
      "open to opportunities. atlanta-based, allergic to boring problems. book a call.",
      "hire me? bold. correct, but bold. the calendar link's right there.",
    ],
    links: [
      { label: "book a call", href: "https://calendly.com/abrartsarwar/30min" },
      { label: "open /professional", href: "/professional" },
    ],
    followUps: {
      why: "because i build things that work at 3am, and i document them so you don't have to call me at 3am.",
      when: "whenever the calendar says. it's linked above.",
    },
  },
  {
    id: "location",
    category: "general",
    priority: -1,
    triggers: ["where are you", "where are you from", "where do you live", "where are you based", "atlanta", "georgia", "location", "where"],
    responses: [
      "atlanta, georgia. born and raised. the /myworld page has the rest of the map.",
      "atlanta. the /myworld globe knows more than i'm telling you here.",
    ],
    links: [{ label: "go to my world", href: "/myworld" }],
  },
  {
    id: "hello",
    category: "general",
    priority: -1,
    triggers: ["hi", "hello", "hey", "yo", "sup", "whats up", "wassup", "hola", "good morning", "good evening", "good afternoon", "howdy", "greetings"],
    responses: [
      "hey. ask me something. i dare you.",
      "hi. ask me about a project, a show, or a name.",
      "wsg. the good stuff is one word away.",
      "yo. lock in. type a project, a show, or a name.",
    ],
  },
  {
    id: "thanks",
    category: "general",
    triggers: ["thanks", "thank you", "ty", "thx", "appreciate it", "cheers"],
    responses: ["anytime. i literally live here.", "np. tell the others.", "w visitor. respectfully."],
  },
  {
    id: "bye",
    category: "general",
    triggers: ["bye", "goodbye", "cya", "see you", "later", "peace", "gtg"],
    responses: ["you'll be back. everyone tries one more word.", "later. the eggs aren't going anywhere.", "bro really said bye to a website 💀 later."],
  },
  {
    id: "help",
    category: "general",
    priority: -1,
    triggers: ["help", "what can you do", "what can i say", "what can i type", "what should i type", "what should i say", "what do i do", "options", "menu", "commands", "how does this work"],
    responses: [
      "type /help for the menu. or just guess. guessing is the whole point.",
      "try a project (netwraith), a word (hacker), a show (bleach), or a name. /help has the full list.",
    ],
  },
  {
    id: "website",
    category: "general",
    priority: -1,
    triggers: ["portfolio", "website", "this site", "this website", "who made this", "who built this", "site", "how was this made", "how did you make this"],
    responses: [
      "built with next.js, framer motion, gsap, and a concerning number of anime references. yes, i made it myself.",
      "this site? next.js + tailwind + framer motion + gsap + stubbornness.",
    ],
    followUps: {
      why: "because a pdf resume doesn't have a page where you can throw a football at me.",
      how: "next.js, tailwind, framer motion, gsap. and stubbornness.",
      "open source": "the projects are. the site's mine. for now.",
    },
  },
  {
    id: "fun",
    category: "general",
    triggers: ["fun", "fun page", "shoot you", "punch you", "hit you", "throw", "weapons"],
    responses: [
      "there's a page where you get to hit me with things. i regret building it.",
      "fun page. gun, fist, sword, shuriken, football, soccer, free food. pick your poison.",
    ],
    links: [{ label: "go to fun", href: "#fun" }],
  },
  {
    id: "gallery",
    category: "general",
    triggers: ["gallery", "photos", "pictures", "pics", "photo"],
    responses: ["gallery's up the page. click a photo to flip it.", "photos. some good, some goofy, one named ohhellnaw."],
    links: [{ label: "go to gallery", href: "#gallery" }],
  },
  {
    id: "myworld",
    category: "general",
    priority: -1,
    triggers: ["my world", "myworld", "globe", "travel", "places", "map", "world", "countries", "adventure"],
    responses: ["/myworld is a globe you can spin. every pin is somewhere i've been.", "travel? spin the globe. it's a whole page."],
    links: [{ label: "go to my world", href: "/myworld" }],
  },
  {
    id: "progsu",
    category: "general",
    triggers: ["progsu", "programming student union", "proggy"],
    responses: ["progsu. programming student union. the home page has a whole video about it.", "proggy 🫡"],
    links: [{ label: "progsu.com", href: "https://www.progsu.com" }],
  },
  {
    id: "music",
    category: "general",
    hidden: true,
    triggers: ["music", "song", "favorite song", "playlist", "spotify"],
    responses: ["the /myworld page has music. the home page has a song. that's all you're getting.", "music? there's a disc on the home page. click it."],
  },
  {
    id: "gym",
    category: "general",
    hidden: true,
    triggers: ["gym", "lift", "lifting", "workout", "bench"],
    responses: ["i lift. the numbers are classified.", "gym. yes. no further questions.", "mogging in the gym is the plan. numbers still classified."],
  },
  {
    id: "draw",
    category: "general",
    hidden: true,
    triggers: ["draw", "drawing", "art", "sketch", "sketching"],
    responses: ["i draw sometimes. nothing on the site yet. soon, maybe.", "drawing is the hobby i don't post. that's on purpose."],
  },
  {
    id: "games",
    category: "general",
    priority: -1,
    hidden: true,
    triggers: ["game", "games", "gaming", "video games", "gamer", "ps5", "xbox", "pc"],
    responses: ["gaming, yes. the fun page is the closest this site gets to one.", "games? the whole career started with a minecraft server. type minecraft.", "gamer. yes. the fun page is where you get to hit me with things. go."],
  },
  {
    id: "goal",
    category: "general",
    priority: -1,
    triggers: ["solutions architect", "architect", "career goal", "long term", "goal", "goals", "future", "dream job"],
    responses: [
      "long term: solutions architect. systems that actually work for the people using them.",
      "the goal is designing systems end to end, not just shipping features. solutions architect, eventually.",
    ],
  },
  {
    id: "love",
    category: "secret",
    hidden: true,
    triggers: ["love you", "i love you", "marry me", "cute", "handsome"],
    responses: ["that's the fun page's heart button talking.", "noted. blushing in monospace.", "rizz detected. unfortunately i'm locked in."],
  },
  {
    id: "coffee",
    category: "secret",
    hidden: true,
    triggers: ["coffee", "caffeine", "energy drink", "monster", "red bull"],
    responses: ["caffeine is a dependency. it's in the package.json of my life.", "coffee. the real ci/cd pipeline."],
  },
  {
    id: "meaning",
    category: "secret",
    hidden: true,
    triggers: ["meaning of life", "42", "why are we here", "purpose"],
    responses: ["42. next.", "the meaning of life is a clean readme and a green build.", "lock in. that's the meaning."],
  },
  {
    // The Real Fist clip used to live on the fun page. Now it only comes out
    // when someone gets personal.
    id: "fat",
    category: "secret",
    hidden: true,
    triggers: [
      "fat",
      "fatty",
      "fatso",
      "chubby",
      "chubs",
      "chunky",
      "chonky",
      "thicc",
      "overweight",
      "obese",
      "big back",
      "big boned",
      "belly",
    ],
    responses: [
      "say that again. i dare you.",
      "bro called me fat on my own website 💀 hands are rated E for everyone.",
      "fat? okay. this is what happens.",
      "who's fat. WHO'S FAT.",
    ],
    media: { type: "video", src: "/assets/videos/ultrapunchvideo.mp4", alt: "the real fist" },
    effect: "shake",
  },
  {
    id: "easter-egg",
    category: "secret",
    hidden: true,
    triggers: ["easter egg", "easter eggs", "secret", "secrets", "hidden"],
    responses: ["there are more than you've found. /help shows the count. it does not show the list.", "yes. no. maybe. keep typing.", "there's more. you're not locked in enough. keep typing."],
  },
];
