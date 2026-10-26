"use client";

import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ProductionCharts } from "@/components/dashboard/production-charts";
import { BarChart3, Plus, RefreshCw, Target, Pickaxe, Layers, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { ProductionTargetModel, SiteModel, MaterialModel, UserSession } from "@/types";
import { formatNumber } from "@/lib/utils";

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<UserSession | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [targets, setTargets] = useState<ProductionTargetModel[]>([]);
  const [sites, setSites] = useState<SiteModel[]>([]);
  const [materials, setMaterials] = useState<MaterialModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    siteId: "",
    materialId: "",
    periodType: "DAILY" as "DAILY" | "MONTHLY" | "SHIFT",
    targetAmount: 2500,
    startDate: "",
    endDate: "",
  });

  const fetchData = async () => {
    try {
      const [meRes, anRes, masterRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/analytics"),
        fetch("/api/master"),
      ]);

      const meJson = await meRes.json();
      if (meJson.authenticated) setUser(meJson.user);

      const anJson = await anRes.json();
      if (anJson.success) setAnalytics(anJson.data);

      const masterJson = await masterRes.json();
      if (masterJson.success) {
        setSites(masterJson.data.sites);
        setMaterials(masterJson.data.materials);
        if (!formData.siteId && masterJson.data.sites.length > 0) {
          setFormData((p) => ({
            ...p,
            siteId: masterJson.data.sites[0].id,
            materialId: masterJson.data.materials[0]?.id || "",
          }));
        }
      }
    } catch {}
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (!user || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <RefreshCw className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <DashboardLayout
      user={user}
      title="Analitik Target & Realisasi Produksi"
      breadcrumbs={[{ label: "Admin", href: "/admin/dashboard" }, { label: "Analitik" }]}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Evaluasi Pencapaian Target & Produktivitas Tambang
          </h2>
          <p className="text-xs text-slate-500">
            Perbandingan data produksi yang telah disetujui terhadap target anggaran harian & bulanan
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Realisasi Batubara"
          value={formatNumber(analytics.totalCoalTon)}
          unit="Ton"
          icon={Pickaxe}
          variant="safety"
          description={`Target: ${formatNumber(analytics.targetCoalTon)} Ton`}
        />
        <MetricCard
          title="Tingkat Pencapaian"
          value={`${analytics.achievementPercent}%`}
          unit=""
          icon={Target}
          variant={analytics.achievementPercent >= 100 ? "success" : "warning"}
          trend={{
            value: `${analytics.diffProduction >= 0 ? "+" : ""}${formatNumber(analytics.diffProduction)} Ton`,
            isPositive: analytics.diffProduction >= 0,
            label: "selisih",
          }}
        />
        <MetricCard
          title="Pengupasan Overburden"
          value={formatNumber(analytics.totalOBBCM)}
          unit="BCM"
          icon={Layers}
          variant="info"
          description="Volume pemindahan batuan penutup"
        />
        <MetricCard
          title="Kesiapan Armada"
          value={`${analytics.equipmentSummary.available + analytics.equipmentSummary.inUse}/${analytics.equipmentSummary.total}`}
          unit="Unit"
          icon={Target}
          variant="success"
          description="Armada beroperasi normal di pit"
        />
      </div>

      {/* Production Analytics Charts */}
      <ProductionCharts
        trendData={analytics.trend}
        materialData={analytics.byMaterial}
        siteData={analytics.bySite}
      />

      {/* Breakdown Tables */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Produksi Berdasarkan Jenis Material
          </h3>
          <div className="space-y-3">
            {analytics.byMaterial.map((m: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{m.name}</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {formatNumber(m.amount)} {m.unit}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
            Perbandingan Produktivitas Antar-Site
          </h3>
          <div className="space-y-3">
            {analytics.bySite.map((s: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{s.siteName}</span>
                <div className="text-right font-mono">
                  <span className="font-bold text-orange-600 block">{formatNumber(s.coal)} Ton</span>
                  {s.ob > 0 && <span className="text-[10px] text-blue-500 block">{formatNumber(s.ob)} BCM</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
