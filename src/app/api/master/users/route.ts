import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const users = db.getAllUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMINISTRATOR") {
      return NextResponse.json({ error: "Hanya Administrator yang dapat membuat pengguna baru" }, { status: 403 });
    }

    const body = await req.json();
    if (!body.email || !body.name || !body.role) {
      return NextResponse.json({ error: "Email, nama, dan role wajib diisi" }, { status: 400 });
    }

    const user = db.createUser(body);
    return NextResponse.json({ success: true, data: user }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
