import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { isLocalDev } from "@/lib/local-dev";
import { MediaPathError, resolveInsideRoot } from "@/lib/media-path";
import { contentTypeFor, extensionOf } from "@/lib/media-types";
import { getProjectStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!isLocalDev()) {
    return NextResponse.json(
      { error: "Local media is only available in local development." },
      { status: 403 },
    );
  }

  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId")?.trim();
  const relativePath = searchParams.get("path")?.trim();
  if (!projectId || !relativePath) {
    return NextResponse.json(
      { error: "projectId and path are required." },
      { status: 400 },
    );
  }

  const project = await getProjectStore().get(projectId);
  if (!project?.exportRoot) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  try {
    const file = await resolveInsideRoot(project.exportRoot, relativePath);
    const bytes = await readFile(file);
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeFor(extensionOf(path.basename(file))),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    if (error instanceof MediaPathError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
