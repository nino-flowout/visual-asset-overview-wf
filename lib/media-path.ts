import { realpath } from "node:fs/promises";
import path from "node:path";
import { MEDIA_EXTENSIONS, extensionOf } from "@/lib/media-types";

export class MediaPathError extends Error {
  readonly status: 400 | 404;

  constructor(message: string, status: 400 | 404 = 400) {
    super(message);
    this.name = "MediaPathError";
    this.status = status;
  }
}

/**
 * Resolve a project-relative media path and refuse anything outside the export root.
 * Symlinks are resolved and rejected when they land outside that root.
 */
export async function resolveInsideRoot(
  root: string,
  relativePath: string,
): Promise<string> {
  if (
    !relativePath ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    path.win32.isAbsolute(relativePath)
  ) {
    throw new MediaPathError("Invalid path.");
  }

  const normalized = path.posix.normalize(relativePath.replaceAll("\\", "/"));
  if (
    !normalized ||
    normalized === "." ||
    normalized.startsWith("../") ||
    normalized === ".." ||
    normalized.startsWith("/") ||
    normalized.split("/").includes("..")
  ) {
    throw new MediaPathError("Invalid path.");
  }

  if (!MEDIA_EXTENSIONS.has(extensionOf(normalized))) {
    throw new MediaPathError("Invalid path.");
  }

  const rootReal = await realpath(root);
  const absolute = path.resolve(rootReal, ...normalized.split("/"));
  let realFile: string;
  try {
    realFile = await realpath(absolute);
  } catch {
    throw new MediaPathError("File not found.", 404);
  }

  const prefix = rootReal.endsWith(path.sep) ? rootReal : `${rootReal}${path.sep}`;
  if (realFile !== rootReal && !realFile.startsWith(prefix)) {
    throw new MediaPathError("Invalid path.");
  }

  return realFile;
}
