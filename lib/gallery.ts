// Gallery data — the single source of truth for the photo collage section.
//
// Every component in components/gallery/ reads from GALLERY_PHOTOS. Filenames
// are never hard-coded anywhere else, so adding, reordering, or re-describing a
// photo is a one-file change here.
//
// WRITING CAPTIONS LATER
// ----------------------
// `title`, `description`, `date`, and `location` are intentionally empty. The
// viewer's flip side hides any field left blank, so you can fill in as much or
// as little as you like, one photo at a time, without touching a component.
//
// `alt` is already filled in with a neutral description of what is visibly in
// the frame. It deliberately does not name anyone. Replace it whenever you want
// more specific alt text — it is what screen readers announce.

export type GalleryPhotoLayout = {
  /** Deterministic resting tilt in degrees. Kept small and hand-placed. */
  rotate: number;
  /** Which direction this photo flies in from as the collage assembles. */
  from: "left" | "right" | "top" | "bottom";
};

export type GalleryPhoto = {
  /** Stable key, also used by the viewer to identify the open photo. */
  id: string;
  src: string;
  /** Intrinsic pixel size — set on the <img> so nothing shifts while loading. */
  width: number;
  height: number;
  /**
   * Neutral description of what is visible. Never names individuals.
   * Replace with your own wording whenever you like.
   */
  alt: string;
  /** Shown on the flipped side. Empty fields are hidden by the UI. */
  title: string;
  description: string;
  date: string;
  location: string;
  /** Featured photos get a double-width cell in the collage. */
  featured: boolean;
  layout: GalleryPhotoLayout;
};

const BASE = "/assets/sprites";

/**
 * The photo that opens the section. It lands in the middle, spins, holds for a
 * few seconds and leaves — then the collage appears. It is deliberately NOT one
 * of the collage tiles; it is the curtain, not part of the show.
 */
export const INTRO_PHOTO = {
  src: `${BASE}/ohhellnaw.png`,
  width: 1290,
  height: 1299,
  alt: "Someone leaning over a person lying face-down on a bed in a sunlit bedroom.",
} as const;

/**
 * How long the intro photo's flip takes, in milliseconds. The photo leaves the
 * moment the spin finishes — it does not hold afterwards — so this single
 * number controls both the rotation and how long the intro is on screen.
 */
export const INTRO_SPIN_MS = 1500;

/**
 * Collage order, read row by row. The desktop collage is a 6-column, 3-row grid
 * and each row's spans add up to exactly 6 (`featured` photos take two columns):
 *
 *   row 1   [ grouppic3  ][ grouppic3 ][ grouppic1 ][ aurapic1 ][ grouppic6 ][ aurapic2 ]
 *   row 2   [ goofypic1  ][ grouppic4 ][ grouppic4 ][ goodpic1  ][ grouppic2 ][ aurapic3 ]
 *   row 3   [ goofypic2  ][ goofypic2 ][ grouppic5 ][ grouppic5 ][ goofypic3 ][ grouppic7 ]
 *
 * Fourteen photographs, four of them featured: 4x2 + 10x1 = 18 cells = 3 full
 * rows. Reorder freely, but keep that arithmetic or the grid will leave holes —
 * there is a test for it.
 *
 * ohhellnaw is not here on purpose: it is the intro, not a collage tile.
 */
