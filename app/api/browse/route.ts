import { NextResponse } from "next/server";
import { chooseExportFolder } from "@/lib/choose-folder";
import { isLocalDev } from "@/lib/local-dev";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  if (!isLocalDev()) {
    return NextResponse.json(
      { error: "Folder browse is only available in local development." },
      { status: 403 },
    );
  }

  try {
    const folderPath = await chooseExportFolder();
    if (!folderPath) return NextResponse.json({ cancelled: true });
    return NextResponse.json({ folderPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not open the folder picker.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
