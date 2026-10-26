"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Calendar, Plus, RefreshCw, Trash2, Clock, Users, Truck, AlertCircle } from "lucide-react";
import { ShiftAssignmentModel, ShiftModel, SiteModel, UserProfile, EquipmentModel, UserSession } from "@/types";
import { formatDateId } from "@/lib/utils";

export default function AdminShiftsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [assignments, setAssignments] = useState<ShiftAssignmentModel[]>([]);
  const [shifts, setShifts] = useState<ShiftModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [operators, setOperators] = useState<UserProfile[]>([]);
  const [supervisors, setSupervisors] = useState<UserProfile[]>([]);
  const [equipmentList, setEquipmentList] = useState<EquipmentModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formDate, setFormDate] = useState("");
  const [formData, setFormData] = useState({
    shiftId: "",
    siteId: "",
    operatorId: "",
    supervisorId: "",
    equipmentId: "",
    notes: "",
  });

  const fetchData = async () => {
    try {
      const [meRes, asgRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/shifts/assignments"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const asgJson = await asgRes.json();
      if (asgJson.success) setAssignments(asgJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setShifts(masterJson.data.shifts);
        setSites(masterJson.data.sites);
        setOperators(masterJson.data.users.filter((u: UserProfile) => u.role === "OPERATOR"));
        setSupervisors(masterJson.data.users.filter((u: UserProfile) => u.role === "SUPERVISOR"));
        setEquipmentList(masterJson.data.equipment);

        if (!formData.shiftId && masterJson.data.shifts.length > 0) {
          setFormData((p) => ({
            ...p,
            shiftId: masterJson.data.shifts[0].id,
            siteId: masterJson.data.sites[0]?.id || "",
            operatorId: masterJson.data.users.find((u: UserProfile) => u.role === "OPERATOR")?.id || "",
            supervisorId: masterJson.data.users.find((u: UserProfile) => u.role === "SUPERVISOR")?.id || "",
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    setFormDate(new Date().toISOString().slice(0, 10));
    fetchData();
  }, []);

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    try {
      const res = await fetch("/api/shifts/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: `${formDate}T00:00:00.000Z`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Gagal membuat penugasan shift");
        return;
      }

      setIsModalOpen(false);
      fetchData();
    } catch {
      setErrorMessage("Terjadi kesalahan koneksi server");
    }
  };

  const handleDeleteAssignment = async (id: string) => {
    if (!confirm("Hapus penugasan shift ini?")) return;
    try {
      await fetch(`/api/shifts/assignments/${id}`, { method: "DELETE" });
      fetchData();
    } catch {}
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
      title="Pengelolaan Shift & Penugasan Operator"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Shift & Penugasan" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Jadwal Shift & Alokasi Tenaga Kerja
          </h2>
          <p className="text-xs text-slate-500">
            Atur shift kerja tambang, alokasikan operator dan unit alat berat dengan proteksi bentrok jadwal
          </p>
        </div>
        <Button variant="safety" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Tugaskan Operator</span>
        </Button>
      </div>

      {/* Shifts Definition Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {shifts.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
              </div>
              <Badge variant="outline" className="font-mono text-xs">
                {s.code}
              </Badge>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-900 dark:text-slate-100">
                {s.startTime} - {s.endTime}
              </span>
              {s.crossesMidnight && (
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 dark:bg-amber-950/40">
                  Lintas Hari (Midnight)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Assignments Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Daftar Penugasan Aktif
          </h3>
          <span className="text-xs text-slate-500">{assignments.length} Penugasan Terjadwal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Shift</th>
                <th className="py-3 px-4">Site Tambang</th>
                <th className="py-3 px-4">Operator Bertugas</th>
                <th className="py-3 px-4">Supervisor Pengawas</th>
                <th className="py-3 px-4">Unit Alat Ditugaskan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Belum ada penugasan shift dibuat. Klik "Tugaskan Operator" untuk menjadwalkan.
                  </td>
                </tr>
              ) : (
                assignments.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {formatDateId(asg.date)}
                    </td>
                    <td className="py-3 px-4">{asg.shift?.name}</td>
                    <td className="py-3 px-4">{asg.site?.name}</td>
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                      {asg.operator?.name}
                    </td>
                    <td className="py-3 px-4">{asg.supervisor?.name || "-"}</td>
                    <td className="py-3 px-4 font-mono">{asg.equipment?.code || "-"}</td>
                    <td className="py-3 px-4 text-center">
                      <Badge variant="success">Terjadwal</Badge>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleDeleteAssignment(asg.id)}
                        className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded"
                        title="Hapus Penugasan"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Penugasan Shift */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Penugasan Shift & Operator"
        description="Sistem akan memeriksa deteksi bentrok jadwal operator dan alat secara otomatis"
      >
        <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
          {errorMessage && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Tanggal</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
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
                    {s.name} ({s.startTime} - {s.endTime})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Lokasi Site</label>
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
              <label className="block font-semibold mb-1">Operator Bertugas</label>
              <select
                required
                value={formData.operatorId}
                onChange={(e) => setFormData({ ...formData, operatorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {operators.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name} ({o.email})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Supervisor Pengawas</label>
              <select
                value={formData.supervisorId}
                onChange={(e) => setFormData({ ...formData, supervisorId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="">Pilih Supervisor</option>
                {supervisors.map((spv) => (
                  <option key={spv.id} value={spv.id}>
                    {spv.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Alat Berat Ditugaskan (Opsional)</label>
              <select
                value={formData.equipmentId}
                onChange={(e) => setFormData({ ...formData, equipmentId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              >
                <option value="">Tanpa Penugasan Alat</option>
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    {eq.code} - {eq.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="safety">
              Jadwalkan Penugasan
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
