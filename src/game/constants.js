export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;
export const GROUND_Y = 560; // kept for backward compat

// The actual map is larger than the viewport
export const MAP_W = 2800;
export const MAP_H = 2800;

export const COLORS = {
  bg: '#020710',
  navy: '#050D1C',
  blue: '#0A1628',
  gold: '#C89B3C',
  goldBright: '#F0E6A0',
  teal: '#0BC4C4',
  red: '#CC2222',
  dark: '#03070F',
  hpGreen: '#1EAF4A',
  hpRed: '#CC2222',
  manaBlue: '#1A6ED8',
};

export const STATES = {
  INTRO: 'intro',
  PLAYING: 'playing',
  REVEAL: 'reveal',
  MAGICIAN: 'magician',
  VICTORY: 'victory',
  DEAD: 'dead',
};

export const ENEMY_DATA = [
  {
    id: 1,
    name: 'The Script Kiddie',
    maxHp: 80,
    speed: 0.8,
    attackInterval: 120,
    projectileSpeed: 4,
    color: '#22AA22',
    xp: 120,
    deathQuote: '"Your tools are not your skills."',
  },
  {
    id: 2,
    name: 'The Phantom Threat',
    maxHp: 130,
    speed: 1.5,
    attackInterval: 100,
    projectileSpeed: 6,
    color: '#AA22AA',
    xp: 200,
    deathQuote: '"I was never really here."',
  },
  {
    id: 3,
    name: 'The Risk Golem',
    maxHp: 170,
    speed: 0.5,
    attackInterval: 160,
    projectileSpeed: 3,
    color: '#AA8822',
    xp: 280,
    deathQuote: '"Risk accepted. Risk mitigated."',
  },
  {
    id: 4,
    name: 'The Firewall Hydra',
    maxHp: 220,
    speed: 1.2,
    attackInterval: 80,
    projectileSpeed: 7,
    color: '#DD4400',
    xp: 360,
    deathQuote: '"Every port has its weakness."',
  },
  {
    id: 5,
    name: 'The Final Audit',
    maxHp: 280,
    speed: 0.9,
    attackInterval: 70,
    projectileSpeed: 5,
    color: '#8800AA',
    xp: 500,
    deathQuote: '"Insufficient experience? I think not."',
  },
];

// All personal photos (used in reveals + victory screen gallery strip)
export const PERSONAL_PHOTOS = [
  '/assets/sprites/IMG_3760.webp',
  '/assets/sprites/IMG_6058.webp',
  '/assets/sprites/IMG_2391.webp',
  '/assets/sprites/IMG_9924.webp',
  '/assets/sprites/IMG_1757.webp',
  '/assets/sprites/IMG_2018.webp',
  '/assets/sprites/IMG_3295.webp',
  '/assets/sprites/IMG_3384.webp',
  '/assets/sprites/IMG_4613.png',
  '/assets/sprites/IMG_4615.webp',
  '/assets/sprites/IMG_6012.jpg',
  '/assets/sprites/IMG_7766.jpg',
  '/assets/sprites/IMG_7913.webp',
  '/assets/sprites/image0.webp',
  '/assets/sprites/074FC809-3C34-40A1-8AAD-43E700B5BBBB.webp',
];

