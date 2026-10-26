import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { equipmentSchema } from "@/lib/validations";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const type = searchParams.get("type") || undefined;
    const status = searchParams.get("status") || undefined;

    const data = db.getAllEquipment({ siteId, type, status });
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR") {
      return NextResponse.json({ error: "Izin ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = equipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const eq = db.createEquipment(parsed.data);
    return NextResponse.json({ success: true, data: eq }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
