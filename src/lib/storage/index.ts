import fs from "fs";
import path from "path";
import crypto from "crypto";
import { DocumentStorageModel, StorageCategory, UserSession } from "@/types";
import { db } from "@/lib/db";

// Constraints
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
];

const SIGNING_SECRET = process.env.JWT_SECRET || "minetrack-storage-signing-secret-2026";

export interface UploadOptions {
  category: StorageCategory;
  entityType: string;
  entityId?: string | null;
  siteId?: string | null;
}

export interface UploadResult {
  success: boolean;
  document?: DocumentStorageModel;
  signedUrl?: string;
  error?: string;
}

export class StorageManager {
  private static uploadDir = path.join(process.cwd(), "public", "uploads");

  private static ensureUploadDirectory(subdir?: string) {
    const targetDir = subdir
      ? path.join(this.uploadDir, subdir)
      : this.uploadDir;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    return targetDir;
  }

  /**
   * Generates a tamper-proof signed URL for a private document with limited validity.
   */
  public static generateSignedUrl(docId: string, filePath: string, expiresInSeconds: number = 3600): string {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const dataToSign = `${docId}:${filePath}:${expiresAt}`;
    const signature = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(dataToSign)
      .digest("hex");

    return `/api/upload/view?id=${encodeURIComponent(docId)}&expires=${expiresAt}&sig=${signature}`;
  }

  /**
   * Validates a signed URL signature.
   */
  public static verifySignedUrl(docId: string, filePath: string, expiresAt: number, signature: string): boolean {
    if (Math.floor(Date.now() / 1000) > expiresAt) {
      return false; // Expired
    }
    const dataToSign = `${docId}:${filePath}:${expiresAt}`;
    const expectedSig = crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(dataToSign)
      .digest("hex");

    const bufA = Buffer.from(signature);
    const bufB = Buffer.from(expectedSig);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Upload file securely: checks size, MIME type, generates unguessable UUID filename,
   * saves file and records document metadata in DB with audit logging.
   */
  public static async uploadFile(
    fileBuffer: Buffer,
    originalFileName: string,
    mimeType: string,
    options: UploadOptions,
    user: UserSession
  ): Promise<UploadResult> {
    // 1. Validate file size
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return {
        success: false,
        error: `Ukuran file melampaui batas maksimum 10MB (${(fileBuffer.length / (1024 * 1024)).toFixed(2)}MB).`,
      };
    }

    // 2. Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        success: false,
        error: `Format file ${mimeType} tidak diizinkan. Hanya JPEG, PNG, WEBP, dan PDF yang didukung.`,
      };
    }

    // 3. Generate safe random object name
    const ext = path.extname(originalFileName).toLowerCase() || (mimeType === "application/pdf" ? ".pdf" : ".jpg");
    const safeId = crypto.randomUUID();
    const safeFileName = `${safeId}${ext}`;
    const categoryFolder = options.category.toLowerCase();

    const targetFolder = this.ensureUploadDirectory(categoryFolder);
    const diskPath = path.join(targetFolder, safeFileName);
    const publicRelativePath = `/uploads/${categoryFolder}/${safeFileName}`;

    try {
      // 4. Save to disk securely
      fs.writeFileSync(diskPath, fileBuffer);

      // 5. Generate signed URL
      const signedUrl = this.generateSignedUrl(safeId, publicRelativePath, 7200); // 2 hours

      // 6. Record metadata in DB
      const docMetadata: DocumentStorageModel = {
        id: safeId,
        fileName: originalFileName,
        fileSize: fileBuffer.length,
        mimeType,
        storagePath: publicRelativePath,
        url: signedUrl,
        category: options.category,
        entityType: options.entityType,
        entityId: options.entityId,
        siteId: options.siteId,
        uploadedById: user.id,
        uploadedByName: user.name,
        createdAt: new Date().toISOString(),
      };

      db.saveDocumentStorage(docMetadata, user);

      return {
        success: true,
        document: docMetadata,
        signedUrl,
      };
    } catch (err: any) {
      // Clean up orphaned file if saving metadata fails
      if (fs.existsSync(diskPath)) {
        try {
          fs.unlinkSync(diskPath);
        } catch {}
      }
      return {
        success: false,
        error: `Gagal menyimpan berkas: ${err?.message || "Kesalahan internal storage"}`,
      };
    }
  }

  /**
   * Delete file and remove metadata.
   */
  public static async deleteFile(docId: string, user: UserSession): Promise<{ success: boolean; error?: string }> {
    const doc = db.getDocumentStorageById(docId);
    if (!doc) {
      return { success: false, error: "Dokumen tidak ditemukan." };
    }

    // Authorization: User must be uploader or Admin/Supervisor
    if (doc.uploadedById !== user.id && user.role !== "ADMINISTRATOR" && user.role !== "SUPERVISOR") {
      return { success: false, error: "Anda tidak berhak menghapus dokumen ini." };
    }

    // Remove from disk
    const diskPath = path.join(process.cwd(), "public", doc.storagePath);
    if (fs.existsSync(diskPath)) {
      try {
        fs.unlinkSync(diskPath);
      } catch {}
    }

    db.deleteDocumentStorage(docId, user);
    return { success: true };
  }
}
