"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Pickaxe,
  Plus,
  Send,
  Edit,
  Eye,
  RefreshCw,
  Scale,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { ProductionRecordModel, SiteModel, MaterialModel, ShiftModel, UserSession } from "@/types";
import { formatNumber, formatDateId } from "@/lib/utils";

export default function OperatorProductionPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [records, setRecords] = useState<ProductionRecordModel[]>([]);
  const [masterData, setMasterData] = useState<{
    sites: SiteModel[];
    materials: MaterialModel[];
    shifts: ShiftModel[];
  }>({ sites: [], materials: [], shifts: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecordModel | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Create form state
  const [formData, setFormData] = useState({
    date: "",
    siteId: "",
    pitId: "",
    shiftId: "",
    materialId: "",
    equipmentId: "",
    measurementType: "WEIGHED" as "WEIGHED" | "RITASE",
    ritaseCount: 1,
    grossWeight: 42.0,
    tareWeight: 14.2,
    netWeight: 27.8,
    unit: "Ton",
    isEstimated: false,
    startTime: "07:30",
    endTime: "08:15",
    notes: "",
    status: "DRAFT" as "DRAFT" | "SUBMITTED",
  });

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    grossWeight: 0,
    tareWeight: 0,
    netWeight: 0,
    notes: "",
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, prodRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/production"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const prodJson = await prodRes.json();
      if (prodJson.success) {
        // Filter operator's own records
        setRecords(prodJson.data.filter((r: ProductionRecordModel) => r.operatorId === meJson.user?.id));
      }

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setMasterData(masterJson.data);
        if (masterJson.data.sites.length > 0 && !formData.siteId) {
          const firstSite = masterJson.data.sites[0];
          setFormData((prev) => ({
            ...prev,
            siteId: firstSite.id,
            pitId: firstSite.pits?.[0]?.id || "",
            materialId: masterJson.data.materials[0]?.id || "",
            shiftId: masterJson.data.shifts[0]?.id || "",
          }));
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setFormData((prev) => ({ ...prev, date: new Date().toISOString().slice(0, 10) }));
    fetchData();
  }, []);

  const handleWeightChange = (gross: number, tare: number) => {
    const net = Math.max(0, Number((gross - tare).toFixed(2)));
    setFormData((prev) => ({
      ...prev,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
    }));
  };

  const handleEditWeightChange = (gross: number, tare: number) => {
    const net = Math.max(0, Number((gross - tare).toFixed(2)));
    setEditFormData((prev) => ({
      ...prev,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
    }));
  };

  const handleCreate = async (submitDirectly: boolean) => {
    setErrorMessage(null);

    if (formData.measurementType === "WEIGHED") {
      if (formData.grossWeight < formData.tareWeight) {
        setErrorMessage("Berat bruto harus lebih besar atau sama dengan berat tara!");
        return;
      }
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          status: submitDirectly ? "SUBMITTED" : "DRAFT",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Gagal menyimpan catatan");
        return;
      }

      setIsCreateModalOpen(false);
      fetchData();
    } catch {
      setErrorMessage("Gagal menghubungi server");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSubmitForReview = async (recordId: string) => {
    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/production/${recordId}/submit`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        fetchData();
      } else {
        alert(data.error || "Gagal mengajukan catatan");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;

    if (editFormData.grossWeight < editFormData.tareWeight) {
      alert("Berat bruto harus lebih besar dari berat tara!");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/production/${selectedRecord.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editFormData),
      });
      const data = await res.json();
      if (data.success) {
        setIsEditModalOpen(false);
        setSelectedRecord(null);
        fetchData();
      } else {
        alert(data.error || "Gagal memperbarui catatan");
      }
    } finally {
      setIsActionLoading(false);
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
      title="Input & Riwayat Catatan Produksi Operator"
      breadcrumbs={[{ label: "Operator", href: "/operator/dashboard" }, { label: "Produksi Saya" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pencatatan Ritase & Hasil Timbang Lapangan
          </h2>
          <p className="text-xs text-slate-500">
            Buat catatan draft, perbaiki catatan yang dikembalikan, dan ajukan ke supervisor
          </p>
        </div>
        <Button variant="safety" size="sm" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Buat Catatan Baru</span>
        </Button>
      </div>

      {/* Operator Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Catatan</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Pit & Material</th>
                <th className="py-3 px-4">Unit Alat</th>
                <th className="py-3 px-4 text-right">Bruto - Tara</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Belum ada catatan produksi dibuat. Klik "Buat Catatan Baru" di atas.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {r.recordNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {formatDateId(r.date)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : "-"}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">{r.material?.name}</p>
                      <p className="text-[11px] text-slate-400">{r.pit?.name}</p>
                    </td>
                    <td className="py-3 px-4 font-mono">{r.equipment?.code || "-"}</td>
                    <td className="py-3 px-4 text-right font-mono text-[11px]">
                      {r.measurementType === "WEIGHED" ? (
                        <span>
                          {formatNumber(r.grossWeight)} - {formatNumber(r.tareWeight)}
                        </span>
                      ) : (
                        <span className="text-slate-400">{r.ritaseCount} Ritase</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                      {formatNumber(r.netWeight)} {r.unit}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.status === "APPROVED" && <Badge variant="success">Disetujui</Badge>}
                      {r.status === "SUBMITTED" && <Badge variant="info">Review</Badge>}
                      {r.status === "DRAFT" && <Badge variant="secondary">Draft</Badge>}
                      {r.status === "NEEDS_REVISION" && <Badge variant="warning">Revisi</Badge>}
                      {r.status === "REJECTED" && <Badge variant="destructive">Ditolak</Badge>}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* If DRAFT or NEEDS_REVISION, operator can edit or submit */}
                        {(r.status === "DRAFT" || r.status === "NEEDS_REVISION") && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRecord(r);
                                setEditFormData({
                                  grossWeight: r.grossWeight || 0,
                                  tareWeight: r.tareWeight || 0,
                                  netWeight: r.netWeight,
                                  notes: r.notes || "",
                                });
                                setIsEditModalOpen(true);
                              }}
                              className="rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 p-1.5 text-slate-700 dark:text-slate-300"
                              title="Edit / Revisi"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => handleSubmitForReview(r.id)}
                              className="rounded bg-orange-600 hover:bg-orange-500 px-2 py-1 text-[11px] font-bold text-white shadow-xs flex items-center gap-1"
                            >
                              <Send className="h-3 w-3" />
                              <span>Ajukan</span>
                            </button>
                          </>
                        )}
                        {/* Detail button */}
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Lihat Detail"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Catatan Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Input Catatan Timbang / Ritase Baru"
        description="Data akan disimpan sebagai Draft atau langsung diajukan ke Supervisor"
        className="max-w-2xl"
      >
        <div className="space-y-4 text-xs">
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
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Shift Kerja</label>
              <select
                required
                value={formData.shiftId}
                onChange={(e) => setFormData({ ...formData, shiftId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {masterData.shifts.map((s) => (
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
                onChange={(e) => {
                  const sId = e.target.value;
                  const sObj = masterData.sites.find((s) => s.id === sId);
                  setFormData({
                    ...formData,
                    siteId: sId,
                    pitId: sObj?.pits?.[0]?.id || "",
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {masterData.sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Pit / Area Kerja</label>
              <select
                required
                value={formData.pitId}
                onChange={(e) => setFormData({ ...formData, pitId: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {masterData.sites
                  .find((s) => s.id === formData.siteId)
                  ?.pits?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Material</label>
              <select
                required
                value={formData.materialId}
                onChange={(e) => {
                  const mat = masterData.materials.find((m) => m.id === e.target.value);
                  setFormData({
                    ...formData,
                    materialId: e.target.value,
                    unit: mat?.unit || "Ton",
                  });
                }}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                {masterData.materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.unit})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Metode</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, measurementType: "WEIGHED" })}
                  className={`flex-1 rounded-lg p-2 font-bold border transition-colors ${
                    formData.measurementType === "WEIGHED"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  Jembatan Timbang
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, measurementType: "RITASE" })}
                  className={`flex-1 rounded-lg p-2 font-bold border transition-colors ${
                    formData.measurementType === "RITASE"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  Hitung Ritase
                </button>
              </div>
            </div>
          </div>

          {/* Weighed Calculation Inputs */}
          {formData.measurementType === "WEIGHED" ? (
            <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-800 dark:text-orange-400">
                <Scale className="h-4 w-4" />
                <span>Kalkulasi Otomatis Timbangan: Netto = Bruto - Tara</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Berat Bruto (Ton)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.grossWeight}
                    onChange={(e) =>
                      handleWeightChange(parseFloat(e.target.value) || 0, formData.tareWeight)
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Berat Tara (Ton)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.tareWeight}
                    onChange={(e) =>
                      handleWeightChange(formData.grossWeight, parseFloat(e.target.value) || 0)
                    }
                    className="w-full rounded-lg border border-slate-300 p-2 font-mono font-bold dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Hasil Netto (Ton)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={`${formData.netWeight} Ton`}
                    className="w-full rounded-lg border border-slate-300 bg-slate-100 p-2 font-mono font-black text-orange-600 dark:border-slate-700 dark:bg-slate-800 dark:text-orange-400"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold mb-1">Jumlah Ritase</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={formData.ritaseCount}
                  onChange={(e) => {
                    const rit = parseInt(e.target.value) || 1;
                    setFormData({
                      ...formData,
                      ritaseCount: rit,
                      netWeight: rit * 20,
                      isEstimated: true,
                    });
                  }}
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Estimasi Muatan Total ({formData.unit})</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={formData.netWeight}
                  onChange={(e) => setFormData({ ...formData, netWeight: parseFloat(e.target.value) || 0 })}
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold mb-1">Catatan Tambahan (Opsional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Keterangan tiket timbang atau catatan lapangan..."
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => handleCreate(false)}
              isLoading={isActionLoading}
            >
              Simpan Draft
            </Button>
            <Button
              type="button"
              variant="safety"
              onClick={() => handleCreate(true)}
              isLoading={isActionLoading}
            >
              Simpan & Ajukan Review
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Edit / Revisi Catatan */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Perbaiki / Revisi Catatan Produksi"
        description={`Nomor Catatan: ${selectedRecord?.recordNumber}`}
      >
        {selectedRecord && (
          <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
            {selectedRecord.rejectionReason && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="font-bold">Catatan Koreksi dari Supervisor:</p>
                <p className="mt-1">{selectedRecord.rejectionReason}</p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block font-semibold mb-1">Berat Bruto (Ton)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editFormData.grossWeight}
                  onChange={(e) =>
                    handleEditWeightChange(parseFloat(e.target.value) || 0, editFormData.tareWeight)
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Berat Tara (Ton)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editFormData.tareWeight}
                  onChange={(e) =>
                    handleEditWeightChange(editFormData.grossWeight, parseFloat(e.target.value) || 0)
                  }
                  className="w-full rounded-lg border border-slate-300 p-2 font-mono dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Netto (Ton)</label>
                <input
                  type="text"
                  readOnly
                  value={`${editFormData.netWeight} Ton`}
                  className="w-full rounded-lg border border-slate-300 bg-slate-100 p-2 font-mono font-bold text-orange-600 dark:border-slate-700 dark:bg-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">Catatan Koreksi</label>
              <textarea
                rows={2}
                value={editFormData.notes}
                onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" variant="safety" isLoading={isActionLoading}>
                Simpan Perbaikan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal Detail Catatan */}
      <Modal
        isOpen={Boolean(selectedRecord && !isEditModalOpen)}
        onClose={() => setSelectedRecord(null)}
        title="Detail Catatan Produksi"
        description={`Nomor Catatan: ${selectedRecord?.recordNumber}`}
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-850 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Material:</span>
                <span className="font-bold">{selectedRecord.material?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Hasil Netto:</span>
                <span className="font-mono font-bold text-orange-600">
                  {formatNumber(selectedRecord.netWeight)} {selectedRecord.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Status:</span>
                <span>{selectedRecord.status}</span>
              </div>
            </div>

            {selectedRecord.rejectionReason && (
              <div className="rounded bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="font-bold">Alasan Revisi / Penolakan:</p>
                <p className="mt-1">{selectedRecord.rejectionReason}</p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedRecord(null)}>
                Tutup
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
