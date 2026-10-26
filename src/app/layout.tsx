import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MineTrack — Sistem Monitoring Operasional Tambang Berbasis Web",
  description: "Operational Clarity. Every Shift. Platform monitoring produksi pertambangan terpadu, pengelolaan alat berat, pengawasan shift, kepatuhan K3, dan evaluasi target produksi.",
  keywords: ["minetrack", "mining", "tambang", "monitoring produksi", "alat berat", "shift tambang", "K3", "batubara", "overburden"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MineTrack",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-950 font-sans">{children}</body>
    </html>
  );
}
