import { describe, expect, it } from "vitest";
import { assetIssue, usageChips } from "@/lib/asset-label";
import { RED_MIN_BYTES, YELLOW_MIN_BYTES } from "@/lib/score";

const used = [{ context: "page" as const, location: "index.html" }];

describe("assetIssue", () => {
  it("uses the Paper labels", () => {
    expect(
      assetIssue({ type: "image", sizeBytes: 2_400_000, alt: "Harbor", usage: [] }),
    ).toBe("Unused");
    expect(
      assetIssue({
        type: "video",
        sizeBytes: RED_MIN_BYTES + 1,
        alt: null,
        usage: used,
      }),
    ).toBe("Oversized");
    expect(
      assetIssue({
        type: "image",
        sizeBytes: 980 * 1024,
        alt: null,
        usage: used,
      }),
    ).toBe("Missing alt");
    expect(
      assetIssue({
        type: "lottie",
        sizeBytes: YELLOW_MIN_BYTES,
        alt: null,
        usage: used,
      }),
    ).toBe("Heavy Lottie");
    expect(
      assetIssue({ type: "image", sizeBytes: 42 * 1024, alt: "Icon", usage: used }),
    ).toBe("Optimized");
  });
});

describe("usageChips", () => {
  it("shows an em dash when nothing uses the asset", () => {
    expect(usageChips([])).toEqual(["—"]);
  });

  it("turns the homepage into Home and keeps CMS separate", () => {
    expect(
      usageChips([
        { context: "page", location: "index.html" },
        { context: "cms", location: "blog/post.html" },
      ]),
    ).toEqual(["Home", "CMS", "post"]);
  });
});
