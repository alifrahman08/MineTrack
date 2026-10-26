import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { z } from "zod";

// In-memory OTP storage with TTL (15 minutes)
interface OtpEntry {
  otpCode: string;
  expiresAt: number;
}

// Global store to persist across API invocations in development
const globalForOtp = globalThis as unknown as {
  minetrackOtpStore?: Map<string, OtpEntry>;
};

const otpStore = globalForOtp.minetrackOtpStore ?? new Map<string, OtpEntry>();
if (process.env.NODE_ENV !== "production") {
  globalForOtp.minetrackOtpStore = otpStore;
}

const requestOtpSchema = z.object({
  action: z.literal("request-otp"),
  email: z.string().email("Format email tidak valid"),
});

const resetPasswordSchema = z.object({
  action: z.literal("reset-password"),
  email: z.string().email("Format email tidak valid"),
  otpCode: z.string().min(4, "Kode verifikasi tidak boleh kosong"),
  newPassword: z.string().min(6, "Kata sandi baru minimal 6 karakter"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body?.action;

    // 1. Action: REQUEST OTP
    if (action === "request-otp") {
      const parsed = requestOtpSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Input tidak valid" },
          { status: 400 }
        );
      }

      const email = parsed.data.email.trim().toLowerCase();
      const user = db.findUserByEmail(email);

      if (!user) {
        return NextResponse.json(
          { error: `Email "${email}" tidak terdaftar dalam database operasional MineTrack.` },
          { status: 404 }
        );
      }

      if (!user.isActive) {
        return NextResponse.json(
          { error: "Akun ini telah dinonaktifkan. Silakan hubungi Administrator IT Site." },
          { status: 403 }
        );
      }

      // Generate 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      otpStore.set(email, { otpCode, expiresAt });

      db.createAuditLog(
        "REQUEST_PASSWORD_RESET",
        "User",
        user.id,
        `Kode OTP reset password diterbitkan untuk akun ${email}`
      );

      return NextResponse.json({
        success: true,
        message: "Kode verifikasi keamanan 6-digit berhasil diterbitkan.",
        otpCode,
        email: user.email,
        userName: user.name,
        expiresInMinutes: 15,
      });
    }

    // 2. Action: RESET PASSWORD
    if (action === "reset-password") {
      const parsed = resetPasswordSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.issues[0]?.message || "Input tidak valid" },
          { status: 400 }
        );
      }

      const { otpCode, newPassword } = parsed.data;
      const email = parsed.data.email.trim().toLowerCase();

      const user = db.findUserByEmail(email);
      if (!user) {
        return NextResponse.json(
          { error: "Akun pengguna tidak ditemukan." },
          { status: 404 }
        );
      }

      const storedOtp = otpStore.get(email);
      if (!storedOtp) {
        return NextResponse.json(
          { error: "Tidak ada permohonan reset password aktif. Silakan minta kode verifikasi baru." },
          { status: 400 }
        );
      }

      if (Date.now() > storedOtp.expiresAt) {
        otpStore.delete(email);
        return NextResponse.json(
          { error: "Kode verifikasi telah kedaluwarsa. Silakan minta kode baru." },
          { status: 400 }
        );
      }

      if (storedOtp.otpCode !== otpCode.trim()) {
        return NextResponse.json(
          { error: "Kode verifikasi 6-digit yang Anda masukkan salah." },
          { status: 400 }
        );
      }

      // Update password in database
      db.updateUser(user.id, { password: newPassword });

      // Invalidate used OTP
      otpStore.delete(email);

      db.createAuditLog(
        "PASSWORD_RESET_SUCCESS",
        "User",
        user.id,
        `Kata sandi akun ${email} berhasil direset via formulir Lupa Kata Sandi.`
      );

      return NextResponse.json({
        success: true,
        message: "Kata sandi Anda berhasil diperbarui! Silakan masuk menggunakan kata sandi baru Anda.",
      });
    }

    return NextResponse.json(
      { error: "Aksi tidak dikenali. Gunakan 'request-otp' atau 'reset-password'." },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Terjadi kesalahan pada server saat memproses reset password." },
      { status: 500 }
    );
  }
}
