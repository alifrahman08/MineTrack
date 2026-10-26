import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession, createSessionToken, getRoleDefaultPath } from "@/lib/auth";
import { db } from "@/lib/db";
import { Role } from "@/types";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  return NextResponse.json({ authenticated: true, user: session });
}

export async function POST(req: NextRequest) {
  try {
    const { role } = await req.json();
    const validRoles: Role[] = ["ADMINISTRATOR", "SUPERVISOR", "OPERATOR", "MANAGEMENT"];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: "Role demo tidak valid" }, { status: 400 });
    }

    const allUsers = db.getAllUsers();
    const targetUser = allUsers.find((u) => u.role === role);
    if (!targetUser) {
      return NextResponse.json({ error: "Akun demo untuk role ini tidak ditemukan" }, { status: 404 });
    }

    const sessionData = {
      id: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      phone: targetUser.phone,
      avatarUrl: targetUser.avatarUrl,
      siteIds: targetUser.siteAccesses?.map((s) => s.siteId) || [],
    };

    const token = await createSessionToken(sessionData);
    const cookieStore = await cookies();
    cookieStore.set("minetrack_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    const redirectUrl = getRoleDefaultPath(role);
    return NextResponse.json({ success: true, user: sessionData, redirectUrl });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal mengganti role demo" }, { status: 500 });
  }
}
