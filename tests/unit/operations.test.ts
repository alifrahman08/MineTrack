import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { loginUser } from "@/lib/auth";

describe("Modul Shift, Alat Berat, Downtime & Keamanan", () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  it("9. Deteksi bentrok jadwal: Operator tidak dapat ditugaskan ke dua shift pada tanggal yang sama", () => {
    const date = "2026-10-27T00:00:00.000Z";

    // Penugasan pertama berhasil
    db.createShiftAssignment({
      date,
      shiftId: "shf-day-01",
      siteId: "site-kalbar-01",
      operatorId: "usr-opr-01",
    });

    // Penugasan kedua untuk operator yang sama pada tanggal & shift yang sama harus gagal!
    expect(() => {
      db.createShiftAssignment({
        date,
        shiftId: "shf-day-01",
        siteId: "site-kalbar-01",
        operatorId: "usr-opr-01",
      });
    }).toThrow("Operator ini sudah memiliki penugasan pada shift dan tanggal yang sama.");
  });

  it("10. Deteksi bentrok jadwal: Alat berat tidak dapat memiliki penugasan yang tumpang tindih", () => {
    const date = "2026-10-28T00:00:00.000Z";

    // Tugaskan unit EX-201 ke operator 1
    db.createShiftAssignment({
      date,
      shiftId: "shf-day-01",
      siteId: "site-kalbar-01",
      operatorId: "usr-opr-01",
      equipmentId: "eq-ex-201",
    });

    // Tugaskan unit EX-201 yang sama ke operator lain pada shift yang sama harus ditolak!
    expect(() => {
      db.createShiftAssignment({
        date,
        shiftId: "shf-day-01",
        siteId: "site-kalbar-01",
        operatorId: "usr-admin-01",
        equipmentId: "eq-ex-201",
      });
    }).toThrow("Alat berat ini sudah ditugaskan ke pekerjaan lain pada shift yang sama.");
  });

  it("11. Downtime menghasilkan durasi yang benar dan mengubah status alat", () => {
    const startTime = "2026-10-26T08:00:00.000Z";
    const endTime = "2026-10-26T10:30:00.000Z"; // 2.5 jam = 150 menit

    const report = db.createDowntimeReport({
      equipmentId: "eq-dt-105",
      siteId: "site-kalbar-01",
      reportedById: "usr-opr-01",
      startTime,
      endTime,
      category: "MECHANICAL",
      priority: "HIGH",
      description: "Kerusakan rem hidrolik",
    });

    expect(report.durationMinutes).toBe(150);

    // Status alat berat otomatis menjadi BREAKDOWN
    const eq = db.getEquipmentById("eq-dt-105");
    expect(eq?.status).toBe("BREAKDOWN");

    // Ketika downtime diselesaikan (Resolved), status alat kembali AVAILABLE
    db.updateDowntimeReport(report.id, { status: "RESOLVED" }, "usr-spv-01");
    const eqUpdated = db.getEquipmentById("eq-dt-105");
    expect(eqUpdated?.status).toBe("AVAILABLE");
  });

  it("12. Notifikasi hanya terlihat oleh penerima yang dituju", () => {
    const oprNotifs = db.getNotifications("usr-opr-01");
    oprNotifs.forEach((n) => {
      expect(n.userId).toBe("usr-opr-01");
    });

    const spvNotifs = db.getNotifications("usr-spv-01");
    spvNotifs.forEach((n) => {
      expect(n.userId).toBe("usr-spv-01");
    });
  });

  it("13. Pengguna nonaktif ditolak masuk sistem (Login block)", async () => {
    // Nonaktifkan operator
    db.updateUser("usr-opr-01", { isActive: false });

    const result = await loginUser("operator@minetrack.com", "MineTrack2026!");
    expect(result.success).toBe(false);
    expect(result.error).toContain("Akun Anda telah dinonaktifkan");
  });
});