export const GALLERY_PHOTOS: GalleryPhoto[] = [
  // ---------------- row 1 ----------------
  {
    id: "grouppic3",
    src: `${BASE}/grouppic3.jpg`,
    width: 3240,
    height: 2160,
    alt: "A line of people outdoors at golden hour holding ice cream cones out toward the camera.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: true,
    layout: { rotate: -1.2, from: "left" },
  },
  {
    id: "grouppic1",
    src: `${BASE}/grouppic1.jpg`,
    width: 2048,
    height: 1536,
    alt: "A group crowded together for a close-up photo wearing novelty hats and oversized glasses against a pink wall.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.6, from: "top" },
  },
  {
    id: "aurapic1",
    src: `${BASE}/aurapic1.png`,
    width: 860,
    height: 1079,
    alt: "Three people walking down a campus path, the one in the middle wearing a top hat and long overcoat.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: -2, from: "top" },
  },
  {
    id: "grouppic6",
    src: `${BASE}/grouppic6.jpg`,
    width: 1536,
    height: 2048,
    alt: "People lying spread out across a giant inflatable airbag beneath large wall signage.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.8, from: "top" },
  },
  {
    id: "aurapic2",
    src: `${BASE}/aurapic2.jpg`,
    width: 1242,
    height: 2208,
    alt: "Someone lying back on a large bean bag with a golden retriever in a living room.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 2.2, from: "right" },
  },

  // ---------------- row 2 ----------------
  {
    id: "goofypic1",
    src: `${BASE}/goofypic1.png`,
    width: 1290,
    height: 1018,
    alt: "People messing around in a backyard pool at night, one of them balanced above the water among inner tubes.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.4, from: "left" },
  },
  {
    id: "grouppic4",
    src: `${BASE}/grouppic4.jpg`,
    width: 2880,
    height: 2160,
    alt: "A group posing together outside a brightly lit storefront at night.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: true,
    layout: { rotate: -1, from: "right" },
  },
  {
    id: "goodpic1",
    src: `${BASE}/goodpic1.jpg`,
    width: 2160,
    height: 2880,
    alt: "A mirror selfie of someone photographed from behind wearing a white football jersey.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.5, from: "right" },
  },
  {
    id: "grouppic2",
    src: `${BASE}/grouppic2.png`,
    width: 1200,
    height: 1800,
    alt: "A printed photo-booth strip with four frames of a group posing, decorated with cartoon stickers.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 2, from: "right" },
  },

  // ---------------- row 3 ----------------
  {
    id: "aurapic3",
    src: `${BASE}/aurapic3.png`,
    width: 1080,
    height: 1350,
    alt: "A Hacklanta promotional poster showing someone in a red suit, top hat and sunglasses holding out a playing card.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: -1.6, from: "left" },
  },
  {
    id: "goofypic2",
    src: `${BASE}/goofypic2.png`,
    width: 1235,
    height: 945,
    alt: "Two people play-fighting in an above-ground pool at night.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: true,
    layout: { rotate: -1.5, from: "bottom" },
  },
  {
    id: "grouppic5",
    src: `${BASE}/grouppic5.png`,
    width: 1083,
    height: 683,
    alt: "Five people floating in an above-ground pool at night with a pink inflatable raft.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: true,
    layout: { rotate: -1.3, from: "bottom" },
  },
  {
    id: "goofypic3",
    src: `${BASE}/goofypic3.jpg`,
    width: 1536,
    height: 2048,
    alt: "Someone in a straw hat covering their face with one hand while another person leans on their shoulder.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.7, from: "bottom" },
  },
  {
    id: "grouppic7",
    src: `${BASE}/grouppic7.jpg`,
    width: 2160,
    height: 2880,
    alt: "A hand holding a compact digital camera whose screen shows a group photo taken on a street at night.",
    title: "",
    description: "",
    date: "",
    location: "",
    featured: false,
    layout: { rotate: 1.2, from: "right" },
  },
];

/** Columns a photo occupies in the desktop collage. */
export function columnSpan(photo: GalleryPhoto): number {
  return photo.featured ? 2 : 1;
}

/** Aspect ratio (width / height). Used for sizing without cropping. */
export function aspectRatio(photo: GalleryPhoto): number {
  return photo.width / photo.height;
}

/** True when a photo has anything worth showing on its flipped side. */
export function hasDetails(photo: GalleryPhoto): boolean {
  return Boolean(
    photo.title || photo.description || photo.date || photo.location,
  );
}

/** Total columns the collage spans on desktop. */
export const COLLAGE_COLUMNS = 6;
