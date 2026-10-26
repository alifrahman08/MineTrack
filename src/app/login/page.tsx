"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HardHat,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  AlertCircle,
  Check,
  CheckCircle2,
  X,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Role } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoSwitching, setIsDemoSwitching] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [forgotShowPassword, setForgotShowPassword] = useState(false);
  const [forgotIssuedOtp, setForgotIssuedOtp] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotCopied, setForgotCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Gagal masuk. Periksa email dan password Anda.");
        setIsLoading(false);
        return;
      }

      // Redirect based on role
      const role = data.user.role;
      if (role === "ADMINISTRATOR") router.push("/admin/dashboard");
      else if (role === "SUPERVISOR") router.push("/supervisor/dashboard");
      else if (role === "OPERATOR") router.push("/operator/dashboard");
      else if (role === "MANAGEMENT") router.push("/management/dashboard");
      else router.push("/");
    } catch {
      setError("Terjadi kesalahan koneksi ke server.");
      setIsLoading(false);
    }
  };

  const directDemoLogin = async (role: Role) => {
    setIsDemoSwitching(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (data.success && data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setIsDemoSwitching(false);
      }
    } catch {
      setIsDemoSwitching(false);
      setError("Gagal mengakses mode demo.");
    }
  };

  // Forgot Password Handlers
  const handleForgotRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-otp", email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.error || "Gagal meminta kode verifikasi.");
        setForgotLoading(false);
        return;
      }
      setForgotIssuedOtp(data.otpCode);
      setForgotOtp(data.otpCode); // Pre-fill for instant test convenience
      setForgotStep("VERIFY");
    } catch {
      setForgotError("Terjadi kesalahan koneksi ke server.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    if (forgotNewPassword.length < 6) {
      setForgotError("Kata sandi baru minimal 6 karakter.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email: forgotEmail,
          otpCode: forgotOtp,
          newPassword: forgotNewPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setForgotError(data.error || "Gagal memperbarui kata sandi.");
        setForgotLoading(false);
        return;
      }

      setForgotStep("SUCCESS");
      setEmail(forgotEmail);
      setPassword("");
      setSuccessNotice("Kata sandi berhasil diperbarui! Silakan masuk dengan kata sandi baru.");
    } catch {
      setForgotError("Terjadi kesalahan saat memproses reset password.");
    } finally {
      setForgotLoading(false);
    }
  };

  const copyForgotOtp = () => {
    if (!forgotIssuedOtp) return;
    navigator.clipboard.writeText(forgotIssuedOtp);
    setForgotCopied(true);
    setTimeout(() => setForgotCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] text-[#252A2D] px-4 py-12 relative">
      <div className="w-full max-w-md relative z-10">
        {/* Navigation Back to Landing Page */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#687177] hover:text-[#252A2D] transition-colors py-1.5 px-3 rounded-lg border border-[#E3E2DC] bg-white shadow-2xs hover:bg-[#F8F7F4]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#F36B21]" />
            <span>Kembali ke Beranda</span>
          </Link>
          <span className="text-[11px] font-mono text-[#687177]">MineTrack Platform</span>
        </div>

        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#252A2D] text-white font-black shadow-xs group-hover:bg-[#F36B21] transition-colors">
              <HardHat className="h-6 w-6" />
            </div>
            <div className="text-left">
              <span className="text-xl font-black tracking-tight text-[#252A2D]">MineTrack</span>
              <p className="text-[10px] font-bold text-[#687177] uppercase tracking-wider">OPERATIONS PLATFORM</p>
            </div>
          </Link>
          <h2 className="mt-5 text-xl font-black text-[#252A2D] tracking-tight">
            Masuk ke Portal Operasional
          </h2>
          <p className="mt-1 text-xs text-[#687177]">
            Gunakan akun kredensial terverifikasi untuk melanjutkan
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-[#E3E2DC] bg-white p-7 shadow-sm">
          {successNotice && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2] p-3 text-xs text-[#287D54] animate-in fade-in duration-150">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#287D54]" />
              <span>{successNotice}</span>
            </div>
          )}

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] p-3 text-xs text-[#C94438] animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#C94438]" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                Alamat Email Operasional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@minetrack.com"
                  className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 text-sm text-[#252A2D] placeholder:text-[#687177]/60 focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21] transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[#252A2D] uppercase tracking-wider text-[11px]">Kata Sandi</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email || "admin@minetrack.com");
                    setForgotError(null);
                    setForgotStep("REQUEST");
                    setIsForgotModalOpen(true);
                  }}
                  className="text-[11px] font-semibold text-[#F36B21] hover:underline cursor-pointer"
                >
                  Lupa sandi?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 text-sm text-[#252A2D] placeholder:text-[#687177]/60 focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21] transition-all"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="safety"
              className="w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
              isLoading={isLoading}
            >
              Masuk ke Sistem &rarr;
            </Button>
          </form>

          {/* 1-Click Role Switcher Demo Box */}
          <div className="mt-6 pt-5 border-t border-[#E3E2DC]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[11px] font-bold text-[#252A2D] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#F36B21]" />
                1-Click Masuk Demo (Langsung Aktif):
              </span>
              {isDemoSwitching && (
                <span className="text-[10px] font-semibold text-[#F36B21] animate-pulse">
                  Menghubungkan...
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => directDemoLogin("ADMINISTRATOR")}
                disabled={isDemoSwitching}
                className="p-2.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-left hover:border-[#F36B21] hover:bg-[#FDF3EC] transition-all cursor-pointer"
              >
                <p className="font-bold text-[#252A2D]">Administrator</p>
                <p className="text-[10px] text-[#687177]">admin@minetrack.com</p>
              </button>

              <button
                type="button"
                onClick={() => directDemoLogin("SUPERVISOR")}
                disabled={isDemoSwitching}
                className="p-2.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-left hover:border-[#F36B21] hover:bg-[#FDF3EC] transition-all cursor-pointer"
              >
                <p className="font-bold text-[#252A2D]">Mine Supervisor</p>
                <p className="text-[10px] text-[#687177]">supervisor@minetrack.com</p>
              </button>

              <button
                type="button"
                onClick={() => directDemoLogin("OPERATOR")}
                disabled={isDemoSwitching}
                className="p-2.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-left hover:border-[#F36B21] hover:bg-[#FDF3EC] transition-all cursor-pointer"
              >
                <p className="font-bold text-[#252A2D]">Operator Pit</p>
                <p className="text-[10px] text-[#687177]">operator@minetrack.com</p>
              </button>

              <button
                type="button"
                onClick={() => directDemoLogin("MANAGEMENT")}
                disabled={isDemoSwitching}
                className="p-2.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-left hover:border-[#F36B21] hover:bg-[#FDF3EC] transition-all cursor-pointer"
              >
                <p className="font-bold text-[#252A2D]">Executive Board</p>
                <p className="text-[10px] text-[#687177]">management@minetrack.com</p>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Return to Home & Security Assurance */}
        <div className="text-center mt-6 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#687177] hover:text-[#F36B21] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Beranda Utama</span>
          </Link>
          <p className="text-[11px] text-[#687177]">
            Sistem dilindungi enkripsi JWT, otorisasi RBAC berjenjang, dan audit trail operasional tambang.
          </p>
        </div>
      </div>

      {/* MODAL: LUPA KATA SANDI / PEMULIHAN AKSES */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#252A2D]/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-[#E3E2DC] bg-white p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-[#FEF8ED] border border-[#FCE6BD] flex items-center justify-center text-[#B87B17]">
                  <KeyRound className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#252A2D]">Pemulihan Kata Sandi</h3>
                  <p className="text-[10px] text-[#687177]">MineTrack Security Gateway</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="p-1 rounded-md text-[#687177] hover:text-[#252A2D] hover:bg-[#F8F7F4] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {forgotError && (
              <div className="flex items-center gap-2 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] p-3 text-xs text-[#C94438]">
                <AlertCircle className="h-4 w-4 shrink-0 text-[#C94438]" />
                <span>{forgotError}</span>
              </div>
            )}

            {/* MODAL STEP 1: REQUEST OTP */}
            {forgotStep === "REQUEST" && (
              <form onSubmit={handleForgotRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                    Email Terdaftar di Sistem
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="nama@minetrack.com"
                      className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 text-sm text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21]"
                    />
                  </div>
                </div>

                {/* Quick preset selector */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-[#687177] uppercase tracking-wider">
                    Pilih Cepat Akun Demo:
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: "Admin", email: "admin@minetrack.com" },
                      { label: "Supervisor", email: "supervisor@minetrack.com" },
                      { label: "Operator", email: "operator@minetrack.com" },
                      { label: "Management", email: "management@minetrack.com" },
                    ].map((acc) => (
                      <button
                        key={acc.email}
                        type="button"
                        onClick={() => {
                          setForgotEmail(acc.email);
                          setForgotError(null);
                        }}
                        className={`text-left px-2 py-1.5 rounded border text-[10px] transition-all cursor-pointer ${
                          forgotEmail === acc.email
                            ? "border-[#F36B21] bg-[#FDF3EC] text-[#F36B21] font-bold"
                            : "border-[#E3E2DC] bg-[#F8F7F4] text-[#252A2D] hover:border-[#687177]"
                        }`}
                      >
                        <span className="font-bold">{acc.label}</span>
                        <span className="block text-[9px] text-[#687177] truncate">{acc.email}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <Link
                    href="/forgot-password"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="text-[11px] text-[#687177] hover:text-[#F36B21] hover:underline"
                  >
                    Buka Halaman Lengkap &rarr;
                  </Link>
                  <Button
                    type="submit"
                    variant="safety"
                    className="py-2 px-4 text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                    isLoading={forgotLoading}
                  >
                    Kirim Kode &rarr;
                  </Button>
                </div>
              </form>
            )}

            {/* MODAL STEP 2: VERIFY & RESET */}
            {forgotStep === "VERIFY" && (
              <form onSubmit={handleForgotResetPassword} className="space-y-3.5">
                {/* Simulated OTP Display Banner */}
                {forgotIssuedOtp && (
                  <div className="p-3 rounded-xl border border-[#CDE9DA] bg-[#EDF7F2] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#287D54] uppercase tracking-wider">
                        Kode OTP Keamanan Diterbitkan:
                      </span>
                      <button
                        type="button"
                        onClick={copyForgotOtp}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-[#287D54] hover:underline cursor-pointer"
                      >
                        {forgotCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        <span>{forgotCopied ? "Tersalin" : "Salin"}</span>
                      </button>
                    </div>
                    <div className="bg-white px-2.5 py-1.5 rounded-lg border border-[#CDE9DA] flex items-center justify-between">
                      <span className="font-mono text-base font-black tracking-widest text-[#252A2D]">
                        {forgotIssuedOtp}
                      </span>
                      <span className="text-[9px] text-[#687177]">Masa berlaku: 15 menit</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-[#252A2D] mb-1 uppercase tracking-wider text-[11px]">
                    Kode Verifikasi (6 Digit)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 font-mono text-sm font-bold tracking-widest text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#252A2D] mb-1 uppercase tracking-wider text-[11px]">
                    Kata Sandi Baru (Min. 6 Karakter)
                  </label>
                  <div className="relative">
                    <input
                      type={forgotShowPassword ? "text" : "password"}
                      required
                      minLength={6}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pr-9 text-sm text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setForgotShowPassword(!forgotShowPassword)}
                      className="absolute right-3 top-2.5 text-[#687177] hover:text-[#252A2D] cursor-pointer"
                    >
                      {forgotShowPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#252A2D] mb-1 uppercase tracking-wider text-[11px]">
                    Konfirmasi Kata Sandi Baru
                  </label>
                  <input
                    type={forgotShowPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 text-sm text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep("REQUEST");
                      setForgotError(null);
                    }}
                    className="py-2 px-3 rounded-lg border border-[#E3E2DC] bg-white text-xs font-semibold text-[#687177] hover:bg-[#F8F7F4] cursor-pointer"
                  >
                    &larr; Kembali
                  </button>
                  <Button
                    type="submit"
                    variant="safety"
                    className="py-2 px-4 text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                    isLoading={forgotLoading}
                  >
                    Simpan Kata Sandi
                  </Button>
                </div>
              </form>
            )}

            {/* MODAL STEP 3: SUCCESS */}
            {forgotStep === "SUCCESS" && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#EDF7F2] border border-[#CDE9DA]">
                  <CheckCircle2 className="h-7 w-7 text-[#287D54]" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-[#252A2D]">Kata Sandi Berhasil Diperbarui!</h4>
                  <p className="text-xs text-[#687177]">
                    Kata sandi untuk <span className="font-bold text-[#252A2D]">{forgotEmail}</span> telah diperbarui. Silakan masuk menggunakan kata sandi baru Anda.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="safety"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="w-full py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-xs"
                >
                  Lanjut Masuk ke Sistem &rarr;
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
