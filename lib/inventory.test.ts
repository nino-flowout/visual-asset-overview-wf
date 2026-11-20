import { describe, expect, it } from "vitest";
import { matchesUsage, sortBySize } from "@/lib/inventory";

const assets = [
  { name: "b.png", sizeBytes: 20 },
  { name: "a.png", sizeBytes: 20 },
  { name: "large.png", sizeBytes: 300 },
  { name: "unknown.png", sizeBytes: null },
  { name: "tiny.png", sizeBytes: 5 },
];

const page = { context: "page" as const, location: "index.html" };
const cms = { context: "cms" as const, location: "blog/post.html" };
const code = { context: "custom-code" as const, location: "js/app.js" };

describe("matchesUsage", () => {
  it("keeps every asset when no usage filter is set", () => {
    expect(matchesUsage({ usage: [] }, undefined)).toBe(true);
    expect(matchesUsage({ usage: [page] }, undefined)).toBe(true);
  });

  it("matches each context, including an asset used in more than one", () => {
    const both = { usage: [page, cms] };
    expect(matchesUsage(both, "page")).toBe(true);
    expect(matchesUsage(both, "cms")).toBe(true);
    expect(matchesUsage({ usage: [code] }, "custom-code")).toBe(true);
    expect(matchesUsage({ usage: [page] }, "cms")).toBe(false);
  });

  it("treats an empty reference list as unused", () => {
    expect(matchesUsage({ usage: [] }, "unused")).toBe(true);
    expect(matchesUsage({ usage: [page] }, "unused")).toBe(false);
  });
});

describe("sortBySize", () => {
  it("orders largest first and keeps unknown sizes last", () => {
    expect(sortBySize(assets, "desc").map((asset) => asset.name)).toEqual([
      "large.png",
      "a.png",
      "b.png",
      "tiny.png",
      "unknown.png",
    ]);
  });

  it("orders smallest first and keeps unknown sizes last", () => {
    expect(sortBySize(assets, "asc").map((asset) => asset.name)).toEqual([
      "tiny.png",
      "a.png",
      "b.png",
      "large.png",
      "unknown.png",
    ]);
  });

  it("does not change the original list", () => {
    sortBySize(assets, "asc");
    expect(assets.map((asset) => asset.name)).toEqual([
      "b.png",
      "a.png",
      "large.png",
      "unknown.png",
      "tiny.png",
    ]);
  });
});
