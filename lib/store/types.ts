import type { HealthStatus, ProjectInventory } from "@/lib/inventory";

export interface ProjectSummary {
  siteId: string;
  siteName: string;
  scannedAt: string;
  assetCount: number;
  counts: Record<HealthStatus, number>;
}

/** `exportRoot` is local metadata. It is not part of the inventory the UI scores. */
export interface StoredProject {
  exportRoot: string | null;
  inventory: ProjectInventory;
}

export interface ProjectStore {
  list(): Promise<ProjectSummary[]>;
  get(siteId: string): Promise<StoredProject | null>;
  save(project: StoredProject): Promise<void>;
}
