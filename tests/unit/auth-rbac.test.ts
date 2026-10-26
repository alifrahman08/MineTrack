import { describe, it, expect, beforeEach } from "vitest";
import { db } from "@/lib/db";
import { loginUser, createSessionToken, verifySessionToken, getRoleDefaultPath } from "@/lib/auth";
import { UserSession } from "@/types";

describe("Modul Autentikasi, RBAC & Filter Laporan", () => {
  beforeEach(() => {
    db.resetToSeed();
  });

  it("14. Login berhasil dengan kredensial yang valid", async () => {
    const result = await loginUser("admin@minetrack.com", "MineTrack2026!");
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.role).toBe("ADMINISTRATOR");
    expect(result.user?.email).toBe("admin@minetrack.com");
  });

  it("15. Login gagal jika password salah atau email tidak terdaftar", async () => {
    const wrongPass = await loginUser("admin@minetrack.com", "WrongPassword123!");
    expect(wrongPass.success).toBe(false);
    expect(wrongPass.error).toBe("Email atau kata sandi tidak valid.");

    const nonExistent = await loginUser("unknown@minetrack.com", "MineTrack2026!");
    expect(nonExistent.success).toBe(false);
    expect(nonExistent.error).toBe("Email atau kata sandi tidak valid.");
  });

  it("16. Token sesi JWT di-sign dan diverifikasi dengan benar", async () => {
    const session: UserSession = {
      id: "usr-opr-01",
      email: "operator@minetrack.com",
      name: "Dedi Supriyadi",
      role: "OPERATOR",
      siteIds: ["site-kalbar-01"],
    };

    const token = await createSessionToken(session);
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(20);

    const verified = await verifySessionToken(token);
    expect(verified).toBeDefined();
    expect(verified?.id).toBe("usr-opr-01");
    expect(verified?.role).toBe("OPERATOR");
  });

  it("17. Mapping default path navigasi role (RBAC)", () => {
    expect(getRoleDefaultPath("ADMINISTRATOR")).toBe("/admin/dashboard");
    expect(getRoleDefaultPath("SUPERVISOR")).toBe("/supervisor/dashboard");
    expect(getRoleDefaultPath("OPERATOR")).toBe("/operator/dashboard");
    expect(getRoleDefaultPath("MANAGEMENT")).toBe("/management/dashboard");
  });

  it("18. Filter data laporan produksi menghormati site dan status persetujuan", () => {
    const allRecords = db.getProductionRecords();
    const approvedKalbar = db.getProductionRecords({
      siteId: "site-kalbar-01",
      status: "APPROVED",
    });

    expect(approvedKalbar.length).toBeGreaterThan(0);
    expect(approvedKalbar.every((r) => r.siteId === "site-kalbar-01" && r.status === "APPROVED")).toBe(true);

    const draftRecords = db.getProductionRecords({ status: "DRAFT" });
    expect(draftRecords.every((r) => r.status === "DRAFT")).toBe(true);
  });

  it("19. Alur reset password: verifikasi OTP, update password, dan login dengan password baru", async () => {
    // Import API route handler
    const { POST } = await import("@/app/api/auth/reset-password/route");
    const { NextRequest } = await import("next/server");

    // 1. Request OTP
    const reqOtp = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ action: "request-otp", email: "admin@minetrack.com" }),
    });
    const resOtp = await POST(reqOtp);
    const dataOtp = await resOtp.json();

    expect(resOtp.status).toBe(200);
    expect(dataOtp.success).toBe(true);
    expect(dataOtp.otpCode).toBeDefined();
    expect(dataOtp.otpCode.length).toBe(6);

    // 2. Reset Password with incorrect OTP
    const reqWrongOtp = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        action: "reset-password",
        email: "admin@minetrack.com",
        otpCode: "000000",
        newPassword: "BrandNewPassword2026!",
      }),
    });
    const resWrongOtp = await POST(reqWrongOtp);
    expect(resWrongOtp.status).toBe(400);

    // 3. Reset Password with correct OTP
    const reqReset = new NextRequest("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({
        action: "reset-password",
        email: "admin@minetrack.com",
        otpCode: dataOtp.otpCode,
        newPassword: "BrandNewPassword2026!",
      }),
    });
    const resReset = await POST(reqReset);
    const dataReset = await resReset.json();

    expect(resReset.status).toBe(200);
    expect(dataReset.success).toBe(true);

    // 4. Old password should fail
    const oldLogin = await loginUser("admin@minetrack.com", "MineTrack2026!");
    expect(oldLogin.success).toBe(false);

    // 5. New password should succeed
    const newLogin = await loginUser("admin@minetrack.com", "BrandNewPassword2026!");
    expect(newLogin.success).toBe(true);
    expect(newLogin.user?.email).toBe("admin@minetrack.com");
  });
});
