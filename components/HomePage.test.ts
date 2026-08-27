import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

import HomePage from "./HomePage";

describe("HomePage ProgSU links", () => {
  it("offers the requested website link on desktop and mobile", () => {
    const html = renderToStaticMarkup(
      createElement(HomePage, { onNavigate: vi.fn() }),
    );
    const progsuLinks = html.match(
      /<a[^>]*href="https:\/\/www\.progsu\.com"[^>]*>\s*click proggy to check us out\s*<\/a>/g,
    );

    expect(progsuLinks ?? []).toHaveLength(2);
  });
});
