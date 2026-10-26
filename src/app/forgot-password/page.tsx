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
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"REQUEST" | "VERIFY" | "SUCCESS">("REQUEST");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [issuedOtp, setIssuedOtp] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [copiedOtp, setCopiedOtp] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request-otp", email }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Gagal meminta kode verifikasi. Periksa kembali email Anda.");
        setIsLoading(false);
        return;
      }

      setIssuedOtp(data.otpCode);
      setOtpCode(data.otpCode); // Pre-fill for instant seamless test
      setUserName(data.userName);
      setStep("VERIFY");
      setSuccessMsg("Kode verifikasi keamanan berhasil dibuat.");
    } catch {
      setError("Terjadi gangguan koneksi ke server operasional.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("Kata sandi baru harus minimal 6 karakter.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok dengan kata sandi baru.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reset-password",
          email,
          otpCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || "Gagal memperbarui kata sandi.");
        setIsLoading(false);
        return;
      }

      setStep("SUCCESS");
      setSuccessMsg(data.message);
    } catch {
      setError("Terjadi gangguan koneksi saat menyimpan kata sandi baru.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!issuedOtp) return;
    navigator.clipboard.writeText(issuedOtp);
    setCopiedOtp(true);
    setTimeout(() => setCopiedOtp(false), 2000);
  };

  const quickSelectEmail = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F7F4] text-[#252A2D] px-4 py-12 relative font-sans">
      <div className="w-full max-w-md relative z-10">
        {/* Navigation Back */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#687177] hover:text-[#252A2D] transition-colors py-1.5 px-3 rounded-lg border border-[#E3E2DC] bg-white shadow-2xs hover:bg-[#F8F7F4]"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-[#F36B21]" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>
          <span className="text-[11px] font-mono text-[#687177]">Security Protocol</span>
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
          <h1 className="mt-5 text-xl font-black text-[#252A2D] tracking-tight">
            Pemulihan Akses Akun Operasional
          </h1>
          <p className="mt-1 text-xs text-[#687177]">
            {step === "REQUEST" && "Masukkan email terdaftar untuk menerima kode verifikasi OTP"}
            {step === "VERIFY" && `Verifikasi identitas untuk ${userName || email}`}
            {step === "SUCCESS" && "Kata sandi Anda telah berhasil direset"}
          </p>
        </div>

        {/* Card Container */}
        <div className="rounded-2xl border border-[#E3E2DC] bg-white p-7 shadow-sm space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] p-3 text-xs text-[#C94438] animate-in fade-in duration-150">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#C94438]" />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: REQUEST OTP */}
          {step === "REQUEST" && (
            <form onSubmit={handleRequestOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                  Alamat Email Akun Anda
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

              {/* Quick Select Preset for Fast Testing */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-[#687177] uppercase tracking-wider">
                  Pilih Cepat Akun Operasional:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { label: "Admin", val: "admin@minetrack.com" },
                    { label: "Supervisor", val: "supervisor@minetrack.com" },
                    { label: "Operator", val: "operator@minetrack.com" },
                    { label: "Management", val: "management@minetrack.com" },
                  ].map((acc) => (
                    <button
                      key={acc.val}
                      type="button"
                      onClick={() => quickSelectEmail(acc.val)}
                      className={`text-left px-2.5 py-1.5 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                        email === acc.val
                          ? "border-[#F36B21] bg-[#FDF3EC] text-[#F36B21] font-bold"
                          : "border-[#E3E2DC] bg-[#F8F7F4] text-[#252A2D] hover:border-[#687177]/40"
                      }`}
                    >
                      <span className="font-bold">{acc.label}</span>
                      <span className="block text-[9px] text-[#687177] truncate">{acc.val}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="submit"
                variant="safety"
                className="w-full py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer mt-2"
                isLoading={isLoading}
              >
                <span>Kirim Kode Verifikasi &rarr;</span>
              </Button>
            </form>
          )}

          {/* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */}
          {step === "VERIFY" && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* OTP Simulation Banner */}
              {issuedOtp && (
                <div className="p-3.5 rounded-xl border border-[#CDE9DA] bg-[#EDF7F2] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#287D54] flex items-center gap-1.5">
                      <KeyRound className="h-3.5 w-3.5 text-[#287D54]" />
                      Kode Verifikasi Keamanan Diterbitkan:
                    </span>
                    <button
                      type="button"
                      onClick={copyToClipboard}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-[#287D54] hover:underline cursor-pointer"
                    >
                      {copiedOtp ? (
                        <>
                          <Check className="h-3 w-3" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" /> Salin Kode
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-[#CDE9DA]">
                    <span className="font-mono text-lg font-black tracking-widest text-[#252A2D]">
                      {issuedOtp}
                    </span>
                    <span className="text-[10px] text-[#687177]">Berlaku 15 Menit</span>
                  </div>
                  <p className="text-[10px] text-[#287D54]/90 leading-tight">
                    Simulasi sistem pengiriman kode OTP untuk area site tambang tanpa hambatan jaringan.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                  Kode Verifikasi (6 Digit)
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 font-mono text-base font-bold text-[#252A2D] tracking-widest focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                  Kata Sandi Baru (Min. 6 Karakter)
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 pr-10 text-sm text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-[#687177] hover:text-[#252A2D] cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#252A2D] mb-1.5 uppercase tracking-wider text-[11px]">
                  Konfirmasi Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-[#687177]" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-3 py-2 pl-9 text-sm text-[#252A2D] focus:border-[#F36B21] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#F36B21]"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("REQUEST");
                    setError(null);
                  }}
                  className="w-1/3 py-2.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#687177] hover:bg-[#F8F7F4] cursor-pointer"
                >
                  &larr; Ubah Email
                </button>
                <Button
                  type="submit"
                  variant="safety"
                  className="w-2/3 py-2.5 text-xs font-bold uppercase tracking-wider shadow-xs cursor-pointer"
                  isLoading={isLoading}
                >
                  Simpan Kata Sandi
                </Button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === "SUCCESS" && (
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#EDF7F2] border border-[#CDE9DA]">
                <CheckCircle2 className="h-8 w-8 text-[#287D54]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-[#252A2D]">
                  Kata Sandi Berhasil Diperbarui!
                </h3>
                <p className="text-xs text-[#687177] max-w-xs mx-auto">
                  Akun <span className="font-bold text-[#252A2D]">{email}</span> kini dapat diakses menggunakan kata sandi baru Anda.
                </p>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-[#F36B21] text-xs font-bold uppercase tracking-wider text-white shadow-xs hover:bg-[#DE5C16] transition-all cursor-pointer"
                >
                  <span>Masuk ke MineTrack Sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Security Assurance */}
        <div className="text-center mt-6 text-[11px] text-[#687177]">
          Proses reset kata sandi diawasi oleh sistem audit log keamanan internal MineTrack.
        </div>
      </div>
    </div>
  );
}
