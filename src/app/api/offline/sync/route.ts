import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { OfflineSyncQueueItem } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const items: OfflineSyncQueueItem[] = body.items || [];

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ success: false, error: "Tidak ada data antrean untuk disinkronkan." }, { status: 400 });
    }

    const { syncedCount, results } = db.syncOfflineQueue(items, session);

    return NextResponse.json({
      success: true,
      syncedCount,
      totalCount: items.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || "Internal error" }, { status: 500 });
  }
}
