"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ShieldAlert, Plus, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, Eye } from "lucide-react";
import { SafetyIncidentModel, SiteModel, UserSession } from "@/types";
import { formatDateTimeId } from "@/lib/utils";

export default function AdminSafetyPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [incidents, setIncidents] = useState<SafetyIncidentModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncidentModel | null>(null);
  const [followUpActionText, setFollowUpActionText] = useState("");
  const [newStatus, setNewStatus] = useState<SafetyIncidentModel["status"]>("RESOLVED");

  const [formData, setFormData] = useState({
    siteId: "",
    dateTime: "",
    location: "",
    category: "UNSAFE_CONDITION" as SafetyIncidentModel["category"],
    severity: "MEDIUM" as SafetyIncidentModel["severity"],
    description: "",
    initialAction: "",
  });

  const fetchData = async () => {
    try {
      const [meRes, safRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/safety"),
        fetch("/api/master"),
      ]);
      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const safJson = await safRes.json();
      if (safJson.success) setIncidents(safJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setSites(masterJson.data.sites);
        if (!formData.siteId && masterJson.data.sites.length > 0) {
          setFormData((p) => ({ ...p, siteId: masterJson.data.sites[0].id }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setFormData((p) => ({ ...p, dateTime: new Date().toISOString().slice(0, 16) }));
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/safety", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dateTime: new Date(formData.dateTime).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateModalOpen(false);
        setFormData({
          siteId: sites[0]?.id || "",
          dateTime: new Date().toISOString().slice(0, 16),
          location: "",
          category: "UNSAFE_CONDITION",
          severity: "MEDIUM",
          description: "",
          initialAction: "",
        });
        fetchData();
      } else {
        alert(data.error || "Gagal melaporkan insiden K3");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;

    try {
      if (followUpActionText.trim()) {
        await fetch(`/api/safety/${selectedIncident.id}/followup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ actionDescription: followUpActionText }),
        });
      }

      await fetch(`/api/safety/${selectedIncident.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      setSelectedIncident(null);
      setFollowUpActionText("");
      fetchData();
    } catch {
      alert("Gagal memperbarui data K3");
    }
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "CRITICAL":
        return <Badge variant="destructive">Kritis (Critical)</Badge>;
      case "HIGH":
        return <Badge variant="destructive">Tinggi (High)</Badge>;
      case "MEDIUM":
        return <Badge variant="warning">Sedang (Medium)</Badge>;
      default:
        return <Badge variant="secondary">Rendah (Low)</Badge>;
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
      title="Pengawasan Keselamatan Kerja & Lingkungan Hidup (K3LH)"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "K3 Tambang" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Monitoring Insiden, Near Miss & Bahaya Lapangan
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan kondisi tidak aman, investigasi bahaya, dan dokumentasi tindak lanjut perbaikan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/export/csv?type=safety"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            Ekspor Laporan K3
          </a>
          <Button variant="safety" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Lapor Temuan K3</span>
          </Button>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 sm:p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-400">
              Pencapaian Keselamatan: 240 Hari Tanpa Kehilangan Jam Kerja (Zero Fatality)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Prioritas utama: Inspeksi tanggul pit, komunikasi radio aktif, dan penggunaan APD lengkap.
            </p>
          </div>
        </div>
        <Badge variant="success" className="hidden sm:inline-flex text-xs px-3 py-1">
          Kondisi Aman Terkendali
        </Badge>
      </div>

      {/* Incidents Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Laporan</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Site & Lokasi</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Tingkat Bahaya</th>
                <th className="py-3 px-4">Deskripsi Temuan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {inc.incidentNumber}
                  </td>
                  <td className="py-3 px-4">{formatDateTimeId(inc.dateTime)}</td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {inc.site?.name}
                    </p>
                    <p className="text-[11px] text-slate-400">{inc.location}</p>
                  </td>
                  <td className="py-3 px-4 font-medium">{inc.category.replace("_", " ")}</td>
                  <td className="py-3 px-4">{getSeverityBadge(inc.severity)}</td>
                  <td className="py-3 px-4 max-w-xs">
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                      {inc.description}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      Tindakan: {inc.initialAction}
                    </p>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {inc.status === "RESOLVED" || inc.status === "CLOSED" ? (
                      <Badge variant="success">Tuntas</Badge>
                    ) : (
                      <Badge variant="warning">Perlu Tindakan</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => {
                        setSelectedIncident(inc);
                        setNewStatus(inc.status);
                      }}
                      className="rounded bg-slate-800 hover:bg-slate-700 px-2.5 py-1 text-[11px] font-bold text-orange-400 border border-slate-700 shadow-xs"
                    >
                      Detail & Tindak Lanjut
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Lapor Temuan K3 */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Lapor Temuan / Kondisi Bahaya K3"
        description="Peringatan prioritas tinggi akan otomatis diteruskan ke seluruh tim pengawas"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
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
              <label className="block font-semibold mb-1">Waktu Kejadian</label>
              <input
                type="datetime-local"
                required
                value={formData.dateTime}
                onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Lokasi Spesifik / Pit</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pit Utara KM 2.5 sisi tebing luar"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Kategori Bahaya</label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="UNSAFE_CONDITION">Kondisi Tidak Aman (Unsafe Condition)</option>
                <option value="UNSAFE_ACTION">Tindakan Tidak Aman (Unsafe Action)</option>
                <option value="NEAR_MISS">Hampir Celaka (Near Miss)</option>
                <option value="INCIDENT">Kecelakaan Kerja (Incident)</option>
                <option value="INSPECTION_FINDING">Temuan Inspeksi Rutin</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Tingkat Keparahan</label>
              <select
                value={formData.severity}
                onChange={(e) =>
                  setFormData({ ...formData, severity: e.target.value as any })
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
            <label className="block font-semibold mb-1">Deskripsi Kondisi / Kronologi</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan kondisi bahaya yang ditemukan di lapangan..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div>
            <label className="block font-semibold mb-1">Tindakan Langsung di Lapangan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pasang safety cone, batasi area, pasang pita peringatan..."
              value={formData.initialAction}
              onChange={(e) => setFormData({ ...formData, initialAction: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="destructive">
              Kirim Laporan K3
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Detail & Tindak Lanjut K3 */}
      <Modal
        isOpen={Boolean(selectedIncident)}
        onClose={() => setSelectedIncident(null)}
        title="Detail & Tindak Lanjut K3"
        description={`Laporan: ${selectedIncident?.incidentNumber}`}
      >
        {selectedIncident && (
          <form onSubmit={handleFollowUp} className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-850 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Lokasi:</span>
                <span className="font-bold">{selectedIncident.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori & Tingkat:</span>
                <span>
                  {selectedIncident.category} • {selectedIncident.severity}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Kronologi:</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  {selectedIncident.description}
                </p>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <p className="font-semibold text-slate-800 dark:text-slate-200">Tindakan Awal:</p>
                <p className="text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {selectedIncident.initialAction}
                </p>
              </div>
            </div>

            {/* Existing Follow Ups */}
            <div>
              <h4 className="font-bold mb-1.5">Riwayat Tindak Lanjut:</h4>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {selectedIncident.followUps && selectedIncident.followUps.length > 0 ? (
                  selectedIncident.followUps.map((f) => (
                    <div
                      key={f.id}
                      className="rounded bg-slate-100 p-2 text-[11px] dark:bg-slate-800"
                    >
                      <p className="font-medium text-slate-800 dark:text-slate-200">
                        {f.actionDescription}
                      </p>
                      <span className="text-[10px] text-slate-400">Oleh: {f.actionBy}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 italic">Belum ada catatan tindak lanjut</p>
                )}
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Tambah Catatan Tindak Lanjut</label>
              <textarea
                rows={2}
                placeholder="Tuliskan tindakan perbaikan yang telah dilaksanakan..."
                value={followUpActionText}
                onChange={(e) => setFollowUpActionText(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div>
              <label className="block font-semibold mb-1">Status Penyelesaian</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="OPEN">Masih Terbuka (Open)</option>
                <option value="UNDER_INVESTIGATION">Investigasi Lapangan</option>
                <option value="ACTION_REQUIRED">Menunggu Tindakan Perbaikan</option>
                <option value="RESOLVED">Selesai Ditangani (Resolved)</option>
                <option value="CLOSED">Kasus Ditutup (Closed)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button type="button" variant="outline" onClick={() => setSelectedIncident(null)}>
                Tutup
              </Button>
              <Button type="submit" variant="safety">
                Simpan Perubahan
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  );
}
