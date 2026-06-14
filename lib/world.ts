// My World — single source of truth for the globe view.
//
// Everything the globe needs lives here: the two selectable regions, the
// clickable locations inside each region, their coordinates, and the copy
// shown in the side panel. Add or edit a location by editing one entry in
// WORLD_LOCATIONS. Nothing else needs to change.

export type RegionId = "america" | "world";

export type WorldRegion = {
  id: RegionId;
  // Label shown on the region marker during step 1 (pick a region).
  label: string;
  // Short hint shown once this region is engaged (step 2).
  hint: string;
  // Marker position + where the globe rotates to when the region is picked.
  lat: number;
  lng: number;
  // Camera altitude (zoom) when this region becomes the focus. Bigger = farther.
  focusAltitude: number;
  // GeoJSON ADMIN names that belong to this region. Used to brighten the
  // matching landmasses once the region is selected.
  countries: string[];
};

// Which geographic shape to light up for this location.
//   source "states"    -> matched against the US states dataset by name
//   source "countries" -> matched against the world countries dataset (ADMIN)
export type LocationHighlight = {
  source: "states" | "countries";
  name: string;
};

export type WorldLocation = {
  slug: string;
  region: RegionId;
  // Marker label + panel fallback.
  label: string;
  // Where the name label sits and where the camera frames on select.
  lat: number;
  lng: number;
  // The shape that glows / is clickable for this location.
  highlight: LocationHighlight;
  // Panel body, one string per paragraph. The panel heading is `label`, so
  // this is just the story text. Placeholder for now (see banner below).
  content: string[];
};

export const WORLD_REGIONS: WorldRegion[] = [
  {
    id: "america",
    label: "The States",
    hint: "Tap a place in the States.",
    lat: 39.5,
    lng: -98.35,
    focusAltitude: 1.6,
    countries: ["United States of America"],
  },
  {
    id: "world",
    label: "Around the World",
    hint: "Tap a place around the world.",
    // Sits over the Arabian Sea so it reads as the hub of the international
    // grouping (South Asia, Middle East, SE Asia, and a reach to Portugal).
    lat: 18,
    lng: 64,
    focusAltitude: 2.1,
    countries: [
      "Pakistan",
      "Indonesia",
      "Turkey",
      "Saudi Arabia",
      "Malaysia",
      "Portugal",
    ],
  },
];

/* =========================================================================
   LOCATION CONTENT — PLACEHOLDER COPY. SWAP THIS LATER.

   These are the places visited so far. Each location's `content` is an array
   of paragraphs shown in the side panel; the panel heading is the `label`
   (e.g. "Saudi Arabia"). The text is throwaway gibberish for now. To drop in
   the real story, find the entry by `slug` and replace its `content` array.
   That is the only place per location you need to touch.
   ========================================================================= */

