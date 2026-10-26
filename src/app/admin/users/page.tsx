"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Users, Plus, RefreshCw, CheckCircle2, XCircle, Shield, Mail, Phone } from "lucide-react";
import { UserProfile, SiteModel, Role, UserSession } from "@/types";

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "MineTrack2026!",
    role: "OPERATOR" as Role,
    phone: "",
    selectedSiteIds: [] as string[],
  });

  const fetchData = async () => {
    try {
      const [meRes, usersRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/master/users"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setCurrentUser(meJson.user);

      const uJson = await usersRes.json();
      if (uJson.success) setUsers(uJson.data);

      const mJson = await masterRes.json();
      if (mJson.success) setSites(mJson.data.sites);
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/master/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          siteAccesses: formData.selectedSiteIds.map((siteId) => ({
            siteId,
            siteName: sites.find((s) => s.id === siteId)?.name,
          })),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsModalOpen(false);
        setFormData({
          name: "",
          email: "",
          password: "MineTrack2026!",
          role: "OPERATOR",
          phone: "",
          selectedSiteIds: [],
        });
        fetchData();
      } else {
        alert(data.error || "Gagal membuat pengguna");
      }
    } catch {
      alert("Gagal menghubungi server");
    }
  };

  const handleToggleActive = async (u: UserProfile) => {
    if (u.id === currentUser?.id) {
      alert("Anda tidak dapat menonaktifkan akun Anda sendiri saat sedang login!");
      return;
    }

    try {
      await fetch(`/api/master/users/${u.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      fetchData();
    } catch {}
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case "ADMINISTRATOR":
        return <Badge variant="destructive">Admin</Badge>;
      case "SUPERVISOR":
        return <Badge variant="warning">Supervisor</Badge>;
      case "OPERATOR":
        return <Badge variant="success">Operator</Badge>;
      case "MANAGEMENT":
        return <Badge variant="info">Management</Badge>;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={currentUser}
      title="Manajemen Pengguna & Hak Akses (RBAC)"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Pengguna" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Daftar Personel & Hak Akses Sistem
          </h2>
          <p className="text-xs text-slate-500">
            Atur wewenang pengguna (Admin, Supervisor, Operator, Management) serta cakupan site yang diizinkan
          </p>
        </div>
        <Button variant="safety" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          <span>Tambah Pengguna</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Nama Lengkap</th>
                <th className="py-3 px-4">Email Operasional</th>
                <th className="py-3 px-4">Role Sistem</th>
                <th className="py-3 px-4">No. Telepon</th>
                <th className="py-3 px-4">Cakupan Site Tambang</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">
                    {u.name}
                  </td>
                  <td className="py-3 px-4 font-mono">{u.email}</td>
                  <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                  <td className="py-3 px-4">{u.phone || "-"}</td>
                  <td className="py-3 px-4">
                    {u.siteAccesses && u.siteAccesses.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {u.siteAccesses.map((sa) => (
                          <span
                            key={sa.siteId}
                            className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] dark:bg-slate-800"
                          >
                            {sa.siteName || "Site"}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400">Semua Site</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {u.isActive ? (
                      <Badge variant="success">Aktif</Badge>
                    ) : (
                      <Badge variant="destructive">Nonaktif</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(u)}
                      className={`text-[11px] font-bold px-2 py-1 rounded transition-colors ${
                        u.isActive
                          ? "text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          : "text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                      }`}
                    >
                      {u.isActive ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Pengguna */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Buat Akun Pengguna Baru"
        description="Tetapkan hak akses peran dan email operasional"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              placeholder="Contoh: Budi Santoso"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email Operasional</label>
              <input
                type="email"
                required
                placeholder="nama@minetrack.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Kata Sandi Awal</label>
              <input
                type="text"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Role / Peran</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              >
                <option value="OPERATOR">Operator Lapangan</option>
                <option value="SUPERVISOR">Mine Supervisor</option>
                <option value="MANAGEMENT">Manager / Management</option>
                <option value="ADMINISTRATOR">Administrator</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1">Nomor Telepon</label>
              <input
                type="text"
                placeholder="08123456789"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1">Cakupan Site Tambang yang Diizinkan</label>
            <div className="space-y-1.5 border rounded-lg p-2.5 dark:border-slate-800">
              {sites.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.selectedSiteIds.includes(s.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          selectedSiteIds: [...formData.selectedSiteIds, s.id],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          selectedSiteIds: formData.selectedSiteIds.filter((id) => id !== s.id),
                        });
                      }
                    }}
                    className="rounded text-orange-600"
                  />
                  <span>
                    {s.name} ({s.code})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="safety">
              Buat Pengguna
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
