import { createHash } from "node:crypto";
import { lstat, open, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import * as cheerio from "cheerio";
import { glob } from "fast-glob";
import {
  toSiteId,
  withStatus,
  type Asset,
  type AssetType,
  type AssetUsage,
  type ProjectInventory,
  type UsageContext,
} from "@/lib/inventory";
import {
  MEDIA_EXTENSIONS,
  extensionOf,
  typeFromExtension,
} from "@/lib/media-types";

const TEXT_EXTENSIONS = new Set([".html", ".htm", ".css", ".js", ".mjs"]);
const MAX_TEXT_BYTES = 8 * 1024 * 1024;

export class ScanError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScanError";
  }
}

export interface ScanResult {
  exportRoot: string;
  inventory: ProjectInventory;
}

interface Draft {
  path: string | null;
  url: string | null;
  type: AssetType;
  alt: string | null;
  lottieElement: boolean;
  json: boolean;
  usage: Map<string, AssetUsage>;
}

interface Reference {
  raw: string;
  fromFile: string;
  context: UsageContext;
  location: string;
  /** Document URLs resolve from the file. Script strings prefer a site-root path when that file exists. */
  source?: "document" | "script";
  alt?: string | null;
  lottieElement?: boolean;
  forceType?: AssetType;
}

export async function scanExportFolder(input: {
  folderPath: string;
  siteId?: string;
  siteName?: string;
}): Promise<ScanResult> {
  const root = await resolveExportRoot(input.folderPath);
  const files = await listFiles(root);
  const known = new Map<string, string>();
  for (const file of files) {
    known.set(file, file);
    known.set(file.toLowerCase(), file);
  }

  const drafts = new Map<string, Draft>();

  const add = (reference: Reference) => {
    recordReference(drafts, known, reference);
  };

  for (const file of files) {
    const ext = extensionOf(file);
    if (!TEXT_EXTENSIONS.has(ext)) continue;
    const text = await readText(absFromRel(root, file));
    if (text == null) continue;
    if (ext === ".html" || ext === ".htm") parseHtml(text, file, add);
    else if (ext === ".css") {
      for (const raw of extractUrls(text)) {
        add({ raw, fromFile: file, context: "page", location: file });
      }
    } else {
      for (const raw of extractQuotedPaths(text)) {
        add({
          raw,
          fromFile: file,
          context: "custom-code",
          location: file,
          source: "script",
        });
      }
    }
  }

  for (const file of files) {
    const ext = extensionOf(file);
    const type = ext === ".lottie" ? "lottie" : typeFromExtension(ext);
    if (type !== "image" && type !== "video" && type !== "lottie") continue;
    const key = `local:${file}`;
    if (drafts.has(key)) continue;
    const info = await lstat(absFromRel(root, file)).catch(() => null);
    if (!info?.isFile()) continue;
    drafts.set(key, emptyDraft({ path: file, url: null, type }));
  }

  for (const [key, draft] of drafts) {
    if (!(await keepDraft(root, draft))) drafts.delete(key);
  }

  for (const file of files) {
    if (extensionOf(file) !== ".json") continue;
    const key = `local:${file}`;
    if (drafts.has(key)) continue;
    if (!(await isLottieFile(absFromRel(root, file)))) continue;
    drafts.set(
      key,
      emptyDraft({ path: file, url: null, type: "lottie", json: true, lottieElement: false }),
    );
  }

  const assets: Asset[] = [];
  for (const [key, draft] of drafts) {
    assets.push(await toAsset(root, key, draft));
  }
  assets.sort((a, b) => a.name.localeCompare(b.name) || (a.path ?? "").localeCompare(b.path ?? ""));

  const folderName = path.basename(root);
  const siteName = input.siteName?.trim() || folderName;
  const inventory: ProjectInventory = {
    siteId: toSiteId(input.siteId?.trim() || siteName),
    siteName,
    scannedAt: new Date().toISOString(),
    assets,
  };

  return { exportRoot: root, inventory };
}

