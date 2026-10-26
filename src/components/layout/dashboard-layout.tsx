import React from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { PwaRegister } from "./pwa-register";
import { UserSession } from "@/types";

interface DashboardLayoutProps {
  user: UserSession;
  title: string;
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
}

export function DashboardLayout({ user, title, breadcrumbs, children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-[#F8F7F4] text-[#252A2D]">
      <Sidebar user={user} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar user={user} title={title} breadcrumbs={breadcrumbs} />
        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
      <PwaRegister />
    </div>
  );
}
