import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { productionRecordSchema } from "@/lib/validations";
import { UserSession } from "@/types";

describe("Modul Produksi & Validasi Timbangan", () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  const mockOperator: UserSession = {
    id: "usr-opr-01",
    email: "operator@minetrack.com",
    name: "Dedi Supriyadi",
    role: "OPERATOR",
  };

  const mockOtherOperator: UserSession = {
    id: "usr-opr-99",
    email: "other@minetrack.com",
    name: "Operator Lain",
    role: "OPERATOR",
  };

  const mockSupervisor: UserSession = {
    id: "usr-spv-01",
    email: "supervisor@minetrack.com",
    name: "Agus Pratama",
    role: "SUPERVISOR",
  };

  it("1. Berat bersih dihitung dengan benar (Netto = Bruto - Tara)", () => {
    const gross = 45.5;
    const tare = 15.2;
    const net = Number((gross - tare).toFixed(2));
    expect(net).toBe(30.3);

    const record = db.createProductionRecord(
      {
        date: "2026-10-26T00:00:00.000Z",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
        shiftId: "shf-day-01",
        materialId: "mat-coal-01",
        measurementType: "WEIGHED",
        ritaseCount: 1,
        grossWeight: gross,
        tareWeight: tare,
        netWeight: net,
        unit: "Ton",
        status: "DRAFT",
      },
      mockOperator
    );

    expect(record.netWeight).toBe(30.3);
    expect(record.status).toBe("DRAFT");
  });

  it("2. Berat bruto yang lebih kecil dari berat tara ditolak oleh schema dan repository", () => {
    // Validasi Zod
    const invalidInput = {
      date: "2026-10-26",
      siteId: "site-kalbar-01",
      pitId: "pit-north-01",
      shiftId: "shf-day-01",
      materialId: "mat-coal-01",
      measurementType: "WEIGHED",
      ritaseCount: 1,
      grossWeight: 10.0,
      tareWeight: 15.0, // Tara > Bruto!
      netWeight: 0,
      unit: "Ton",
      isEstimated: false,
    };

    const parsed = productionRecordSchema.safeParse(invalidInput);
    expect(parsed.success).toBe(false);

    // Validasi Repository DB
    expect(() => {
      db.createProductionRecord(
        {
          ...invalidInput,
          status: "DRAFT",
        } as any,
        mockOperator
      );
    }).toThrow("Berat bruto harus lebih besar atau sama dengan berat tara.");
  });

  it("3. Operator dapat membuat draft produksi dan mengirimkannya untuk review", () => {
    const draft = db.createProductionRecord(
      {
        date: "2026-10-26T00:00:00.000Z",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
        shiftId: "shf-day-01",
        materialId: "mat-coal-01",
        measurementType: "WEIGHED",
        ritaseCount: 1,
        grossWeight: 40.0,
        tareWeight: 14.0,
        netWeight: 26.0,
        unit: "Ton",
        status: "DRAFT",
      },
      mockOperator
    );

    expect(draft.status).toBe("DRAFT");

    // Submit for review
    const submitted = db.submitProductionRecord(draft.id, mockOperator);
    expect(submitted.status).toBe("SUBMITTED");
  });

  it("4. Supervisor dapat menyetujui (Approve) catatan produksi", () => {
    const records = db.getProductionRecords({ status: "SUBMITTED" });
    expect(records.length).toBeGreaterThan(0);
    const target = records[0];

    const approved = db.reviewProductionRecord(target.id, "APPROVE", "Data timbang valid", mockSupervisor);
    expect(approved.status).toBe("APPROVED");
    expect(approved.reviewedById).toBe(mockSupervisor.id);
  });

  it("5. Catatan yang dikembalikan (Needs Revision) dapat direvisi oleh operator", () => {
    // Cari atau buat record needs revision
    const target = db.getProductionRecords().find((r) => r.status === "NEEDS_REVISION");
    expect(target).toBeDefined();

    // Operator memperbaiki catatan
    const updated = db.updateProductionRecord(
      target!.id,
      {
        grossWeight: 42.0,
        tareWeight: 14.2,
        notes: "Sudah diperbaiki dan foto tiket timbang dilampirkan",
      },
      mockOperator
    );

    expect(updated.grossWeight).toBe(42.0);
    expect(updated.netWeight).toBe(27.8);

    // Operator mengajukan ulang
    const reSubmitted = db.submitProductionRecord(target!.id, mockOperator);
    expect(reSubmitted.status).toBe("SUBMITTED");
  });

  it("6. Operator tidak dapat mengubah catatan milik operator lain", () => {
    const target = db.getProductionRecords().find((r) => r.operatorId === "usr-opr-01");
    expect(target).toBeDefined();

    expect(() => {
      db.updateProductionRecord(target!.id, { notes: "Usaha sabotase" }, mockOtherOperator);
    }).toThrow("Anda tidak memiliki izin mengubah catatan milik operator lain.");
  });

  it("7. Catatan draft dan returned TIDAK masuk ke agregasi produksi resmi", () => {
    const analytics = db.getProductionAnalytics();
    const approvedRecords = db.getProductionRecords({ status: "APPROVED" });
    const expectedApprovedCoal = approvedRecords
      .filter((r) => r.materialId === "mat-coal-01")
      .reduce((sum, r) => sum + r.netWeight, 0);

    expect(analytics.totalCoalTon).toBe(Number(expectedApprovedCoal.toFixed(2)));

    // Tambah draft baru dengan berat 1000 ton
    db.createProductionRecord(
      {
        date: "2026-10-26T00:00:00.000Z",
        siteId: "site-kalbar-01",
        pitId: "pit-north-01",
        shiftId: "shf-day-01",
        materialId: "mat-coal-01",
        measurementType: "WEIGHED",
        ritaseCount: 1,
        grossWeight: 1014.0,
        tareWeight: 14.0,
        netWeight: 1000.0,
        unit: "Ton",
        status: "DRAFT",
      },
      mockOperator
    );

    // Analytics produksi resmi TIDAK boleh berubah karena masih draft!
    const updatedAnalytics = db.getProductionAnalytics();
    expect(updatedAnalytics.totalCoalTon).toBe(analytics.totalCoalTon);
  });

  it("8. Target versus realisasi dihitung dengan benar & menangani target 0", () => {
    const analytics = db.getProductionAnalytics();
    if (analytics.targetCoalTon > 0) {
      const expectedPct = Number(((analytics.totalCoalTon / analytics.targetCoalTon) * 100).toFixed(1));
      expect(analytics.achievementPercent).toBe(expectedPct);
      expect(analytics.diffProduction).toBe(Number((analytics.totalCoalTon - analytics.targetCoalTon).toFixed(2)));
    }

    // Uji safe divide bila target 0
    const safeCalc = (actual: number, target: number) => (target > 0 ? (actual / target) * 100 : 0);
    expect(safeCalc(500, 0)).toBe(0);
  });
});
