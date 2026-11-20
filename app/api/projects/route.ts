import { NextResponse } from "next/server";
import { getProjectStore } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const projects = await getProjectStore().list();
  return NextResponse.json({ projects });
}
