import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { StorageManager } from "@/lib/storage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("id");
    const expires = searchParams.get("expires");
    const sig = searchParams.get("sig");

    if (!docId || !expires || !sig) {
      return NextResponse.json({ error: "Parameter tanda tangan berkas tidak lengkap." }, { status: 400 });
    }

    const doc = db.getDocumentStorageById(docId);
    if (!doc) {
      return NextResponse.json({ error: "Dokumen tidak ditemukan." }, { status: 404 });
    }

    const expiresAt = parseInt(expires, 10);
    const isValid = StorageManager.verifySignedUrl(docId, doc.storagePath, expiresAt, sig);
    if (!isValid) {
      return NextResponse.json({ error: "Tautan dokumen tidak valid atau sudah kedaluwarsa." }, { status: 403 });
    }

    const filePath = path.join(process.cwd(), "public", doc.storagePath);
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Berkas fisik tidak ditemukan di server." }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Internal error" }, { status: 500 });
  }
}
