import type { Asset, AssetUsage } from "@/lib/inventory";
import { RED_MIN_BYTES, YELLOW_MIN_BYTES } from "@/lib/score";

/** Short reason under the filename, using the words from the Paper grid. */
export function assetIssue(
  asset: Pick<Asset, "type" | "sizeBytes" | "alt" | "usage">,
): string {
  if (asset.usage.length === 0) return "Unused";
  if (asset.sizeBytes != null && asset.sizeBytes > RED_MIN_BYTES) return "Oversized";
  if (asset.type === "image" && !asset.alt?.trim()) return "Missing alt";
  if (
    asset.type === "lottie" &&
    asset.sizeBytes != null &&
    asset.sizeBytes >= YELLOW_MIN_BYTES
  ) {
    return "Heavy Lottie";
  }
  if (asset.sizeBytes != null && asset.sizeBytes >= YELLOW_MIN_BYTES) return "Heavy file";
  return "Optimized";
}

/** Up to three short chips. An unused asset gets the em dash from the design. */
export function usageChips(usage: readonly AssetUsage[]): string[] {
  if (usage.length === 0) return ["—"];

  const chips: string[] = [];
  for (const item of usage) {
    if (item.context === "cms") pushChip(chips, "CMS");
    if (item.context === "custom-code") pushChip(chips, "Custom code");
    pushChip(chips, pageChip(item.location));
    if (chips.length >= 3) break;
  }
  return chips.slice(0, 3);
}

function pushChip(chips: string[], label: string) {
  const key = label.toLowerCase();
  if (chips.some((chip) => chip.toLowerCase() === key)) return;
  chips.push(label);
}

function pageChip(location: string): string {
  const base = location.split("/").pop()?.replace(/\.(html|css|js|mjs)$/i, "") ?? location;
  if (!base || base === "index") return "Home";
  return base.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
