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
  Layers,
  ArrowRight,
  ShieldCheck,
  Clock,
  CheckCircle2,
  UserPlus,
  PlusCircle,
  Target,
  Wrench,
  AlertCircle,
  Building2,
  Activity,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateTimeId } from "@/lib/utils";

export default async function AdminDashboardPage() {
  const user = await requireRole(["ADMINISTRATOR"]);
  const analytics = db.getProductionAnalytics();
  const sites = db.getAllSites();
  const recentRecords = db.getProductionRecords().slice(0, 5);
  const recentAuditLogs = db.getAuditLogs({ limit: 6 });
  const openIncidents = db.getSafetyIncidents({ status: "OPEN" });
  const activeDowntimes = db.getDowntimeReports({ status: "OPEN" });

  const availableUnits = analytics.equipmentSummary.available;
  const inUseUnits = analytics.equipmentSummary.inUse;
  const totalOperating = availableUnits + inUseUnits;

  return (
    <DashboardLayout
      user={user}
      title="System Overview"
      breadcrumbs={[{ label: "Admin" }, { label: "System Overview" }]}
    >
      {/* Header & Quick Action Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#E3E2DC]">
        <div>
          <h2 className="text-xl font-black text-[#252A2D] tracking-tight">System Overview</h2>
          <p className="text-xs text-[#687177] mt-0.5">
            Ringkasan kondisi platform dan kegiatan operasional seluruh site konsesi tambang.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5 text-[#F36B21]" />
            <span>Tambah Pengguna</span>
          </Link>
          <Link
            href="/admin/master"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Building2 className="h-3.5 w-3.5 text-[#477A9B]" />
            <span>Kelola Site & Pit</span>
          </Link>
          <Link
            href="/admin/equipment"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Truck className="h-3.5 w-3.5 text-[#287D54]" />
            <span>Kelola Alat Berat</span>
          </Link>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Target className="h-3.5 w-3.5 text-[#B87B17]" />
            <span>Atur Target</span>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#252A2D] text-xs font-bold text-white shadow-xs hover:bg-[#383E43] transition-colors"
          >
            <History className="h-3.5 w-3.5" />
            <span>Buka Audit Log</span>
          </Link>
        </div>
      </div>

      {/* A. KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Produksi Disetujui"
          value={formatNumber(analytics.totalCoalTon)}
          unit="Ton"
          icon={Pickaxe}
          variant="safety"
          description={`Target Shift: ${formatNumber(analytics.targetCoalTon)} Ton`}
          trend={{
            value: `${analytics.achievementPercent}%`,
            isPositive: analytics.achievementPercent >= 100,
            label: "pencapaian",
          }}
        />

        <MetricCard
          title="Jumlah Site Aktif"
          value={sites.length}
          unit="Konsesi"
          icon={Building2}
          variant="info"
          description={`${sites.reduce((acc, s) => acc + (s.pits?.length || 0), 0)} Pit operasional aktif`}
        />

        <MetricCard
          title="Unit Alat Berat Siap"
          value={`${totalOperating}/${analytics.equipmentSummary.total}`}
          unit="Unit"
          icon={Truck}
          variant="success"
          description={`${analytics.equipmentSummary.breakdown} Breakdown • ${analytics.equipmentSummary.maintenance} PM Servis`}
          trend={{
            value: `${Math.round((totalOperating / (analytics.equipmentSummary.total || 1)) * 100)}%`,
            isPositive: true,
            label: "ketersediaan",
          }}
        />

        <MetricCard
          title="Laporan Menunggu Review"
          value={analytics.pendingReviewCount}
          unit="Catatan"
          icon={FileCheck2}
          variant={analytics.pendingReviewCount > 0 ? "warning" : "default"}
          description={`${openIncidents.length} Temuan K3 aktif`}
        />
      </div>

      {/* B. Main Charts: Tren Produksi & Overburden */}
      <ProductionCharts
        trendData={analytics.trend}
        materialData={analytics.byMaterial}
        siteData={analytics.bySite}
      />

      {/* C. Operational Status & Pending Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet & Downtime Status (1 Col) */}
        <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#F36B21]" />
                <h3 className="text-sm font-bold text-[#252A2D]">Status Armada & Downtime</h3>
              </div>
              <Link href="/admin/downtime" className="text-xs font-semibold text-[#F36B21] hover:underline">
                Detail &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="p-3 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2]">
                <p className="text-[10px] font-bold text-[#287D54] uppercase">Tersedia / Aktif</p>
                <p className="text-xl font-black text-[#287D54] mt-1">{totalOperating} Unit</p>
                <p className="text-[10px] text-[#287D54]">Beroperasi di Pit</p>
              </div>

              <div className="p-3 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1]">
                <p className="text-[10px] font-bold text-[#C94438] uppercase">Breakdown</p>
                <p className="text-xl font-black text-[#C94438] mt-1">{analytics.equipmentSummary.breakdown} Unit</p>
                <p className="text-[10px] text-[#C94438]">Perbaikan Darurat</p>
              </div>
            </div>

            {/* Active Downtime List */}
            <div className="mt-4 space-y-2">
              <span className="text-[11px] font-bold text-[#687177] uppercase tracking-wider">
                Downtime Sedang Berjalan:
              </span>
              {activeDowntimes.length === 0 ? (
                <div className="p-3 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs text-[#287D54] font-semibold text-center">
                  Tidak ada unit yang mengalami breakdown saat ini.
                </div>
              ) : (
                activeDowntimes.slice(0, 2).map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] text-xs">
                    <div className="flex items-center justify-between font-bold text-[#C94438]">
                      <span>{d.equipment?.code || d.equipmentId}</span>
                      <span className="font-mono text-[10px]">{d.category}</span>
                    </div>
                    <p className="text-[11px] text-[#252A2D] mt-0.5">{d.description}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3E2DC]">
            <Link
              href="/admin/maintenance"
              className="text-xs font-bold text-[#252A2D] hover:text-[#F36B21] flex items-center justify-between"
            >
              <span>Jadwal Preventive Maintenance</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Pending Actions & Verification Queue (1 Col) */}
        <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <FileCheck2 className="h-4 w-4 text-[#B87B17]" />
                <h3 className="text-sm font-bold text-[#252A2D]">Tindakan Tertunda</h3>
              </div>
              <Badge variant="warning">{analytics.pendingReviewCount} Antrean</Badge>
            </div>

            <div className="mt-4 divide-y divide-[#E3E2DC]">
              {recentRecords.slice(0, 3).map((r) => (
                <div key={r.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-bold text-[#252A2D]">{r.recordNumber}</p>
                    <p className="text-[11px] text-[#687177]">
                      {r.operator?.name} • {r.material?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#252A2D]">{formatNumber(r.netWeight)} Ton</p>
                    <Badge variant={r.status === "APPROVED" ? "success" : r.status === "SUBMITTED" ? "warning" : "secondary"}>
                      {r.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3E2DC]">
            <Link
              href="/admin/production"
              className="w-full py-2 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs font-bold text-[#252A2D] hover:bg-[#EFECE6] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Buka Seluruh Antrean Produksi</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Safety Oversight & K3 Watch (1 Col) */}
        <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#C94438]" />
                <h3 className="text-sm font-bold text-[#252A2D]">Pengawasan K3 Terbuka</h3>
              </div>
              <Badge variant={openIncidents.length > 0 ? "destructive" : "success"}>
                {openIncidents.length} Kasus
              </Badge>
            </div>

            <div className="mt-4 space-y-2.5">
              {openIncidents.length === 0 ? (
                <div className="p-4 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2] text-center">
                  <CheckCircle2 className="h-5 w-5 text-[#287D54] mx-auto mb-1" />
                  <p className="text-xs font-bold text-[#287D54]">Nir-Kecelakaan (Zero Fatality)</p>
                  <p className="text-[11px] text-[#687177] mt-0.5">Semua temuan bahaya telah ditindaklanjuti.</p>
                </div>
              ) : (
                openIncidents.slice(0, 2).map((inc) => (
                  <div key={inc.id} className="p-3 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] text-xs">
                    <div className="flex items-center justify-between font-bold text-[#C94438]">
                      <span>{inc.incidentNumber} • {inc.category}</span>
                      <span className="text-[10px] uppercase font-mono">{inc.severity}</span>
                    </div>
                    <p className="text-[11px] text-[#252A2D] mt-1">{inc.description}</p>
                    <p className="text-[10px] text-[#687177] mt-1">Lokasi: {inc.location}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E3E2DC]">
            <Link
              href="/admin/safety"
              className="text-xs font-bold text-[#C94438] hover:underline flex items-center justify-between"
            >
              <span>Audit Kepatuhan & Insiden K3</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* D. Activity Log (Audit Trail) */}
      <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-[#287D54]" />
            <h3 className="text-sm font-bold text-[#252A2D]">Aktivitas Administrasi & Audit Log Terakhir</h3>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-xs font-bold text-[#F36B21] hover:underline flex items-center gap-1"
          >
            <span>Buka Selengkapnya</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-3 divide-y divide-[#E3E2DC]">
          {recentAuditLogs.map((log) => (
            <div key={log.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-1 sm:gap-4">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="font-bold text-[#252A2D] truncate">
                  {log.userEmail || "Sistem"}
                </span>
                <span className="rounded bg-[#F8F7F4] border border-[#E3E2DC] px-1.5 py-0.5 text-[10px] font-mono text-[#687177] shrink-0">
                  {log.action}
                </span>
                <span className="text-[#687177] text-[11px] truncate max-w-lg">
                  {log.details}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#687177] shrink-0">
                {formatDateTimeId(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
