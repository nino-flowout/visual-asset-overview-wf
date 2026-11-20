import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { countByStatus } from "@/lib/inventory";
import type { ProjectStore, ProjectSummary, StoredProject } from "@/lib/store/types";

const SITE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isSafeSiteId(siteId: string): boolean {
  return siteId.length > 0 && siteId.length <= 80 && SITE_ID.test(siteId);
}

function isStoredProject(value: unknown): value is StoredProject {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<StoredProject>;
  const inventory = record.inventory;
  return Boolean(
    inventory &&
      typeof inventory === "object" &&
      typeof inventory.siteId === "string" &&
      Array.isArray(inventory.assets),
  );
}

export function createLocalJsonStore(directory: string): ProjectStore {
  async function fileFor(siteId: string): Promise<string> {
    if (!isSafeSiteId(siteId)) {
      throw new Error(`Invalid siteId: ${siteId}`);
    }
    return path.join(directory, `${siteId}.json`);
  }

  return {
    async list() {
      let names: string[];
      try {
        names = await readdir(directory);
      } catch (error) {
        if (isMissing(error)) return [];
        throw error;
      }

      const summaries: ProjectSummary[] = [];
      for (const name of names) {
        if (!name.endsWith(".json")) continue;
        try {
          const raw = await readFile(path.join(directory, name), "utf8");
          const parsed: unknown = JSON.parse(raw);
          if (!isStoredProject(parsed)) continue;
          summaries.push(toSummary(parsed));
        } catch {
          continue;
        }
      }

      summaries.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
      return summaries;
    },

    async get(siteId) {
      if (!isSafeSiteId(siteId)) return null;
      try {
        const raw = await readFile(await fileFor(siteId), "utf8");
        const parsed: unknown = JSON.parse(raw);
        if (!isStoredProject(parsed)) return null;
        return parsed;
      } catch (error) {
        if (isMissing(error)) return null;
        throw error;
      }
    },

    async save(project) {
      if (!isSafeSiteId(project.inventory.siteId)) {
        throw new Error(`Invalid siteId: ${project.inventory.siteId}`);
      }
      await mkdir(directory, { recursive: true });
      const file = await fileFor(project.inventory.siteId);
      await writeFile(file, `${JSON.stringify(project, null, 2)}\n`, "utf8");
    },
  };
}

function toSummary(project: StoredProject): ProjectSummary {
  return {
    siteId: project.inventory.siteId,
    siteName: project.inventory.siteName,
    scannedAt: project.inventory.scannedAt,
    assetCount: project.inventory.assets.length,
    counts: countByStatus(project.inventory.assets),
  };
}

function isMissing(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
