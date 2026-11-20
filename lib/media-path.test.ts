import { mkdtemp, mkdir, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MediaPathError, resolveInsideRoot } from "@/lib/media-path";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("resolveInsideRoot", () => {
  it("returns a media file inside the export root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "vao-media-"));
    directories.push(root);
    await mkdir(path.join(root, "images"));
    const file = path.join(root, "images", "hero.jpg");
    await writeFile(file, "image");

    await expect(resolveInsideRoot(root, "images/hero.jpg")).resolves.toBe(await realpath(file));
  });

  it("rejects traversal, non-media files, and missing files", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "vao-media-"));
    directories.push(root);
    await mkdir(path.join(root, "images"));
    await writeFile(path.join(root, "index.html"), "<html></html>");

    await expect(resolveInsideRoot(root, "../secret.jpg")).rejects.toBeInstanceOf(MediaPathError);
    await expect(resolveInsideRoot(root, "index.html")).rejects.toBeInstanceOf(MediaPathError);
    await expect(resolveInsideRoot(root, "images/missing.jpg")).rejects.toMatchObject({
      status: 404,
    });
  });

  it("rejects a symlink that resolves outside the export root", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "vao-media-"));
    const outside = await mkdtemp(path.join(tmpdir(), "vao-outside-"));
    directories.push(root, outside);
    await mkdir(path.join(root, "images"));
    const secret = path.join(outside, "secret.jpg");
    await writeFile(secret, "nope");
    await symlink(secret, path.join(root, "images", "escape.jpg"));

    await expect(resolveInsideRoot(root, "images/escape.jpg")).rejects.toMatchObject({
      status: 400,
    });
  });
});
