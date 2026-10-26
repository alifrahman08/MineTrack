"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Clock,
  Trash2,
  FileText,
} from "lucide-react";
import { UserSession, OfflineSyncQueueItem } from "@/types";

export default function OperatorOfflinePage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [queue, setQueue] = useState<OfflineSyncQueueItem[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    // 1. Fetch user
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setUser(d.user);
      })
      .catch(() => {});

    // 2. Connectivity listeners
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const onOn = () => setIsOnline(true);
      const onOff = () => setIsOnline(false);
      window.addEventListener("online", onOn);
      window.addEventListener("offline", onOff);

      // 3. Load queue from localStorage
      try {
        const raw = localStorage.getItem("minetrack_offline_queue");
        if (raw) {
          setQueue(JSON.parse(raw));
        } else {
          // Provide an initial sample draft in pit mode for demonstration
          const sample: OfflineSyncQueueItem[] = [
            {
              id: "draft-local-01",
              idempotencyKey: "idemp-opr-20261026-pit-north-01",
              action: "CREATE_PRODUCTION",
              payload: {
                date: new Date().toISOString(),
                siteId: "site-kalbar-01",
                pitId: "pit-north-01",
                shiftId: "shf-day-01",
                materialId: "mat-coal-01",
                measurementType: "WEIGHED",
                ritaseCount: 1,
                grossWeight: 43.2,
                tareWeight: 14.1,
                netWeight: 29.1,
                notes: "Pencatatan offline di Pit North (Zona Blankspot)",
                status: "DRAFT",
              },
              clientTimestamp: new Date().toISOString(),
              attempts: 0,
              syncStatus: "QUEUED",
            },
          ];
          setQueue(sample);
          localStorage.setItem("minetrack_offline_queue", JSON.stringify(sample));
        }
      } catch {}

      return () => {
        window.removeEventListener("online", onOn);
        window.removeEventListener("offline", onOff);
      };
    }
  }, []);

  const handleSyncAll = async () => {
    if (queue.length === 0) return;
    setIsSyncing(true);
    setSyncStatusMessage(null);

    try {
      const res = await fetch("/api/offline/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: queue }),
      });
      const json = await res.json();
      if (json.success) {
        setSyncStatusMessage(`Berhasil menyinkronkan ${json.syncedCount} dari ${json.totalCount} data ke server!`);
        // Clear synced items
        setQueue([]);
        localStorage.removeItem("minetrack_offline_queue");
      } else {
        setSyncStatusMessage(`Gagal sinkronisasi: ${json.error}`);
      }
    } catch {
      setSyncStatusMessage("Koneksi ke server gagal. Data draf tetap aman di penyimpanan lokal perangkat.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = () => {
    if (confirm("Apakah Anda yakin ingin mengosongkan antrean draf offline ini?")) {
      setQueue([]);
      localStorage.removeItem("minetrack_offline_queue");
    }
  };

  return (
    <DashboardLayout
      user={user || { id: "usr-opr-01", email: "operator@minetrack.com", name: "Operator Lapangan", role: "OPERATOR" }}
      title="Mode Offline & Antrean Sinkronisasi (Pit Offline Queue)"
      breadcrumbs={[{ label: "Operator Lapangan" }, { label: "Mode Offline" }]}
    >
      {/* Connectivity Banner */}
      <div
        className={`p-5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm ${
          isOnline
            ? "bg-emerald-950/20 border-emerald-800 text-emerald-300"
            : "bg-amber-950/30 border-amber-800 text-amber-300 animate-pulse"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isOnline ? "bg-emerald-900/60 text-emerald-400" : "bg-amber-900/60 text-amber-400"
            }`}
          >
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-white text-base">
              {isOnline ? "Terhubung ke Server (Online)" : "Mode Pit Aktif (Koneksi Terputus / Blankspot)"}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isOnline
                ? "Seluruh data dapat disinkronkan secara langsung ke database pusat."
                : "Aplikasi tetap dapat mencatat draf timbang & ritase secara lokal. Data dilindungi kunci idempotency."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSyncAll}
            disabled={!isOnline || queue.length === 0 || isSyncing}
            className="w-full sm:w-auto"
          >
            <UploadCloud className={`w-4 h-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
            Sinkronkan Sekarang ({queue.length})
          </Button>
        </div>
      </div>

      {syncStatusMessage && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-emerald-400 flex items-center">
          <CheckCircle className="w-4 h-4 mr-2 text-emerald-400 shrink-0" />
          {syncStatusMessage}
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h4 className="font-semibold text-white text-sm">Daftar Antrean Data Lokal (Pending Sync)</h4>
          </div>
          {queue.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearQueue} className="text-red-400 hover:text-red-300">
              <Trash2 className="w-4 h-4 mr-1.5" />
              Kosongkan Antrean
            </Button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">ID Klien</th>
                <th className="px-5 py-3.5">Aksi / Operasi</th>
                <th className="px-5 py-3.5">Idempotency Key</th>
                <th className="px-5 py-3.5">Rincian Data</th>
                <th className="px-5 py-3.5">Waktu Simpan Lokal</th>
                <th className="px-5 py-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {queue.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Tidak ada data yang tertahan di antrean offline. Semua catatan telah tersinkronkan.
                  </td>
                </tr>
              ) : (
                queue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs text-white">{item.id}</td>
                    <td className="px-5 py-3.5">
                      <Badge variant="outline">{item.action}</Badge>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-xs text-amber-400">{item.idempotencyKey}</td>
                    <td className="px-5 py-3.5 text-xs text-slate-300">
                      Netto: {item.payload.netWeight || "-"} Ton • Catatan: {item.payload.notes || "-"}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {new Date(item.clientTimestamp).toLocaleTimeString("id-ID")} WIB
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Badge variant={item.syncStatus === "SYNCED" ? "success" : "warning"}>
                        {item.syncStatus}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