async function resolveExportRoot(folderPath: string): Promise<string> {
  const resolved = path.resolve(folderPath);
  try {
    const info = await stat(resolved);
    if (!info.isDirectory()) {
      throw new ScanError(`Not a directory: ${folderPath}`);
    }
    return await realpath(resolved);
  } catch (error) {
    if (error instanceof ScanError) throw error;
    if (isEnoent(error)) throw new ScanError(`Folder not found: ${folderPath}`);
    throw error;
  }
}

async function listFiles(root: string): Promise<string[]> {
  const found = await glob("**/*", {
    cwd: root,
    onlyFiles: true,
    dot: false,
    followSymbolicLinks: false,
    ignore: ["**/node_modules/**", "**/.git/**"],
  });
  return found.map((file) => file.split(path.sep).join("/")).sort();
}

function recordReference(
  drafts: Map<string, Draft>,
  known: Map<string, string>,
  reference: Reference,
): void {
  const raw = reference.raw.trim();
  if (!raw || /^(?:data|blob|javascript|mailto|tel):/i.test(raw)) return;

  if (isRemote(raw)) {
    const url = raw.startsWith("//") ? `https:${raw}` : raw;
    let ext = "";
    try {
      ext = extensionOf(new URL(url).pathname);
    } catch {
      return;
    }
    if (ext === ".json" && !reference.lottieElement) return;
    const type = reference.lottieElement
      ? "lottie"
      : (reference.forceType ?? typeFromExtension(ext));
    if (!type) return;
    const draft = ensureDraft(drafts, `remote:${url}`, {
      path: null,
      url,
      type,
      json: ext === ".json",
      lottieElement: Boolean(reference.lottieElement),
    });
    applyReference(draft, reference);
    return;
  }

  const relative = resolveLocal(reference, known);
  if (!relative) return;
  const canonical = relative;
  const ext = extensionOf(canonical);
  const json = ext === ".json";
  const type = reference.lottieElement
    ? "lottie"
    : (reference.forceType ?? typeFromExtension(ext) ?? (json ? "lottie" : null));
  if (!type) return;

  const draft = ensureDraft(drafts, `local:${canonical}`, {
    path: canonical,
    url: null,
    type,
    json,
    lottieElement: Boolean(reference.lottieElement),
  });
  applyReference(draft, reference);
}

function applyReference(draft: Draft, reference: Reference): void {
  if (reference.lottieElement) {
    draft.lottieElement = true;
    draft.type = "lottie";
  } else if (reference.forceType && !draft.lottieElement) {
    draft.type = reference.forceType;
  }
  const alt = reference.alt?.trim();
  if (alt && !draft.alt) draft.alt = alt;
  const key = `${reference.context}:${reference.location}`;
  draft.usage.set(key, { context: reference.context, location: reference.location });
}

function ensureDraft(
  drafts: Map<string, Draft>,
  key: string,
  init: {
    path: string | null;
    url: string | null;
    type: AssetType;
    json: boolean;
    lottieElement: boolean;
  },
): Draft {
  const existing = drafts.get(key);
  if (existing) return existing;
  const draft = emptyDraft(init);
  drafts.set(key, draft);
  return draft;
}

function emptyDraft(init: {
  path: string | null;
  url: string | null;
  type: AssetType;
  json?: boolean;
  lottieElement?: boolean;
}): Draft {
  return {
    path: init.path,
    url: init.url,
    type: init.type,
    alt: null,
    lottieElement: Boolean(init.lottieElement),
    json: Boolean(init.json),
    usage: new Map(),
  };
}

async function keepDraft(root: string, draft: Draft): Promise<boolean> {
  if (!draft.json) return true;
  if (draft.lottieElement) {
    draft.type = "lottie";
    return true;
  }
  if (!draft.path) return false;
  const lottie = await isLottieFile(absFromRel(root, draft.path));
  if (!lottie) return false;
  draft.type = "lottie";
  return true;
}

