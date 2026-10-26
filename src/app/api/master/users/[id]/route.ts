import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Hanya Administrator yang dapat mengedit profil pengguna" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    const updated = db.updateUser(id, body);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
