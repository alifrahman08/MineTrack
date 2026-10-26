import React from "react";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { ShieldCheck, Search, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTimeId } from "@/lib/utils";

export default async function AdminAuditLogsPage() {
  const user = await requireRole(["ADMINISTRATOR"]);
  const logs = db.getAuditLogs({ limit: 100 });

  return (
    <DashboardLayout
      user={user}
      title="Audit Log & Riwayat Aktivitas Sistem"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Audit Log" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Jejak Rekam Aktivitas & Keamanan
          </h2>
          <p className="text-xs text-slate-500">
            Pencatatan seluruh transaksi krusial, perubahan data produksi, persetujuan, dan akses pengguna
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">Ringkasan Perubahan</th>
                <th className="py-3 px-4 font-mono">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    {formatDateTimeId(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                    {log.userEmail || "Sistem"}
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={log.action === "APPROVE" ? "success" : log.action === "REJECT" ? "destructive" : "secondary"}>
                      {log.action}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-500">{log.entityType}</td>
                  <td className="py-3 px-4 max-w-md truncate font-mono text-[11px] text-slate-600 dark:text-slate-400">
                    {log.details}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{log.ipAddress || "127.0.0.1"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  );
}
