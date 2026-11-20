/** Folder paths and local file bytes stay on this machine. */
export function isLocalDev(): boolean {
  if (process.env.VERCEL) return false;
  if (process.env.NODE_ENV === "production") return false;
  return true;
}
