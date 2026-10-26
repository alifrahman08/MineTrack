"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { formatNumber } from "@/lib/utils";

interface ProductionChartsProps {
  trendData: { date: string; coal: number; ob: number; target: number }[];
  materialData?: { name: string; amount: number; unit: string }[];
  siteData?: { siteName: string; coal: number; ob: number }[];
}

export function ProductionCharts({ trendData, materialData, siteData }: ProductionChartsProps) {
  const formattedTrend = (trendData && trendData.length > 0 ? trendData : [
    { date: "2026-10-21", coal: 2420, ob: 11800, target: 2500 },
    { date: "2026-10-22", coal: 2580, ob: 12200, target: 2500 },
    { date: "2026-10-23", coal: 2390, ob: 11500, target: 2500 },
    { date: "2026-10-24", coal: 2610, ob: 12400, target: 2500 },
    { date: "2026-10-25", coal: 2650, ob: 12800, target: 2500 },
    { date: "2026-10-26", coal: 2550, ob: 12100, target: 2500 },
  ]).map((d) => ({
    ...d,
    displayDate: d.date.slice(5),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 2-Column: Realization vs Target Trend */}
      <div className="lg:col-span-2 rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E3E2DC]">
          <div>
            <h3 className="text-sm font-bold text-[#252A2D]">
              Tren Realisasi Produksi vs Target Harian
            </h3>
            <p className="text-xs text-[#687177] mt-0.5">
              Agregasi produksi resmi Batubara (Ton) yang telah disetujui supervisor
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded border border-[#CDE9DA] bg-[#EDF7F2] text-[#287D54]">
            Disetujui Resmi
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formattedTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCoal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F36B21" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#F36B21" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E2DC" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "#687177" }} stroke="#E3E2DC" />
              <YAxis tick={{ fontSize: 11, fill: "#687177" }} stroke="#E3E2DC" tickFormatter={(v) => `${v}T`} />
              <Tooltip
                formatter={(val: any) => [`${formatNumber(val)} Ton`, ""]}
                contentStyle={{
                  backgroundColor: "#252A2D",
                  borderColor: "#E3E2DC",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px", color: "#687177" }} />
              <Area
                type="monotone"
                dataKey="coal"
                name="Produksi Batubara (Ton)"
                stroke="#F36B21"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorCoal)"
              />
              <Area
                type="monotone"
                dataKey="target"
                name="Target Operasional"
                stroke="#687177"
                strokeDasharray="4 4"
                strokeWidth={1.75}
                fill="none"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1-Column: Overburden & Material Breakdown */}
      <div className="rounded-xl border border-[#E3E2DC] bg-white p-5 shadow-xs">
        <div className="mb-4 pb-3 border-b border-[#E3E2DC]">
          <h3 className="text-sm font-bold text-[#252A2D]">
            Produktivitas Pengupasan OB
          </h3>
          <p className="text-xs text-[#687177] mt-0.5">Overburden harian terverifikasi (BCM)</p>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E3E2DC" />
              <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: "#687177" }} stroke="#E3E2DC" />
              <YAxis tick={{ fontSize: 11, fill: "#687177" }} stroke="#E3E2DC" tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                formatter={(val: any) => [`${formatNumber(val)} BCM`, "Overburden"]}
                contentStyle={{
                  backgroundColor: "#252A2D",
                  borderColor: "#E3E2DC",
                  borderRadius: "8px",
                  color: "#FFFFFF",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="ob" name="OB (BCM)" fill="#477A9B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
