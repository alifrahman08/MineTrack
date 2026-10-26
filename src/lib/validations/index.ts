import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const productionRecordSchema = z
  .object({
    date: z.string().min(1, "Tanggal operasional wajib diisi"),
    siteId: z.string().min(1, "Site tambang wajib dipilih"),
    pitId: z.string().min(1, "Pit/Area kerja wajib dipilih"),
    workBlockId: z.string().optional().nullable(),
    shiftId: z.string().min(1, "Shift kerja wajib dipilih"),
    materialId: z.string().min(1, "Jenis material wajib dipilih"),
    equipmentId: z.string().optional().nullable(),
    measurementType: z.enum(["WEIGHED", "RITASE"]),
    ritaseCount: z.coerce.number().int("Ritase harus berupa bilangan bulat").min(1, "Minimal 1 ritase"),
    grossWeight: z.coerce.number().min(0, "Berat bruto tidak boleh negatif").optional().nullable(),
    tareWeight: z.coerce.number().min(0, "Berat tara tidak boleh negatif").optional().nullable(),
    netWeight: z.coerce.number().min(0, "Berat bersih tidak boleh negatif"),
    unit: z.string().default("Ton"),
    isEstimated: z.boolean().default(false),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    photoUrl: z.string().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.measurementType === "WEIGHED") {
        if (data.grossWeight === undefined || data.grossWeight === null) return false;
        if (data.tareWeight === undefined || data.tareWeight === null) return false;
        return data.grossWeight >= data.tareWeight;
      }
      return true;
    },
    {
      message: "Berat bruto harus lebih besar atau sama dengan berat tara",
      path: ["grossWeight"],
    }
  );

export type ProductionRecordInput = z.infer<typeof productionRecordSchema>;

export const approvalActionSchema = z.object({
  action: z.enum(["APPROVE", "REJECT", "REQUEST_REVISION"]),
  reason: z.string().optional().nullable(),
}).refine(
  (data) => {
    if ((data.action === "REJECT" || data.action === "REQUEST_REVISION") && (!data.reason || data.reason.trim().length === 0)) {
      return false;
    }
    return true;
  },
  {
    message: "Alasan penolakan atau revisi wajib diisi",
    path: ["reason"],
  }
);

export const downtimeReportSchema = z.object({
  equipmentId: z.string().min(1, "Pilih alat berat"),
  siteId: z.string().min(1, "Pilih site"),
  shiftId: z.string().optional().nullable(),
  startTime: z.string().min(1, "Waktu mulai downtime wajib diisi"),
  endTime: z.string().optional().nullable(),
  category: z.enum(["MECHANICAL", "ELECTRICAL", "OPERATIONAL", "WAITING_MATERIAL", "WEATHER", "OTHER"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(5, "Deskripsi masalah minimal 5 karakter"),
  actionTaken: z.string().optional().nullable(),
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).default("OPEN"),
  photoUrl: z.string().optional().nullable(),
});

export type DowntimeReportInput = z.infer<typeof downtimeReportSchema>;

export const safetyIncidentSchema = z.object({
  dateTime: z.string().min(1, "Waktu kejadian wajib diisi"),
  siteId: z.string().min(1, "Pilih lokasi site"),
  location: z.string().min(2, "Lokasi spesifik/pit wajib diisi"),
  category: z.enum(["INCIDENT", "NEAR_MISS", "UNSAFE_CONDITION", "UNSAFE_ACTION", "INSPECTION_FINDING"]),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
  description: z.string().min(10, "Deskripsi kejadian minimal 10 karakter"),
  initialAction: z.string().min(5, "Tindakan awal penanganan wajib diisi"),
  assignedToId: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type SafetyIncidentInput = z.infer<typeof safetyIncidentSchema>;

export const dailyReportSchema = z.object({
  date: z.string().min(1, "Tanggal operasional wajib diisi"),
  siteId: z.string().min(1, "Site wajib dipilih"),
  shiftId: z.string().min(1, "Shift wajib dipilih"),
  summary: z.string().min(10, "Ringkasan kegiatan minimal 10 karakter"),
  actualProduction: z.coerce.number().min(0, "Produksi aktual tidak boleh negatif"),
  targetProduction: z.coerce.number().min(0, "Target produksi tidak boleh negatif"),
  weather: z.string().optional().nullable(),
  downtimeMinutes: z.coerce.number().min(0).default(0),
  safetyIssuesCount: z.coerce.number().min(0).default(0),
  operationalObstacles: z.string().optional().nullable(),
  followUpPlan: z.string().optional().nullable(),
  photoUrl: z.string().optional().nullable(),
});

export type DailyReportInput = z.infer<typeof dailyReportSchema>;

export const equipmentSchema = z.object({
  code: z.string().min(2, "Kode unit wajib diisi"),
  name: z.string().min(2, "Nama unit wajib diisi"),
  type: z.enum(["EXCAVATOR", "DUMP_TRUCK", "BULLDOZER", "WHEEL_LOADER", "GRADER", "OTHER"]),
  model: z.string().min(2, "Model alat wajib diisi"),
  siteId: z.string().min(1, "Pilih site"),
  status: z.enum(["AVAILABLE", "IN_USE", "MAINTENANCE", "BREAKDOWN", "INACTIVE"]).default("AVAILABLE"),
  operatingHours: z.coerce.number().min(0).default(0),
  conditionNotes: z.string().optional().nullable(),
  nextMaintenanceDate: z.string().optional().nullable(),
});

export type EquipmentInput = z.infer<typeof equipmentSchema>;

export const shiftAssignmentSchema = z.object({
  date: z.string().min(1, "Tanggal penugasan wajib diisi"),
  shiftId: z.string().min(1, "Pilih shift"),
  siteId: z.string().min(1, "Pilih site"),
  operatorId: z.string().min(1, "Pilih operator"),
  supervisorId: z.string().optional().nullable(),
  equipmentId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export type ShiftAssignmentInput = z.infer<typeof shiftAssignmentSchema>;
