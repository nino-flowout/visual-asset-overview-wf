import { NextResponse } from "next/server";
import { isLocalDev } from "@/lib/local-dev";
import { ScanError, scanExportFolder } from "@/lib/scan/export-folder";
import { getProjectStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!isLocalDev()) {
    return NextResponse.json(
      { error: "Folder scan is only available in local development." },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Expected a JSON body." }, { status: 400 });
  }

  const folderPath = field(body, "folderPath");
  if (!folderPath) {
    return NextResponse.json({ error: "folderPath is required." }, { status: 400 });
  }

  try {
    const result = await scanExportFolder({
      folderPath,
      siteId: field(body, "siteId"),
      siteName: field(body, "siteName"),
    });
    await getProjectStore().save(result);
    return NextResponse.json({ inventory: result.inventory });
  } catch (error) {
    if (error instanceof ScanError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Scan failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function field(body: unknown, key: string): string | undefined {
  if (!body || typeof body !== "object" || !(key in body)) return undefined;
  const value = (body as Record<string, unknown>)[key];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}