export const ABRAR_REVEALS = [
  {
    tag: 'UNLOCKING: ABRAR.EXE · CHAPTER 1',
    title: 'yo, the name\'s Abrar.',
    message: 'you actually sat down and played this whole thing?? okay okay, i see you. no skip button for real ones. so yeah, i\'m Abrar. i treat every day like a side quest worth grinding. the gym is my daily checkpoint, hiking is my fast travel, and life\'s just a massive open world i\'m trying to 100%. whatever it takes to level up, i\'m on it.',
    tags: ['#gym rat', '#hiker', '#side quest speedrunner', '#progression arc'],
    photo: '/assets/sprites/abrarboss1.webp',
  },
  {
    tag: 'UNLOCKING: ABRAR.EXE · CHAPTER 2',
    title: 'cybersecurity by degree. engineer by soul.',
    message: 'Georgia State, CIS is the official title. but honestly i\'m just someone who loves building things. give me a problem and i\'ll make something that solves it, probably over-engineer it a little, and have a blast doing it. the cyber part just means i also know what the bad guys are up to lol. it\'s giving creative engineer energy for real.',
    tags: ['#GSU', '#security+', '#builder mentality', '#creative engineer'],
    photo: '/assets/sprites/abrarboss2.webp',
  },
  {
    tag: 'UNLOCKING: ABRAR.EXE · CHAPTER 3',
    title: 'the big dream. no cap.',
    message: 'okay so this one\'s personal. i want to make a story that could genuinely be a manga. something that captures the excitement of exploring the world, the kind where anything feels possible. i already have an idea i\'ve been working on, still got plenty of ground to cover, but the best way i can describe it is think JoJo meets One Piece. real exploration, wild moments, and characters with actual depth. that kind of energy. it\'s coming together slowly but surely.',
    tags: ['#one piece reference', '#world builder', '#manifesting', '#the lore runs deep'],
    photo: '/assets/sprites/abrarboss3.webp',
  },
  {
    tag: 'UNLOCKING: ABRAR.EXE · CHAPTER 4',
    title: 'ATL is home. for now.',
    message: 'based in Atlanta and yeah it absolutely slaps. but i\'m always moving, love exploring new spots and meeting people. currently locked in on a coffee shop world tour across the city. if you know a fire spot in ATL i genuinely need the rec, my list keeps growing and so does the mission. i will find every single one.',
    tags: ['#atlanta', '#coffee world tour', '#explorer mode', '#send locations pls'],
    photo: '/assets/sprites/abrarboss4.webp',
  },
  {
    tag: 'UNLOCKING: ABRAR.EXE · FINAL CHAPTER',
    title: 'bro. you actually beat all 5.',
    message: 'okay i genuinely did not expect this. you\'re actually goated. most people hit that skip button (i saw you skip button lookers 👀). but you? you stayed. you fought through all 5 bosses. that\'s the kind of dedication i bring to everything i do, so yeah, here\'s everything. links, resume, the whole thing. you earned this fr fr.',
    tags: ['#you\'re goated', '#certified W', '#earned access', '#fr fr'],
    photo: '/assets/sprites/IMG_9924.webp',
  },
];

export const RESUME_SECTIONS = [
  {
    title: 'TECHNICAL SKILLS',
    items: [
      { label: 'Languages', value: 'Python · SQL · TypeScript · PowerShell · Bash' },
      { label: 'Security', value: 'Splunk · Wireshark · Nmap · Nessus · Burp Suite · OWASP ZAP' },
      { label: 'OS & Admin', value: 'Linux · Windows Server · Active Directory' },
      { label: 'Certs', value: 'CompTIA Security+' },
    ],
  },
  {
    title: 'COUNTERSTACK PROJECT',
    items: [
      { label: 'Award', value: 'Hackathon Winner — 1st Place' },
      { label: 'Scale', value: '10,000+ security events processed per day' },
      { label: 'Framework', value: 'MITRE ATT&CK gamification engine' },
      { label: 'Stack', value: 'React · FastAPI · PostgreSQL · Docker' },
    ],
  },
  {
    title: 'GRC & RISK PROJECT',
    items: [
      { label: 'Dataset', value: 'World Bank — 11,000+ global projects' },
      { label: 'Finding', value: '64.1% project cancellation rate in South Asia' },
      { label: 'Tools', value: 'Excel · Power BI · Risk Modeling' },
      { label: 'Output', value: 'Predictive risk dashboard for portfolio managers' },
    ],
  },
  {
    title: 'HOMELAB & CLOUD',
    items: [
      { label: 'Cloud', value: 'AWS · Azure · Terraform (IaC)' },
      { label: 'SIEM', value: 'Splunk — 5,000+ logs/day ingestion pipeline' },
      { label: 'Network', value: 'Snort IDS · pfSense firewall · VLAN segmentation' },
      { label: 'Pentesting', value: '20+ authorized penetration tests completed' },
    ],
  },
];
