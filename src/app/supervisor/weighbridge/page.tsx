"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Scale,
  RefreshCw,
  Search,
  CheckCircle,
  Clock,
  Truck,
  Eye,
  Edit2,
  XCircle,
} from "lucide-react";
import { WeighbridgeTicketModel, SiteModel, UserSession } from "@/types";
import { formatNumber } from "@/lib/utils";

export default function SupervisorWeighbridgePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [tickets, setTickets] = useState<WeighbridgeTicketModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedTicket, setSelectedTicket] = useState<WeighbridgeTicketModel | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctionReason, setCorrectionReason] = useState("");
  const [correctGross, setCorrectGross] = useState(0);
  const [correctTare, setCorrectTare] = useState(0);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, wbRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/weighbridge?status=${statusFilter}&search=${encodeURIComponent(search)}`),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const wbJson = await wbRes.json();
      if (wbJson.success) setTickets(wbJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) setSites(masterJson.data.sites);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [statusFilter]);

  const handleCorrectTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket) return;

    try {
      const res = await fetch(`/api/weighbridge/${selectedTicket.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grossWeight: correctGross,
          tareWeight: correctTare,
          reason: correctionReason,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsCorrectModalOpen(false);
        setSelectedTicket(null);
        setCorrectionReason("");
        fetchData();
      } else {
        alert(json.error || "Gagal mengoreksi tiket");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleCancelTicket = async (ticket: WeighbridgeTicketModel) => {
    const reason = prompt("Masukkan alasan pembatalan tiket timbang:");
    if (!reason) return;

    try {
      const res = await fetch(`/api/weighbridge/${ticket.id}?reason=${encodeURIComponent(reason)}`, {
        method: "DELETE",
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      } else {
        alert(json.error || "Gagal membatalkan tiket");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const totalTickets = tickets.length;
  const totalNetWeight = tickets
    .filter((t) => t.status !== "CANCELLED")
    .reduce((sum, t) => sum + t.netWeight, 0);

  return (
    <DashboardLayout
      user={user || { id: "usr-spv-01", email: "supervisor@minetrack.com", name: "Supervisor", role: "SUPERVISOR" }}
      title="Pengawasan Jembatan Timbang (Weighbridge Supervision)"
      breadcrumbs={[{ label: "Operasional Tambang" }, { label: "Jembatan Timbang" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tiket Terpantau</span>
            <Scale className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalTickets}</div>
          <div className="text-xs text-slate-400 mt-1">Total tiket dalam pengawasan shift</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Muatan Bersih</span>
            <Truck className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{formatNumber(totalNetWeight)} Ton</div>
          <div className="text-xs text-slate-400 mt-1">Hasil timbang netto resmi</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Kondisi Timbangan</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">TERVERIFIKASI</div>
          <div className="text-xs text-emerald-400 mt-1">Sertifikasi tera timbangan aktif</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari no tiket, plat kendaraan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchData()}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Status Tiket</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="PENDING_REVIEW">PENDING_REVIEW</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">No. Tiket</th>
                <th className="px-5 py-3.5">Plat / Supir</th>
                <th className="px-5 py-3.5">Pit & Komoditas</th>
                <th className="px-5 py-3.5 text-right">Bruto (Ton)</th>
                <th className="px-5 py-3.5 text-right">Tara (Ton)</th>
                <th className="px-5 py-3.5 text-right font-bold text-amber-400">Netto (Ton)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Aksi Supervisor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {tickets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-500">
                    Tidak ada tiket timbang dalam pengawasan saat ini.
                  </td>
                </tr>
              ) : (
                tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-white">{t.ticketNumber}</td>
                    <td className="px-5 py-3.5">
                      <div className="font-semibold text-slate-200">{t.truckPlateNumber}</div>
                      <div className="text-xs text-slate-400">Supir: {t.driverName || "-"}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="text-slate-200">{t.materialName}</div>
                      <div className="text-xs text-slate-400">{t.pitName}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-300">{t.grossWeight.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-slate-400">{t.tareWeight.toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-400">{t.netWeight.toFixed(2)}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant={t.status === "VERIFIED" ? "success" : t.status === "CANCELLED" ? "destructive" : "warning"}>
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTicket(t);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {t.status !== "CANCELLED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTicket(t);
                                setCorrectGross(t.grossWeight);
                                setCorrectTare(t.tareWeight);
                                setIsCorrectModalOpen(true);
                              }}
                            >
                              <Edit2 className="w-4 h-4 text-blue-400" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => handleCancelTicket(t)}>
                              <XCircle className="w-4 h-4 text-red-400" />
                            </Button>
                          </>
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

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Detail Tiket Timbang: ${selectedTicket.ticketNumber}`}
        >
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-500">Nomor Kendaraan:</span>
                <p className="font-mono font-bold text-lg text-white">{selectedTicket.truckPlateNumber}</p>
                <span className="text-xs text-slate-500 mt-2 block">Pengemudi:</span>
                <p className="text-slate-300">{selectedTicket.driverName || "-"}</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Petugas Timbang (Weighmaster):</span>
                <p className="text-slate-200 font-semibold">{selectedTicket.weighmasterName || "Sistem"}</p>
                <span className="text-xs text-slate-500 mt-2 block">Sumber Data:</span>
                <Badge variant="outline">{selectedTicket.dataSource}</Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <div>
                <span className="text-xs text-slate-500">Bruto</span>
                <p className="font-mono text-lg font-bold text-white">{selectedTicket.grossWeight} Ton</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Tara</span>
                <p className="font-mono text-lg font-bold text-slate-400">{selectedTicket.tareWeight} Ton</p>
              </div>
              <div>
                <span className="text-xs text-slate-500">Netto</span>
                <p className="font-mono text-xl font-bold text-emerald-400">{selectedTicket.netWeight} Ton</p>
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setIsDetailModalOpen(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Correct Modal */}
      {selectedTicket && (
        <Modal
          isOpen={isCorrectModalOpen}
          onClose={() => setIsCorrectModalOpen(false)}
          title={`Koreksi Tiket Timbang: ${selectedTicket.ticketNumber}`}
        >
          <form onSubmit={handleCorrectTicket} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Berat Bruto Baru (Ton)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={correctGross}
                  onChange={(e) => setCorrectGross(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Berat Tara Baru (Ton)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={correctTare}
                  onChange={(e) => setCorrectTare(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-xs text-slate-500">Netto Baru Hasil Koreksi:</span>
              <p className="font-mono font-bold text-lg text-emerald-400">
                {Math.max(0, Number((correctGross - correctTare).toFixed(2)))} Ton
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Alasan Koreksi (Wajib Diisi - Terekam Audit Log) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Alasan koreksi timbangan..."
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsCorrectModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan Koreksi</Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
