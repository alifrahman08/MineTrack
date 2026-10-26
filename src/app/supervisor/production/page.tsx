"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Pickaxe, CheckCircle2, XCircle, AlertCircle, Eye, RefreshCw, Scale } from "lucide-react";
import { ProductionRecordModel, UserSession } from "@/types";
import { formatNumber, formatDateId } from "@/lib/utils";

export default function SupervisorProductionPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [records, setRecords] = useState<ProductionRecordModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Review modal
  const [selectedRecord, setSelectedRecord] = useState<ProductionRecordModel | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"APPROVE" | "REJECT" | "REQUEST_REVISION">("APPROVE");
  const [reviewReason, setReviewReason] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, prodRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/production"),
      ]);
      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const prodJson = await prodRes.json();
      if (prodJson.success) setRecords(prodJson.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        setSelectedRecord(null);
        setReviewReason("");
        fetchData();
      } else {
        alert(data.error || "Gagal memproses review");
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

  const submittedRecords = records.filter((r) => r.status === "SUBMITTED");
  const otherRecords = records.filter((r) => r.status !== "SUBMITTED");

  return (
    <DashboardLayout
      user={user}
      title="Verifikasi & Persetujuan Produksi Shift"
      breadcrumbs={[{ label: "Supervisor", href: "/supervisor/dashboard" }, { label: "Review Produksi" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Antrean Tiket Timbang & Ritase Menunggu Persetujuan
          </h2>
          <p className="text-xs text-slate-500">
            Periksa keabsahan berat kotor, berat tara, dan kesesuaian unit sebelum pengesahan
          </p>
        </div>
      </div>

      {/* Priority Section: Waiting for Review */}
      <div className="rounded-xl border border-orange-200 bg-orange-50/40 p-5 dark:border-orange-950 dark:bg-orange-950/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-600 text-xs font-bold text-white">
              {submittedRecords.length}
            </span>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Perlu Tindakan Review Segera
            </h3>
          </div>
          <Badge variant="warning">Membutuhkan Keputusan</Badge>
        </div>

        {submittedRecords.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500 bg-white rounded-lg dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            Tidak ada catatan yang menunggu review saat ini. Semua data operasional telah diverifikasi.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {submittedRecords.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                    {r.recordNumber}
                  </span>
                  <Badge variant="info">Submitted</Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {r.material?.name}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {r.site?.name} • {r.pit?.name}
                  </p>
                </div>
                <div className="rounded bg-slate-50 p-2 text-xs dark:bg-slate-850">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operator:</span>
                    <span className="font-semibold">{r.operator?.name}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-slate-400">Unit Alat:</span>
                    <span className="font-mono">{r.equipment?.code || "-"}</span>
                  </div>
                  <div className="flex justify-between mt-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400">Hasil Netto:</span>
                    <span className="font-mono font-bold text-orange-600">
                      {formatNumber(r.netWeight)} {r.unit}
                    </span>
                  </div>
                </div>
                {r.notes && (
                  <p className="text-[11px] text-slate-500 italic truncate">"{r.notes}"</p>
                )}
                <Button
                  variant="safety"
                  size="sm"
                  className="w-full font-bold"
                  onClick={() => {
                    setSelectedRecord(r);
                    setIsReviewModalOpen(true);
                  }}
                >
                  Tinjau & Validasi
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* History Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Riwayat Catatan yang Telah Diproses
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">No. Catatan</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4 text-right">Netto</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Catatan / Alasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {otherRecords.map((r) => (
                <tr key={r.id}>
                  <td className="py-3 px-4 font-mono font-bold text-orange-600">{r.recordNumber}</td>
                  <td className="py-3 px-4">{formatDateId(r.date)}</td>
                  <td className="py-3 px-4 font-semibold">{r.operator?.name}</td>
                  <td className="py-3 px-4">{r.material?.name}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold">
                    {formatNumber(r.netWeight)} {r.unit}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {r.status === "APPROVED" && <Badge variant="success">Disetujui</Badge>}
                    {r.status === "DRAFT" && <Badge variant="secondary">Draft</Badge>}
                    {r.status === "NEEDS_REVISION" && <Badge variant="warning">Revisi</Badge>}
                    {r.status === "REJECTED" && <Badge variant="destructive">Ditolak</Badge>}
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {r.rejectionReason || r.notes || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Validasi Catatan Produksi Operator"
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
                <span className="text-slate-500">Hasil Netto:</span>
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
                  placeholder="Contoh: Tiket timbangan kabur, mohon konfirmasi kembali berat tara..."
                  className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button type="button" variant="outline" onClick={() => setIsReviewModalOpen(false)}>
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
    </DashboardLayout>
  );
}
