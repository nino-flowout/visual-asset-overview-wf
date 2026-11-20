import { describe, expect, it } from "vitest";
import { cleanChosenPath, isFolderChoiceCancelled } from "@/lib/choose-folder";

describe("cleanChosenPath", () => {
  it("drops the trailing slash AppleScript adds", () => {
    expect(cleanChosenPath("/tmp/vao-demo-export/\n")).toBe("/tmp/vao-demo-export");
  });

  it("keeps the filesystem root", () => {
    expect(cleanChosenPath("/\n")).toBe("/");
  });

  it("returns null for an empty result", () => {
    expect(cleanChosenPath("  \n")).toBeNull();
  });
});

describe("isFolderChoiceCancelled", () => {
  it("recognizes the AppleScript cancel error", () => {
    expect(
      isFolderChoiceCancelled({
        stderr: Buffer.from("execution error: User canceled. (-128)\n"),
        message: "Command failed",
      }),
    ).toBe(true);
  });

  it("does not treat other failures as a cancel", () => {
    expect(isFolderChoiceCancelled(new Error("osascript not found"))).toBe(false);
  });
});
