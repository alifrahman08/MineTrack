"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Clock, Plus, RefreshCw, CheckCircle2, AlertTriangle, Wrench, Search } from "lucide-react";
import { DowntimeReportModel, EquipmentModel, SiteModel, UserSession } from "@/types";
import { formatDateTimeId } from "@/lib/utils";

export default function AdminDowntimePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [downtimes, setDowntimes] = useState<DowntimeReportModel[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DowntimeReportModel | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [actionTakenText, setActionTakenText] = useState("");

  const [formData, setFormData] = useState({
    equipmentId: "",
    siteId: "",
    startTime: "",
    category: "MECHANICAL" as DowntimeReportModel["category"],
    priority: "MEDIUM" as DowntimeReportModel["priority"],
    description: "",
    actionTaken: "",
  });

  const fetchData = async () => {
    try {
      const [meRes, dtRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/downtime"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const dtJson = await dtRes.json();
      if (dtJson.success) setDowntimes(dtJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setEquipmentList(masterJson.data.equipment);
        setSites(masterJson.data.sites);
        if (!formData.equipmentId && masterJson.data.equipment.length > 0) {
          setFormData((p) => ({
            ...p,
            equipmentId: masterJson.data.equipment[0].id,
            siteId: masterJson.data.equipment[0].siteId || masterJson.data.sites[0]?.id || "",
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setFormData((p) => ({ ...p, startTime: new Date().toISOString().slice(0, 16) }));
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/downtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          startTime: new Date(formData.startTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setFormData({
          equipmentId: equipmentList[0]?.id || "",
          siteId: sites[0]?.id || "",
          startTime: new Date().toISOString().slice(0, 16),
          category: "MECHANICAL",
          priority: "MEDIUM",
          description: "",
          actionTaken: "",
        });
        fetchData();
      } else {
        alert(data.error || "Gagal melaporkan downtime");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport) return;

    try {
      const res = await fetch(`/api/downtime/${selectedReport.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "RESOLVED",
          endTime: new Date().toISOString(),
          actionTaken: actionTakenText || "Pekerjaan perbaikan selesai dan unit dinyatakan laik operasi.",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsResolveModalOpen(false);
        setSelectedReport(null);
        setActionTakenText("");
        fetchData();
      } else {
        alert(data.error || "Gagal memperbarui status downtime");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const filtered = downtimes.filter((d) => {
    const matchStatus = !statusFilter || d.status === statusFilter;
    const matchCategory = !categoryFilter || d.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  const activeCount = downtimes.filter((d) => d.status === "OPEN" || d.status === "IN_PROGRESS").length;
  const totalMinutes = downtimes.reduce((sum, d) => sum + (d.durationMinutes || 0), 0);

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
      title="Monitoring Downtime & Perbaikan Alat"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Downtime" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pelaporan Kerusakan & Gangguan Operasional
          </h2>
          <p className="text-xs text-slate-500">
            Lacak durasi terhentinya alat berat akibat gangguan mekanikal, elektrikal, cuaca, atau tunggu antrian
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv?type=downtime"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            Ekspor CSV
          </a>
          <Button variant="safety" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Lapor Gangguan</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Gangguan Aktif</span>
          <p className="mt-1 text-2xl font-black text-rose-600 dark:text-rose-400">
            {activeCount} <span className="text-xs font-normal text-slate-400">Unit</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Durasi</span>
          <p className="mt-1 text-2xl font-black text-orange-600 dark:text-orange-400">
            {(totalMinutes / 60).toFixed(1)} <span className="text-xs font-normal">Jam</span>
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Mekanikal / Mesin</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
            {downtimes.filter((d) => d.category === "MECHANICAL").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Selesai Diperbaiki</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {downtimes.filter((d) => d.status === "RESOLVED" || d.status === "CLOSED").length}
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Kategori Gangguan</option>
          <option value="MECHANICAL">Mekanikal (Mechanical)</option>
          <option value="ELECTRICAL">Elektrikal (Electrical)</option>
          <option value="OPERATIONAL">Operasional (Operational)</option>
          <option value="WAITING_MATERIAL">Menunggu Material (Waiting Material)</option>
          <option value="WEATHER">Faktor Cuaca / Hujan (Weather)</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Status</option>
          <option value="OPEN">Terbuka (Open)</option>
          <option value="IN_PROGRESS">Sedang Ditangani</option>
          <option value="RESOLVED">Selesai (Resolved)</option>
        </select>
      </div>

      {/* Downtimes Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Alat Berat</th>
                <th className="py-3 px-4">Waktu Mulai</th>
                <th className="py-3 px-4">Waktu Selesai</th>
                <th className="py-3 px-4 text-right">Durasi</th>
                <th className="py-3 px-4">Kategori & Prioritas</th>
                <th className="py-3 px-4">Deskripsi Kerusakan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4">
                    <p className="font-mono font-bold text-orange-600 dark:text-orange-400">
                      {d.equipment?.code}
                    </p>
                    <p className="text-[11px] text-slate-400">{d.equipment?.name}</p>
                  </td>
                  <td className="py-3 px-4">{formatDateTimeId(d.startTime)}</td>
                  <td className="py-3 px-4">{d.endTime ? formatDateTimeId(d.endTime) : "-"}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {d.durationMinutes ? `${Math.round(d.durationMinutes)} mnt` : "-"}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold">{d.category}</span>
                    <div className="mt-0.5">
                      {d.priority === "CRITICAL" && <Badge variant="destructive">Kritis</Badge>}
                      {d.priority === "HIGH" && <Badge variant="destructive">Tinggi</Badge>}
                      {d.priority === "MEDIUM" && <Badge variant="warning">Sedang</Badge>}
                      {d.priority === "LOW" && <Badge variant="secondary">Rendah</Badge>}
                    </div>
                  </td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {d.description}
                    </p>
                    {d.actionTaken && (
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                        Tindakan: {d.actionTaken}
                      </p>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {d.status === "RESOLVED" || d.status === "CLOSED" ? (
                      <Badge variant="success">Selesai</Badge>
                    ) : (
                      <Badge variant="destructive">Aktif</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {d.status !== "RESOLVED" && d.status !== "CLOSED" && (
                      <button
                        onClick={() => {
                          setSelectedReport(d);
                          setIsResolveModalOpen(true);
                        }}
                        className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-emerald-500 shadow-xs"
                      >
                        Selesaikan
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lapor Downtime Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lapor Downtime / Kerusakan Alat"
        description="Melaporkan penghentian operasi unit alat berat"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Unit Alat Berat</label>
              <select
                required
                value={formData.equipmentId}
                onChange={(e) => {
                  const eqId = e.target.value;
                  const eq = equipmentList.find((item) => item.id === eqId);
                  setFormData({
                    ...formData,
                    equipmentId: eqId,
                    siteId: eq?.siteId || sites[0]?.id || "",
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              >
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.code} - {eq.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Waktu Mulai Gangguan</label>
              <input
                type="datetime-local"
                required
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Kategori Gangguan</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="MECHANICAL">Mekanikal (Mesin/Hidrolik)</option>
                <option value="ELECTRICAL">Elektrikal / Kelistrikan</option>
                <option value="OPERATIONAL">Operasional Lapangan</option>
                <option value="WAITING_MATERIAL">Menunggu Material / Antrian</option>
                <option value="WEATHER">Cuaca Hujan / Licin</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Prioritas Penanganan</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as any })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="LOW">Rendah (Low)</option>
                <option value="MEDIUM">Sedang (Medium)</option>
                <option value="HIGH">Tinggi (High)</option>
                <option value="CRITICAL">Kritis (Critical)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Deskripsi Kerusakan / Gejala</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan komponen yang mengalami kerusakan atau penyebab unit terhenti..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive">
              Kirim Laporan Gangguan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Selesaikan Perbaikan Downtime */}
      <Modal
        isOpen={isResolveModalOpen}
        onClose={() => setIsResolveModalOpen(false)}
        title="Konfirmasi Penyelesaian Perbaikan"
        description={`Unit: ${selectedReport?.equipment?.code}`}
      >
        <form onSubmit={handleResolve} className="space-y-4 text-xs">
          <p className="text-slate-600 dark:text-slate-400">
            Setelah diselesaikan, status alat berat akan otomatis dikembalikan menjadi{" "}
            <strong className="text-emerald-600">Tersedia (Ready)</strong> dan durasi final downtime akan tercatat.
          </p>

          <div>
            <label className="block font-semibold mb-1">Tindakan Perbaikan yang Dilakukan</label>
            <textarea
              required
              rows={3}
              placeholder="Contoh: Penggantian hose hidrolik utama selesai, uji coba tekanan normal..."
              value={actionTakenText}
              onChange={(e) => setActionTakenText(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsResolveModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="success">
              Nyatakan Siap Operasi
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
