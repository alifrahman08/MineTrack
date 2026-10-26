import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { StorageManager } from "@/lib/storage";
import { StorageCategory } from "@/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const category = (formData.get("category") as StorageCategory) || "GENERAL";
    const entityType = (formData.get("entityType") as string) || "GENERAL";
    const entityId = (formData.get("entityId") as string) || null;
    const siteId = (formData.get("siteId") as string) || null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Berkas tidak ditemukan dalam formulir." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await StorageManager.uploadFile(
      buffer,
      file.name,
      file.type,
      {
        category,
        entityType,
        entityId,
        siteId,
      },
      session
    );

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: result.document,
      signedUrl: result.signedUrl,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
