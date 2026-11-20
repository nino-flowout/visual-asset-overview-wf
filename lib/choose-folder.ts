import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

const CHOOSE_FOLDER =
  'POSIX path of (choose folder with prompt "Select a Webflow export folder")';

/** Trim the POSIX path AppleScript returns. Keeps the filesystem root intact. */
export function cleanChosenPath(stdout: string): string | null {
  const trimmed = stdout.trim();
  if (!trimmed) return null;
  if (trimmed === "/") return "/";
  return trimmed.replace(/\/+$/, "");
}

export function isFolderChoiceCancelled(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { stderr?: unknown; message?: unknown };
  const text = `${asText(record.stderr)}\n${asText(record.message)}`;
  return text.includes("User canceled") || text.includes("-128");
}

function asText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Buffer.isBuffer(value)) return value.toString("utf8");
  return "";
}

/**
 * Opens the macOS folder dialog and returns the selected path.
 * Returns null when the user cancels. Local development only.
 */
export async function chooseExportFolder(): Promise<string | null> {
  if (process.platform !== "darwin") {
    throw new Error("Browse is available on macOS, where this app can open the folder dialog.");
  }

  try {
    const { stdout } = await execFileAsync("osascript", ["-e", CHOOSE_FOLDER]);
    return cleanChosenPath(stdout);
  } catch (error) {
    if (isFolderChoiceCancelled(error)) return null;
    throw error;
  }
}
