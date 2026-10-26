import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticket = db.getWeighbridgeTicketById(id);
    if (!ticket) {
      return NextResponse.json({ success: false, error: "Tiket timbang tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Only Supervisor or Admin can correct tickets
    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Hanya Supervisor atau Admin yang berwenang mengoreksi tiket timbang." }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { reason, ...updates } = body;

    const updated = db.updateWeighbridgeTicket(id, updates, reason || "Koreksi data timbang oleh pengawas", session);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMINISTRATOR" && session.role !== "SUPERVISOR") {
      return NextResponse.json({ success: false, error: "Hanya Supervisor atau Admin yang berwenang membatalkan tiket." }, { status: 403 });
    }

    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const reason = searchParams.get("reason") || "Dibatalkan oleh pengawas operasional";

    const cancelled = db.cancelWeighbridgeTicket(id, reason, session);
    return NextResponse.json({ success: true, data: cancelled });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 400 });
  }
}
