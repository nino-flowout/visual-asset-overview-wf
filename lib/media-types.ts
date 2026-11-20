import type { AssetType } from "@/lib/inventory";

export const IMAGE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".avif",
  ".ico",
] as const;

export const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".ogv"] as const;

export const LOTTIE_EXTENSIONS = [".json", ".lottie"] as const;

export const MEDIA_EXTENSIONS = new Set<string>([
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...LOTTIE_EXTENSIONS,
]);

const IMAGE_SET = new Set<string>(IMAGE_EXTENSIONS);
const VIDEO_SET = new Set<string>(VIDEO_EXTENSIONS);

export function extensionOf(value: string): string {
  const withoutQuery = value.split("?")[0]?.split("#")[0] ?? value;
  const base = withoutQuery.split("/").pop() ?? withoutQuery;
  const dot = base.lastIndexOf(".");
  if (dot <= 0) return "";
  return base.slice(dot).toLowerCase();
}

/** `.json` is not typed here. It becomes lottie only after a content sniff. */
export function typeFromExtension(ext: string): AssetType | null {
  if (IMAGE_SET.has(ext)) return "image";
  if (VIDEO_SET.has(ext)) return "video";
  if (ext === ".lottie") return "lottie";
  return null;
}

export function contentTypeFor(ext: string): string {
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".svg":
      return "image/svg+xml";
    case ".avif":
      return "image/avif";
    case ".ico":
      return "image/x-icon";
    case ".mp4":
      return "video/mp4";
    case ".webm":
      return "video/webm";
    case ".mov":
      return "video/quicktime";
    case ".ogv":
      return "video/ogg";
    case ".json":
      return "application/json";
    case ".lottie":
      return "application/zip";
    default:
      return "application/octet-stream";
  }
}
