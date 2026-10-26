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
  Download,
  Layers,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  Building2,
  AlertCircle,
  FileSpreadsheet,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateId } from "@/lib/utils";

export default async function ManagementDashboardPage() {
  const user = await requireRole(["MANAGEMENT", "ADMINISTRATOR"]);
  const analytics = db.getProductionAnalytics();
  const sites = db.getAllSites();
  const approvedRecords = db.getProductionRecords({ status: "APPROVED" });
  const openIncidents = db.getSafetyIncidents({ status: "OPEN" });
  const activeDowntimes = db.getDowntimeReports({ status: "OPEN" });

  const totalDowntimeMinutes = activeDowntimes.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);
  const activeEquipmentCount = analytics.equipmentSummary.available + analytics.equipmentSummary.inUse;
  const availabilityRate = analytics.equipmentSummary.total > 0
    ? ((activeEquipmentCount / analytics.equipmentSummary.total) * 100).toFixed(1)
    : "0";

  return (
    <DashboardLayout
      user={user}
      title="Executive Performance"
      breadcrumbs={[{ label: "Management" }, { label: "Executive Performance" }]}
    >
      {/* Top Controls & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[#E3E2DC]">
        <div>
          <h2 className="text-xl font-black text-[#252A2D] tracking-tight">Executive Performance</h2>
          <p className="text-xs text-[#687177] mt-0.5">
            Konsolidasi resmi lintas site tambang — data transaksi tervalidasi (Approved Only).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/management/reports"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E3E2DC] bg-white text-xs font-bold text-[#252A2D] shadow-2xs hover:bg-[#F8F7F4] hover:border-[#687177]/40 transition-colors"
          >
            <Printer className="h-3.5 w-3.5 text-[#687177]" />
            <span>Laporan & Cetak</span>
          </Link>
          <a
            href="/api/export/csv?type=production"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F36B21] text-xs font-bold text-white shadow-xs hover:bg-[#DE5C16] transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV Eksekutif</span>
          </a>
        </div>
      </div>

      {/* A. Executive Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Produksi Disetujui"
          value={formatNumber(analytics.totalCoalTon)}
          unit="Ton"
          icon={Pickaxe}
          variant="safety"
          description={`Target Konsesi: ${formatNumber(analytics.targetCoalTon)} Ton`}
        />

        <MetricCard
          title="Pencapaian Target"
          value={`${analytics.achievementPercent}%`}
          unit=""
          icon={TrendingUp}
          variant={analytics.achievementPercent >= 100 ? "success" : "warning"}
          trend={{
            value: `${analytics.achievementPercent}%`,
            isPositive: analytics.achievementPercent >= 100,
            label: "realisasi",
          }}
          description="+150 Ton vs rencana kerja"
        />

        <MetricCard
          title="Ketersediaan Armada"
          value={`${availabilityRate}%`}
          unit=""
          icon={Truck}
          variant="info"
          description={`${activeEquipmentCount}/${analytics.equipmentSummary.total} Unit beroperasi`}
        />

        <MetricCard
          title="Downtime Aktif"
          value={activeDowntimes.length}
          unit="Unit"
          icon={Clock}
          variant={activeDowntimes.length > 0 ? "warning" : "success"}
          description={`${totalDowntimeMinutes} menit kumulatif`}
        />

        <MetricCard
          title="Insiden K3 Terbuka"
          value={openIncidents.length}
          unit="Kasus"
          icon={ShieldCheck}
          variant={openIncidents.length === 0 ? "success" : "destructive"}
          description="Nir-kecelakaan hari ke-240"
        />
      </div>

      {/* B. Main Visualizations */}
      <ProductionCharts
        trendData={analytics.trend}
        materialData={analytics.byMaterial}
        siteData={analytics.bySite}
      />

      {/* C. Site Comparison Table */}
      <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
          <div>
            <h3 className="text-sm font-bold text-[#252A2D]">
              Tabel Komparasi Kinerja Antar-Site Konsesi
            </h3>
            <p className="text-xs text-[#687177] mt-0.5">
              Perbandingan realisasi produksi batubara, overburden, downtime, dan status keselamatan per konsesi
            </p>
          </div>
          <Link
            href="/management/analytics"
            className="text-xs font-bold text-[#F36B21] hover:underline flex items-center gap-1"
          >
            <span>Analisis Detail</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F8F7F4] text-[#687177] border-b border-[#E3E2DC] font-bold text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4">Konsesi Site</th>
                <th className="py-3 px-4">Lokasi Tambang</th>
                <th className="py-3 px-4 text-right">Target Harian</th>
                <th className="py-3 px-4 text-right">Produksi Disetujui</th>
                <th className="py-3 px-4 text-center">Pencapaian (%)</th>
                <th className="py-3 px-4 text-center">Downtime Armada</th>
                <th className="py-3 px-4 text-center">Insiden K3</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E2DC] text-[#252A2D]">
              {sites.map((site) => {
                const siteRecords = approvedRecords.filter((r) => r.siteId === site.id);
                const siteCoal = siteRecords.reduce((sum, r) => sum + r.netWeight, 0);
                const siteTarget = 2500;
                const achievementPct = siteTarget > 0 ? (siteCoal / siteTarget) * 100 : 0;
                const siteDowntimes = activeDowntimes.filter((d) => d.siteId === site.id);
                const siteIncidents = openIncidents.filter((i) => i.siteId === site.id);

                return (
                  <tr key={site.id} className="hover:bg-[#F8F7F4]/60 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#252A2D]">
                      {site.name} ({site.code})
                    </td>
                    <td className="py-3 px-4 text-[#687177]">{site.location}</td>
                    <td className="py-3 px-4 text-right font-mono font-semibold">
                      {formatNumber(siteTarget)} Ton
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#252A2D]">
                      {formatNumber(siteCoal)} Ton
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                          achievementPct >= 100
                            ? "bg-[#EDF7F2] text-[#287D54] border-[#CDE9DA]"
                            : "bg-[#FEF8ED] text-[#B87B17] border-[#FCE6BD]"
                        }`}
                      >
                        {achievementPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {siteDowntimes.length > 0 ? (
                        <span className="text-[#C94438] font-bold">{siteDowntimes.length} Unit</span>
                      ) : (
                        <span className="text-[#287D54] font-semibold">0 Breakdown</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {siteIncidents.length > 0 ? (
                        <span className="text-[#C94438] font-bold">{siteIncidents.length} Open</span>
                      ) : (
                        <span className="text-[#287D54] font-semibold">Nir-Kecelakaan</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. Operational Risks & Corporate Exceptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Panel: Fleet Downtime */}
        <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#F36B21]" />
              <h3 className="text-sm font-bold text-[#252A2D]">Unit dengan Kendala Operasional</h3>
            </div>
            <Link href="/management/downtime" className="text-xs font-semibold text-[#F36B21] hover:underline">
              Semua Downtime &rarr;
            </Link>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {activeDowntimes.length === 0 ? (
              <div className="p-4 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2] text-center text-xs text-[#287D54] font-semibold">
                Tidak ada gangguan armada kritis yang belum tertangani.
              </div>
            ) : (
              activeDowntimes.map((d) => (
                <div key={d.id} className="p-3 rounded-lg border border-[#F8D2CF] bg-[#FDF2F1] text-xs">
                  <div className="flex items-center justify-between font-bold text-[#C94438]">
                    <span>{d.equipment?.code || d.equipmentId} • {d.category}</span>
                    <span>Durasi: {d.durationMinutes || 0} Menit</span>
                  </div>
                  <p className="text-[11px] text-[#252A2D] mt-1">{d.description}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Risk Panel: Safety Oversight */}
        <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-[#E3E2DC]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#C94438]" />
              <h3 className="text-sm font-bold text-[#252A2D]">Perhatian K3 Eksekutif</h3>
            </div>
            <Link href="/management/safety" className="text-xs font-semibold text-[#F36B21] hover:underline">
              Laporan K3 &rarr;
            </Link>
          </div>

          <div className="mt-3.5 space-y-2.5">
            {openIncidents.length === 0 ? (
              <div className="p-4 rounded-lg border border-[#CDE9DA] bg-[#EDF7F2] text-center text-xs text-[#287D54] font-semibold">
                Nir-Kecelakaan (Zero Fatality) terjaga di seluruh site konsesi tambang.
              </div>
            ) : (
              openIncidents.map((inc) => (
                <div key={inc.id} className="p-3 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] text-xs">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-[#252A2D]">{inc.incidentNumber} • {inc.category}</span>
                    <Badge variant={inc.severity === "CRITICAL" || inc.severity === "HIGH" ? "destructive" : "warning"}>
                      {inc.severity}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-[#687177] mt-1">{inc.description}</p>
                  <p className="text-[10px] text-[#687177] mt-1 font-mono">Lokasi: {inc.location}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
