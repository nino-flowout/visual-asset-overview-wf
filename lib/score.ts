import type { AssetType, HealthStatus } from "@/lib/inventory";

/** Yellow starts at 500 KB, inclusive. */
export const YELLOW_MIN_BYTES = 500 * 1024;

/**
 * Red starts strictly above 1.5 MB.
 * A file of exactly 1.5 MB stays yellow.
 */
export const RED_MIN_BYTES = Math.round(1.5 * 1024 * 1024);

export interface ScoreInput {
  type: AssetType;
  sizeBytes: number | null;
  alt: string | null;
  usage: readonly unknown[];
}

/**
 * Proposal rules, in priority order:
 * red when unused or larger than 1.5 MB;
 * yellow from 500 KB through 1.5 MB, or when an image has no alt text;
 * green when the asset is used and neither size nor alt text raises it.
 * Unknown size does not trigger a size threshold.
 */
export function scoreAsset(asset: ScoreInput): HealthStatus {
  if (asset.usage.length === 0) return "red";
  if (asset.sizeBytes != null && asset.sizeBytes > RED_MIN_BYTES) return "red";
  if (asset.sizeBytes != null && asset.sizeBytes >= YELLOW_MIN_BYTES) {
    return "yellow";
  }
  if (asset.type === "image" && !asset.alt?.trim()) return "yellow";
  return "green";
}
