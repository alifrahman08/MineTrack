"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Pickaxe,
  Truck,
  Calendar,
  AlertTriangle,
  FileText,
  BarChart3,
  ShieldCheck,
  Users,
  LogOut,
  ChevronRight,
  HardHat,
  X,
  Clock,
  Scale,
  Wrench,
  CheckSquare,
  Bell,
  Activity,
  WifiOff,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserSession } from "@/types";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

export function Sidebar({ user }: { user: UserSession }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const getNavItems = (): NavItem[] => {
    switch (user.role) {
      case "ADMINISTRATOR":
        return [
          { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Pencatatan Produksi", href: "/admin/production", icon: Pickaxe },
          { label: "Jembatan Timbang", href: "/admin/weighbridge", icon: Scale },
          { label: "Alat Berat & Unit", href: "/admin/equipment", icon: Truck },
          { label: "Maintenance Armada", href: "/admin/maintenance", icon: Wrench },
          { label: "Shift & Penugasan", href: "/admin/shifts", icon: Calendar },
          { label: "Downtime Alat", href: "/admin/downtime", icon: Clock },
          { label: "Peringatan Sistem", href: "/admin/alerts", icon: Bell },
          { label: "Keselamatan Kerja (K3)", href: "/admin/safety", icon: AlertTriangle },
          { label: "Laporan Harian", href: "/admin/reports", icon: FileText },
          { label: "Analitik & Target", href: "/admin/analytics", icon: BarChart3 },
          { label: "Master Data Tambang", href: "/admin/master", icon: Layers },
          { label: "Manajemen Pengguna", href: "/admin/users", icon: Users },
          { label: "Audit Log Sistem", href: "/admin/audit-logs", icon: ShieldCheck },
          { label: "Status Sistem", href: "/admin/system", icon: Activity },
        ];

      case "SUPERVISOR":
        return [
          { label: "Dashboard Supervisor", href: "/supervisor/dashboard", icon: LayoutDashboard },
          { label: "Review Produksi", href: "/supervisor/production", icon: Pickaxe },
          { label: "Jembatan Timbang", href: "/supervisor/weighbridge", icon: Scale },
          { label: "Rekonsiliasi Produksi", href: "/supervisor/reconciliation", icon: CheckSquare },
          { label: "Penugasan Shift", href: "/supervisor/shifts", icon: Calendar },
          { label: "Monitoring Alat Berat", href: "/supervisor/equipment", icon: Truck },
          { label: "Downtime & Kendala", href: "/supervisor/downtime", icon: Clock },
          { label: "Pengawasan K3", href: "/supervisor/safety", icon: AlertTriangle },
          { label: "Laporan Operasional", href: "/supervisor/reports", icon: FileText },
          { label: "Analitik Target", href: "/supervisor/analytics", icon: BarChart3 },
        ];

      case "OPERATOR":
        return [
          { label: "Dashboard Operator", href: "/operator/dashboard", icon: LayoutDashboard },
          { label: "Input Produksi", href: "/operator/production", icon: Pickaxe },
          { label: "Mode Offline & Antrean", href: "/operator/offline", icon: WifiOff },
          { label: "Jadwal Shift Saya", href: "/operator/shifts", icon: Calendar },
          { label: "Lapor Downtime Unit", href: "/operator/downtime", icon: Clock },
          { label: "Lapor Kondisi K3", href: "/operator/safety", icon: AlertTriangle },
          { label: "Laporan Harian (LOH)", href: "/operator/reports", icon: FileText },
        ];

      case "MANAGEMENT":
        return [
          { label: "Executive Dashboard", href: "/management/dashboard", icon: LayoutDashboard },
          { label: "Analisis Produksi", href: "/management/analytics", icon: BarChart3 },
          { label: "Rekonsiliasi Produksi", href: "/management/reconciliation", icon: CheckSquare },
          { label: "Produksi Disetujui", href: "/management/production", icon: Pickaxe },
          { label: "Utilisasi Alat Berat", href: "/management/equipment", icon: Truck },
          { label: "Ringkasan Downtime", href: "/management/downtime", icon: Clock },
          { label: "Statistik K3", href: "/management/safety", icon: AlertTriangle },
          { label: "Laporan & Ekspor", href: "/management/reports", icon: FileText },
        ];

      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const getRoleBadgeStyle = () => {
    switch (user.role) {
      case "ADMINISTRATOR":
        return "bg-[#FDF2F1] text-[#C94438] border-[#F8D2CF]";
      case "SUPERVISOR":
        return "bg-[#FEF8ED] text-[#B87B17] border-[#FCE6BD]";
      case "OPERATOR":
        return "bg-[#EDF7F2] text-[#287D54] border-[#CDE9DA]";
      case "MANAGEMENT":
        return "bg-[#F1F6F9] text-[#477A9B] border-[#D0E2EC]";
    }
  };

  const sidebarContent = (
    <aside className="flex h-full flex-col bg-white text-[#252A2D]">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E3E2DC]">
        <Link href="/" className="flex items-center gap-2.5 group min-w-0">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#252A2D] text-white font-black group-hover:bg-[#F36B21] transition-colors shrink-0">
            <HardHat className="h-4.5 w-4.5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold tracking-tight text-[#252A2D]">MineTrack</span>
              </div>
              <p className="text-[10px] font-semibold text-[#687177] uppercase tracking-wider">
                OPERATIONS PLATFORM
              </p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden p-1.5 text-[#687177] hover:text-[#252A2D] cursor-pointer"
          aria-label="Tutup Menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Active Site Context */}
      {!isCollapsed && (
        <div className="px-5 py-3 border-b border-[#E3E2DC] bg-[#F8F7F4]/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="h-2 w-2 rounded-full bg-[#287D54] animate-pulse shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#252A2D] truncate">
                Site Kendawangan
              </p>
              <p className="text-[10px] text-[#687177] truncate">
                Kalimantan Barat • Pit Alumina 01
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {!isCollapsed && (
          <div className="px-3 pb-1 pt-1 text-[10px] font-bold tracking-wider text-[#687177] uppercase">
            Menu Operasional
          </div>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/admin/dashboard" && item.href !== "/supervisor/dashboard" && item.href !== "/operator/dashboard" && item.href !== "/management/dashboard" && pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150",
                isActive
                  ? "bg-[#FDF3EC] text-[#F36B21] font-semibold border-l-2 border-[#F36B21]"
                  : "text-[#687177] hover:bg-[#F8F7F4] hover:text-[#252A2D]"
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "text-[#F36B21]" : "text-[#687177] group-hover:text-[#252A2D]"
                  )}
                />
                {!isCollapsed && <span className="truncate">{item.label}</span>}
              </div>
              {!isCollapsed && (
                <ChevronRight
                  className={cn(
                    "h-3 w-3 shrink-0 transition-transform",
                    isActive ? "text-[#F36B21] opacity-90" : "text-[#687177] opacity-0 group-hover:opacity-100"
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User Profile & Footer Actions */}
      <div className="border-t border-[#E3E2DC] bg-[#F8F7F4]/50 p-3 space-y-2">
        {/* User Card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-white border border-[#E3E2DC]">
          <div className="h-7 w-7 rounded-full bg-[#252A2D] text-white flex items-center justify-center text-xs font-bold shrink-0">
            {user.name.charAt(0)}
          </div>
          {!isCollapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-[#252A2D] truncate">{user.name}</p>
              <span
                className={cn(
                  "inline-block text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.2 rounded border",
                  getRoleBadgeStyle()
                )}
              >
                {user.role}
              </span>
            </div>
          )}
        </div>

        {/* Collapse & Logout Bar */}
        <div className="flex items-center justify-between pt-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex items-center gap-1.5 text-xs text-[#687177] hover:text-[#252A2D] p-1 rounded hover:bg-white transition-colors cursor-pointer"
            title={isCollapsed ? "Buka Sidebar" : "Ciutkan Sidebar"}
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!isCollapsed && <span className="text-[11px]">Ciutkan</span>}
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1 text-xs text-[#C94438] hover:text-[#A73429] p-1 rounded hover:bg-[#FDF2F1] transition-colors cursor-pointer ml-auto"
            title="Keluar dari sistem"
          >
            <LogOut className="h-3.5 w-3.5" />
            {!isCollapsed && <span className="text-[11px] font-semibold">Keluar</span>}
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <>
      {/* Mobile Hamburger Button */}
      <div className="lg:hidden fixed top-3 left-4 z-40">
        <button
          onClick={() => setIsMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E3E2DC] bg-white text-[#252A2D] shadow-sm hover:bg-[#F8F7F4] cursor-pointer"
          aria-label="Buka Menu"
        >
          <HardHat className="h-5 w-5 text-[#F36B21]" />
        </button>
      </div>

      {/* Desktop Persistent Sidebar */}
      <div
        className={cn(
          "hidden lg:block shrink-0 border-r border-[#E3E2DC] transition-all duration-200 sticky top-0 h-screen",
          isCollapsed ? "w-16" : "w-[248px]"
        )}
      >
        {sidebarContent}
      </div>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-[#252A2D]/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative flex w-full max-w-[270px] flex-1 flex-col shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