async function toAsset(root: string, key: string, draft: Draft): Promise<Asset> {
  let sizeBytes: number | null = null;
  if (draft.path) {
    const info = await lstat(absFromRel(root, draft.path)).catch(() => null);
    if (info?.isFile()) sizeBytes = info.size;
  }

  const usage = [...draft.usage.values()].sort((a, b) =>
    a.context === b.context
      ? a.location.localeCompare(b.location)
      : a.context.localeCompare(b.context),
  );

  return withStatus({
    id: assetKey(key),
    name: assetName(draft),
    type: draft.type,
    sizeBytes,
    url: draft.url,
    path: draft.path,
    alt: draft.alt,
    usage,
  });
}

function parseHtml(html: string, fromFile: string, add: (reference: Reference) => void): void {
  const $ = cheerio.load(html);
  const location = fromFile;

  const contextFor = (element: Parameters<typeof $>[0]): UsageContext => {
    const node = $(element);
    if (node.closest(".w-embed, script").length) return "custom-code";
    if (node.closest(".w-dyn-list, .w-dyn-items, .w-dyn-item, [data-wf-collection]").length) {
      return "cms";
    }
    return "page";
  };

  $("img").each((_, element) => {
    const node = $(element);
    const context = contextFor(element);
    const alt = node.attr("alt") ?? null;
    for (const raw of [node.attr("src"), node.attr("data-src")]) {
      if (raw) add({ raw, fromFile, context, location, alt });
    }
    for (const raw of splitSrcset(node.attr("srcset") ?? "")) {
      add({ raw, fromFile, context, location, alt });
    }
  });

  $("video").each((_, element) => {
    const node = $(element);
    const context = contextFor(element);
    const src = node.attr("src");
    if (src) add({ raw: src, fromFile, context, location, forceType: "video" });
    const poster = node.attr("poster");
    if (poster) add({ raw: poster, fromFile, context, location, forceType: "image" });
  });

  $("source").each((_, element) => {
    const node = $(element);
    const context = contextFor(element);
    const parent = node.parent().get(0);
    const parentTag = parent && "tagName" in parent ? parent.tagName.toLowerCase() : "";
    const typeAttr = (node.attr("type") ?? "").toLowerCase();
    let forceType: AssetType | undefined;
    if (parentTag === "video" || typeAttr.startsWith("video/")) forceType = "video";
    else if (parentTag === "picture" || typeAttr.startsWith("image/")) forceType = "image";
    const sources = [node.attr("src"), ...splitSrcset(node.attr("srcset") ?? "")].filter(
      (value): value is string => Boolean(value),
    );
    for (const raw of sources) {
      add({ raw, fromFile, context, location, forceType });
    }
  });

  $("lottie-player, [data-animation-type='lottie']").each((_, element) => {
    const node = $(element);
    const context = contextFor(element);
    for (const raw of [node.attr("src"), node.attr("data-src")]) {
      if (raw) {
        add({ raw, fromFile, context, location, lottieElement: true, forceType: "lottie" });
      }
    }
  });

  $("link[href]").each((_, element) => {
    const href = $(element).attr("href");
    if (!href || !MEDIA_EXTENSIONS.has(extensionOf(stripFragment(href)))) return;
    add({ raw: href, fromFile, context: contextFor(element), location });
  });

  $("style").each((_, element) => {
    const context = contextFor(element);
    for (const raw of extractUrls($(element).text())) {
      add({ raw, fromFile, context, location });
    }
  });

  $("[style]").each((_, element) => {
    const style = $(element).attr("style");
    if (!style) return;
    for (const raw of extractUrls(style)) {
      add({ raw, fromFile, context: contextFor(element), location });
    }
  });

  $("script").each((_, element) => {
    for (const raw of extractQuotedPaths($(element).text())) {
      add({ raw, fromFile, context: "custom-code", location, source: "script" });
    }
  });
}

