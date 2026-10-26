"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Pickaxe,
  Plus,
  Download,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  RefreshCw,
  Scale,
  Calendar,
  Layers,
  Truck,
} from "lucide-react";
import { ProductionRecordModel, SiteModel, MaterialModel, ShiftModel, UserSession } from "@/types";
import { formatNumber, formatDateId } from "@/lib/utils";

export default function ProductionPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [records, setRecords] = useState<ProductionRecordModel[]>([]);
  const [masterData, setMasterData] = useState<{
    sites: SiteModel[];
    materials: MaterialModel[];
    shifts: ShiftModel[];
  }>({ sites: [], materials: [], shifts: [] });
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [materialFilter, setMaterialFilter] = useState("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecordModel | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "REQUEST_REVISION">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Form State for new production
  const [formData, setFormData] = useState({
    date: "",
    siteId: "",
    pitId: "",
    shiftId: "",
    materialId: "",
    equipmentId: "",
    measurementType: "WEIGHED" as "WEIGHED" | "RITASE",
    ritaseCount: 1,
    grossWeight: 40.0,
    tareWeight: 14.0,
    netWeight: 26.0,
    unit: "Ton",
    isEstimated: false,
    startTime: "08:00",
    endTime: "09:00",
    notes: "",
    status: "APPROVED" as "DRAFT" | "SUBMITTED" | "APPROVED",
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchSessionAndData = async () => {
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
      if (prodJson.success) setRecords(prodJson.data);

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
    fetchSessionAndData();
  }, []);

  // Handle Gross - Tare auto calculation
  const handleWeightChange = (gross: number, tare: number) => {
    const net = Math.max(0, Number((gross - tare).toFixed(2)));
    setFormData((prev) => ({
      ...prev,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: net,
    }));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.measurementType === "WEIGHED") {
      if (formData.grossWeight < formData.tareWeight) {
        setFormError("Berat bruto harus lebih besar atau sama dengan berat tara!");
        return;
      }
    }

    setIsActionLoading(true);
    try {
      const res = await fetch("/api/production", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setFormError(data.error || "Gagal menyimpan data produksi");
        return;
      }

      setIsCreateModalOpen(false);
      fetchSessionAndData();
    } catch {
      setFormError("Gagal menghubungi server");
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecord) return;
    if ((reviewAction === "REJECT" || reviewAction === "REQUEST_REVISION") && !reviewReason.trim()) {
      alert("Alasan wajib diisi untuk penolakan atau permintaan revisi");
      return;
    }

    setIsActionLoading(true);
    try {
      const res = await fetch(`/api/production/${selectedRecord.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: reviewAction, reason: reviewReason }),
      });
      const data = await res.json();
      if (data.success) {
        setIsReviewModalOpen(false);
        setReviewReason("");
        setSelectedRecord(null);
        fetchSessionAndData();
      } else {
        alert(data.error || "Gagal memproses review");
      }
    } finally {
      setIsActionLoading(false);
    }
  };

  // Filtered records
  const filteredRecords = records.filter((r) => {
    const matchSearch =
      !search ||
      r.recordNumber.toLowerCase().includes(search.toLowerCase()) ||
      r.notes?.toLowerCase().includes(search.toLowerCase()) ||
      r.operator?.name?.toLowerCase().includes(search.toLowerCase());
    const matchSite = !siteFilter || r.siteId === siteFilter;
    const matchStatus = !statusFilter || r.status === statusFilter;
    const matchMaterial = !materialFilter || r.materialId === materialFilter;
    return matchSearch && matchSite && matchStatus && matchMaterial;
  });

  // KPI Calculations
  const approvedRecords = filteredRecords.filter((r) => r.status === "APPROVED");
  const totalApprovedWeight = approvedRecords.reduce((sum, r) => sum + r.netWeight, 0);
  const pendingCount = filteredRecords.filter((r) => r.status === "SUBMITTED").length;

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
      title="Pencatatan & Monitoring Produksi"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Produksi" }]}
    >
      {/* Top Header Actions & Statistics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Daftar Catatan Ritase & Jembatan Timbang
          </h2>
          <p className="text-xs text-slate-500">
            Kelola seluruh transaksi pencatatan muatan batubara, overburden, dan topsoil
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <a
            href="/api/export/csv?type=production"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </a>
          <Button variant="safety" size="sm" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            <span>Catatan Baru</span>
          </Button>
        </div>
      </div>

      {/* Mini KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Catatan</span>
          <p className="mt-1 text-2xl font-black text-slate-900 dark:text-slate-100">
            {filteredRecords.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Menunggu Review</span>
          <p className="mt-1 text-2xl font-black text-amber-500">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Catatan Disetujui</span>
          <p className="mt-1 text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {approvedRecords.length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Produksi Disetujui</span>
          <p className="mt-1 text-2xl font-black text-orange-600 dark:text-orange-400">
            {formatNumber(totalApprovedWeight)} <span className="text-xs font-normal">Ton/BCM</span>
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nomor tiket, catatan, atau operator..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
          />
        </div>

        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Site Tambang</option>
          {masterData.sites.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Status</option>
          <option value="DRAFT">Draft</option>
          <option value="SUBMITTED">Menunggu Review</option>
          <option value="APPROVED">Disetujui</option>
          <option value="NEEDS_REVISION">Perlu Revisi</option>
          <option value="REJECTED">Ditolak</option>
        </select>

        <select
          value={materialFilter}
          onChange={(e) => setMaterialFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:border-orange-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
        >
          <option value="">Semua Material</option>
          {masterData.materials.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      {/* Main Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Catatan</th>
                <th className="py-3 px-4">Tanggal / Waktu</th>
                <th className="py-3 px-4">Site / Pit</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4">Alat & Operator</th>
                <th className="py-3 px-4 text-right">Bruto - Tara</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 dark:divide-slate-800 dark:text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    Tidak ada catatan produksi yang cocok dengan filter
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-orange-600 dark:text-orange-400">
                      {r.recordNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {formatDateId(r.date)}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {r.startTime && r.endTime ? `${r.startTime} - ${r.endTime}` : r.shift?.name}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.site?.name}
                      </p>
                      <p className="text-[11px] text-slate-400">{r.pit?.name}</p>
                    </td>
                    <td className="py-3 px-4 font-medium">{r.material?.name}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.equipment?.code || "-"}
                      </p>
                      <p className="text-[11px] text-slate-400">{r.operator?.name}</p>
                    </td>
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
                        <button
                          onClick={() => setSelectedRecord(r)}
                          className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {(user.role === "ADMINISTRATOR" || user.role === "SUPERVISOR") &&
                          r.status === "SUBMITTED" && (
                            <button
                              onClick={() => {
                                setSelectedRecord(r);
                                setIsReviewModalOpen(true);
                              }}
                              className="rounded bg-orange-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-orange-500 shadow-xs"
                            >
                              Tinjau
                            </button>
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

      {/* Modal: Tambah Catatan Produksi Baru */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Buat Catatan Produksi Baru"
        description="Pencatatan jembatan timbang aktual atau estimasi ritase"
        className="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-700 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Tanggal Operasional</label>
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
                    {s.name} ({s.startTime} - {s.endTime})
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
                      {p.name} ({p.code})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Jenis Material</label>
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
              <label className="block font-semibold mb-1">Metode Pencatatan</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, measurementType: "WEIGHED" })}
                  className={`flex-1 rounded-lg p-2 font-bold border transition-colors ${
                    formData.measurementType === "WEIGHED"
                      ? "bg-orange-600 text-white border-orange-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
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
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300"
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
                      netWeight: rit * 20, // default 20 BCM/rit
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
            <label className="block font-semibold mb-1">Catatan Lapangan (Opsional)</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan kondisi jalan, nomor tiket timbang, atau kendala..."
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              variant="safety"
              isLoading={isActionLoading}
            >
              Simpan & Catat
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Review & Approval Supervisor */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Tinjau & Validasi Catatan Produksi"
        description={`Nomor Catatan: ${selectedRecord?.recordNumber}`}
      >
        {selectedRecord && (
          <form onSubmit={handleReviewSubmit} className="space-y-4 text-xs">
            <div className="rounded-lg bg-slate-50 p-3.5 dark:bg-slate-850 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Operator Pelapor:</span>
                <span className="font-bold">{selectedRecord.operator?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Material:</span>
                <span className="font-bold">{selectedRecord.material?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Berat Netto:</span>
                <span className="font-bold text-orange-600 font-mono text-sm">
                  {formatNumber(selectedRecord.netWeight)} {selectedRecord.unit}
                </span>
              </div>
              {selectedRecord.notes && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                  <span className="font-semibold">Catatan Lapangan:</span> {selectedRecord.notes}
                </div>
              )}
            </div>

            <div>
              <label className="block font-semibold mb-1.5">Keputusan Review</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewAction("APPROVE")}
                  className={`rounded-lg p-2.5 font-bold border flex flex-col items-center gap-1 transition-colors ${
                    reviewAction === "APPROVE"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Setujui</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction("REQUEST_REVISION")}
                  className={`rounded-lg p-2.5 font-bold border flex flex-col items-center gap-1 transition-colors ${
                    reviewAction === "REQUEST_REVISION"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <AlertCircle className="h-4 w-4" />
                  <span>Minta Revisi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setReviewAction("REJECT")}
                  className={`rounded-lg p-2.5 font-bold border flex flex-col items-center gap-1 transition-colors ${
                    reviewAction === "REJECT"
                      ? "bg-rose-600 text-white border-rose-600"
                      : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  }`}
                >
                  <XCircle className="h-4 w-4" />
                  <span>Tolak</span>
                </button>
              </div>
            </div>

            {(reviewAction === "REJECT" || reviewAction === "REQUEST_REVISION") && (
              <div>
                <label className="block font-semibold mb-1 text-rose-600 dark:text-rose-400">
                  Alasan {reviewAction === "REJECT" ? "Penolakan" : "Permintaan Revisi"} (Wajib)
                </label>
                <textarea
                  required
                  rows={3}
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="Contoh: Berat tara tidak sesuai dengan tiket timbang kalibrasi..."
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReviewModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant={reviewAction === "APPROVE" ? "success" : reviewAction === "REQUEST_REVISION" ? "warning" : "destructive"}
                isLoading={isActionLoading}
              >
                Kirim Keputusan
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal: Detail Catatan & Riwayat Status */}
      <Modal
        isOpen={Boolean(selectedRecord && !isReviewModalOpen)}
        onClose={() => setSelectedRecord(null)}
        title="Detail Catatan Produksi"
        description={`Nomor Registrasi: ${selectedRecord?.recordNumber}`}
      >
        {selectedRecord && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
              <div>
                <span className="text-slate-400">Status Saat Ini:</span>
                <div className="mt-1">
                  {selectedRecord.status === "APPROVED" && <Badge variant="success">Disetujui</Badge>}
                  {selectedRecord.status === "SUBMITTED" && <Badge variant="info">Review</Badge>}
                  {selectedRecord.status === "DRAFT" && <Badge variant="secondary">Draft</Badge>}
                  {selectedRecord.status === "NEEDS_REVISION" && <Badge variant="warning">Perlu Revisi</Badge>}
                  {selectedRecord.status === "REJECTED" && <Badge variant="destructive">Ditolak</Badge>}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Tanggal Operasi:</span>
                <p className="mt-1 font-bold text-slate-800 dark:text-slate-200">
                  {formatDateId(selectedRecord.date)}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Site & Pit:</span>
                <p className="mt-1 font-bold">
                  {selectedRecord.site?.name} • {selectedRecord.pit?.name}
                </p>
              </div>
              <div>
                <span className="text-slate-400">Operator Pelapor:</span>
                <p className="mt-1 font-bold">{selectedRecord.operator?.name}</p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 space-y-2">
              <h4 className="font-bold text-slate-800 dark:text-slate-200">Detail Muatan:</h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className="bg-slate-100 p-2 rounded dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 block">Bruto</span>
                  <span className="font-bold">{formatNumber(selectedRecord.grossWeight)} T</span>
                </div>
                <div className="bg-slate-100 p-2 rounded dark:bg-slate-800">
                  <span className="text-[10px] text-slate-500 block">Tara</span>
                  <span className="font-bold">{formatNumber(selectedRecord.tareWeight)} T</span>
                </div>
                <div className="bg-orange-50 p-2 rounded border border-orange-200 dark:bg-orange-950/40 dark:border-orange-800">
                  <span className="text-[10px] text-orange-600 block">Netto</span>
                  <span className="font-black text-orange-600">
                    {formatNumber(selectedRecord.netWeight)} {selectedRecord.unit}
                  </span>
                </div>
              </div>
            </div>

            {selectedRecord.rejectionReason && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                <p className="font-bold">Catatan Koreksi / Alasan Penolakan:</p>
                <p className="mt-1">{selectedRecord.rejectionReason}</p>
              </div>
            )}

            {/* Status History Audit */}
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Riwayat Perubahan Status:</h4>
              <div className="space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800 border rounded-lg p-2">
                {selectedRecord.statusHistories && selectedRecord.statusHistories.length > 0 ? (
                  selectedRecord.statusHistories.map((h) => (
                    <div key={h.id} className="pt-1.5 flex items-center justify-between text-[11px]">
                      <div>
                        <span className="font-bold">{h.previousStatus} &rarr; {h.newStatus}</span>
                        {h.reason && <p className="text-slate-500">{h.reason}</p>}
                      </div>
                      <span className="text-slate-400">{formatDateId(h.createdAt)}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-2">Belum ada riwayat transisi</p>
                )}
              </div>
            </div>

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
