import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { format } from "date-fns";

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "production";
    const siteId = searchParams.get("siteId") || undefined;

    let csvContent = "";
    let filename = `minetrack-export-${type}-${format(new Date(), "yyyyMMdd-HHmm")}.csv`;

    if (type === "production") {
      const records = db.getProductionRecords({ siteId });
      const headers = [
        "Nomor Catatan",
        "Tanggal",
        "Site",
        "Pit",
        "Shift",
        "Material",
        "Unit Alat",
        "Operator",
        "Tipe Pengukuran",
        "Ritase",
        "Bruto (Ton)",
        "Tara (Ton)",
        "Netto",
        "Satuan",
        "Estimasi",
        "Status",
        "Catatan",
      ];
      const rows = records.map((r) => [
        `"${r.recordNumber}"`,
        `"${r.date.slice(0, 10)}"`,
        `"${r.site?.name || r.siteId}"`,
        `"${r.pit?.name || r.pitId}"`,
        `"${r.shift?.name || r.shiftId}"`,
        `"${r.material?.name || r.materialId}"`,
        `"${r.equipment?.code || "-"}"`,
        `"${r.operator?.name || r.operatorId}"`,
        `"${r.measurementType}"`,
        r.ritaseCount,
        r.grossWeight ?? "",
        r.tareWeight ?? "",
        r.netWeight,
        `"${r.unit}"`,
        r.isEstimated ? "Ya" : "Tidak",
        `"${r.status}"`,
        `"${(r.notes || "").replace(/"/g, '""')}"`,
      ]);

      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    } else if (type === "downtime") {
      const downtimes = db.getDowntimeReports({ siteId });
      const headers = [
        "ID",
        "Alat Berat",
        "Site",
        "Waktu Mulai",
        "Waktu Selesai",
        "Durasi (Menit)",
        "Kategori",
        "Prioritas",
        "Deskripsi",
        "Tindakan",
        "Status",
      ];
      const rows = downtimes.map((d) => [
        `"${d.id}"`,
        `"${d.equipment?.code || d.equipmentId}"`,
        `"${d.site?.name || d.siteId}"`,
        `"${d.startTime}"`,
        `"${d.endTime || "-"}"`,
        d.durationMinutes ?? "",
        `"${d.category}"`,
        `"${d.priority}"`,
        `"${d.description.replace(/"/g, '""')}"`,
        `"${(d.actionTaken || "").replace(/"/g, '""')}"`,
        `"${d.status}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    } else if (type === "safety") {
      const incidents = db.getSafetyIncidents({ siteId });
      const headers = [
        "Nomor Laporan",
        "Waktu",
        "Site",
        "Lokasi",
        "Kategori",
        "Tingkat Keparahan",
        "Deskripsi",
        "Tindakan Awal",
        "Status",
      ];
      const rows = incidents.map((i) => [
        `"${i.incidentNumber}"`,
        `"${i.dateTime}"`,
        `"${i.site?.name || i.siteId}"`,
        `"${i.location.replace(/"/g, '""')}"`,
        `"${i.category}"`,
        `"${i.severity}"`,
        `"${i.description.replace(/"/g, '""')}"`,
        `"${i.initialAction.replace(/"/g, '""')}"`,
        `"${i.status}"`,
      ]);
      csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
    }

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
