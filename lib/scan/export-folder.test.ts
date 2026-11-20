import { mkdtemp, mkdir, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import type { Asset } from "@/lib/inventory";
import { RED_MIN_BYTES } from "@/lib/score";
import { ScanError, scanExportFolder } from "@/lib/scan/export-folder";

const directories: string[] = [];

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
  );
});

describe("scanExportFolder", () => {
  it("inventories a Webflow-style export and scores each asset", async () => {
    const root = await fixture();
    const { exportRoot, inventory } = await scanExportFolder({
      folderPath: root,
      siteName: "Northline Studio",
    });

    expect(exportRoot).toBe(await realpath(root));
    expect(inventory.siteId).toBe("northline-studio");
    expect(inventory.siteName).toBe("Northline Studio");

    const byName = new Map(inventory.assets.map((asset) => [asset.name, asset]));
    expect([...byName.keys()].sort()).toEqual([
      "bg.png",
      "cms.webp",
      "embed.gif",
      "hero-2x.jpg",
      "hero.jpg",
      "icon.svg",
      "missing-alt.jpg",
      "orphan.json",
      "oversized.jpg",
      "reel.mp4",
      "remote.png",
      "unused.png",
      "wave.json",
    ]);

    expect(byName.get("hero.jpg")).toMatchObject({
      type: "image",
      status: "green",
      alt: "Harbor at dusk",
      path: "images/hero.jpg",
      url: null,
      usage: [
        { context: "page", location: "blog/post.html" },
        { context: "page", location: "index.html" },
      ],
    });
    expect(byName.get("hero.jpg")?.sizeBytes).toBe(1000);

    expect(byName.get("missing-alt.jpg")).toMatchObject({
      status: "yellow",
      sizeBytes: null,
      alt: null,
      path: "images/missing-alt.jpg",
    });
    expect(byName.get("hero-2x.jpg")).toMatchObject({
      status: "green",
      sizeBytes: null,
      alt: "Harbor at dusk",
    });
    expect(byName.get("oversized.jpg")?.status).toBe("red");
    expect(byName.get("oversized.jpg")?.sizeBytes).toBe(RED_MIN_BYTES + 1);
    expect(byName.get("unused.png")).toMatchObject({ status: "red", usage: [] });
    expect(byName.get("bg.png")).toMatchObject({
      status: "yellow",
      usage: [{ context: "page", location: "css/site.css" }],
    });
    expect(byName.get("cms.webp")?.usage).toEqual([
      { context: "cms", location: "index.html" },
    ]);
    expect(byName.get("embed.gif")?.usage).toEqual([
      { context: "custom-code", location: "index.html" },
    ]);
    expect(byName.get("icon.svg")).toMatchObject({
      type: "image",
      status: "yellow",
      usage: [{ context: "custom-code", location: "js/app.js" }],
    });
    expect(byName.get("reel.mp4")).toMatchObject({ type: "video", status: "green", alt: null });
    expect(byName.get("wave.json")).toMatchObject({ type: "lottie", status: "green" });
    expect(byName.get("orphan.json")).toMatchObject({
      type: "lottie",
      status: "red",
      usage: [],
    });
    expect(byName.get("remote.png")).toMatchObject({
      status: "green",
      path: null,
      url: "https://cdn.example.com/remote.png",
      sizeBytes: null,
    });

    expect(names(inventory.assets)).not.toContain("settings.json");
    expect(names(inventory.assets)).not.toContain("package.json");
    expect(names(inventory.assets)).not.toContain("a.woff2");
  });

  it("rejects a path that is not a directory", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "vao-scan-"));
    directories.push(root);
    const file = path.join(root, "notes.txt");
    await writeFile(file, "nope");

    await expect(scanExportFolder({ folderPath: file })).rejects.toBeInstanceOf(ScanError);
    await expect(scanExportFolder({ folderPath: path.join(root, "missing") })).rejects.toThrow(
      /Folder not found/,
    );
  });
});

function names(assets: Asset[]): string[] {
  return assets.map((asset) => asset.name);
}

async function fixture(): Promise<string> {
  const root = await mkdtemp(path.join(tmpdir(), "vao-export-"));
  directories.push(root);
  await mkdir(path.join(root, "images"), { recursive: true });
  await mkdir(path.join(root, "videos"), { recursive: true });
  await mkdir(path.join(root, "css"), { recursive: true });
  await mkdir(path.join(root, "js"), { recursive: true });
  await mkdir(path.join(root, "blog"), { recursive: true });
  await mkdir(path.join(root, "fonts"), { recursive: true });
  await mkdir(path.join(root, "data"), { recursive: true });

  await writeFile(path.join(root, "images", "hero.jpg"), Buffer.alloc(1000));
  await writeFile(path.join(root, "images", "unused.png"), Buffer.alloc(10));
  await writeFile(path.join(root, "images", "bg.png"), Buffer.alloc(600 * 1024));
  await writeFile(path.join(root, "images", "cms.webp"), Buffer.alloc(100));
  await writeFile(path.join(root, "images", "embed.gif"), Buffer.alloc(80));
  await writeFile(path.join(root, "images", "icon.svg"), "<svg xmlns='http://www.w3.org/2000/svg'/>");
  await writeFile(path.join(root, "images", "oversized.jpg"), Buffer.alloc(RED_MIN_BYTES + 1));
  await writeFile(
    path.join(root, "images", "wave.json"),
    JSON.stringify({ v: "5.7.0", layers: [] }),
  );
  await writeFile(
    path.join(root, "images", "orphan.json"),
    JSON.stringify({ v: "5.7.0", layers: [{ ty: 1 }] }),
  );
  await writeFile(path.join(root, "videos", "reel.mp4"), Buffer.alloc(120));
  await writeFile(path.join(root, "fonts", "a.woff2"), Buffer.alloc(20));
  await writeFile(path.join(root, "data", "settings.json"), JSON.stringify({ name: "nope" }));
  await writeFile(path.join(root, "package.json"), JSON.stringify({ name: "export" }));
  await writeFile(
    path.join(root, "css", "site.css"),
    '@font-face{src:url("../fonts/a.woff2")}body{background:url("../images/bg.png")}',
  );
  await writeFile(
    path.join(root, "js", "app.js"),
    'const icon = "images/icon.svg";\nconst config = "data/settings.json";\n',
  );
  await writeFile(
    path.join(root, "index.html"),
    `<!doctype html>
<html><body>
  <img src="images/hero.jpg" srcset="images/hero.jpg 1x, images/hero-2x.jpg 2x" alt="Harbor at dusk">
  <img src="images/missing-alt.jpg" alt="">
  <img src="images/oversized.jpg" alt="Too heavy">
  <img src="https://cdn.example.com/remote.png" alt="Remote">
  <img src="../../outside.png" alt="Escape">
  <video src="videos/reel.mp4">
    <source src="videos/reel.mp4" type="video/mp4">
  </video>
  <div data-animation-type="lottie" data-src="images/wave.json"></div>
  <div class="w-dyn-list"><div class="w-dyn-item">
    <img src="images/cms.webp" alt="CMS photo">
  </div></div>
  <div class="w-embed"><img src="images/embed.gif" alt="Embed"></div>
</body></html>`,
  );
  await writeFile(
    path.join(root, "blog", "post.html"),
    '<img src="../images/hero.jpg" alt="Harbor at dusk">',
  );
  return root;
}
