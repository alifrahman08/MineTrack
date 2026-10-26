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
    const equipmentId = searchParams.get("equipmentId") || undefined;
    const status = searchParams.get("status") || undefined;
    const siteId = searchParams.get("siteId") || undefined;

    const pms = db.getPreventiveMaintenances({ equipmentId, status, siteId });
    return NextResponse.json({ success: true, data: pms });
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

    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Hanya Admin atau Supervisor yang dapat membuat jadwal maintenance." }, { status: 403 });
    }

    const body = await req.json();
    const pm = db.createPreventiveMaintenance(body, session);
    return NextResponse.json({ success: true, data: pm }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) {
      return NextResponse.json({ success: false, error: "ID PM wajib disertakan." }, { status: 400 });
    }

    const updated = db.updatePreventiveMaintenance(id, updates, session);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}
