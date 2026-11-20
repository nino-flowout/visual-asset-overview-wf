import { scoreAsset } from "@/lib/score";

export type AssetType = "image" | "video" | "lottie";
export type UsageContext = "page" | "cms" | "custom-code";
export type HealthStatus = "red" | "yellow" | "green";

export interface AssetUsage {
  context: UsageContext;
  location: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  sizeBytes: number | null;
  /** Original absolute URL from the export, when the reference was remote. */
  url: string | null;
  /** Path relative to the export root, when the file is part of the export. */
  path: string | null;
  alt: string | null;
  usage: AssetUsage[];
  status: HealthStatus;
}

export interface ProjectInventory {
  siteId: string;
  siteName: string;
  scannedAt: string;
  assets: Asset[];
}

export type AssetDraft = Omit<Asset, "status">;

export function withStatus(asset: AssetDraft): Asset {
  return {
    ...asset,
    status: scoreAsset(asset),
  };
}

export function countByStatus(
  assets: Pick<Asset, "status">[],
): Record<HealthStatus, number> {
  const counts: Record<HealthStatus, number> = { red: 0, yellow: 0, green: 0 };
  for (const asset of assets) {
    counts[asset.status] += 1;
  }
  return counts;
}

/** Filesystem-safe id. Later hosts can keep using this as the project key. */
export function toSiteId(value: string): string {
  const slug = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "project";
}
