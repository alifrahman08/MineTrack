import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { productionRecordSchema } from "@/lib/validations";
import { ApprovalStatus } from "@/types";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const siteId = searchParams.get("siteId") || undefined;
    const pitId = searchParams.get("pitId") || undefined;
    const shiftId = searchParams.get("shiftId") || undefined;
    const materialId = searchParams.get("materialId") || undefined;
    const status = (searchParams.get("status") as ApprovalStatus) || undefined;
    const operatorId = searchParams.get("operatorId") || undefined;

    // If Operator role, by default can view all or filter by own
    const records = db.getProductionRecords({
      search,
      siteId,
      pitId,
      shiftId,
      materialId,
      status,
      operatorId,
    });

    return NextResponse.json({ success: true, data: records });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengambil data produksi" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    // Role check: OPERATOR, SUPERVISOR, or ADMINISTRATOR can create
    if (session.role === "MANAGEMENT") {
      return NextResponse.json({ error: "Role Management hanya memiliki akses baca." }, { status: 403 });
    }

    const body = await req.json();
    const parsed = productionRecordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const status: ApprovalStatus = body.status === "SUBMITTED" ? "SUBMITTED" : "DRAFT";
    const record = db.createProductionRecord({ ...parsed.data, status }, session);

    return NextResponse.json({ success: true, data: record }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menyimpan catatan produksi" }, { status: 400 });
  }
}
