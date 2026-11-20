import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { ProjectInventory } from "@/lib/inventory";
import { createLocalJsonStore } from "@/lib/store/local-json";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

function inventory(overrides: Partial<ProjectInventory> = {}): ProjectInventory {
  return {
    siteId: "northline",
    siteName: "Northline Studio",
    scannedAt: "2026-11-20T12:00:00.000Z",
    assets: [],
    ...overrides,
  };
}

describe("createLocalJsonStore", () => {
  it("saves, lists, and reloads a project without exposing the export root via the summary", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "vao-store-"));
    directories.push(directory);
    const store = createLocalJsonStore(directory);

    await store.save({
      exportRoot: "/tmp/exports/northline",
      inventory: inventory({
        assets: [
          {
            id: "a",
            name: "hero.jpg",
            type: "image",
            sizeBytes: 10,
            url: null,
            path: "images/hero.jpg",
            alt: null,
            usage: [],
            status: "red",
          },
        ],
      }),
    });
    await store.save({
      exportRoot: "/tmp/exports/harbor",
      inventory: inventory({
        siteId: "harbor",
        siteName: "Harbor CMS",
        scannedAt: "2026-11-19T12:00:00.000Z",
      }),
    });

    const listed = await store.list();
    expect(listed.map((item) => item.siteId)).toEqual(["northline", "harbor"]);
    expect(listed[0]).toMatchObject({
      siteName: "Northline Studio",
      assetCount: 1,
      counts: { red: 1, yellow: 0, green: 0 },
    });
    expect(listed[0]).not.toHaveProperty("exportRoot");

    const loaded = await store.get("northline");
    expect(loaded?.exportRoot).toBe("/tmp/exports/northline");
    expect(loaded?.inventory.assets).toHaveLength(1);
  });

  it("rejects a site id that could escape the data directory", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "vao-store-"));
    directories.push(directory);
    const store = createLocalJsonStore(directory);

    await expect(
      store.save({
        exportRoot: null,
        inventory: inventory({ siteId: "../secret" }),
      }),
    ).rejects.toThrow(/Invalid siteId/);

    expect(await store.get("../secret")).toBeNull();
    expect(await store.get("missing")).toBeNull();
  });
});
