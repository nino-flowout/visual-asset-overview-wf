import { describe, expect, it } from "vitest";
import { withStatus } from "@/lib/inventory";
import { RED_MIN_BYTES, YELLOW_MIN_BYTES, scoreAsset } from "@/lib/score";

const used = [{ context: "page", location: "index.html" }];

function score(overrides: {
  type?: "image" | "video" | "lottie";
  sizeBytes?: number | null;
  alt?: string | null;
  usage?: readonly unknown[];
}) {
  return scoreAsset({
    type: overrides.type ?? "image",
    sizeBytes: overrides.sizeBytes === undefined ? 1000 : overrides.sizeBytes,
    alt: overrides.alt === undefined ? "Harbor" : overrides.alt,
    usage: overrides.usage ?? used,
  });
}

describe("scoreAsset", () => {
  it("marks unused assets red, ahead of size and alt text", () => {
    expect(score({ usage: [], sizeBytes: 100, alt: "Harbor" })).toBe("red");
    expect(score({ usage: [], sizeBytes: YELLOW_MIN_BYTES, alt: "" })).toBe(
      "red",
    );
  });

  it("marks files above 1.5 MB red and exactly 1.5 MB yellow", () => {
    expect(score({ sizeBytes: RED_MIN_BYTES + 1 })).toBe("red");
    expect(score({ sizeBytes: RED_MIN_BYTES })).toBe("yellow");
  });

  it("marks files from 500 KB through 1.5 MB yellow", () => {
    expect(score({ sizeBytes: YELLOW_MIN_BYTES })).toBe("yellow");
    expect(score({ sizeBytes: YELLOW_MIN_BYTES - 1 })).toBe("green");
  });

  it("marks a used image with missing alt text yellow", () => {
    expect(score({ alt: null, sizeBytes: 100 })).toBe("yellow");
    expect(score({ alt: "", sizeBytes: 100 })).toBe("yellow");
    expect(score({ alt: "   ", sizeBytes: 100 })).toBe("yellow");
  });

  it("does not require alt text on video or lottie", () => {
    expect(score({ type: "video", alt: null, sizeBytes: 100 })).toBe("green");
    expect(score({ type: "lottie", alt: null, sizeBytes: 100 })).toBe("green");
  });

  it("does not treat an unknown size as oversized", () => {
    expect(score({ sizeBytes: null, alt: "Harbor" })).toBe("green");
    expect(score({ sizeBytes: null, alt: null })).toBe("yellow");
  });

  it("marks a small, used, described image green", () => {
    expect(score({ sizeBytes: 42_000, alt: "Team portrait" })).toBe("green");
  });
});

describe("withStatus", () => {
  it("copies the draft and stores the scored status", () => {
    const asset = withStatus({
      id: "abc",
      name: "hero.jpg",
      type: "image",
      sizeBytes: 100,
      url: null,
      path: "images/hero.jpg",
      alt: null,
      usage: [],
    });

    expect(asset.status).toBe("red");
    expect(asset.path).toBe("images/hero.jpg");
  });
});
