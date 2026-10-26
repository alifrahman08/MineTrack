import React from "react";
import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProductionCharts } from "@/components/dashboard/production-charts";
import {
  Pickaxe,
  Truck,
  AlertTriangle,
  FileCheck2,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Layers,
  FileText,
  Building2,
  ArrowUpRight,
  CheckSquare,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateId } from "@/lib/utils";

export default async function SupervisorDashboardPage() {
  const user = await requireRole(["SUPERVISOR", "ADMINISTRATOR"]);
  const analytics = db.getProductionAnalytics();
  const pendingRecords = db.getProductionRecords({ status: "SUBMITTED" });
  const openIncidents = db.getSafetyIncidents({ status: "OPEN" });
  const activeDowntimes = db.getDowntimeReports({ status: "OPEN" });
  const allEquipment = db.getAllEquipment();

  const operatingUnits = allEquipment.filter((e) => e.status === "IN_USE" || e.status === "AVAILABLE");
  const breakdownUnits = allEquipment.filter((e) => e.status === "BREAKDOWN");
  const maintenanceUnits = allEquipment.filter((e) => e.status === "MAINTENANCE");

  return (
    <DashboardLayout
      user={user}
      title="Shift Operations"
      breadcrumbs={[{ label: "Supervisor" }, { label: "Shift Operations" }]}
    >
      {/* Shift Briefing Header & Quick Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-[#E3E2DC]">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#287D54] animate-pulse" />
            <h2 className="text-xl font-black text-[#252A2D] tracking-tight">Shift Operations</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8F7F4] border border-[#E3E2DC] text-[#252A2D]">
              Shift 1 Siang (07:00 - 19:00 WIB)
            </span>
          </div>
          <p className="text-xs text-[#687177] mt-0.5">
            Site Kendawangan (Kalbar) • Pit Alumina 01 — Pantau produksi, validasi laporan, dan tangani kendala operasional.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/supervisor/production"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F36B21] text-xs font-bold text-white shadow-xs hover:bg-[#DE5C16] transition-colors"
          >
            <Pickaxe className="h-3.5 w-3.5" />
            <span>Review Produksi ({pendingRecords.length})</span>
          </Link>
          <Link
            href="/supervisor/shifts"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-[#477A9B]" />
            <span>Penugasan Shift</span>
          </Link>
          <Link
            href="/supervisor/downtime"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-[#C94438]" />
            <span>Tinjau Downtime</span>
          </Link>
          <Link
            href="/supervisor/safety"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-[#B87B17]" />
            <span>Tindak Lanjut K3</span>
          </Link>
          <Link
            href="/supervisor/reports"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252A2D] text-xs font-bold text-white shadow-xs hover:bg-[#383E43] transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Buat LOH</span>
          </Link>
        </div>
      </div>

      {/* Action Required Banner if pending items exist */}
      {(pendingRecords.length > 0 || openIncidents.length > 0) && (
        <div className="rounded-xl border border-[#FCE6BD] bg-[#FEF8ED] p-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <AlertCircle className="h-5 w-5 text-[#B87B17] shrink-0 mt-0.5 sm:mt-0" />
              <div>
                <h4 className="font-bold text-[#8C5D0E]">
                  Perhatian: Terdapat Pekerjaan yang Membutuhkan Verifikasi Lapangan Segera
                </h4>
                <p className="text-[#8C5D0E]/90 mt-0.5">
                  {pendingRecords.length} catatan produksi menunggu persetujuan supervisor •{" "}
                  {openIncidents.length} temuan bahaya K3 membutuhkan verifikasi tindakan koreksi.
                </p>
              </div>
            </div>
            <Link
              href="/supervisor/production"
              className="px-3.5 py-1.5 rounded-lg bg-[#F36B21] text-xs font-bold text-white hover:bg-[#DE5C16] shadow-xs transition-colors shrink-0 text-center"
            >
              Tinjau Sekarang &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* A. Shift Briefing KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Produksi Shift Terverifikasi"
          value={formatNumber(analytics.totalCoalTon)}
          unit="Ton"
          icon={Pickaxe}
          variant="safety"
          description={`Target Shift: ${formatNumber(analytics.targetCoalTon)} Ton`}
          trend={{
            value: `${analytics.achievementPercent}%`,
            isPositive: analytics.achievementPercent >= 100,
            label: "target shift",
          }}
        />

        <MetricCard
          title="Antrean Review"
          value={pendingRecords.length}
          unit="Catatan"
          icon={FileCheck2}
          variant={pendingRecords.length > 0 ? "warning" : "default"}
          description="Tiket ritase & timbangan operator"
        />

        <MetricCard
          title="Armada Beroperasi"
          value={`${operatingUnits.length}/${allEquipment.length}`}
          unit="Unit"
          icon={Truck}
          variant="success"
          description={`${breakdownUnits.length} Breakdown • ${maintenanceUnits.length} Servis`}
        />

        <MetricCard
          title="Insiden K3 Terbuka"
          value={openIncidents.length}
          unit="Temuan"
          icon={AlertTriangle}
          variant={openIncidents.length > 0 ? "destructive" : "success"}
          description="Pengawasan K3 & Near-miss"
        />
      </div>

      {/* B. Action-Oriented Queue & Operational Status (Tampilkan tindakan terlebih dahulu!) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Approval Queue Table (7 Cols) */}
        <div className="lg:col-span-7 rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div>
                <h3 className="text-sm font-bold text-[#252A2D]">
                  Antrean Review Produksi Operator
                </h3>
                <p className="text-xs text-[#687177]">
                  Verifikasi kesesuaian tiket timbang, nomor unit, dan muatan
                </p>
              </div>
              <Link
                href="/supervisor/production"
                className="text-xs font-bold text-[#F36B21] hover:underline flex items-center gap-1"
              >
                <span>Buka Antrean Lengkap</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="mt-4 divide-y divide-[#E3E2DC]">
              {pendingRecords.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#687177]">
                  <CheckCircle2 className="h-6 w-6 text-[#287D54] mx-auto mb-1.5" />
                  <p className="font-semibold text-[#252A2D]">Semua Catatan Produksi Telah Diverifikasi</p>
                  <p className="text-[11px] text-[#687177] mt-0.5">Tidak ada draf yang menunggu persetujuan saat ini.</p>
                </div>
              ) : (
                pendingRecords.map((r) => (
                  <div key={r.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#F36B21]">
                          {r.recordNumber}
                        </span>
                        <span className="font-semibold text-[#252A2D]">• {r.material?.name}</span>
                        <Badge variant="warning" className="text-[9px]">SUBMITTED</Badge>
                      </div>
                      <p className="text-[11px] text-[#687177] mt-0.5">
                        Opr: {r.operator?.name} • Unit: {r.equipment?.code || "-"} • Pit: {r.pit?.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center">
                      <div className="text-right">
                        <p className="font-mono font-bold text-[#252A2D]">
                          {formatNumber(r.netWeight)} {r.unit}
                        </p>
                        <p className="text-[10px] text-[#687177]">{r.ritaseCount} Ritase</p>
                      </div>

                      <Link
                        href={`/supervisor/production?recordId=${r.id}`}
                        className="px-2.5 py-1 rounded bg-[#252A2D] text-white text-[11px] font-bold hover:bg-[#F36B21] transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3E2DC] flex items-center justify-between text-xs text-[#687177]">
            <span>Menampilkan catatan berstatus SUBMITTED</span>
            <Link href="/supervisor/weighbridge" className="font-semibold text-[#F36B21] hover:underline">
              Cek Tiket Timbang Digital &rarr;
            </Link>
          </div>
        </div>

        {/* Right Column: Fleet Status & Safety Watch (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Fleet Status */}
          <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#F36B21]" />
                <h3 className="text-sm font-bold text-[#252A2D]">Status Armada di Pit</h3>
              </div>
              <Link href="/supervisor/equipment" className="text-xs font-semibold text-[#F36B21] hover:underline">
                Monitoring &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3.5 text-center">
              <div className="p-2.5 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2]">
                <p className="text-[10px] font-bold text-[#287D54] uppercase">Operasi</p>
                <p className="text-lg font-black text-[#287D54] mt-0.5">{operatingUnits.length}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1]">
                <p className="text-[10px] font-bold text-[#C94438] uppercase">Breakdown</p>
                <p className="text-lg font-black text-[#C94438] mt-0.5">{breakdownUnits.length}</p>
              </div>
              <div className="p-2.5 rounded-lg border border-[#FCE6BD] bg-[#FEF8ED]">
                <p className="text-[10px] font-bold text-[#B87B17] uppercase">Servis PM</p>
                <p className="text-lg font-black text-[#B87B17] mt-0.5">{maintenanceUnits.length}</p>
              </div>
            </div>

            {/* Active Downtime Summary */}
            <div className="mt-3.5 pt-3 border-t border-[#E3E2DC]">
              <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider block mb-2">
                Kendala Downtime Aktif:
              </span>
              {activeDowntimes.length === 0 ? (
                <p className="text-xs text-[#287D54] font-semibold">Seluruh unit hauler & excavator beroperasi normal.</p>
              ) : (
                activeDowntimes.slice(0, 2).map((d) => (
                  <div key={d.id} className="p-2 rounded border border-[#F8D2CF] bg-[#FDF2F1] text-xs mb-1.5">
                    <span className="font-bold text-[#C94438]">{d.equipment?.code || d.equipmentId}</span>: {d.description}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Safety Watch */}
          <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#B87B17]" />
                <h3 className="text-sm font-bold text-[#252A2D]">Safety Watch (K3 Lapangan)</h3>
              </div>
              <Link href="/supervisor/safety" className="text-xs font-semibold text-[#F36B21] hover:underline">
                Pengawasan &rarr;
              </Link>
            </div>

            <div className="mt-3 space-y-2">
              {openIncidents.length === 0 ? (
                <div className="p-3 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2] text-center text-xs text-[#287D54] font-semibold">
                  Zero Incident dilaporkan pada shift ini.
                </div>
              ) : (
                openIncidents.map((inc) => (
                  <div key={inc.id} className="p-2.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-[#252A2D]">{inc.incidentNumber} • {inc.category}</span>
                      <Badge variant={inc.severity === "CRITICAL" || inc.severity === "HIGH" ? "destructive" : "warning"}>
                        {inc.severity}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-[#687177] mt-1">{inc.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* C. Production Chart */}
      <ProductionCharts trendData={analytics.trend} />
    </DashboardLayout>
  );
}
