"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  ChevronDown,
  CheckCheck,
  Wifi,
  WifiOff,
  Building2,
  Calendar,
} from "lucide-react";
import { cn, formatTimeAgo } from "@/lib/utils";
import { UserSession, NotificationModel } from "@/types";

export function Topbar({
  user,
  title,
  breadcrumbs,
}: {
  user: UserSession;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
}) {
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [isOpenNotif, setIsOpenNotif] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedSite, setSelectedSite] = useState<string>("site-kalbar-01");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setNotifications(json.data);
        setUnreadCount(json.data.filter((n: NotificationModel) => !n.isRead).length);
      }
    } catch {
      // silently handle
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markSingleRead = async (notifId: string) => {
    try {
      await fetch(`/api/notifications/${notifId}/read`, { method: "POST" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "APPROVAL":
        return <CheckCircle2 className="h-4 w-4 text-[#287D54]" />;
      case "SAFETY":
        return <AlertTriangle className="h-4 w-4 text-[#C94438]" />;
      case "REVISION":
        return <AlertTriangle className="h-4 w-4 text-[#B87B17]" />;
      case "DOWNTIME":
        return <Clock className="h-4 w-4 text-[#F36B21]" />;
      default:
        return <Shield className="h-4 w-4 text-[#477A9B]" />;
    }
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 w-full items-center justify-between border-b border-[#E3E2DC] bg-white/95 px-4 sm:px-6 backdrop-blur-xs">
      {/* Left: Breadcrumbs & Page Context */}
      <div className="flex items-center gap-3 pl-8 lg:pl-0 min-w-0">
        <div>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center space-x-1.5 text-[11px] text-[#687177]">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span className="text-[#E3E2DC]">/</span>}
                  {b.href ? (
                    <Link href={b.href} className="hover:text-[#252A2D] transition-colors">
                      {b.label}
                    </Link>
                  ) : (
                    <span className="font-semibold text-[#252A2D]">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}
          <h1 className="text-base font-bold text-[#252A2D] leading-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Site Selector, Connectivity, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Site Selector */}
        <div className="hidden md:flex items-center gap-1.5 rounded-lg border border-[#E3E2DC] bg-[#F8F7F4] px-2.5 py-1 text-xs text-[#252A2D]">
          <Building2 className="h-3.5 w-3.5 text-[#F36B21]" />
          <select
            value={selectedSite}
            onChange={(e) => setSelectedSite(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#252A2D] focus:outline-none cursor-pointer"
          >
            <option value="site-kalbar-01">Site Kendawangan (Kalbar)</option>
            <option value="site-kaltim-02">Site Sanga-Sanga (Kaltim)</option>
          </select>
        </div>

        {/* Connectivity Status Indicator */}
        <div
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-semibold border",
            isOnline
              ? "bg-[#EDF7F2] text-[#287D54] border-[#CDE9DA]"
              : "bg-[#FDF2F1] text-[#C94438] border-[#F8D2CF]"
          )}
          title={isOnline ? "Terhubung ke Jaringan Server" : "Koneksi Terputus - Mode Offline Aktif"}
        >
          {isOnline ? (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-[#287D54]" />
              <span className="hidden sm:inline">Online</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>Offline</span>
            </>
          )}
        </div>

        {/* Notification Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsOpenNotif(!isOpenNotif)}
            className="relative rounded-lg p-1.5 text-[#687177] hover:bg-[#F8F7F4] hover:text-[#252A2D] transition-colors focus:outline-none cursor-pointer"
            aria-label="Notifikasi Operasional"
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#F36B21] text-[9px] font-bold text-white shadow-xs">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {isOpenNotif && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-[#E3E2DC] bg-white shadow-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-[#E3E2DC] px-4 py-3 bg-[#F8F7F4]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#252A2D]">
                    Notifikasi Operasional
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#FDF3EC] px-2 py-0.5 text-[10px] font-bold text-[#F36B21] border border-[#FCD8C1]">
                      {unreadCount} baru
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="flex items-center gap-1 text-[11px] font-medium text-[#687177] hover:text-[#252A2D] cursor-pointer"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    <span>Tandai semua dibaca</span>
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-[#E3E2DC]">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#687177]">
                    Tidak ada notifikasi saat ini
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "flex items-start gap-3 p-3.5 transition-colors hover:bg-[#F8F7F4]",
                        !n.isRead && "bg-[#FDF3EC]/40"
                      )}
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#252A2D]">
                          {n.title}
                        </p>
                        <p className="text-xs text-[#687177] mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[10px] text-[#687177]">
                          <span>{formatTimeAgo(n.createdAt)}</span>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => {
                                markSingleRead(n.id);
                                setIsOpenNotif(false);
                              }}
                              className="font-semibold text-[#F36B21] hover:underline"
                            >
                              Lihat detail &rarr;
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Mini Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#E3E2DC]">
          <div className="h-7 w-7 rounded-full bg-[#252A2D] text-white flex items-center justify-center text-xs font-bold shadow-xs">
            {user.name.charAt(0)}
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-semibold text-[#252A2D] leading-none">
              {user.name}
            </p>
            <p className="text-[10px] text-[#687177] mt-0.5 capitalize">
              {user.role.toLowerCase()}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
