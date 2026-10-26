import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Hanya Administrator yang dapat menambah Site" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.name || !body.code) {
      return NextResponse.json({ error: "Kode dan Nama Site wajib diisi" }, { status: 400 });
    }

    const site = db.createSite(body);
    return NextResponse.json({ success: true, data: site }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
