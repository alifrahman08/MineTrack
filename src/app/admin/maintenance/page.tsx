"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Wrench,
  Plus,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  AlertTriangle,
  Truck,
  CheckSquare,
  Activity,
} from "lucide-react";
import { PreventiveMaintenanceModel, EquipmentModel, SiteModel, UserSession } from "@/types";
import { formatDateId } from "@/lib/utils";

export default function AdminMaintenancePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [pms, setPms] = useState<PreventiveMaintenanceModel[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [equipmentFilter, setEquipmentFilter] = useState("");

  // Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPM, setSelectedPM] = useState<PreventiveMaintenanceModel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    equipmentId: "",
    siteId: "",
    title: "",
    pmType: "HOURLY_PM" as PreventiveMaintenanceModel["pmType"],
    scheduledDate: "",
    hourMeterThreshold: 3500,
    technicianName: "Hendra Wijaya (Mekanik Senior)",
    notes: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, pmRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/maintenance?equipmentId=${equipmentFilter}&status=${statusFilter}`),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const pmJson = await pmRes.json();
      if (pmJson.success) setPms(pmJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setEquipmentList(masterJson.data.equipment);
        setSites(masterJson.data.sites);
        if (!formData.equipmentId && masterJson.data.equipment.length > 0) {
          const eq = masterJson.data.equipment[0];
          setFormData((p) => ({
            ...p,
            equipmentId: eq.id,
            siteId: eq.siteId,
          }));
        }
      }
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFormData((p) => ({ ...p, scheduledDate: new Date().toISOString().slice(0, 10) }));
    fetchData();
  }, [statusFilter, equipmentFilter]);

  const handleCreatePM = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/maintenance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          scheduledDate: `${formData.scheduledDate}T00:00:00.000Z`,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCreateModalOpen(false);
        setFormData((p) => ({ ...p, title: "", notes: "" }));
        fetchData();
      } else {
        alert(json.error || "Gagal membuat jadwal maintenance");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleUpdateStatus = async (id: string, status: PreventiveMaintenanceModel["status"]) => {
    try {
      const res = await fetch("/api/maintenance", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "Gagal memperbarui status maintenance");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  // Metrics
  const totalPM = pms.length;
  const inProgressPM = pms.filter((p) => p.status === "IN_PROGRESS").length;
  const completedPM = pms.filter((p) => p.status === "COMPLETED").length;
  const scheduledPM = pms.filter((p) => p.status === "SCHEDULED").length;

  return (
    <DashboardLayout
      user={user || { id: "usr-admin-01", email: "admin@minetrack.com", name: "Administrator", role: "ADMINISTRATOR" }}
      title="Maintenance Armada & Ketersediaan Alat"
      breadcrumbs={[{ label: "Armada & Alat Berat" }, { label: "Preventive Maintenance" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Jadwal PM</span>
            <Wrench className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalPM}</div>
          <div className="text-xs text-slate-400 mt-1">{scheduledPM} terjadwal mendatang</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dalam Pengerjaan</span>
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-blue-400 mt-2">{inProgressPM}</div>
          <div className="text-xs text-slate-400 mt-1">Unit sedang di workshop pit</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Selesai Diservis</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{completedPM}</div>
          <div className="text-xs text-slate-400 mt-1">Lolos verifikasi kesiapan operasi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kesiapan Mekanikal</span>
            <Activity className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">91.8%</div>
          <div className="text-xs text-slate-400 mt-1">Mechanical Availability (MA) target &gt; 90%</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={equipmentFilter}
            onChange={(e) => setEquipmentFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Alat Berat</option>
            {equipmentList.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.code} — {eq.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Status PM</option>
            <option value="SCHEDULED">SCHEDULED</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Jadwalkan Preventive Maintenance
        </Button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Unit Alat</th>
                <th className="px-5 py-3.5">Pekerjaan & Tipe</th>
                <th className="px-5 py-3.5">Tanggal Jadwal</th>
                <th className="px-5 py-3.5 text-right">Hour Meter</th>
                <th className="px-5 py-3.5">Teknisi / Mekanik</th>
                <th className="px-5 py-3.5 text-center">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {pms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Tidak ada jadwal preventive maintenance pada filter ini.
                  </td>
                </tr>
              ) : (
                pms.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-white">{pm.equipmentCode}</div>
                      <div className="text-xs text-slate-400">{pm.equipmentName}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{pm.title}</div>
                      <Badge variant="outline" className="mt-1 text-[10px]">
                        {pm.pmType}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{formatDateId(pm.scheduledDate)}</td>
                    <td className="px-5 py-3.5 text-right font-mono">
                      <span className="text-slate-200">{pm.currentHourMeter || 0} Jam</span>
                      {pm.hourMeterThreshold && (
                        <span className="text-xs text-slate-500 block">/ {pm.hourMeterThreshold} Jam</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-slate-300">{pm.technicianName}</td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge
                        variant={
                          pm.status === "COMPLETED"
                            ? "success"
                            : pm.status === "IN_PROGRESS"
                            ? "warning"
                            : "outline"
                        }
                      >
                        {pm.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {pm.status === "SCHEDULED" && (
                          <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(pm.id, "IN_PROGRESS")}>
                            Mulai Servis
                          </Button>
                        )}
                        {pm.status === "IN_PROGRESS" && (
                          <Button size="sm" onClick={() => handleUpdateStatus(pm.id, "COMPLETED")}>
                            Selesaikan
                          </Button>
                        )}
                        {pm.status === "COMPLETED" && (
                          <span className="text-xs text-emerald-400 flex items-center justify-center">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" /> Siap Operasi
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Jadwalkan Preventive Maintenance">
        <form onSubmit={handleCreatePM} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Unit Alat Berat *</label>
            <select
              value={formData.equipmentId}
              onChange={(e) => {
                const eq = equipmentList.find((x) => x.id === e.target.value);
                setFormData({
                  ...formData,
                  equipmentId: e.target.value,
                  siteId: eq?.siteId || "",
                });
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.code} — {eq.name} ({eq.operatingHours} Jam)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Judul Pekerjaan Maintenance *</label>
            <input
              type="text"
              required
              placeholder="Contoh: PM 500 Jam - Penggantian Oli Mesin & Filter Hidrolik"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tipe Maintenance</label>
              <select
                value={formData.pmType}
                onChange={(e) => setFormData({ ...formData, pmType: e.target.value as any })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="HOURLY_PM">Berdasarkan Jam (Hourly PM)</option>
                <option value="SCHEDULED_PM">Jadwal Kalender (Scheduled PM)</option>
                <option value="KM_PM">Berdasarkan Odometer (KM PM)</option>
                <option value="INSPECTION">Inspeksi Kondisi (Condition Inspection)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tanggal Jadwal</label>
              <input
                type="date"
                required
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Batas Hour Meter Target (Jam)</label>
              <input
                type="number"
                value={formData.hourMeterThreshold}
                onChange={(e) => setFormData({ ...formData, hourMeterThreshold: parseFloat(e.target.value) || 0 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Mekanik / Teknisi Penanggung Jawab</label>
              <input
                type="text"
                required
                value={formData.technicianName}
                onChange={(e) => setFormData({ ...formData, technicianName: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">Catatan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Instruksi suku cadang atau komponen khusus..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit">Jadwalkan PM</Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
