"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export function PwaRegister() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [hasPromptedOffline, setHasPromptedOffline] = useState(false);

  useEffect(() => {
    // 1. Initial state
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      // 2. Register Service Worker
      if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
        navigator.serviceWorker
          .register("/sw.js")
          .catch(() => {});
      }

      // 3. Online/Offline listeners
      const handleOnline = () => {
        setIsOnline(true);
      };

      const handleOffline = () => {
        setIsOnline(false);
        setHasPromptedOffline(true);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  if (isOnline && !hasPromptedOffline) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium shadow-lg transition-all border ${
        isOnline
          ? "bg-emerald-950/90 text-emerald-300 border-emerald-800"
          : "bg-amber-950/90 text-amber-300 border-amber-800 animate-pulse"
      }`}
    >
      {isOnline ? (
        <>
          <Wifi className="w-4 h-4 text-emerald-400" />
          <span>Terhubung ke Jaringan (Online)</span>
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>Koneksi Terputus (Mode Pit) — Draf Disimpan Lokal</span>
        </>
      )}
    </div>
  );
}
