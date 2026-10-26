"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Layers, Plus, RefreshCw, CheckCircle2, MapPin, Pickaxe } from "lucide-react";
import { SiteModel, PitModel, MaterialModel, ProductionTargetModel, UserSession } from "@/types";

export default function AdminMasterPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<"sites" | "pits" | "materials">("sites");
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [pits, setPits] = useState<PitModel[]>([]);
  const [materials, setMaterials] = useState<MaterialModel[]>([]);

  // Modals
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [siteForm, setSiteForm] = useState({ code: "", name: "", location: "", description: "" });

  const [isPitModalOpen, setIsPitModalOpen] = useState(false);
  const [pitForm, setPitForm] = useState({ siteId: "", code: "", name: "" });

  const fetchData = async () => {
    try {
      const [meRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/master"),
      ]);
      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const mJson = await masterRes.json();
      if (mJson.success) {
        setSites(mJson.data.sites);
        setPits(mJson.data.pits);
        setMaterials(mJson.data.materials);
        if (mJson.data.sites.length > 0 && !pitForm.siteId) {
          setPitForm((p) => ({ ...p, siteId: mJson.data.sites[0].id }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateSite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/master/sites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(siteForm),
      });
      const data = await res.json();
      if (data.success) {
        setIsSiteModalOpen(false);
        setSiteForm({ code: "", name: "", location: "", description: "" });
        fetchData();
      } else {
        alert(data.error || "Gagal menambah site");
      }
    } catch {
      alert("Gagal menghubungi server");
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
      title="Manajemen Master Data Operasional"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Master Data" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Pengaturan Entitas Tambang & Parameter Sistem
          </h2>
          <p className="text-xs text-slate-500">
            Kelola lokasi konsesi (Site), blok penggalian (Pit), jenis komoditas, dan satuan ukuran
          </p>
        </div>
        <div className="flex gap-2">
          {activeTab === "sites" && (
            <Button variant="safety" size="sm" onClick={() => setIsSiteModalOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              <span>Tambah Site</span>
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("sites")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "sites"
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Site Tambang ({sites.length})
        </button>
        <button
          onClick={() => setActiveTab("pits")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "pits"
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Pit & Area Kerja ({pits.length})
        </button>
        <button
          onClick={() => setActiveTab("materials")}
          className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === "materials"
              ? "border-orange-600 text-orange-600 dark:text-orange-400"
              : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
          }`}
        >
          Jenis Komoditas & Material ({materials.length})
        </button>
      </div>

      {/* Tab Content: Sites */}
      {activeTab === "sites" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sites.map((s) => (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{s.name}</h3>
                  <span className="font-mono text-xs text-orange-600 font-bold">{s.code}</span>
                </div>
                <Badge variant="success">Aktif</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>{s.location}</span>
              </p>
              {s.description && (
                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 pt-2 dark:border-slate-800">
                  {s.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab Content: Pits */}
      {activeTab === "pits" && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-850 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Kode Pit</th>
                <th className="py-3 px-4">Nama Pit</th>
                <th className="py-3 px-4">Site Tambang</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {pits.map((p) => (
                <tr key={p.id}>
                  <td className="py-3 px-4 font-mono font-bold text-orange-600">{p.code}</td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100">{p.name}</td>
                  <td className="py-3 px-4">{p.siteName || "-"}</td>
                  <td className="py-3 px-4 text-center">
                    <Badge variant="success">Aktif</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Materials */}
      {activeTab === "materials" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {materials.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-orange-600">{m.code}</span>
                <Badge variant="outline">{m.unit}</Badge>
              </div>
              <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-slate-100">{m.name}</h3>
              <p className="mt-1 text-xs text-slate-500">Densitas: {m.density || 1.0} t/m³</p>
              {m.description && <p className="mt-2 text-xs text-slate-400 border-t pt-2">{m.description}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Modal: Tambah Site */}
      <Modal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        title="Tambah Lokasi Site Tambang Baru"
        description="Masukkan kode unik dan lokasi konsesi pertambangan"
      >
        <form onSubmit={handleCreateSite} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold mb-1">Kode Site</label>
            <input
              type="text"
              required
              placeholder="Contoh: SITE-KDW, SITE-SNG"
              value={siteForm.code}
              onChange={(e) => setSiteForm({ ...siteForm, code: e.target.value.toUpperCase() })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Nama Site</label>
            <input
              type="text"
              required
              placeholder="Site Kendawangan (Kalbar)"
              value={siteForm.name}
              onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Wilayah / Lokasi</label>
            <input
              type="text"
              required
              placeholder="Ketapang, Kalimantan Barat"
              value={siteForm.location}
              onChange={(e) => setSiteForm({ ...siteForm, location: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Deskripsi Operasi</label>
            <textarea
              rows={2}
              value={siteForm.description}
              onChange={(e) => setSiteForm({ ...siteForm, description: e.target.value })}
              className="w-full rounded-lg border border-slate-300 p-2 dark:border-slate-700 dark:bg-slate-950"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t">
            <Button type="button" variant="outline" onClick={() => setIsSiteModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="safety">
              Simpan Site
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
