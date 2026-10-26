"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { FileText, Plus, RefreshCw, Eye, CheckCircle2, AlertCircle } from "lucide-react";
import { DailyOperationalReportModel, SiteModel, ShiftModel, UserSession } from "@/types";
import { formatDateId, formatNumber } from "@/lib/utils";

export default function AdminDailyReportsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [reports, setReports] = useState<DailyOperationalReportModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [shifts, setShifts] = useState<ShiftModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DailyOperationalReportModel | null>(null);

  const [formData, setFormData] = useState({
    date: "",
    siteId: "",
    shiftId: "",
    summary: "",
    actualProduction: 2500,
    targetProduction: 2500,
    weather: "CERAH",
    downtimeMinutes: 0,
    safetyIssuesCount: 0,
    operationalObstacles: "",
    followUpPlan: "",
  });

  const fetchData = async () => {
    try {
      const [meRes, repRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/reports/daily"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const repJson = await repRes.json();
      if (repJson.success) setReports(repJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setSites(masterJson.data.sites);
        setShifts(masterJson.data.shifts);
        if (!formData.siteId && masterJson.data.sites.length > 0) {
          setFormData((p) => ({
            ...p,
            siteId: masterJson.data.sites[0].id,
            shiftId: masterJson.data.shifts[0]?.id || "",
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setFormData((p) => ({ ...p, date: new Date().toISOString().slice(0, 10) }));
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/reports/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        fetchData();
      } else {
        alert(data.error || "Gagal membuat laporan harian");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Laporan Operasional Harian (LOH)"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Laporan Harian" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Rekapitulasi Operasional Shift & Evaluasi Pit
          </h2>
          <p className="text-xs text-slate-500">
            Kompilasi ringkasan kegiatan, pencapaian target, cuaca, kendala lapangan, dan rencana kerja
          </p>
        </div>
        <Button variant="safety" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Buat Laporan Baru</span>
        </Button>
      </div>

      {/* Reports Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Laporan</th>
                <th className="py-3 px-4">Tanggal Operasional</th>
                <th className="py-3 px-4">Site & Shift</th>
                <th className="py-3 px-4 text-right">Target (Ton)</th>
                <th className="py-3 px-4 text-right">Realisasi (Ton)</th>
                <th className="py-3 px-4 text-center">Pencapaian</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {reports.map((rep) => {
                const pct =
                  rep.targetProduction > 0
                    ? (rep.actualProduction / rep.targetProduction) * 100
                    : 0;
                return (
                  <tr key={rep.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {rep.reportNumber}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {formatDateId(rep.date)}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {rep.site?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{rep.shift?.name}</p>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {formatNumber(rep.targetProduction)}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(rep.actualProduction)}
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span className={pct >= 100 ? "text-emerald-600" : "text-amber-600"}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rep.status === "APPROVED" ? (
                        <Badge variant="success">Disetujui</Badge>
                      ) : (
                        <Badge variant="info">Review</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedReport(rep)}
                        className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800"
                        title="Lihat Detail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Buat Laporan Harian */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Formulir Laporan Operasional Harian"
        description="Masukkan rekapitulasi data shift untuk review supervisor"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Shift</label>
              <select
                required
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Site Tambang</label>
              <select
                required
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Kondisi Cuaca</label>
              <select
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="CERAH">Cerah (Optimal)</option>
                <option value="BERAWAN">Berawan</option>
                <option value="HUJAN_RINGAN">Hujan Ringan</option>
                <option value="HUJAN_LEBAT">Hujan Lebat (Jalan Licin)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Target Produksi (Ton)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.targetProduction}
                onChange={(e) =>
                  setFormData({ ...formData, targetProduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Realisasi Aktual (Ton)</label>
              <input
                type="number"
                min="0"
                required
                value={formData.actualProduction}
                onChange={(e) =>
                  setFormData({ ...formData, actualProduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Ringkasan Operasi & Kegiatan</label>
            <textarea
              required
              rows={3}
              placeholder="Kegiatan penggalian, kondisi hauling road, ketersediaan unit..."
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Rencana Tindak Lanjut Shift Berikutnya</label>
            <input
              type="text"
              placeholder="Contoh: Lanjutkan penggalian Seam B dan perataan jalan KM 3..."
              value={formData.followUpPlan}
              onChange={(e) => setFormData({ ...formData, followUpPlan: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="safety">
              Kirim Laporan Harian
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Detail Laporan */}
      <Modal
        isOpen={Boolean(selectedReport)}
        onClose={() => setSelectedReport(null)}
        title="Detail Laporan Operasional Harian"
        description={`Nomor Registrasi: ${selectedReport?.reportNumber}`}
      >
        {selectedReport && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 dark:bg-slate-850">
              <div>
                <span className="text-slate-400">Tanggal & Shift:</span>
                <p className="font-bold">
                  {formatDateId(selectedReport.date)} • {selectedReport.shift?.name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Cuaca:</span>
                <p className="font-bold">{selectedReport.weather || "CERAH"}</p>
              </div>
              <div>
                <span className="text-slate-400">Target vs Realisasi:</span>
                <p className="font-bold text-orange-600">
                  {formatNumber(selectedReport.actualProduction)} / {formatNumber(selectedReport.targetProduction)} Ton
                </p>
              </div>
              <div>
                <span className="text-slate-400">Pelapor:</span>
                <p className="font-bold">{selectedReport.createdBy?.name}</p>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">Ringkasan Kegiatan:</p>
              <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
                {selectedReport.summary}
              </p>
            </div>

            {selectedReport.followUpPlan && (
              <div className="rounded bg-slate-100 p-2.5 dark:bg-slate-800">
                <p className="font-bold text-slate-700 dark:text-slate-300">Rencana Shift Lanjutan:</p>
                <p className="mt-0.5 text-slate-600 dark:text-slate-400">
                  {selectedReport.followUpPlan}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedReport(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