function resolveLocal(reference: Reference, known: Map<string, string>): string | null {
  const cleaned = decodePath(stripFragment(reference.raw.trim())).replaceAll("\\", "/");
  if (!cleaned || cleaned.startsWith("#") || isRemote(cleaned)) return null;

  if (cleaned.startsWith("/")) {
    const rooted = path.posix.normalize(cleaned.slice(1));
    return insideExport(rooted) ? canonicalPath(known, rooted) : null;
  }

  const fromFile = path.posix.normalize(
    path.posix.join(path.posix.dirname(reference.fromFile), cleaned),
  );
  const fromRoot = path.posix.normalize(cleaned);
  const fileHit = insideExport(fromFile) && hasKnown(known, fromFile);
  const rootHit = insideExport(fromRoot) && hasKnown(known, fromRoot);

  if (reference.source === "script" && !cleaned.startsWith(".")) {
    if (rootHit) return canonicalPath(known, fromRoot);
    if (fileHit) return canonicalPath(known, fromFile);
    if (insideExport(fromRoot)) return fromRoot;
    return insideExport(fromFile) ? fromFile : null;
  }

  if (fileHit) return canonicalPath(known, fromFile);
  if (rootHit) return canonicalPath(known, fromRoot);
  return insideExport(fromFile) ? fromFile : null;
}

function insideExport(relative: string): boolean {
  return Boolean(
    relative &&
      relative !== "." &&
      !relative.startsWith("../") &&
      relative !== ".." &&
      !relative.startsWith("/") &&
      !relative.split("/").includes(".."),
  );
}

function hasKnown(known: Map<string, string>, relative: string): boolean {
  return known.has(relative) || known.has(relative.toLowerCase());
}

function canonicalPath(known: Map<string, string>, relative: string): string {
  return known.get(relative) ?? known.get(relative.toLowerCase()) ?? relative;
}

function extractUrls(source: string): string[] {
  const urls: string[] = [];
  const pattern = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;
  for (const match of source.matchAll(pattern)) {
    const value = match[2]?.trim();
    if (value) urls.push(value);
  }
  return urls;
}

function extractQuotedPaths(source: string): string[] {
  const urls: string[] = [];
  const pattern = /(['"])([^'"\n]{1,500})\1/g;
  for (const match of source.matchAll(pattern)) {
    const value = match[2]?.trim();
    if (value && MEDIA_EXTENSIONS.has(extensionOf(value))) urls.push(value);
  }
  return urls;
}

function splitSrcset(value: string): string[] {
  if (!value.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim().split(/\s+/)[0])
    .filter((part): part is string => Boolean(part));
}

function stripFragment(value: string): string {
  const hash = value.indexOf("#");
  const query = value.indexOf("?");
  let end = value.length;
  if (hash >= 0) end = Math.min(end, hash);
  if (query >= 0) end = Math.min(end, query);
  return value.slice(0, end);
}

function decodePath(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function isRemote(value: string): boolean {
  return /^https?:\/\//i.test(value) || value.startsWith("//");
}

async function readText(file: string): Promise<string | null> {
  const info = await lstat(file).catch(() => null);
  if (!info?.isFile() || info.size > MAX_TEXT_BYTES) return null;
  return readFile(file, "utf8");
}

async function isLottieFile(file: string): Promise<boolean> {
  const info = await lstat(file).catch(() => null);
  if (!info?.isFile() || info.size === 0) return false;
  const handle = await open(file, "r");
  try {
    const length = Math.min(info.size, 8192);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, 0);
    const head = buffer.toString("utf8");
    return head.includes('"layers"') && /"v"\s*:/.test(head);
  } finally {
    await handle.close();
  }
}

function absFromRel(root: string, relative: string): string {
  return path.join(root, ...relative.split("/"));
}

function assetName(draft: Draft): string {
  if (draft.path) return path.posix.basename(draft.path);
  if (!draft.url) return "asset";
  try {
    return path.posix.basename(new URL(draft.url).pathname) || draft.url;
  } catch {
    return draft.url;
  }
}

function assetKey(value: string): string {
  return createHash("sha1").update(value).digest("hex").slice(0, 12);
}

function isEnoent(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "ENOENT"
  );
}
