import { describe, expect, it } from "vitest";
import { mediaUrl } from "@/lib/media-url";

describe("mediaUrl", () => {
  it("points local files at the media route", () => {
    expect(
      mediaUrl({ path: "images/hero.jpg", url: null }, "northline"),
    ).toBe("/api/media?projectId=northline&path=images%2Fhero.jpg");
  });

  it("prefers the local path when a remote url is also stored", () => {
    expect(
      mediaUrl(
        { path: "images/hero.jpg", url: "https://cdn.example.com/hero.jpg" },
        "northline",
      ),
    ).toBe("/api/media?projectId=northline&path=images%2Fhero.jpg");
  });

  it("returns remote urls unchanged", () => {
    expect(
      mediaUrl({ path: null, url: "https://cdn.example.com/remote.png" }, "northline"),
    ).toBe("https://cdn.example.com/remote.png");
  });

  it("returns null when there is nothing to show", () => {
    expect(mediaUrl({ path: null, url: null }, "northline")).toBeNull();
    expect(mediaUrl({ path: null, url: "/images/hero.jpg" }, "northline")).toBeNull();
  });
});
