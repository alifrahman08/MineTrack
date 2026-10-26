import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const { actionDescription } = await req.json();
    if (!actionDescription || actionDescription.trim().length === 0) {
      return NextResponse.json({ error: "Deskripsi tindakan wajib diisi" }, { status: 400 });
    }

    const followUp = db.addSafetyFollowUp(id, actionDescription, session.name);
    return NextResponse.json({ success: true, data: followUp }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
