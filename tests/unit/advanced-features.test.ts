import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { StorageManager } from "@/lib/storage";
import { UserSession } from "@/types";

describe("Modul Lanjutan: Digital Weighbridge, Storage, Rekonsiliasi, PM, & Offline Sync", () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  const mockAdmin: UserSession = {
    id: "usr-admin-01",
    email: "admin@minetrack.com",
    name: "Budi Santoso",
    role: "ADMINISTRATOR",
    siteIds: ["site-kalbar-01"],
  };

  const mockSupervisor: UserSession = {
    id: "usr-spv-01",
    email: "supervisor@minetrack.com",
    name: "Agus Pratama",
    role: "SUPERVISOR",
    siteIds: ["site-kalbar-01"],
  };

  const mockOperator: UserSession = {
    id: "usr-opr-01",
    email: "operator@minetrack.com",
    name: "Dedi Supriyadi",
    role: "OPERATOR",
    siteIds: ["site-kalbar-01"],
  };

  // 1. Digital Weighbridge: Netto calculation & gross >= tare validation
  it("19. Digital Weighbridge: Netto dihitung otomatis dan bruto < tara ditolak", () => {
    const ticket = db.createWeighbridgeTicket(
      {
        truckPlateNumber: "KB 9999 XX",
        grossWeight: 45.5,
        tareWeight: 15.2,
        materialId: "mat-coal-01",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
      },
      mockAdmin
    );

    expect(ticket.netWeight).toBe(30.3);
    expect(ticket.status).toBe("VERIFIED");

    // Invalid gross < tare
    expect(() => {
      db.createWeighbridgeTicket(
        {
          truckPlateNumber: "KB 9998 XX",
          grossWeight: 12.0,
          tareWeight: 14.0, // Tara > Bruto!
          materialId: "mat-coal-01",
          siteId: "site-kalbar-01",
          pitId: "pit-north-01",
        },
        mockAdmin
      );
    }).toThrow("Berat bruto harus lebih besar atau sama dengan berat tara.");
  });

  // 2. Digital Weighbridge: Duplicate ticket number rejected
  it("20. Digital Weighbridge: Nomor tiket duplikat ditolak", () => {
    db.createWeighbridgeTicket(
      {
        ticketNumber: "WB-UNIQUE-999",
        truckPlateNumber: "KB 1234 AA",
        grossWeight: 40.0,
        tareWeight: 14.0,
        materialId: "mat-coal-01",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
      },
      mockAdmin
    );

    expect(() => {
      db.createWeighbridgeTicket(
        {
          ticketNumber: "WB-UNIQUE-999", // Duplikat!
          truckPlateNumber: "KB 5678 BB",
          grossWeight: 42.0,
          tareWeight: 14.0,
          materialId: "mat-coal-01",
          siteId: "site-kalbar-01",
          pitId: "pit-north-01",
        },
        mockAdmin
      );
    }).toThrow("sudah digunakan");
  });

  // 3. Digital Weighbridge: Correction history tracked with reason
  it("21. Digital Weighbridge: Koreksi tiket timbang mencatat riwayat dan alasan", () => {
    const ticket = db.createWeighbridgeTicket(
      {
        truckPlateNumber: "KB 7777 YY",
        grossWeight: 44.0,
        tareWeight: 14.0,
        materialId: "mat-coal-01",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
      },
      mockAdmin
    );

    expect(ticket.netWeight).toBe(30.0);

    const updated = db.updateWeighbridgeTicket(
      ticket.id,
      {
        grossWeight: 46.0,
        tareWeight: 14.0,
      },
      "Koreksi tiket fisik timbangan jembatan 2 menunjukkan bruto 46.0 Ton",
      mockSupervisor
    );

    expect(updated.netWeight).toBe(32.0);
    expect(updated.correctionHistory?.length).toBe(1);
    expect(updated.correctionHistory?.[0].previousNet).toBe(30.0);
    expect(updated.correctionHistory?.[0].newNet).toBe(32.0);
    expect(updated.correctionHistory?.[0].userName).toBe("Agus Pratama");
  });

  // 4. Multi-Factor Equipment Availability: CANNOT be AVAILABLE if active downtime exists
  it("22. Konsistensi Status Alat: Unit tidak dapat diubah ke AVAILABLE jika masih ada downtime aktif", () => {
    // Unit EX-201 mengalami downtime aktif
    const dt = db.createDowntimeReport({
      equipmentId: "eq-ex-201",
      siteId: "site-kalbar-01",
      reportedById: "usr-opr-01",
      startTime: "2026-10-26T08:00:00.000Z",
      category: "MECHANICAL",
      priority: "HIGH",
      description: "Kerusakan silinder boom hidrolik",
    });

    const check = db.canEquipmentBeAvailable("eq-ex-201");
    expect(check.canBeAvailable).toBe(false);
    expect(check.reasons.length).toBeGreaterThan(0);

    // Paksa update ke AVAILABLE harus ditolak
    expect(() => {
      db.updateEquipment("eq-ex-201", { status: "AVAILABLE" });
    }).toThrow("Unit tidak dapat diubah ke AVAILABLE");
  });

  // 5. Multi-Factor Equipment Availability: CANNOT be AVAILABLE if active PM exists
  it("23. Konsistensi Status Alat: Unit dalam status Preventive Maintenance aktif tidak boleh AVAILABLE", () => {
    // Buat jadwal PM in progress untuk unit DT-104
    db.createPreventiveMaintenance(
      {
        equipmentId: "eq-dt-104",
        title: "PM 250 Jam",
        scheduledDate: "2026-10-26T00:00:00.000Z",
        status: "IN_PROGRESS",
      },
      mockAdmin
    );

    const check = db.canEquipmentBeAvailable("eq-dt-104");
    expect(check.canBeAvailable).toBe(false);

    expect(() => {
      db.updateEquipment("eq-dt-104", { status: "AVAILABLE" });
    }).toThrow("preventive maintenance");
  });

  // 6. Secure Storage: MIME validation and HMAC signed URL expiration
  it("24. Secure Storage: Validasi MIME type, ukuran 10MB, dan verifikasi tanda tangan signed URL", async () => {
    // Buffer dummy
    const validBuffer = Buffer.from("dummy-photo-content");
    const result = await StorageManager.uploadFile(
      validBuffer,
      "tiket-01.jpg",
      "image/jpeg",
      { category: "WEIGHBRIDGE_TICKET", entityType: "WEIGHBRIDGE_TICKET" },
      mockAdmin
    );

    expect(result.success).toBe(true);
    expect(result.signedUrl).toBeDefined();

    // Invalid MIME type (misal file .exe)
    const invalidMime = await StorageManager.uploadFile(
      validBuffer,
      "virus.exe",
      "application/x-msdownload",
      { category: "GENERAL", entityType: "GENERAL" },
      mockAdmin
    );
    expect(invalidMime.success).toBe(false);
    expect(invalidMime.error).toContain("tidak diizinkan");

    // Signed URL verification
    const docId = result.document!.id;
    const filePath = result.document!.storagePath;
    const nowSec = Math.floor(Date.now() / 1000);

    // Valid signature within 1 hour
    const validSigUrl = StorageManager.generateSignedUrl(docId, filePath, 3600);
    const urlParams = new URLSearchParams(validSigUrl.split("?")[1]);
    const expires = parseInt(urlParams.get("expires")!, 10);
    const sig = urlParams.get("sig")!;

    expect(StorageManager.verifySignedUrl(docId, filePath, expires, sig)).toBe(true);

    // Expired signature
    expect(StorageManager.verifySignedUrl(docId, filePath, nowSec - 10, sig)).toBe(false);

    // Tampered signature
    expect(StorageManager.verifySignedUrl(docId, filePath, expires, "tampered-signature-xyz")).toBe(false);
  });

  // 7. Production Reconciliation: Scans tickets vs production records and detects variance
  it("25. Rekonsiliasi Produksi: Menghitung selisih (variance) antara tiket timbang dan catatan ritase", () => {
    const scan = db.runReconciliationScan("site-kalbar-01", "2026-10-26", "shf-day-01", "mat-coal-01", mockSupervisor);
    expect(scan).toBeDefined();
    expect(typeof scan.weightDiscrepancy).toBe("number");
    expect(scan.status).toBeDefined();

    // Resolve variance
    const resolved = db.resolveReconciliation(scan.id, "Selisih telah diverifikasi dan disetujui oleh pengawas.", mockSupervisor);
    expect(resolved.status).toBe("RESOLVED");
    expect(resolved.resolvedById).toBe(mockSupervisor.id);
  });

  // 8. Operational Alerts: Automated alert generation with deduplication
  it("26. Peringatan Operasional: Deteksi downtime otomatis dengan deduplikasi (mencegah duplikat)", () => {
    const alert1 = db.createOperationalAlert({
      siteId: "site-kalbar-01",
      alertType: "EQUIPMENT_DOWNTIME",
      severity: "HIGH",
      title: "Armada Breakdown: DT-105",
      message: "Gangguan transmisi hidrolik",
      entityId: "eq-dt-105",
      dedupKey: "DOWNTIME-eq-dt-105-TEST",
    });

    expect(alert1.id).toBeDefined();
    expect(alert1.isResolved).toBe(false);

    // Peringatan kedua dengan dedupKey sama tidak boleh membuat entitas baru di DB
    const alert2 = db.createOperationalAlert({
      siteId: "site-kalbar-01",
      alertType: "EQUIPMENT_DOWNTIME",
      severity: "HIGH",
      title: "Armada Breakdown: DT-105",
      message: "Gangguan transmisi hidrolik",
      entityId: "eq-dt-105",
      dedupKey: "DOWNTIME-eq-dt-105-TEST",
    });

    expect(alert2.id).toBe(alert1.id);

    // Tandai selesai
    const resolvedAlert = db.resolveOperationalAlert(alert1.id, "Telah diperbaiki mekanik.", mockSupervisor);
    expect(resolvedAlert.isResolved).toBe(true);
  });

  // 9. Offline Queue Sync: Idempotency Key prevents double submissions
  it("27. Offline Sync: Idempotency Key mencegah transaksi ganda saat sinkronisasi ulang", () => {
    const idempotencyKey = "IDEMP-OFFLINE-TEST-001";

    const item1 = {
      id: "queue-001",
      idempotencyKey,
      action: "CREATE_PRODUCTION" as const,
      payload: {
        date: "2026-10-26T00:00:00.000Z",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
        shiftId: "shf-day-01",
        materialId: "mat-coal-01",
        measurementType: "WEIGHED" as const,
        ritaseCount: 1,
        grossWeight: 42.0,
        tareWeight: 14.0,
        netWeight: 28.0,
        notes: "Uji coba antrean pit",
      },
      clientTimestamp: new Date().toISOString(),
      attempts: 0,
      syncStatus: "QUEUED" as const,
    };

    // Sinkronisasi pertama
    const sync1 = db.syncOfflineQueue([item1], mockOperator);
    expect(sync1.syncedCount).toBe(1);
    const recordId1 = sync1.results[0].recordId;

    // Sinkronisasi kedua dengan idempotency key yang sama (misal retry jaringan)
    const sync2 = db.syncOfflineQueue([item1], mockOperator);
    expect(sync2.syncedCount).toBe(1);
    const recordId2 = sync2.results[0].recordId;

    // Record ID harus identik (tidak menduplikasi baris di database)
    expect(recordId2).toBe(recordId1);
  });
});
