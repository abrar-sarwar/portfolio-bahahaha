export const LOGICAL_W = 1280;
export const LOGICAL_H = 720;
export const GROUND_Y = 560;

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
};

export const ENEMY_DATA = [
  {
    id: 1,
    name: 'The Script Kiddie',
    maxHp: 80,
    speed: 0.8,
    attackInterval: 180,
    projectileSpeed: 3,
    color: '#22AA22',
    xp: 120,
    deathQuote: '"Your tools are not your skills."',
  },
  {
    id: 2,
    name: 'The Phantom Threat',
    maxHp: 130,
    speed: 1.5,
    attackInterval: 150,
    projectileSpeed: 5,
    color: '#AA22AA',
    xp: 200,
    deathQuote: '"I was never really here."',
  },
  {
    id: 3,
    name: 'The Risk Golem',
    maxHp: 170,
    speed: 0.5,
    attackInterval: 240,
    projectileSpeed: 2,
    color: '#AA8822',
    xp: 280,
    deathQuote: '"Risk accepted. Risk mitigated."',
  },
  {
    id: 4,
    name: 'The Firewall Hydra',
    maxHp: 220,
    speed: 1.2,
    attackInterval: 120,
    projectileSpeed: 6,
    color: '#DD4400',
    xp: 360,
    deathQuote: '"Every port has its weakness."',
  },
  {
    id: 5,
    name: 'The Final Audit',
    maxHp: 280,
    speed: 0.9,
    attackInterval: 100,
    projectileSpeed: 4,
    color: '#8800AA',
    xp: 500,
    deathQuote: '"Insufficient experience? I think not."',
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
