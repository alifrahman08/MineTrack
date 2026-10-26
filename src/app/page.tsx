"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  HardHat,
  Truck,
  ShieldAlert,
  BarChart3,
  FileCheck2,
  ArrowRight,
  ChevronDown,
  Scale,
  Menu,
  X,
  TrendingUp,
  ShieldCheck,
  CheckSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "Bagaimana alur persetujuan pencatatan produksi di MineTrack?",
      a: "Operator menginput catatan ritase atau hasil timbangan (Bruto - Tara = Netto) sebagai Draft, kemudian mengirimkannya untuk ditinjau. Supervisor menerima notifikasi real-time dan berwenang menyetujui, menolak, atau mengembalikan dengan catatan koreksi. Hanya data yang berstatus Disetujui (Approved) yang masuk ke agregasi target produksi resmi.",
    },
    {
      q: "Apakah sistem mencegah bentrok jadwal operator dan alat berat?",
      a: "Ya. MineTrack menerapkan validasi bentrok penugasan di sisi server. Operator maupun unit alat berat yang sama tidak dapat ditugaskan ke dua shift atau lokasi yang tumpang tindih pada tanggal yang sama.",
    },
    {
      q: "Bagaimana cara kerja rekonsiliasi antara jembatan timbang dan ritase?",
      a: "Engine rekonsiliasi secara otomatis membandingkan berat neto dari tiket timbang digital dengan estimasi ritase dari catatan produksi lapangan. Jika deviasi melebihi toleransi (5%), status secara otomatis ditandai VARIANCE_DETECTED untuk investigasi pengawas.",
    },
    {
      q: "Apakah aplikasi dapat digunakan saat sinyal internet di pit tambang terputus?",
      a: "Ya. MineTrack dilengkapi kapabilitas Progressive Web App (PWA) dengan service worker caching dan antrean sinkronisasi lokal berbasis Idempotency Key. Transaksi yang dicatat saat offline akan otomatis terunggah saat perangkat kembali terhubung ke jaringan site office.",
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#252A2D] selection:bg-[#F36B21] selection:text-white font-sans">
      {/* 1. Navigation Bar */}
      <nav className="sticky top-0 z-50 border-b border-[#E3E2DC] bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Brand Identity */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#252A2D] text-white font-black group-hover:bg-[#F36B21] transition-colors shrink-0 shadow-xs">
                <HardHat className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <span className="text-base font-extrabold tracking-tight text-[#252A2D]">MineTrack</span>
                <span className="text-[10px] font-bold text-[#687177] tracking-wider uppercase">
                  MINE OPERATIONS PLATFORM
                </span>
              </div>
            </Link>

            {/* Center: Nav links */}
            <div className="hidden md:flex items-center space-x-7 text-xs font-semibold text-[#687177]">
              <a href="#fitur" className="hover:text-[#252A2D] transition-colors">
                Fitur
              </a>
              <a href="#solusi" className="hover:text-[#252A2D] transition-colors">
                Solusi
              </a>
              <a href="#platform" className="hover:text-[#252A2D] transition-colors">
                Platform
              </a>
              <a href="#workflow" className="hover:text-[#252A2D] transition-colors">
                Alur Kerja
              </a>
              <a href="#safety" className="hover:text-[#252A2D] transition-colors">
                Keselamatan
              </a>
              <a href="#faq" className="hover:text-[#252A2D] transition-colors">
                FAQ
              </a>
            </div>

            {/* Right: Actions */}
            <div className="hidden md:flex items-center">
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors flex items-center gap-1.5"
              >
                <span>Masuk ke Sistem</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#F36B21]" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-lg text-[#687177] hover:text-[#252A2D] hover:bg-[#F8F7F4] focus:outline-none cursor-pointer"
                aria-label="Toggle Menu"
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6 text-[#252A2D]" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-b border-[#E3E2DC] bg-white px-4 pt-2 pb-5 space-y-3 animate-in slide-in-from-top-2 duration-150">
            <div className="flex flex-col space-y-2 text-sm font-semibold text-[#687177]">
              <a
                href="#fitur"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                Fitur Utama
              </a>
              <a
                href="#solusi"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                Solusi Operasional
              </a>
              <a
                href="#platform"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                Platform
              </a>
              <a
                href="#workflow"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                Alur Kerja
              </a>
              <a
                href="#safety"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                Keselamatan K3
              </a>
              <a
                href="#faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              >
                FAQ
              </a>
            </div>
            <div className="pt-2 border-t border-[#E3E2DC]">
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-[#252A2D] text-xs font-bold text-white shadow-xs hover:bg-[#383E43] flex items-center justify-center gap-1.5"
              >
                <span>Masuk ke Akun Operasional</span>
                <ArrowRight className="h-3.5 w-3.5 text-[#F36B21]" />
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* 2. Hero Section — Asymmetric Split Layout */}
      <section className="relative overflow-hidden pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#E3E2DC] bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Column: Editorial Industrial Headline & CTAs (7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#E3E2DC] bg-white text-xs font-bold uppercase tracking-wider text-[#687177] shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-[#F36B21]" />
                MINE OPERATIONS MANAGEMENT
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#252A2D] tracking-tight leading-[1.08]">
                Dari Lapangan.
                <br />
                <span className="text-[#F36B21]">Menjadi Keputusan.</span>
              </h1>

              <p className="text-base sm:text-lg text-[#687177] max-w-2xl leading-relaxed">
                Satu sistem untuk memantau produksi, mengelola armada, mengawasi keselamatan, dan menghubungkan setiap shift dengan keputusan operasional yang lebih tepat.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-[#F36B21] text-sm font-bold text-white shadow-xs hover:bg-[#DE5C16] transition-all cursor-pointer"
                >
                  <span>Masuk ke MineTrack</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#fitur"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-white border border-[#E3E2DC] text-sm font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-all cursor-pointer"
                >
                  Jelajahi Fitur & Solusi
                </a>
              </div>

              <p className="text-xs font-semibold text-[#687177] tracking-tight pt-1">
                Production monitoring · Fleet & Downtime · Safety HSE · Official Reporting
              </p>
            </div>

            {/* Right Column: Real Industrial Photography & Floating Operational Data (5 Cols) */}
            <div className="lg:col-span-5 relative">
              {/* Photo Frame */}
              <div className="relative rounded-2xl border border-[#E3E2DC] bg-white p-2.5 shadow-md">
                <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-200">
                  <Image
                    src="/images/mining_hero.jpg"
                    alt="Operasi Penambangan Terbuka Komatsu Excavator & Cat Haul Truck"
                    fill
                    priority
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                  {/* Subtle live indicator badge */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 rounded-md bg-[#252A2D]/85 backdrop-blur-xs px-2.5 py-1 text-[11px] font-bold text-white shadow-xs">
                    <span className="h-2 w-2 rounded-full bg-[#287D54] animate-pulse" />
                    <span>PIT ALUMINA 01 • LIVE</span>
                  </div>
                </div>

                {/* Overlaid Data Panel 1: Shift Production */}
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#687177] uppercase">Produksi Shift</span>
                      <span className="text-[10px] font-bold text-[#287D54] bg-[#EDF7F2] px-1.5 py-0.2 rounded border border-[#CDE9DA]">
                        106.0%
                      </span>
                    </div>
                    <p className="text-lg font-black text-[#252A2D] mt-1">2.650 Ton</p>
                    <p className="text-[10px] text-[#687177]">Target: 2.500 Ton</p>
                  </div>

                  <div className="p-3 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4]">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#687177] uppercase">Kesiapan Unit</span>
                      <span className="text-[10px] font-bold text-[#477A9B] bg-[#F1F6F9] px-1.5 py-0.2 rounded border border-[#D0E2EC]">
                        80.0%
                      </span>
                    </div>
                    <p className="text-lg font-black text-[#252A2D] mt-1">4 Unit Siap</p>
                    <p className="text-[10px] text-[#687177]">1 Unit Scheduled PM</p>
                  </div>
                </div>

                {/* Overlaid Status Strip */}
                <div className="mt-2 p-2.5 rounded-lg border border-[#FCE6BD] bg-[#FEF8ED] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-[#B87B17] shrink-0" />
                    <span className="text-[11px] font-semibold text-[#8C5D0E]">
                      2 Catatan ritase baru menunggu review Supervisor
                    </span>
                  </div>
                  <Link
                    href="/login"
                    className="text-[10px] font-bold text-[#F36B21] hover:underline shrink-0"
                  >
                    Tinjau &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Solusi Operasional Tambang */}
      <section id="solusi" className="scroll-mt-20 border-b border-[#E3E2DC] bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Header */}
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#E3E2DC] bg-[#F8F7F4] text-xs font-bold uppercase tracking-wider text-[#687177] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#F36B21]" />
              SOLUSI OPERASIONAL TAMBANG
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#252A2D] tracking-tight">
              Solusi Tuntas untuk 4 Titik Kritis Lapangan Tambang
            </h2>
            <p className="text-base text-[#687177] leading-relaxed">
              MineTrack dirancang menjawab tantangan operasional terberat: disparitas tonase jembatan timbang, downtime armada tak terduga, risiko keselamatan kerja, dan lambatnya pelaporan shift ke manajemen.
            </p>
          </div>

          {/* 4 Solutions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl border border-[#E3E2DC] bg-[#F8F7F4] hover:border-[#F36B21] hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#E3E2DC] flex items-center justify-center text-[#F36B21] shadow-2xs">
                  <Scale className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#252A2D]">Akurasi & Validasi Timbangan</h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Menghilangkan disparitas tonase melalui formula otomatis Gross - Tare = Netto dan toleransi deviasi ketat antara tiket timbang vs hitungan ritase lapangan.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E3E2DC]/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#687177]">Dampak:</span>
                <span className="font-bold text-[#287D54] bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#CDE9DA]">
                  Deviasi &lt; 1.0%
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#E3E2DC] bg-[#F8F7F4] hover:border-[#F36B21] hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#E3E2DC] flex items-center justify-center text-[#F36B21] shadow-2xs">
                  <Truck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#252A2D]">Utilisasi Alat & Downtime</h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Pencatatan jam operasi (Hour Meter) real-time, penjadwalan Preventive Maintenance otomatis, dan klasifikasi breakdown untuk menekan unscheduled downtime.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E3E2DC]/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#687177]">Dampak:</span>
                <span className="font-bold text-[#287D54] bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#CDE9DA]">
                  Availability &gt; 92%
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#E3E2DC] bg-[#F8F7F4] hover:border-[#F36B21] hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#E3E2DC] flex items-center justify-center text-[#F36B21] shadow-2xs">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#252A2D]">Zero Harm & Penegakan K3</h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Deteksi dini kondisi berbahaya di jalan angkut, alur investigasi insiden berjenjang, hingga penetapan tindakan perbaikan (CAPA) yang terpantau tuntas.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E3E2DC]/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#687177]">Dampak:</span>
                <span className="font-bold text-[#287D54] bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#CDE9DA]">
                  240 Hari LTI-Free
                </span>
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-[#E3E2DC] bg-[#F8F7F4] hover:border-[#F36B21] hover:bg-white hover:shadow-sm transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-[#E3E2DC] flex items-center justify-center text-[#F36B21] shadow-2xs">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-[#252A2D]">Transparansi & LOH Cepat</h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Laporan Operasional Harian (LOH) teragregasi otomatis dari data shift resmi yang disetujui, siap diakses manajemen tanpa rekapitulasi spreadsheet manual.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E3E2DC]/80 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#687177]">Dampak:</span>
                <span className="font-bold text-[#287D54] bg-[#EDF7F2] px-2 py-0.5 rounded border border-[#CDE9DA]">
                  LOH 100% Otomatis
                </span>
              </div>
            </div>
          </div>

          {/* Operational Snapshot Briefing Strip */}
          <div className="pt-8 border-t border-[#E3E2DC]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-[#E3E2DC] text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#287D54] animate-pulse" />
                <span className="font-bold text-[#252A2D] uppercase tracking-wider">
                  Status Operasional Terkini — Briefing Harian
                </span>
                <span className="text-[#687177]">• Shift 1 Siang (07:00 - 19:00 WIB)</span>
              </div>
              <div className="text-[11px] text-[#687177] mt-1 sm:mt-0 font-medium">
                Cakupan: Site Kendawangan & Sanga-Sanga • Data Terverifikasi Resmi
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4]">
                <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider">
                  Produksi Disetujui
                </span>
                <p className="text-2xl font-black text-[#252A2D] mt-1.5">2.650 <span className="text-sm font-semibold text-[#687177]">Ton</span></p>
                <p className="text-xs text-[#287D54] font-semibold mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5" /> Batubara resmi + 12.800 BCM OB
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4]">
                <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider">
                  Pencapaian Target
                </span>
                <p className="text-2xl font-black text-[#252A2D] mt-1.5">106.0<span className="text-sm font-semibold text-[#687177]">%</span></p>
                <p className="text-xs text-[#287D54] font-semibold mt-1">
                  +150 Ton di atas rencana harian
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4]">
                <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider">
                  Armada Tersedia
                </span>
                <p className="text-2xl font-black text-[#252A2D] mt-1.5">4 <span className="text-sm font-semibold text-[#687177]">Unit</span></p>
                <p className="text-xs text-[#687177] font-medium mt-1">
                  1 Unit PM Rutin • 0 Breakdown
                </p>
              </div>

              <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4]">
                <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider">
                  Pengawasan K3
                </span>
                <p className="text-2xl font-black text-[#252A2D] mt-1.5">0 <span className="text-sm font-semibold text-[#687177]">Fatality</span></p>
                <p className="text-xs text-[#287D54] font-semibold mt-1 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Hari Ke-240 Nir-Kecelakaan
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Fitur Utama Sistem (Editorial 3-Column Asymmetric) */}
      <section id="fitur" className="scroll-mt-20 py-16 sm:py-20 border-b border-[#E3E2DC] bg-[#F8F7F4]">
        <div id="modul" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 mb-12">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-[#E3E2DC] bg-white text-xs font-bold uppercase tracking-wider text-[#F36B21] shadow-2xs">
              <span className="h-2 w-2 rounded-full bg-[#F36B21]" />
              FITUR UTAMA & MODUL OPERASIONAL
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#252A2D] tracking-tight">
              Semua Fitur Operasional dalam Satu Alur Terpadu
            </h2>
            <p className="text-base text-[#687177] leading-relaxed">
              Tiap modul terhubung secara langsung dari jembatan timbang front pit hingga konsolidasi manajemen pusat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Column 1: Production Intelligence */}
            <div className="rounded-2xl border border-[#E3E2DC] bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Visual snippet */}
                <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4] font-mono text-xs space-y-2">
                  <div className="flex items-center justify-between text-[#687177]">
                    <span>Tiket #WB-20261026-0001</span>
                    <span className="text-[#287D54] font-bold">VERIFIED</span>
                  </div>
                  <div className="grid grid-cols-3 gap-1 pt-1 border-t border-[#E3E2DC] text-center">
                    <div>
                      <p className="text-[10px] text-[#687177]">GROSS</p>
                      <p className="font-bold text-[#252A2D]">42.50 T</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#687177]">TARE</p>
                      <p className="font-bold text-[#687177]">14.20 T</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-[#F36B21]">NETTO</p>
                      <p className="font-black text-[#F36B21]">28.30 T</p>
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#252A2D]">
                  Production Intelligence
                </h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Pencatatan jembatan timbang presisi tinggi dan ritase muatan per trip dengan validasi matematis otomatis (Netto = Bruto - Tara) serta pemisahan data resmi.
                </p>
              </div>

              <a
                href="#workflow"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F36B21] hover:text-[#DE5C16] transition-colors"
              >
                <span>Pelajari modul produksi</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Column 2: Fleet & Maintenance */}
            <div className="rounded-2xl border border-[#E3E2DC] bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Visual snippet */}
                <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#252A2D]">EX-201 (Komatsu PC2000)</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#CDE9DA] bg-[#EDF7F2] text-[#287D54]">
                      AVAILABLE
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-[#687177] pt-1 border-t border-[#E3E2DC]">
                    <span>Hour Meter: 12.450 Jam</span>
                    <span>PM Berikutnya: 12.500 Jam</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-[#252A2D]">
                  Fleet & Maintenance
                </h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Pemantauan status armada real-time, pencatatan downtime otomatis, serta aturan multi-factor availability yang melarang unit aktif jika dalam masa servis.
                </p>
              </div>

              <a
                href="#workflow"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F36B21] hover:text-[#DE5C16] transition-colors"
              >
                <span>Pelajari modul armada</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Column 3: Safety & Compliance */}
            <div className="rounded-2xl border border-[#E3E2DC] bg-white p-6 shadow-xs flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                {/* Visual snippet */}
                <div className="p-4 rounded-xl border border-[#E3E2DC] bg-[#F8F7F4] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#252A2D]">Jalan Angkut KM 4.2</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-[#FCE6BD] bg-[#FEF8ED] text-[#B87B17]">
                      MEDIUM RISK
                    </span>
                  </div>
                  <p className="text-[11px] text-[#687177] pt-1 border-t border-[#E3E2DC]">
                    Tindak lanjut grader & perbaikan tanggul selesai 100%.
                  </p>
                </div>

                <h3 className="text-lg font-bold text-[#252A2D]">
                  Safety & Compliance
                </h3>
                <p className="text-xs text-[#687177] leading-relaxed">
                  Sistem pelaporan insiden, near-miss, dan kondisi tidak aman dengan siklus investigasi tervalidasi hingga rekomendasi CAPA dan penutupan resmi.
                </p>
              </div>

              <a
                href="#safety"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#F36B21] hover:text-[#DE5C16] transition-colors"
              >
                <span>Pelajari modul K3</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Product Showcase (Application Window Mockup) */}
      <section id="platform" className="scroll-mt-20 py-16 sm:py-24 border-b border-[#E3E2DC] bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#687177]">
              ANTARMUKA OPERASIONAL MODERN
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#252A2D] tracking-tight">
              Visibilitas Penuh dari Pit ke Kantor Pusat
            </h2>
            <p className="text-base text-[#687177]">
              Dirancang dengan tata letak padat data tanpa clutter, memudahkan pengawas dan operator fokus pada eksekusi lapangan.
            </p>
          </div>

          {/* App Window Frame Mockup */}
          <div className="rounded-2xl border border-[#E3E2DC] bg-[#F8F7F4] shadow-xl overflow-hidden">
            {/* Window Topbar */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E3E2DC] bg-white">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#E3E2DC]" />
                <span className="h-3 w-3 rounded-full bg-[#E3E2DC]" />
                <span className="h-3 w-3 rounded-full bg-[#E3E2DC]" />
                <span className="ml-2 text-xs font-mono text-[#687177]">minetrack.internal/operations/kendawangan</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#687177]">
                <span className="h-2 w-2 rounded-full bg-[#287D54]" />
                <span className="font-semibold text-[11px]">System Connected (PostgreSQL)</span>
              </div>
            </div>

            {/* Window Content */}
            <div className="p-4 sm:p-6 lg:p-8 space-y-6">
              {/* Mockup Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#E3E2DC]">
                <div>
                  <h3 className="text-lg font-bold text-[#252A2D]">Shift Operations Overview</h3>
                  <p className="text-xs text-[#687177]">Site Kendawangan (Kalbar) • Pit Alumina 01</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-md border border-[#E3E2DC] bg-white text-xs font-semibold text-[#252A2D]">
                    Shift 1 Siang
                  </span>
                  <span className="px-3 py-1 rounded-md bg-[#252A2D] text-xs font-bold text-white">
                    Live Monitor
                  </span>
                </div>
              </div>

              {/* Mockup Operational Table */}
              <div className="rounded-xl border border-[#E3E2DC] bg-white overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-[#E3E2DC] bg-[#F8F7F4] flex items-center justify-between">
                  <span className="text-xs font-bold text-[#252A2D] uppercase tracking-wider">
                    Antrean Validasi Timbangan Terkini
                  </span>
                  <span className="text-xs text-[#687177]">5 Transaksi Terakhir</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-[#F8F7F4]/60 border-b border-[#E3E2DC] text-[11px] font-bold text-[#687177] uppercase">
                      <tr>
                        <th className="px-4 py-2.5">No. Tiket</th>
                        <th className="px-4 py-2.5">Armada & Supir</th>
                        <th className="px-4 py-2.5">Material</th>
                        <th className="px-4 py-2.5 text-right">Gross (T)</th>
                        <th className="px-4 py-2.5 text-right">Tare (T)</th>
                        <th className="px-4 py-2.5 text-right">Netto (T)</th>
                        <th className="px-4 py-2.5 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E2DC] font-mono text-[11px]">
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-[#252A2D]">WB-20261026-0001</td>
                        <td className="px-4 py-2.5 font-sans">DT-104 (Budi Gunawan)</td>
                        <td className="px-4 py-2.5 font-sans">Batubara (Coal)</td>
                        <td className="px-4 py-2.5 text-right">42.50</td>
                        <td className="px-4 py-2.5 text-right text-[#687177]">14.20</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#287D54]">28.30</td>
                        <td className="px-4 py-2.5 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDF7F2] text-[#287D54] border border-[#CDE9DA]">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-[#252A2D]">WB-20261026-0002</td>
                        <td className="px-4 py-2.5 font-sans">DT-105 (Ahmad Riyadi)</td>
                        <td className="px-4 py-2.5 font-sans">Batubara (Coal)</td>
                        <td className="px-4 py-2.5 text-right">43.10</td>
                        <td className="px-4 py-2.5 text-right text-[#687177]">14.50</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#287D54]">28.60</td>
                        <td className="px-4 py-2.5 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#EDF7F2] text-[#287D54] border border-[#CDE9DA]">
                            VERIFIED
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-[#252A2D]">WB-20261026-0003</td>
                        <td className="px-4 py-2.5 font-sans">DT-104 (Budi Gunawan)</td>
                        <td className="px-4 py-2.5 font-sans">Overburden (OB)</td>
                        <td className="px-4 py-2.5 text-right">45.00</td>
                        <td className="px-4 py-2.5 text-right text-[#687177]">14.20</td>
                        <td className="px-4 py-2.5 text-right font-bold text-[#F36B21]">30.80</td>
                        <td className="px-4 py-2.5 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FEF8ED] text-[#B87B17] border border-[#FCE6BD]">
                            REVIEW
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Operational Workflow (Horizontal Step Timeline) */}
      <section id="workflow" className="scroll-mt-20 py-16 sm:py-20 border-b border-[#E3E2DC] bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F36B21]">
              INTEGRITAS & TATA KELOLA DATA
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-[#252A2D] tracking-tight">
              Alur Kerja Nyata dari Pit hingga Kantor Pusat
            </h2>
            <p className="text-base text-[#687177]">
              Setiap angka produksi melewati verifikasi berjenjang untuk mencegah penyimpangan dan klaim sepihak.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {[
              {
                step: "01",
                title: "Catat Produksi",
                role: "Operator Lapangan",
                desc: "Operator front pit mencatat ritase muatan dan operator jembatan timbang menginput gross/tare secara presisi.",
              },
              {
                step: "02",
                title: "Verifikasi Supervisor",
                role: "Mine Supervisor",
                desc: "Supervisor meninjau kualitas data, memeriksa nopol dan ritase, lalu menyetujui atau meminta perbaikan data.",
              },
              {
                step: "03",
                title: "Rekonsiliasi Data",
                role: "Sistem Rekonsiliasi",
                desc: "Sistem membandingkan tiket timbangan vs ritase lapangan untuk mendeteksi varians tonase secara otomatis.",
              },
              {
                step: "04",
                title: "Analisis Management",
                role: "Executive Board",
                desc: "Hanya data yang disetujui resmi masuk ke Laporan Operasional Harian (LOH) dan agregasi evaluasi target perusahaan.",
              },
            ].map((s) => (
              <div
                key={s.step}
                className="p-6 rounded-2xl border border-[#E3E2DC] bg-white space-y-3 shadow-xs relative"
              >
                <span className="text-3xl font-black text-[#F36B21]/80 font-mono">
                  {s.step}
                </span>
                <h3 className="text-base font-bold text-[#252A2D]">{s.title}</h3>
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded border border-[#E3E2DC] bg-[#F8F7F4] text-[#687177]">
                  {s.role}
                </span>
                <p className="text-xs text-[#687177] leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. Safety Section (Graphite Focused High-Contrast Accent) */}
      <section id="safety" className="scroll-mt-20 py-16 sm:py-24 border-b border-[#E3E2DC] bg-[#252A2D] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Column: HSE Content */}
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-white/20 bg-white/10 text-xs font-bold uppercase tracking-wider text-orange-400">
                <ShieldAlert className="h-4 w-4" />
                KESELAMATAN & K3 PERTAMBANGAN
              </span>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Keselamatan bukan sekadar laporan.
              </h2>

              <p className="text-base text-slate-300 leading-relaxed max-w-2xl">
                Dari temuan kondisi berbahaya di jalan angkut tambang hingga investigasi akar masalah, MineTrack memastikan setiap potensi bahaya terdeteksi, tercatat, dan ditindaklanjuti sebelum menjadi kerugian.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-2xl font-black text-white font-mono">240</p>
                  <p className="text-xs text-slate-400 mt-1">Hari Nir-Kecelakaan</p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-2xl font-black text-emerald-400 font-mono">100%</p>
                  <p className="text-xs text-slate-400 mt-1">Tindak Lanjut CAPA</p>
                </div>
                <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                  <p className="text-2xl font-black text-amber-400 font-mono">&lt; 30 m</p>
                  <p className="text-xs text-slate-400 mt-1">Waktu Respons Bahaya</p>
                </div>
              </div>
            </div>

            {/* Right Column: Real Safety Inspection Photo */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-white/20 bg-white/5 p-2 shadow-2xl">
                <div className="relative aspect-16/10 w-full overflow-hidden rounded-xl">
                  <Image
                    src="/images/mining_safety.jpg"
                    alt="Pengawas K3 Tambang Melakukan Inspeksi Lapangan Menggunakan Tablet"
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                </div>
                <p className="text-[11px] text-slate-400 text-center py-2">
                  Inspeksi K3 jalan angkut aktif di front tambang Kendawangan.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ Section */}
      <section id="faq" className="scroll-mt-20 py-16 sm:py-20 border-b border-[#E3E2DC] bg-[#F8F7F4]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[#687177]">
              PERTANYAAN UMUM
            </span>
            <h2 className="text-3xl font-black text-[#252A2D]">
              Seputar Sistem MineTrack
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#E3E2DC] bg-white overflow-hidden shadow-2xs"
              >
                <button
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-bold text-sm text-[#252A2D] hover:text-[#F36B21] transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-[#687177] transition-transform duration-200 shrink-0 ml-2",
                      activeFaq === idx && "rotate-180 text-[#F36B21]"
                    )}
                  />
                </button>
                {activeFaq === idx && (
                  <div className="px-4 pb-4 text-xs text-[#687177] leading-relaxed border-t border-[#E3E2DC] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Final CTA */}
      <section className="py-16 sm:py-24 bg-white border-b border-[#E3E2DC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black text-[#252A2D] tracking-tight">
            Operasional lebih jelas. Keputusan lebih terukur.
          </h2>
          <p className="text-base text-[#687177] max-w-xl mx-auto leading-relaxed">
            Mulai pantau seluruh ritase, pergerakan armada, dan keselamatan kerja tambang Anda dalam satu platform yang terintegrasi.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[#F36B21] text-sm font-bold text-white shadow-xs hover:bg-[#DE5C16] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Masuk ke MineTrack</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#workflow"
              className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-sm font-bold text-[#252A2D] hover:bg-[#EFECE6] transition-all cursor-pointer"
            >
              Lihat Alur Kerja
            </a>
          </div>
        </div>
      </section>

      {/* 10. Footer */}
      <footer className="bg-white py-12 text-xs text-[#687177]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-[#E3E2DC]">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#252A2D] text-white font-bold">
                  <HardHat className="h-4 w-4" />
                </div>
                <span className="font-bold text-sm text-[#252A2D]">MineTrack</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Platform pemantauan operasional tambang terpadu untuk pencatatan produksi, armada, keselamatan kerja, dan laporan shift.
              </p>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[#252A2D] uppercase tracking-wider text-[11px]">Modul Sistem</p>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#fitur" className="hover:text-[#252A2D]">Jembatan Timbang</a></li>
                <li><a href="#fitur" className="hover:text-[#252A2D]">Pencatatan Ritase</a></li>
                <li><a href="#fitur" className="hover:text-[#252A2D]">Monitoring Armada & PM</a></li>
                <li><a href="#safety" className="hover:text-[#252A2D]">Keselamatan K3</a></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[#252A2D] uppercase tracking-wider text-[11px]">Navigasi Cepat</p>
              <ul className="space-y-1.5 text-[11px]">
                <li><a href="#fitur" className="hover:text-[#252A2D]">Fitur Utama</a></li>
                <li><a href="#solusi" className="hover:text-[#252A2D]">Solusi Operasional</a></li>
                <li><a href="#platform" className="hover:text-[#252A2D]">Showcase Platform</a></li>
                <li><a href="#workflow" className="hover:text-[#252A2D]">Alur Kerja</a></li>
                <li><a href="#faq" className="hover:text-[#252A2D]">Pertanyaan Umum</a></li>
                <li><Link href="/login" className="hover:text-[#252A2D]">Masuk ke Sistem</Link></li>
              </ul>
            </div>

            <div className="space-y-2">
              <p className="font-bold text-[#252A2D] uppercase tracking-wider text-[11px]">Kepatuhan & Keamanan</p>
              <p className="text-[11px] leading-relaxed">
                Dilengkapi enkripsi JWT, proteksi RBAC berjenjang, penyimpanan berkas bertanda tangan HMAC-SHA256, dan audit trail transaksi lengkap.
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#687177] gap-2">
            <p>&copy; {new Date().getFullYear()} MineTrack — Sistem Monitoring Operasional Tambang. Hak Cipta Dilindungi.</p>
            <p className="font-mono text-[10px]">WIB (Asia/Jakarta) • Enterprise Grade</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