export const WORLD_LOCATIONS: WorldLocation[] = [
  // ----- America region -------------------------------------------------
  {
    slug: "georgia",
    region: "america",
    label: "Georgia",
    lat: 33.749,
    lng: -84.388,
    highlight: { source: "states", name: "Georgia" },
    content: [
      "Placeholder copy for Georgia. Florbex quanto the wibbly sprocket, lorem ipsum but make it sillier. Replace this whole block when the real story is ready.",
      "More filler so the panel is not empty: zonk, frizzle, bloop, the cat sat on the keyboard and produced this very paragraph. None of it is true yet.",
    ],
  },
  {
    slug: "tennessee",
    region: "america",
    label: "Tennessee",
    lat: 36.1627,
    lng: -86.7816,
    highlight: { source: "states", name: "Tennessee" },
    content: [
      "Placeholder copy for Tennessee. Wibble wobble, a paragraph of pure nonsense waiting to be evicted by the real thing.",
      "Second filler paragraph. Quibble snorf glimmer, etc. Swap me out whenever.",
    ],
  },
  {
    slug: "north-carolina",
    region: "america",
    label: "North Carolina",
    lat: 35.7796,
    lng: -78.6382,
    highlight: { source: "states", name: "North Carolina" },
    content: [
      "Placeholder copy for North Carolina. Splonk the doodle, frabjous and meaningless, here purely to fill space.",
      "Another throwaway paragraph so the scroll has something to do. Real words coming soon.",
    ],
  },
  {
    slug: "new-york",
    region: "america",
    label: "New York",
    lat: 40.7128,
    lng: -74.006,
    highlight: { source: "states", name: "New York" },
    content: [
      "Placeholder copy for New York. Bibble bobble zoom, a stand-in sentence with no actual content.",
      "Filler paragraph number two. Yadda yadda flibbertigibbet. Replace at will.",
    ],
  },

  // ----- Around the World region ---------------------------------------
  {
    slug: "pakistan",
    region: "world",
    label: "Pakistan",
    lat: 33.6844,
    lng: 73.0479,
    highlight: { source: "countries", name: "Pakistan" },
    content: [
      "Placeholder copy for Pakistan. Glorp the wandle, a nonsense paragraph keeping the seat warm for the real one.",
      "Second filler line. Snizzle frump, gibberish on purpose. Swap whenever the story is ready.",
    ],
  },
  {
    slug: "indonesia",
    region: "world",
    label: "Indonesia",
    lat: -6.2088,
    lng: 106.8456,
    highlight: { source: "countries", name: "Indonesia" },
    content: [
      "Placeholder copy for Indonesia. Floofle the marblewicket, lorem-ish drivel meant to be deleted.",
      "More placeholder so it scrolls. Zib zob zub. Real words land here later.",
    ],
  },
  {
    slug: "turkey",
    region: "world",
    label: "Turkey",
    // Centered on Istanbul; clicking the broader country area is fine.
    lat: 41.0082,
    lng: 28.9784,
    highlight: { source: "countries", name: "Turkey" },
    content: [
      "Placeholder copy for Turkey, centered on Istanbul. Quonk the bibblesnap, a placeholder paragraph and nothing more.",
      "Filler two. Wuzzle frindle. Replace this with the real account when ready.",
    ],
  },
  {
    slug: "saudi-arabia",
    region: "world",
    label: "Saudi Arabia",
    lat: 24.7136,
    lng: 46.6753,
    highlight: { source: "countries", name: "Saudi Arabia" },
    content: [
      "Placeholder copy for Saudi Arabia. Glimber the snorfwidget, total gibberish standing in for the truth.",
      "Second placeholder paragraph. Boop beep blorp. Swap me out.",
    ],
  },
  {
    slug: "malaysia",
    region: "world",
    label: "Malaysia",
    lat: 3.139,
    lng: 101.6869,
    highlight: { source: "countries", name: "Malaysia" },
    content: [
      "Placeholder copy for Malaysia. Wibblethwack the donglebean, filler text awaiting its replacement.",
      "More nonsense for the scroll. Frizz fram floom. Real copy soon.",
    ],
  },
  {
    slug: "portugal",
    region: "world",
    label: "Portugal",
    lat: 38.7223,
    lng: -9.1393,
    highlight: { source: "countries", name: "Portugal" },
    content: [
      "Placeholder copy for Portugal. Snibble the quaverflux, a paragraph of cheerful nonsense holding the spot.",
      "Filler paragraph two. Plonk wibble zint. Replace whenever the real words arrive.",
    ],
  },
];

// Convenience lookups.
export const REGION_BY_ID: Record<RegionId, WorldRegion> = WORLD_REGIONS.reduce(
  (acc, r) => {
    acc[r.id] = r;
    return acc;
  },
  {} as Record<RegionId, WorldRegion>,
);

export function locationsForRegion(region: RegionId): WorldLocation[] {
  return WORLD_LOCATIONS.filter((l) => l.region === region);
}

export function locationBySlug(slug: string): WorldLocation | undefined {
  return WORLD_LOCATIONS.find((l) => l.slug === slug);
}

// ADMIN name -> region, so the globe can brighten a region's countries.
export const COUNTRY_REGION: Record<string, RegionId> = WORLD_REGIONS.reduce(
  (acc, r) => {
    r.countries.forEach((c) => {
      acc[c] = r.id;
    });
    return acc;
  },
  {} as Record<string, RegionId>,
);
