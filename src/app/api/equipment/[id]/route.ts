import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const eq = db.getEquipmentById(id);
    if (!eq) return NextResponse.json({ error: "Unit tidak ditemukan" }, { status: 404 });

    return NextResponse.json({ success: true, data: eq });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Izin ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const updated = db.updateEquipment(id, body);

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
