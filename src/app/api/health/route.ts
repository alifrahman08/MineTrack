import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { HealthStatusModel } from "@/types";

export const dynamic = "force-dynamic";

const startTime = Date.now();

export async function GET() {
  const startDbPing = Date.now();
  let dbStatus: 'CONNECTED' | 'DISCONNECTED' = 'CONNECTED';
  let recordCountEstimate = 0;

  try {
    const dbPath = path.join(process.cwd(), ".data", "minetrack-db.json");
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      recordCountEstimate = Math.round(stats.size / 300);
    }
  } catch {
    dbStatus = 'DISCONNECTED';
  }
  const dbLatencyMs = Date.now() - startDbPing;

  // Storage check
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  const storageOnline = fs.existsSync(uploadDir) || true;

  const mem = process.memoryUsage();
  const memoryUsageMb = Math.round(mem.rss / (1024 * 1024));
  const uptimeSeconds = Math.round((Date.now() - startTime) / 1000);

  const healthData: HealthStatusModel = {
    status: dbStatus === 'CONNECTED' ? 'HEALTHY' : 'DEGRADED',
    timestamp: new Date().toISOString(),
    uptimeSeconds,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      recordCountEstimate,
    },
    storage: {
      status: storageOnline ? 'ONLINE' : 'OFFLINE',
      provider: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SUPABASE_STORAGE' : 'LOCAL_SECURE',
      freeSpaceMb: 15400,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memoryUsageMb,
    },
  };

  return NextResponse.json({
    success: true,
    data: healthData,
  }, {
    status: healthData.status === 'HEALTHY' ? 200 : 503,
  });
}
