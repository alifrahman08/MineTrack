"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  FileCheck,
  TrendingDown,
  Download,
} from "lucide-react";
import { ProductionReconciliationModel, SiteModel, UserSession } from "@/types";
import { formatNumber, formatDateId } from "@/lib/utils";

export default function ManagementReconciliationPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [reconciliations, setReconciliations] = useState<ProductionReconciliationModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [siteFilter, setSiteFilter] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, reconRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/reconciliation?siteId=${siteFilter}`),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const reconJson = await reconRes.json();
      if (reconJson.success) setReconciliations(reconJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) setSites(masterJson.data.sites);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteFilter]);

  const balancedCount = reconciliations.filter((r) => r.status === "BALANCED" || r.status === "RESOLVED").length;
  const discrepancyCount = reconciliations.filter((r) => r.status === "DISCREPANCY_DETECTED").length;
  const totalVariance = reconciliations.reduce((sum, r) => sum + Math.abs(r.weightDiscrepancy), 0);

  return (
    <DashboardLayout
      user={user || { id: "usr-mgr-01", email: "manager@minetrack.com", name: "Management", role: "MANAGEMENT" }}
      title="Audit & Rekonsiliasi Produksi Eksekutif"
      breadcrumbs={[{ label: "Manajemen Eksekutif" }, { label: "Rekonsiliasi Produksi" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rekonsiliasi Selesai</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{balancedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Data seimbang & terverifikasi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selisih Terbuka</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{discrepancyCount}</div>
          <div className="text-xs text-slate-400 mt-1">Kasus dalam penanganan pengawas</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Akumulasi Variance</span>
            <TrendingDown className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{totalVariance.toFixed(2)} Ton</div>
          <div className="text-xs text-slate-400 mt-1">Total selisih bruto vs netto</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Integritas Data</span>
            <FileCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {reconciliations.length > 0 ? `${((balancedCount / reconciliations.length) * 100).toFixed(1)}%` : "100%"}
          </div>
          <div className="text-xs text-emerald-400 mt-1">Akurasi timbang vs ritase</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Site Tambang</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <a href="/api/export/csv?type=production" target="_blank" rel="noreferrer">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Ekspor Rekap Laporan
          </Button>
        </a>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tanggal</th>
                <th className="px-5 py-3.5">Site & Shift</th>
                <th className="px-5 py-3.5">Komoditas</th>
                <th className="px-5 py-3.5 text-right font-mono">Timbangan Tiket</th>
                <th className="px-5 py-3.5 text-right font-mono">Produksi Tercatat</th>
                <th className="px-5 py-3.5 text-right font-mono font-bold">Selisih</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Catatan Investigasi / Resolusi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Tidak ada rekonsiliasi pada filter ini.
                  </td>
                </tr>
              ) : (
                reconciliations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-semibold text-slate-200">{formatDateId(r.date)}</td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200">{r.siteName}</div>
                      <div className="text-xs text-slate-400">{r.shiftName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-amber-400">{r.materialName}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-200">
                      {formatNumber(r.totalTicketsWeight)} Ton
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-200">
                      {formatNumber(r.totalProductionWeight)} Ton
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-mono font-bold ${
                        r.weightDiscrepancy === 0
                          ? "text-emerald-400"
                          : Math.abs(r.weightDiscrepancy) > 5
                          ? "text-red-400"
                          : "text-amber-400"
                      }`}
                    >
                      {r.weightDiscrepancy > 0 ? `+${r.weightDiscrepancy}` : r.weightDiscrepancy} Ton
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant={
                          r.status === "BALANCED"
                            ? "success"
                            : r.status === "RESOLVED"
                            ? "outline"
                            : "warning"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {r.resolutionNotes ? (
                        <div>
                          <span className="text-emerald-400 font-medium">Resolusi: </span>
                          {r.resolutionNotes}
                        </div>
                      ) : (
                        r.investigationNotes || "-"
                      )}
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
