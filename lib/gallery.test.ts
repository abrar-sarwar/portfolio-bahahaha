import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import {
  GALLERY_PHOTOS,
  INTRO_PHOTO,
  INTRO_SPIN_MS,
  COLLAGE_COLUMNS,
  columnSpan,
  aspectRatio,
  hasDetails,
  type GalleryPhoto,
} from "./gallery";

const PUBLIC_DIR = path.resolve(__dirname, "..", "public");

/** The photos that make up the collage — every supplied asset except the intro. */
const REQUIRED = [
  "grouppic1",
  "grouppic2",
  "grouppic3",
  "grouppic4",
  "grouppic5",
  "grouppic6",
  "grouppic7",
  "goodpic1",
  "goofypic1",
  "goofypic2",
  "goofypic3",
  "aurapic1",
  "aurapic2",
  "aurapic3",
];

function fileFor(photo: GalleryPhoto): string {
  return path.join(PUBLIC_DIR, photo.src.replace(/^\//, ""));
}

/**
 * Read the intrinsic size straight out of the file header so the declared
 * width/height can never silently drift from the real asset. Wrong numbers
 * would reserve the wrong box and reintroduce layout shift, so this is worth
 * checking rather than trusting.
 */
function intrinsicSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);

  // PNG: IHDR width/height are big-endian uint32 at offsets 16 and 20.
  if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }

  // JPEG: walk the marker segments to the first Start-Of-Frame.
  if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length - 9) {
      if (buf[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buf[offset + 1];
      const isSof =
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc;
      if (isSof) {
        return {
          height: buf.readUInt16BE(offset + 5),
          width: buf.readUInt16BE(offset + 7),
        };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }

  throw new Error(`could not read intrinsic size from ${file}`);
}

describe("gallery data", () => {
  it("represents every required photo exactly once", () => {
    const ids = GALLERY_PHOTOS.map((p) => p.id).sort();
    expect(ids).toEqual([...REQUIRED].sort());
  });

  it("has unique ids", () => {
    const ids = GALLERY_PHOTOS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("points every photo at a file that actually exists", () => {
    for (const photo of GALLERY_PHOTOS) {
      expect(existsSync(fileFor(photo)), `${photo.id} -> ${photo.src}`).toBe(
        true,
      );
    }
  });

  it("declares the real intrinsic dimensions, so no layout shift", () => {
    for (const photo of GALLERY_PHOTOS) {
      const real = intrinsicSize(fileFor(photo));
      expect({ id: photo.id, ...real }).toEqual({
        id: photo.id,
        width: photo.width,
        height: photo.height,
      });
    }
  });

  it("gives every photo non-empty alt text", () => {
    for (const photo of GALLERY_PHOTOS) {
      expect(photo.alt.trim().length, photo.id).toBeGreaterThan(0);
    }
  });

  it("never names people in the placeholder alt text", () => {
    // Guards against a future edit accidentally reintroducing invented
    // identities. Alt text describes what is visible, nothing more.
    for (const photo of GALLERY_PHOTOS) {
      expect(photo.alt).not.toMatch(/\b(Abrar|Jared)\b/);
    }
  });
});

describe("collage layout", () => {
  it("fills a whole number of rows with no leftover cells", () => {
    const cells = GALLERY_PHOTOS.reduce((n, p) => n + columnSpan(p), 0);
    expect(cells % COLLAGE_COLUMNS).toBe(0);
    // Six columns across three rows is what the CSS declares.
    expect(cells / COLLAGE_COLUMNS).toBe(3);
  });

  it("never lets a wide photo straddle a row boundary", () => {
    // CSS grid would wrap a span-2 tile that cannot fit in the columns left in
    // its row, leaving a visible hole in the collage.
    let col = 0;
    for (const photo of GALLERY_PHOTOS) {
      const span = columnSpan(photo);
      expect(
        col % COLLAGE_COLUMNS <= COLLAGE_COLUMNS - span,
        `${photo.id} would wrap at column ${col % COLLAGE_COLUMNS}`,
      ).toBe(true);
      col += span;
    }
  });

  it("keeps resting tilts small", () => {
    for (const photo of GALLERY_PHOTOS) {
      expect(Math.abs(photo.layout.rotate), photo.id).toBeLessThanOrEqual(3);
    }
  });

  it("gives every photo a valid entry direction", () => {
    for (const photo of GALLERY_PHOTOS) {
      expect(["left", "right", "top", "bottom"], photo.id).toContain(
        photo.layout.from,
      );
    }
  });

  it("is deterministic — the module exports a fixed order", () => {
    const first = GALLERY_PHOTOS.map((p) => `${p.id}:${columnSpan(p)}`);
    const second = GALLERY_PHOTOS.map((p) => `${p.id}:${columnSpan(p)}`);
    expect(first).toEqual(second);
    expect(first[0]).toBe("grouppic3:2");
    expect(first).toHaveLength(14);
  });
});

describe("intro photo", () => {
  it("is ohhellnaw", () => {
    expect(INTRO_PHOTO.src).toMatch(/ohhellnaw\.png$/);
  });

  it("is NOT one of the collage tiles", () => {
    expect(GALLERY_PHOTOS.map((p) => p.id)).not.toContain("ohhellnaw");
    expect(GALLERY_PHOTOS.some((p) => p.src.includes("ohhellnaw"))).toBe(false);
  });

  it("exists on disk with the dimensions it declares", () => {
    const file = path.join(PUBLIC_DIR, INTRO_PHOTO.src.replace(/^\//, ""));
    expect(existsSync(file)).toBe(true);
    expect(intrinsicSize(file)).toEqual({
      width: INTRO_PHOTO.width,
      height: INTRO_PHOTO.height,
    });
  });

  it("has non-empty alt text that names nobody", () => {
    expect(INTRO_PHOTO.alt.trim().length).toBeGreaterThan(0);
    expect(INTRO_PHOTO.alt).not.toMatch(/\b(Abrar|Jared)\b/);
  });

  it("leaves as soon as the spin finishes — no dead hold", () => {
    expect(INTRO_SPIN_MS).toBe(1500);
  });
});

describe("every supplied asset is still used", () => {
  it("covers all fifteen files across the collage and the intro", () => {
    const used = [
      ...GALLERY_PHOTOS.map((p) => p.src),
      INTRO_PHOTO.src,
    ].map((src) => src.split("/").pop()!.replace(/\.\w+$/, ""));
    expect(new Set(used).size).toBe(15);
    expect([...used].sort()).toEqual([...REQUIRED, "ohhellnaw"].sort());
  });
});

describe("aspect ratios", () => {
  it("mixes orientations rather than forcing one shape", () => {
    const ratios = GALLERY_PHOTOS.map(aspectRatio);
    expect(ratios.some((r) => r > 1)).toBe(true);
    expect(ratios.some((r) => r < 1)).toBe(true);
    expect(ratios.every((r) => r > 0)).toBe(true);
  });
});

describe("hasDetails", () => {
  const base = GALLERY_PHOTOS[0];

  it("is false while both caption fields are blank", () => {
    expect(hasDetails({ ...base, title: "", description: "" })).toBe(false);
  });

  it("is true as soon as either field is filled in", () => {
    for (const field of ["title", "description"] as const) {
      expect(
        hasDetails({ ...base, title: "", description: "", [field]: "something" }),
        field,
      ).toBe(true);
    }
  });
});
