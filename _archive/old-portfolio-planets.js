// Planet specs for the galaxy. Positions are spherical (radius, theta, phi).
// Five planets, theta spaced 72deg apart so none overlap from camera [0,3,18].
export const PLANETS = [
  {
    id: 'projects',
    name: 'PROJECTS',
    chartName: 'Projects',
    index: '01',
    descriptor: 'built things',
    subtitle: 'counterstack · tripwire · glint',
    radius: 4.8,
    theta: 0.6,
    phi: 1.15,
    size: 0.5, // headline planet — carries Counterstack
    color: '#A78BFA',
    emissive: '#7B5BFF',
    orbitSpeed: 0.0008,
  },
  {
    id: 'experience',
    name: 'EXPERIENCE',
    chartName: 'Experience',
    index: '02',
    descriptor: "where i've been",
    subtitle: "handshake · step n' fetch",
    radius: 5.3,
    theta: 1.86,
    phi: 0.82,
    size: 0.4,
    color: '#4FC3F7',
    emissive: '#1E3A8A',
    orbitSpeed: 0.0009,
  },
  {
    id: 'cybersecurity',
    name: 'TECHNICAL SKILLS',
    chartName: 'Technical Skills',
    index: '03',
    descriptor: 'the stack',
    subtitle: 'sec+ · net+ · aws · az-900',
    radius: 7.0,
    theta: 3.11,
    phi: 1.7,
    size: 0.42,
    color: '#22D3EE',
    emissive: '#0E7490',
    orbitSpeed: 0.0007,
  },
  {
    id: 'leadership',
    name: 'LEADERSHIP',
    chartName: 'Leadership',
    index: '04',
    descriptor: 'where i lead',
    subtitle: 'gsu cyber club VP · progsu',
    radius: 5.7,
    theta: 4.37,
    phi: 1.05,
    size: 0.4,
    color: '#818CF8',
    emissive: '#4338CA',
    orbitSpeed: 0.0008,
  },
  {
    id: 'events',
    name: 'EVENTS',
    chartName: 'Events',
    index: '05',
    descriptor: "what's coming",
    subtitle: "hacklanta · ??? spring '26",
    radius: 8.0,
    theta: 5.63,
    phi: 1.9,
    size: 0.45,
    color: '#7B5BFF',
    emissive: '#4C1D95',
    orbitSpeed: 0.0005,
    ring: true,
  },
];

// Spherical -> Cartesian. phi = polar angle from +Y, theta = azimuth.
export function sphericalToVec3(radius, theta, phi) {
  return [
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta),
  ];
}

// Intro reveal order.
export const INTRO_ORDER = [
  'projects',
  'experience',
  'cybersecurity',
  'leadership',
  'events',
];

export const CALENDLY_URL = 'https://calendly.com/abrartsarwar';

export const NAV_LINKS = [
  { id: 'home', label: 'HOME' },
  { id: 'projects', label: 'PROJECTS' },
  { id: 'experience', label: 'EXPERIENCE' },
  { id: 'leadership', label: 'LEADERSHIP' },
  { id: 'events', label: 'EVENTS' },
  { id: 'about', label: 'ABOUT' },
];
