"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Truck, Plus, RefreshCw, AlertTriangle, CheckCircle2, Wrench, Search } from "lucide-react";
import { EquipmentModel, SiteModel, UserSession } from "@/types";
import { formatDateTimeId } from "@/lib/utils";

export default function AdminEquipmentPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [equipmentList, setEquipmentList] = useState<EquipmentModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "EXCAVATOR",
    model: "",
    siteId: "",
    status: "AVAILABLE",
    operatingHours: 0,
    conditionNotes: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, eqRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/equipment"),
        fetch("/api/master"),
      ]);
      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const eqJson = await eqRes.json();
      if (eqJson.success) setEquipmentList(eqJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setSites(masterJson.data.sites);
        if (masterJson.data.sites.length > 0 && !formData.siteId) {
          setFormData((p) => ({ ...p, siteId: masterJson.data.sites[0].id }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({
          code: "",
          name: "",
          type: "EXCAVATOR",
          model: "",
          siteId: sites[0]?.id || "",
          status: "AVAILABLE",
          operatingHours: 0,
          conditionNotes: "",
        });
        fetchData();
      } else {
        alert(data.error || "Gagal menambah alat");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const filtered = equipmentList.filter((e) => {
    const matchSearch =
      !search ||
      e.code.toLowerCase().includes(search.toLowerCase()) ||
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.model.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || e.status === statusFilter;
    const matchType = !typeFilter || e.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return <Badge variant="success">Tersedia (Ready)</Badge>;
      case "IN_USE":
        return <Badge variant="info">Sedang Beroperasi</Badge>;
      case "MAINTENANCE":
        return <Badge variant="warning">Perawatan Rutin</Badge>;
      case "BREAKDOWN":
        return <Badge variant="destructive">Breakdown / Rusak</Badge>;
      default:
        return <Badge variant="secondary">Nonaktif</Badge>;
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
      title="Manajemen Alat Berat & Armada Tambang"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Alat Berat" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Daftar Unit Excavator, Hauler & Support Equipment
          </h2>
          <p className="text-xs text-slate-500">
            Monitor jam operasi, lokasi penempatan site, dan status kesiapan unit tambang
          </p>
        </div>
        <Button variant="safety" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Tambah Unit Alat</span>
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kode unit (EX-201, DT-104), nama, atau model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Jenis Alat</option>
          <option value="EXCAVATOR">Excavator</option>
          <option value="DUMP_TRUCK">Dump Truck</option>
          <option value="BULLDOZER">Bulldozer</option>
          <option value="WHEEL_LOADER">Wheel Loader</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Status</option>
          <option value="AVAILABLE">Tersedia (Ready)</option>
          <option value="IN_USE">Sedang Beroperasi</option>
          <option value="MAINTENANCE">Perawatan Rutin</option>
          <option value="BREAKDOWN">Breakdown</option>
        </select>
      </div>

      {/* Equipment Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Kode Unit</th>
                <th className="py-3 px-4">Nama & Model</th>
                <th className="py-3 px-4">Jenis Alat</th>
                <th className="py-3 px-4">Site Penempatan</th>
                <th className="py-3 px-4 text-right">Jam Operasi (HM)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Kondisi & Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filtered.map((eq) => (
                <tr key={eq.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                    {eq.code}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{eq.name}</p>
                    <p className="text-[11px] text-slate-400">{eq.model}</p>
                  </td>
                  <td className="py-3 px-4 font-medium">{eq.type.replace("_", " ")}</td>
                  <td className="py-3 px-4">{eq.siteName || "Site Kendawangan"}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {eq.operatingHours.toFixed(1)} Jam
                  </td>
                  <td className="py-3 px-4 text-center">{getStatusBadge(eq.status)}</td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {eq.conditionNotes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Equipment Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Tambah Unit Alat Berat Baru"
        description="Masukkan spesifikasi unit alat dan lokasi tambang"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Kode Unit</label>
              <input
                type="text"
                required
                placeholder="Contoh: EX-202, DT-106"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono uppercase"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Jenis Alat</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="EXCAVATOR">Excavator</option>
                <option value="DUMP_TRUCK">Dump Truck</option>
                <option value="BULLDOZER">Bulldozer</option>
                <option value="WHEEL_LOADER">Wheel Loader</option>
                <option value="GRADER">Motor Grader</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Nama Unit</label>
              <input
                type="text"
                required
                placeholder="Komatsu PC800-8"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Model / Seri</label>
              <input
                type="text"
                required
                placeholder="PC800-8 LC"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Lokasi Site</label>
              <select
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
              <label className="block font-semibold mb-1">Jam Operasi Awal (HM)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={formData.operatingHours}
                onChange={(e) =>
                  setFormData({ ...formData, operatingHours: parseFloat(e.target.value) || 0 })
                }
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Catatan Kondisi Unit</label>
            <textarea
              rows={2}
              placeholder="Kondisi komponen, undercarriage, atau rekomendasi..."
              value={formData.conditionNotes}
              onChange={(e) => setFormData({ ...formData, conditionNotes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="safety">
              Simpan Unit
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
