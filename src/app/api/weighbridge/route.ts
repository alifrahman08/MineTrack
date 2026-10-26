import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const materialId = searchParams.get("materialId") || undefined;

    // RBAC: Check site access if siteId provided
    if (siteId && session.role !== "ADMINISTRATOR" && session.role !== "MANAGEMENT") {
      if (session.siteIds && !session.siteIds.includes(siteId)) {
        return NextResponse.json({ success: false, error: "Akses ke site ini ditolak." }, { status: 403 });
      }
    }

    const tickets = db.getWeighbridgeTickets({
      siteId: siteId || (session.role === "OPERATOR" ? session.siteIds?.[0] : undefined),
      status,
      search,
      materialId,
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Role check: Admin, Supervisor, or Operator can submit weighbridge tickets
    const body = await req.json();

    // Site access check
    if (body.siteId && session.role !== "ADMINISTRATOR") {
      if (session.siteIds && !session.siteIds.includes(body.siteId)) {
        return NextResponse.json({ success: false, error: "Akses ke site ini ditolak." }, { status: 403 });
      }
    }

    const newTicket = db.createWeighbridgeTicket(body, session);
    return NextResponse.json({ success: true, data: newTicket }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal server error" }, { status: 400 });
  }
}
