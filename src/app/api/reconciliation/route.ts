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
    const date = searchParams.get("date") || undefined;
    const status = searchParams.get("status") || undefined;

    const items = db.getReconciliations({ siteId, date, status });
    return NextResponse.json({ success: true, data: items });
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

    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR" && session.role !== "MANAGEMENT") {
      return NextResponse.json({ success: false, error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    if (action === "SCAN") {
      const { siteId, date, shiftId, materialId } = body;
      if (!siteId || !date || !shiftId || !materialId) {
        return NextResponse.json({ success: false, error: "siteId, date, shiftId, dan materialId wajib diisi." }, { status: 400 });
      }

      const recon = db.runReconciliationScan(siteId, date, shiftId, materialId, session);
      return NextResponse.json({ success: true, data: recon });
    }

    if (action === "RESOLVE") {
      const { id, notes } = body;
      if (!id || !notes) {
        return NextResponse.json({ success: false, error: "ID dan catatan resolusi wajib diisi." }, { status: 400 });
      }

      const resolved = db.resolveReconciliation(id, notes, session);
      return NextResponse.json({ success: true, data: resolved });
    }

    return NextResponse.json({ success: false, error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}
