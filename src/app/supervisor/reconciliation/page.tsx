"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  CheckSquare,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  AlertTriangle,
  Scale,
  Pickaxe,
  TrendingUp,
  FileCheck,
} from "lucide-react";
import { ProductionReconciliationModel, SiteModel, ShiftModel, MaterialModel, UserSession } from "@/types";
import { formatNumber, formatDateId } from "@/lib/utils";

export default function SupervisorReconciliationPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [reconciliations, setReconciliations] = useState<ProductionReconciliationModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [shifts, setShifts] = useState<ShiftModel[]>([]);
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Scan modal
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [scanSiteId, setScanSiteId] = useState("");
  const [scanShiftId, setScanShiftId] = useState("");
  const [scanMaterialId, setScanMaterialId] = useState("");
  const [scanDate, setScanDate] = useState("");

  // Resolve modal
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [selectedRecon, setSelectedRecon] = useState<ProductionReconciliationModel | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, reconRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/reconciliation?siteId=${siteFilter}&status=${statusFilter}`),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const reconJson = await reconRes.json();
      if (reconJson.success) setReconciliations(reconJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setSites(masterJson.data.sites);
        setShifts(masterJson.data.shifts);
        setMaterials(masterJson.data.materials);

        if (!scanSiteId && masterJson.data.sites.length > 0) {
          setScanSiteId(masterJson.data.sites[0].id);
          setScanShiftId(masterJson.data.shifts[0]?.id || "");
          setScanMaterialId(masterJson.data.materials[0]?.id || "");
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setScanDate(new Date().toISOString().slice(0, 10));
    fetchData();
  }, [siteFilter, statusFilter]);

  const handleRunScan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SCAN",
          siteId: scanSiteId,
          date: `${scanDate}T00:00:00.000Z`,
          shiftId: scanShiftId,
          materialId: scanMaterialId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsScanModalOpen(false);
        fetchData();
      } else {
        alert(json.error || "Gagal memindai rekonsiliasi");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecon) return;

    try {
      const res = await fetch("/api/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE",
          id: selectedRecon.id,
          notes: resolutionNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsResolveModalOpen(false);
        setSelectedRecon(null);
        setResolutionNotes("");
        fetchData();
      } else {
        alert(json.error || "Gagal menyimpan resolusi");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const balancedCount = reconciliations.filter((r) => r.status === "BALANCED" || r.status === "RESOLVED").length;
  const discrepancyCount = reconciliations.filter((r) => r.status === "DISCREPANCY_DETECTED").length;

  return (
    <DashboardLayout
      user={user || { id: "usr-spv-01", email: "supervisor@minetrack.com", name: "Supervisor", role: "SUPERVISOR" }}
      title="Rekonsiliasi Produksi & Verifikasi Timbangan"
      breadcrumbs={[{ label: "Operasional Tambang" }, { label: "Rekonsiliasi Produksi" }]}
    >
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rekonsiliasi Seimbang</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{balancedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Tiket jembatan timbang cocok 100% dengan ritase</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selisih Terdeteksi</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{discrepancyCount}</div>
          <div className="text-xs text-slate-400 mt-1">Perlu evaluasi atau investigasi supervisor</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Evaluasi Shift</span>
            <FileCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{reconciliations.length}</div>
          <div className="text-xs text-slate-400 mt-1">Siklus audit produksi harian</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Status</option>
            <option value="BALANCED">BALANCED</option>
            <option value="DISCREPANCY_DETECTED">DISCREPANCY_DETECTED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Button onClick={() => setIsScanModalOpen(true)}>
          <CheckSquare className="w-4 h-4 mr-2" />
          Pindai & Rekonsiliasi Baru
        </Button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Tanggal & Shift</th>
                <th className="px-5 py-3.5">Site & Komoditas</th>
                <th className="px-5 py-3.5 text-right font-mono">Timbangan Tiket</th>
                <th className="px-5 py-3.5 text-right font-mono">Produksi Tercatat</th>
                <th className="px-5 py-3.5 text-right font-mono font-bold">Selisih (Variance)</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5">Investigasi / Resolusi</th>
                <th className="px-5 py-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {reconciliations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Belum ada data rekonsiliasi. Klik "Pindai & Rekonsiliasi Baru" untuk memulai.
                  </td>
                </tr>
              ) : (
                reconciliations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{formatDateId(r.date)}</div>
                      <div className="text-xs text-slate-400">{r.shiftName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200">{r.siteName}</div>
                      <div className="text-xs text-amber-400">{r.materialName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-200">
                      {formatNumber(r.totalTicketsWeight)} Ton
                      <span className="text-xs text-slate-500 block">({r.ticketsCount} tiket)</span>
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
                    <td className="px-5 py-3.5 text-xs text-slate-400 max-w-xs truncate">
                      {r.resolutionNotes || r.investigationNotes || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {r.status === "DISCREPANCY_DETECTED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRecon(r);
                            setResolutionNotes("");
                            setIsResolveModalOpen(true);
                          }}
                        >
                          Selesaikan
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Run Scan Modal */}
      <Modal isOpen={isScanModalOpen} onClose={() => setIsScanModalOpen(false)} title="Pindai & Buat Rekonsiliasi Produksi">
        <form onSubmit={handleRunScan} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal Operasional</label>
            <input
              type="date"
              required
              value={scanDate}
              onChange={(e) => setScanDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Site Tambang</label>
              <select
                value={scanSiteId}
                onChange={(e) => setScanSiteId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Shift</label>
              <select
                value={scanShiftId}
                onChange={(e) => setScanShiftId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                {shifts.map((sh) => (
                  <option key={sh.id} value={sh.id}>
                    {sh.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Komoditas Material</label>
            <select
              value={scanMaterialId}
              onChange={(e) => setScanMaterialId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400">
            Sistem akan secara atomik membandingkan seluruh tiket jembatan timbang digital dengan catatan ritase produksi pada
            tanggal, site, dan shift yang dipilih.
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsScanModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Jalankan Pemindaian</Button>
          </div>
        </form>
      </Modal>

      {/* Resolve Discrepancy Modal */}
      {selectedRecon && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title="Penyelesaian Selisih Rekonsiliasi (Supervisor Resolution)"
        >
          <form onSubmit={handleResolve} className="space-y-4 text-sm">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Tiket Jembatan Timbang:</span>
                <span className="font-mono font-bold text-white">{selectedRecon.totalTicketsWeight} Ton</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Total Catatan Ritase Produksi:</span>
                <span className="font-mono font-bold text-white">{selectedRecon.totalProductionWeight} Ton</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-800 pt-2">
                <span className="text-amber-400 font-semibold">Selisih (Variance):</span>
                <span className="font-mono font-bold text-amber-400">{selectedRecon.weightDiscrepancy} Ton</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Catatan Hasil Investigasi & Resolusi Supervisor *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Selisih 1.2 Ton terbukti akibat tumpahan material di loading point front 2. Selisih telah diverifikasi dan disetujui."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsResolveModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Tutup & Selesaikan</Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
