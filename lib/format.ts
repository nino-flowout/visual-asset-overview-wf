export function formatBytes(size: number | null): string {
  if (size == null) return "Unknown";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) {
    const kb = size / 1024;
    return `${kb >= 10 ? kb.toFixed(0) : kb.toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}
