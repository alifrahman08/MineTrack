import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    const { id } = await params;
    const submitted = db.submitProductionRecord(id, session);
    return NextResponse.json({ success: true, data: submitted });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengajukan catatan untuk review" }, { status: 400 });
  }
}
