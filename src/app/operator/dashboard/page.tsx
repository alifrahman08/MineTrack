import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/dashboard/metric-card";
import {
  Pickaxe,
  Truck,
  AlertTriangle,
  FileCheck2,
  Calendar,
  Clock,
  ArrowRight,
  CheckCircle2,
  Scale,
  Plus,
  Wifi,
  WifiOff,
  UserCheck,
  MapPin,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateId } from "@/lib/utils";

export default async function OperatorDashboardPage() {
  const user = await requireRole(["OPERATOR", "ADMINISTRATOR"]);
  const allRecords = db.getProductionRecords({ operatorId: user.id });
  const myAssignments = db.getShiftAssignments({ operatorId: user.id });

  const draftRecords = allRecords.filter((r) => r.status === "DRAFT");
  const revisionRecords = allRecords.filter((r) => r.status === "NEEDS_REVISION");
  const approvedRecords = allRecords.filter((r) => r.status === "APPROVED");
  const totalApprovedWeight = approvedRecords.reduce((sum, r) => sum + r.netWeight, 0);

  // Active assignment metadata
  const currentShift = myAssignments[0]?.shift?.name || "Shift 1 Siang (07:00 - 19:00 WIB)";
  const currentUnit = myAssignments[0]?.equipment?.code || "DT-104 (Scania P410)";
  const currentSupervisor = "Budi Santoso (Supervisor Pit)";

  return (
    <DashboardLayout
      user={user}
      title="My Shift"
      breadcrumbs={[{ label: "Operator" }, { label: "My Shift" }]}
    >
      {/* Revision Alert Banner if any records need revision */}
      {revisionRecords.length > 0 && (
        <div className="rounded-xl border border-[#F8D2CF] bg-[#FDF2F1] p-4 text-xs animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#C94438] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="font-bold text-[#A73429]">
                  Perhatian: Terdapat {revisionRecords.length} Catatan yang Dikembalikan oleh Supervisor
                </h4>
                <p className="text-[#A73429]/90 mt-0.5">
                  Catatan revisi: "{revisionRecords[0]?.rejectionReason || "Perlu perbaikan data berat timbangan"}". Silakan perbaiki dan ajukan ulang.
                </p>
              </div>
            </div>
            <Link
              href="/operator/production"
              className="px-4 py-2 rounded-lg bg-[#C94438] text-xs font-bold text-white hover:bg-[#B33B30] shadow-xs shrink-0 text-center"
            >
              Perbaiki Sekarang &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* Active Shift Card with Prominent "Catat Produksi" CTA */}
      <div className="rounded-2xl border border-[#E3E2DC] bg-white p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#287D54] animate-pulse" />
              <span className="text-[11px] font-bold text-[#287D54] uppercase tracking-wider">
                PENUGASAN SHIFT AKTIF
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-[#252A2D] tracking-tight">
              {currentShift}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-[#687177] pt-1">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-[#F36B21] shrink-0" />
                <span>Site Kendawangan • Pit Alumina 01</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="h-4 w-4 text-[#477A9B] shrink-0" />
                <span className="font-semibold text-[#252A2D]">Unit: {currentUnit}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <UserCheck className="h-4 w-4 text-[#287D54] shrink-0" />
                <span>{currentSupervisor}</span>
              </div>
            </div>
          </div>

          {/* Large Touch-Friendly Primary CTA Button */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
            <Link
              href="/operator/production"
              className="px-6 py-4 rounded-xl bg-[#F36B21] text-white font-bold text-sm sm:text-base shadow-sm hover:bg-[#DE5C16] active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-center cursor-pointer"
            >
              <Scale className="h-5 w-5" />
              <span>Catat Produksi Sekarang</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/operator/offline"
              className="px-4 py-2 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs font-bold text-[#687177] hover:text-[#252A2D] hover:bg-[#EFECE6] flex items-center justify-center gap-1.5 transition-colors"
            >
              <WifiOff className="h-3.5 w-3.5" />
              <span>Buka Antrean Offline Pit</span>
            </Link>
          </div>
        </div>

        {/* Secondary Quick Action Bar */}
        <div className="mt-5 pt-4 border-t border-[#E3E2DC] flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-[#687177] uppercase tracking-wider mr-2">
            Laporan Lapangan:
          </span>
          <Link
            href="/operator/downtime"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs font-semibold text-[#252A2D] hover:bg-[#EFECE6] transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-[#C94438]" />
            <span>Lapor Kondisi Alat (Downtime)</span>
          </Link>
          <Link
            href="/operator/safety"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs font-semibold text-[#252A2D] hover:bg-[#EFECE6] transition-colors"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-[#F36B21]" />
            <span>Lapor Temuan Bahaya K3</span>
          </Link>
        </div>
      </div>

      {/* Operator KPI Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Produksi Disetujui"
          value={formatNumber(totalApprovedWeight)}
          unit="Ton"
          icon={Pickaxe}
          variant="safety"
          description="Muatan resmi disetujui supervisor"
        />

        <MetricCard
          title="Total Catatan"
          value={allRecords.length}
          unit="Tiket"
          icon={Scale}
          variant="info"
          description="Ritase & timbangan shift ini"
        />

        <MetricCard
          title="Draf Tersimpan"
          value={draftRecords.length}
          unit="Catatan"
          icon={FileCheck2}
          variant="default"
          description="Belum diajukan untuk review"
        />

        <MetricCard
          title="Perlu Revisi"
          value={revisionRecords.length}
          unit="Catatan"
          icon={AlertTriangle}
          variant={revisionRecords.length > 0 ? "warning" : "success"}
          description={revisionRecords.length > 0 ? "Perlu koreksi segera" : "Semua draf bersih"}
        />
      </div>

      {/* Operator Production Records History */}
      <div className="rounded-xl border border-[#E3E2DC] bg-white shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#E3E2DC] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#252A2D]">
              Riwayat Catatan Produksi Anda
            </h3>
            <p className="text-xs text-[#687177] mt-0.5">Daftar transaksi timbangan dan ritase yang Anda catat</p>
          </div>
          <Link
            href="/operator/production"
            className="text-xs font-bold text-[#F36B21] hover:underline flex items-center gap-1"
          >
            <span>Buka Formulir Lengkap</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F4] text-[#687177] border-b border-[#E3E2DC] font-bold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">No. Tiket</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Unit Alat</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Catatan Pengawas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E2DC] text-[#252A2D]">
              {allRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#687177]">
                    Belum ada catatan produksi dibuat. Gunakan tombol "Catat Produksi" di atas.
                  </td>
                </tr>
              ) : (
                allRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#F36B21]">
                      {r.recordNumber}
                    </td>
                    <td className="py-3 px-4">{formatDateId(r.date)}</td>
                    <td className="py-3 px-4 font-medium">{r.material?.name}</td>
                    <td className="py-3 px-4 font-mono text-[#687177]">{r.equipment?.code || "-"}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#252A2D]">
                      {formatNumber(r.netWeight)} {r.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === "APPROVED" && <Badge variant="success">Disetujui</Badge>}
                      {r.status === "SUBMITTED" && <Badge variant="warning">Review</Badge>}
                      {r.status === "DRAFT" && <Badge variant="secondary">Draft</Badge>}
                      {r.status === "NEEDS_REVISION" && <Badge variant="destructive">Revisi</Badge>}
                      {r.status === "REJECTED" && <Badge variant="destructive">Ditolak</Badge>}
                    </td>
                    <td className="py-3 px-4 text-[#687177] max-w-xs truncate">
                      {r.rejectionReason || r.notes || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
