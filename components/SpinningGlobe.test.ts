import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import SpinningGlobe from "./SpinningGlobe";
import { WORLD_HEIGHT, WORLD_PATH, WORLD_WIDTH } from "@/lib/worldPath";

const html = (props = {}) =>
  renderToStaticMarkup(createElement(SpinningGlobe, props));

describe("world path data", () => {
  it("is a map, not a stub", () => {
    // One subpath per landmass. If simplification is ever retuned too hard
    // this is what notices.
    const rings = WORLD_PATH.split("M").length - 1;
    expect(rings).toBeGreaterThan(120);
  });

  it("is twice as wide as it is tall, which is what makes a hemisphere fit", () => {
    expect(WORLD_WIDTH).toBe(WORLD_HEIGHT * 2);
  });

  it("stays inside its declared box", () => {
    // Every coordinate has to sit in 0..WIDTH by 0..HEIGHT, or the map bleeds
    // out of the window and the two copies stop lining up.
    const nums = WORLD_PATH.match(/-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?/g) ?? [];
    expect(nums.length).toBeGreaterThan(1000);
    let maxX = 0;
    let maxY = 0;
    for (const pair of nums) {
      const [x, y] = pair.split(",").map(Number);
      expect(Number.isFinite(x) && Number.isFinite(y), pair).toBe(true);
      expect(x, `x out of range in "${pair}"`).toBeGreaterThanOrEqual(0);
      expect(y, `y out of range in "${pair}"`).toBeGreaterThanOrEqual(0);
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
    expect(maxX).toBeLessThanOrEqual(WORLD_WIDTH);
    expect(maxY).toBeLessThanOrEqual(WORLD_HEIGHT);
    // And it really does span the box, rather than hiding in one corner.
    expect(maxX).toBeGreaterThan(WORLD_WIDTH * 0.9);
    expect(maxY).toBeGreaterThan(WORLD_HEIGHT * 0.8);
  });
});

describe("SpinningGlobe", () => {
  it("draws countries rather than a lat/long wireframe", () => {
    const out = html();
    expect(out).toContain("<path");
    // The old icon was meridians: full-height ellipses with an animated rx.
    expect(out).not.toContain('ry="47"');
    expect(out).not.toContain('attributeName="rx"');
  });

  it("lays two copies of the map end to end so the loop has no seam", () => {
    const out = html();
    const copies = out.split(WORLD_PATH).length - 1;
    expect(copies).toBe(2);
    // The second sits exactly one map-width right of the first.
    expect(out).toContain(`translate(${50 - WORLD_HEIGHT / 2} 0)`);
    expect(out).toContain(`translate(${50 - WORLD_HEIGHT / 2 + WORLD_WIDTH} 0)`);
  });

  it("travels exactly one map width per turn, so the seam never shows", () => {
    const out = html({ spin: 7 });
    expect(out).toContain(`to="${-WORLD_WIDTH} 0"`);
    expect(out).toContain('dur="7s"');
  });

  it("gives each instance its own gradient ids", () => {
    // Both globes render in the same tree on the home page — desktop layout and
    // mobile layout. Shared ids would make one reference the other's defs, so
    // this has to render them together rather than one at a time.
    const out = renderToStaticMarkup(
      createElement(
        "div",
        null,
        createElement(SpinningGlobe, { key: "a" }),
        createElement(SpinningGlobe, { key: "b" }),
      ),
    );
    const ids = out.match(/id="globe-[a-z]+-[^"]+"/g) ?? [];
    expect(ids.length).toBeGreaterThan(4);
    expect(new Set(ids).size, "two globes are sharing gradient ids").toBe(ids.length);
  });
});
