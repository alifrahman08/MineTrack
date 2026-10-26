import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const isResolvedParam = searchParams.get("isResolved");
    const isResolved = isResolvedParam !== null ? isResolvedParam === "true" : undefined;

    // Scan for any new conditions
    db.scanAndGenerateAlerts(session);

    const alerts = db.getOperationalAlerts({
      siteId,
      role: session.role,
      isResolved,
    });

    return NextResponse.json({ success: true, data: alerts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { action, id, notes } = body;

    if (action === "RESOLVE") {
      if (!id) {
        return NextResponse.json({ success: false, error: "ID peringatan wajib disertakan." }, { status: 400 });
      }

      const resolved = db.resolveOperationalAlert(id, notes || "Ditindaklanjuti", session);
      return NextResponse.json({ success: true, data: resolved });
    }

    if (action === "SCAN") {
      const generated = db.scanAndGenerateAlerts(session);
      return NextResponse.json({ success: true, count: generated.length, data: generated });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenal" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}
