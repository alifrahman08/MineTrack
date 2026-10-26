import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalActionSchema } from "@/lib/validations";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (session.role !== "SUPERVISOR" && session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Izin ditolak" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const parsed = approvalActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Input tidak valid" }, { status: 400 });
    }

    const reviewed = db.reviewDailyReport(id, parsed.data.action, parsed.data.reason, session);
    return NextResponse.json({ success: true, data: reviewed });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
