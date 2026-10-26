import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalActionSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
    }

    if (session.role !== "SUPERVISOR" && session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Hanya Supervisor atau Administrator yang berwenang meninjau laporan." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const parsed = approvalActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input persetujuan tidak valid" }, { status: 400 });
    }

    const { action, reason } = parsed.data;
    const reviewed = db.reviewProductionRecord(id, action, reason, session);

    return NextResponse.json({ success: true, data: reviewed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memproses persetujuan catatan produksi" }, { status: 400 });
  }
}
