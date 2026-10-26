"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Bell,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Clock,
  ShieldAlert,
  Wrench,
  Truck,
  FileText,
  Search,
} from "lucide-react";
import { OperationalAlertModel, SiteModel, UserSession } from "@/types";
import { formatDateId } from "@/lib/utils";

export default function AdminAlertsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [alerts, setAlerts] = useState<OperationalAlertModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [siteFilter, setSiteFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("false"); // default: unassigned/unresolved

  const [selectedAlert, setSelectedAlert] = useState<OperationalAlertModel | null>(null);
  const [isResolveModalOpen, setIsResolveModalOpen] = useState(false);
  const [resolveNotes, setResolveNotes] = useState("");

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [meRes, alertRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch(`/api/alerts?siteId=${siteFilter}&isResolved=${statusFilter}`),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const alertJson = await alertRes.json();
      if (alertJson.success) setAlerts(alertJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) setSites(masterJson.data.sites);
    } catch {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [siteFilter, statusFilter]);

  const handleResolveAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlert) return;

    try {
      const res = await fetch("/api/alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESOLVE",
          id: selectedAlert.id,
          notes: resolveNotes,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsResolveModalOpen(false);
        setSelectedAlert(null);
        setResolveNotes("");
        fetchData();
      } else {
        alert(json.error || "Gagal menyelesaikan peringatan");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const criticalCount = alerts.filter((a) => (a.severity === "CRITICAL" || a.severity === "HIGH") && !a.isResolved).length;
  const unresolvedCount = alerts.filter((a) => !a.isResolved).length;

  return (
    <DashboardLayout
      user={user || { id: "usr-admin-01", email: "admin@minetrack.com", name: "Administrator", role: "ADMINISTRATOR" }}
      title="Pusat Peringatan Operasional (Operational Alerts)"
      breadcrumbs={[{ label: "Sistem & Keamanan" }, { label: "Peringatan Operasional" }]}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Peringatan Kritis Terbuka</span>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div className="text-2xl font-bold text-red-400 mt-2">{criticalCount}</div>
          <div className="text-xs text-slate-400 mt-1">Perlu tindakan penanganan segera</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Belum Ditutup</span>
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{unresolvedCount}</div>
          <div className="text-xs text-slate-400 mt-1">Insiden, downtime, atau selisih aktif</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mesin Pendeteksi</span>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">DEDUPLIKASI AKTIF</div>
          <div className="text-xs text-emerald-400 mt-1">Mencegah spam notifikasi berulang</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60 p-4 border border-slate-800 rounded-xl">
        <div className="flex items-center gap-3 w-full sm:w-auto flex-wrap">
          <select
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="">Semua Site Tambang</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-amber-500"
          >
            <option value="false">Hanya Yang Belum Selesai</option>
            <option value="true">Riwayat Yang Sudah Selesai</option>
            <option value="">Semua Status</option>
          </select>

          <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-500">
            Tidak ada peringatan operasional pada filter ini. Seluruh parameter terpantau aman.
          </div>
        ) : (
          alerts.map((alt) => (
            <div
              key={alt.id}
              className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${
                alt.isResolved
                  ? "bg-slate-900/40 border-slate-800/80 text-slate-400"
                  : alt.severity === "CRITICAL" || alt.severity === "HIGH"
                  ? "bg-red-950/20 border-red-900/50 text-slate-200"
                  : "bg-amber-950/20 border-amber-900/50 text-slate-200"
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  {alt.alertType === "CRITICAL_SAFETY_INCIDENT" ? (
                    <ShieldAlert className="w-5 h-5 text-red-400" />
                  ) : alt.alertType === "EQUIPMENT_DOWNTIME" ? (
                    <Truck className="w-5 h-5 text-amber-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-white">{alt.title}</span>
                    <Badge variant={alt.severity === "CRITICAL" || alt.severity === "HIGH" ? "destructive" : "warning"}>
                      {alt.severity}
                    </Badge>
                    <span className="text-xs text-slate-400 font-mono">[{alt.siteName}]</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{alt.message}</p>
                  {alt.actionNotes && (
                    <div className="text-xs text-emerald-400 mt-1.5 flex items-center">
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      Tindak lanjut: {alt.actionNotes} ({alt.resolvedByName})
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-slate-500 whitespace-nowrap">
                  {new Date(alt.createdAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
                </span>
                {!alt.isResolved && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAlert(alt);
                      setResolveNotes("");
                      setIsResolveModalOpen(true);
                    }}
                  >
                    Tindak Lanjuti
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resolve Modal */}
      {selectedAlert && (
        <Modal
          isOpen={isResolveModalOpen}
          onClose={() => setIsResolveModalOpen(false)}
          title={`Tindak Lanjut Peringatan: ${selectedAlert.title}`}
        >
          <form onSubmit={handleResolveAlert} className="space-y-4 text-sm">
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
              {selectedAlert.message}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                Catatan Tindakan Korektif / Mitigasi *
              </label>
              <textarea
                required
                rows={3}
                placeholder="Contoh: Unit telah dialihkan ke workshop pit. Mekanik telah menyelesaikan penggantian selang hidrolik."
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <Button type="button" variant="outline" onClick={() => setIsResolveModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Tandai Selesai</Button>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  );
}
