import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import {
  UserProfile,
  SiteModel,
  PitModel,
  WorkBlockModel,
  MaterialModel,
  ShiftModel,
  EquipmentModel,
  ShiftAssignmentModel,
  DowntimeReportModel,
  ProductionTargetModel,
  ProductionRecordModel,
  ProductionStatusHistoryModel,
  DailyOperationalReportModel,
  SafetyIncidentModel,
  SafetyFollowUpModel,
  NotificationModel,
  AuditLogModel,
  ApprovalStatus,
  UserSession,
  Role,
  WeighbridgeTicketModel,
  PreventiveMaintenanceModel,
  ProductionReconciliationModel,
  OperationalAlertModel,
  DocumentStorageModel,
  OfflineSyncQueueItem,
} from "@/types";
import { getInitialSeedData } from "./initial-data";

interface DatabaseStore {
  users: (UserProfile & { passwordHash: string })[];
  sites: SiteModel[];
  pits: PitModel[];
  workBlocks: WorkBlockModel[];
  materials: MaterialModel[];
  shifts: ShiftModel[];
  shiftAssignments: ShiftAssignmentModel[];
  equipment: EquipmentModel[];
  productionTargets: ProductionTargetModel[];
  productionRecords: ProductionRecordModel[];
  downtimes: DowntimeReportModel[];
  dailyReports: DailyOperationalReportModel[];
  safetyIncidents: SafetyIncidentModel[];
  notifications: NotificationModel[];
  auditLogs: AuditLogModel[];
  weighbridgeTickets: WeighbridgeTicketModel[];
  preventiveMaintenances: PreventiveMaintenanceModel[];
  productionReconciliations: ProductionReconciliationModel[];
  operationalAlerts: OperationalAlertModel[];
  documentStorages: DocumentStorageModel[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "minetrack-db.json");

let memoryStore: DatabaseStore | null = null;

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadDatabase(): DatabaseStore {
  if (memoryStore) {
    if (!memoryStore.weighbridgeTickets) memoryStore.weighbridgeTickets = [];
    if (!memoryStore.preventiveMaintenances) memoryStore.preventiveMaintenances = [];
    if (!memoryStore.productionReconciliations) memoryStore.productionReconciliations = [];
    if (!memoryStore.operationalAlerts) memoryStore.operationalAlerts = [];
    if (!memoryStore.documentStorages) memoryStore.documentStorages = [];
    return memoryStore;
  }

  ensureDataDirectory();
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed: DatabaseStore = JSON.parse(raw);
      if (!parsed.weighbridgeTickets) parsed.weighbridgeTickets = [];
      if (!parsed.preventiveMaintenances) parsed.preventiveMaintenances = [];
      if (!parsed.productionReconciliations) parsed.productionReconciliations = [];
      if (!parsed.operationalAlerts) parsed.operationalAlerts = [];
      if (!parsed.documentStorages) parsed.documentStorages = [];
      memoryStore = parsed;
      return memoryStore;
    } catch {
      // Fallback if read fails
    }
  }

  // Initialize fresh from seed
  const initial = getInitialSeedData();
  const usersWithHash = initial.users.map((u) => ({
    ...u,
    passwordHash: initial.passwords.defaultHash,
  }));

  const newStore: DatabaseStore = {
    users: usersWithHash,
    sites: initial.sites,
    pits: initial.pits,
    workBlocks: initial.workBlocks,
    materials: initial.materials,
    shifts: initial.shifts,
    shiftAssignments: [],
    equipment: initial.equipment,
    productionTargets: initial.productionTargets,
    productionRecords: initial.productionRecords,
    downtimes: initial.downtimes,
    dailyReports: initial.dailyReports,
    safetyIncidents: initial.safetyIncidents,
    notifications: initial.notifications,
    auditLogs: initial.auditLogs,
    weighbridgeTickets: initial.weighbridgeTickets || [],
    preventiveMaintenances: initial.preventiveMaintenances || [],
    productionReconciliations: initial.productionReconciliations || [],
    operationalAlerts: initial.operationalAlerts || [],
    documentStorages: initial.documentStorages || [],
  };

  memoryStore = newStore;
  saveDatabase();
  return memoryStore;
}

function saveDatabase() {
  if (!memoryStore) return;
  ensureDataDirectory();
  fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), "utf-8");
}

export const db = {
  resetToSeed() {
    if (fs.existsSync(DB_FILE)) {
      fs.unlinkSync(DB_FILE);
    }
    memoryStore = null;
    return loadDatabase();
  },

  createAuditLog(action: string, entityType: string, entityId: string | null, details: string, user?: UserSession) {
    const store = loadDatabase();
    if (!store.auditLogs) store.auditLogs = [];
    const log: AuditLogModel = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: user?.id || null,
      userEmail: user?.email || null,
      action,
      entityType,
      entityId: entityId || null,
      details: typeof details === "string" ? details : JSON.stringify(details),
      ipAddress: "127.0.0.1",
      createdAt: new Date().toISOString(),
    };
    store.auditLogs.unshift(log);
    return log;
  },

  // USERS & AUTH
  findUserByEmail(email: string) {
    const store = loadDatabase();
    return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  },

  findUserById(id: string) {
    const store = loadDatabase();
    return store.users.find((u) => u.id === id);
  },

  getAllUsers(): UserProfile[] {
    const store = loadDatabase();
    return store.users.map(({ passwordHash: _, ...rest }) => rest);
  },

  createUser(data: Partial<UserProfile> & { password?: string }): UserProfile {
    const store = loadDatabase();
    const existing = store.users.find((u) => u.email.toLowerCase() === (data.email || "").toLowerCase());
    if (existing) {
      throw new Error(`Email ${data.email} sudah terdaftar.`);
    }

    const newUser: UserProfile & { passwordHash: string } = {
      id: `usr-${Date.now()}`,
      email: data.email || "",
      name: data.name || "",
      role: data.role || "OPERATOR",
      phone: data.phone || null,
      avatarUrl: data.avatarUrl || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      siteAccesses: data.siteAccesses || [],
      passwordHash: data.password ? bcrypt.hashSync(data.password, 10) : getInitialSeedData().passwords.defaultHash,
    };

    store.users.push(newUser);
    saveDatabase();
    const { passwordHash: _, ...safeUser } = newUser;
    return safeUser;
  },

  updateUser(id: string, data: Partial<UserProfile> & { password?: string }): UserProfile {
    const store = loadDatabase();
    const idx = store.users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error("Pengguna tidak ditemukan");

    if (data.password) {
      store.users[idx].passwordHash = bcrypt.hashSync(data.password, 10);
    }
    if (data.name !== undefined) store.users[idx].name = data.name;
    if (data.role !== undefined) store.users[idx].role = data.role;
    if (data.phone !== undefined) store.users[idx].phone = data.phone;
    if (data.avatarUrl !== undefined) store.users[idx].avatarUrl = data.avatarUrl;
    if (data.isActive !== undefined) store.users[idx].isActive = data.isActive;
    if (data.siteAccesses !== undefined) store.users[idx].siteAccesses = data.siteAccesses;
    store.users[idx].updatedAt = new Date().toISOString();

    saveDatabase();
    const { passwordHash: _, ...safeUser } = store.users[idx];
    return safeUser;
  },

  // SITES & PITS
  getAllSites(onlyActive = false): SiteModel[] {
    const store = loadDatabase();
    return store.sites
      .filter((s) => !onlyActive || s.isActive)
      .map((s) => ({
        ...s,
        pits: store.pits.filter((p) => p.siteId === s.id && (!onlyActive || p.isActive)),
      }));
  },

  getSiteById(id: string): SiteModel | undefined {
    const store = loadDatabase();
    const site = store.sites.find((s) => s.id === id);
    if (!site) return undefined;
    return {
      ...site,
      pits: store.pits.filter((p) => p.siteId === site.id),
    };
  },

  createSite(data: Partial<SiteModel>): SiteModel {
    const store = loadDatabase();
    const newSite: SiteModel = {
      id: `site-${Date.now()}`,
      code: (data.code || `SITE-${Date.now().toString().slice(-4)}`).toUpperCase(),
      name: data.name || "Site Baru",
      location: data.location || "",
      description: data.description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.sites.push(newSite);
    saveDatabase();
    return newSite;
  },

  getAllPits(siteId?: string): PitModel[] {
    const store = loadDatabase();
    let pits = store.pits;
    if (siteId) {
      pits = pits.filter((p) => p.siteId === siteId);
    }
    return pits.map((p) => ({
      ...p,
      siteName: store.sites.find((s) => s.id === p.siteId)?.name,
    }));
  },

  createPit(data: { siteId: string; code: string; name: string }): PitModel {
    const store = loadDatabase();
    const newPit: PitModel = {
      id: `pit-${Date.now()}`,
      siteId: data.siteId,
      code: data.code.toUpperCase(),
      name: data.name,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.pits.push(newPit);
    saveDatabase();
    return newPit;
  },

  getAllWorkBlocks(pitId?: string): WorkBlockModel[] {
    const store = loadDatabase();
    let blocks = store.workBlocks;
    if (pitId) {
      blocks = blocks.filter((b) => b.pitId === pitId);
    }
    return blocks.map((b) => ({
      ...b,
      pitName: store.pits.find((p) => p.id === b.pitId)?.name,
      siteName: store.sites.find((s) => s.id === b.siteId)?.name,
    }));
  },

  // MATERIALS
  getAllMaterials(onlyActive = true): MaterialModel[] {
    const store = loadDatabase();
    return store.materials.filter((m) => !onlyActive || m.isActive);
  },

  createMaterial(data: Partial<MaterialModel>): MaterialModel {
    const store = loadDatabase();
    const newMat: MaterialModel = {
      id: `mat-${Date.now()}`,
      code: (data.code || "MAT").toUpperCase(),
      name: data.name || "Material",
      unit: data.unit || "Ton",
      density: data.density || 1.0,
      description: data.description || "",
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.materials.push(newMat);
    saveDatabase();
    return newMat;
  },

  // SHIFTS & ASSIGNMENTS
  getAllShifts(onlyActive = true): ShiftModel[] {
    const store = loadDatabase();
    return store.shifts.filter((s) => !onlyActive || s.isActive);
  },

  getShiftAssignments(filters?: { date?: string; siteId?: string; shiftId?: string; operatorId?: string }): ShiftAssignmentModel[] {
    const store = loadDatabase();
    let items = store.shiftAssignments;
    if (filters?.date) {
      const datePrefix = filters.date.slice(0, 10);
      items = items.filter((a) => a.date.startsWith(datePrefix));
    }
    if (filters?.siteId) items = items.filter((a) => a.siteId === filters.siteId);
    if (filters?.shiftId) items = items.filter((a) => a.shiftId === filters.shiftId);
    if (filters?.operatorId) items = items.filter((a) => a.operatorId === filters.operatorId);

    return items.map((a) => ({
      ...a,
      shift: store.shifts.find((s) => s.id === a.shiftId),
      site: store.sites.find((s) => s.id === a.siteId),
      operator: store.users.find((u) => u.id === a.operatorId),
      supervisor: store.users.find((u) => u.id === a.supervisorId),
      equipment: store.equipment.find((e) => e.id === a.equipmentId),
    }));
  },

  createShiftAssignment(data: {
    date: string;
    shiftId: string;
    siteId: string;
    operatorId: string;
    supervisorId?: string | null;
    equipmentId?: string | null;
    notes?: string | null;
  }): ShiftAssignmentModel {
    const store = loadDatabase();
    const datePrefix = data.date.slice(0, 10);

    // Rule: Detect conflict for Operator on the same date and shift
    const operatorConflict = store.shiftAssignments.find(
      (a) => a.date.startsWith(datePrefix) && a.shiftId === data.shiftId && a.operatorId === data.operatorId
    );
    if (operatorConflict) {
      throw new Error("Operator ini sudah memiliki penugasan pada shift dan tanggal yang sama.");
    }

    // Rule: Detect conflict for Equipment on the same date and shift
    if (data.equipmentId) {
      const eqConflict = store.shiftAssignments.find(
        (a) => a.date.startsWith(datePrefix) && a.shiftId === data.shiftId && a.equipmentId === data.equipmentId
      );
      if (eqConflict) {
        throw new Error("Alat berat ini sudah ditugaskan ke pekerjaan lain pada shift yang sama.");
      }
    }

    const newAssignment: ShiftAssignmentModel = {
      id: `asg-${Date.now()}`,
      date: data.date,
      shiftId: data.shiftId,
      siteId: data.siteId,
      operatorId: data.operatorId,
      supervisorId: data.supervisorId || null,
      equipmentId: data.equipmentId || null,
      status: "SCHEDULED",
      notes: data.notes || null,
    };

    store.shiftAssignments.push(newAssignment);
    saveDatabase();
    return newAssignment;
  },

  deleteShiftAssignment(id: string) {
    const store = loadDatabase();
    store.shiftAssignments = store.shiftAssignments.filter((a) => a.id !== id);
    saveDatabase();
    return true;
  },

  // EQUIPMENT
  getAllEquipment(filters?: { siteId?: string; type?: string; status?: string }): EquipmentModel[] {
    const store = loadDatabase();
    let eq = store.equipment;
    if (filters?.siteId) eq = eq.filter((e) => e.siteId === filters.siteId);
    if (filters?.type) eq = eq.filter((e) => e.type === filters.type);
    if (filters?.status) eq = eq.filter((e) => e.status === filters.status);

    return eq.map((e) => ({
      ...e,
      siteName: store.sites.find((s) => s.id === e.siteId)?.name,
    }));
  },

  getEquipmentById(id: string): EquipmentModel | undefined {
    const store = loadDatabase();
    const e = store.equipment.find((item) => item.id === id);
    if (!e) return undefined;
    return {
      ...e,
      siteName: store.sites.find((s) => s.id === e.siteId)?.name,
    };
  },

  createEquipment(data: Partial<EquipmentModel>): EquipmentModel {
    const store = loadDatabase();
    const existing = store.equipment.find((e) => e.code.toUpperCase() === (data.code || "").toUpperCase());
    if (existing) {
      throw new Error(`Kode unit alat ${data.code} sudah digunakan.`);
    }

    const newEq: EquipmentModel = {
      id: `eq-${Date.now()}`,
      code: (data.code || `EQ-${Date.now()}`).toUpperCase(),
      name: data.name || "Unit Baru",
      type: data.type || "OTHER",
      model: data.model || "",
      siteId: data.siteId || "",
      status: data.status || "AVAILABLE",
      operatingHours: data.operatingHours || 0,
      conditionNotes: data.conditionNotes || null,
      nextMaintenanceDate: data.nextMaintenanceDate || null,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.equipment.push(newEq);
    saveDatabase();
    return newEq;
  },

  canEquipmentBeAvailable(equipmentId: string, currentDowntimeIdToExclude?: string): { canBeAvailable: boolean; reasons: string[] } {
    const store = loadDatabase();
    const reasons: string[] = [];

    // 1. Check if there are other active open or in_progress downtime reports
    const otherActiveDowntimes = store.downtimes.filter(
      (d) => d.equipmentId === equipmentId && d.id !== currentDowntimeIdToExclude && (d.status === "OPEN" || d.status === "IN_PROGRESS")
    );
    if (otherActiveDowntimes.length > 0) {
      reasons.push(`Masih terdapat ${otherActiveDowntimes.length} laporan downtime aktif pada unit ini.`);
    }

    // 2. Check if unit is in active preventive maintenance
    const activePM = (store.preventiveMaintenances || []).filter(
      (pm) => pm.equipmentId === equipmentId && (pm.status === "IN_PROGRESS" || pm.status === "SCHEDULED")
    );
    if (activePM.length > 0) {
      reasons.push(`Unit sedang dalam penanganan preventive maintenance (${activePM[0].title}).`);
    }

    // 3. Check if unit is currently assigned to an ongoing shift
    const todayStr = new Date().toISOString().slice(0, 10);
    const activeShift = (store.shiftAssignments || []).filter(
      (s) => s.equipmentId === equipmentId && s.date.slice(0, 10) === todayStr && s.status === "SCHEDULED"
    );
    if (activeShift.length > 0) {
      reasons.push(`Unit saat ini sedang ditugaskan pada shift yang sedang berjalan.`);
    }

    return {
      canBeAvailable: reasons.length === 0,
      reasons,
    };
  },

  updateEquipment(id: string, data: Partial<EquipmentModel>): EquipmentModel {
    const store = loadDatabase();
    const idx = store.equipment.findIndex((e) => e.id === id);
    if (idx === -1) throw new Error("Unit alat berat tidak ditemukan");

    if (data.status === "AVAILABLE") {
      const check = this.canEquipmentBeAvailable(id);
      if (!check.canBeAvailable) {
        throw new Error(`Unit tidak dapat diubah ke AVAILABLE: ${check.reasons.join(", ")}`);
      }
    }

    store.equipment[idx] = {
      ...store.equipment[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    saveDatabase();
    return store.equipment[idx];
  },

  // DOWNTIME
  getDowntimeReports(filters?: { siteId?: string; equipmentId?: string; status?: string }): DowntimeReportModel[] {
    const store = loadDatabase();
    let reports = store.downtimes;
    if (filters?.siteId) reports = reports.filter((r) => r.siteId === filters.siteId);
    if (filters?.equipmentId) reports = reports.filter((r) => r.equipmentId === filters.equipmentId);
    if (filters?.status) reports = reports.filter((r) => r.status === filters.status);

    return reports.map((r) => {
      let durationMinutes = r.durationMinutes;
      if (!durationMinutes) {
        const start = new Date(r.startTime).getTime();
        const end = r.endTime ? new Date(r.endTime).getTime() : Date.now();
        durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
      }
      return {
        ...r,
        durationMinutes,
        equipment: store.equipment.find((e) => e.id === r.equipmentId),
        site: store.sites.find((s) => s.id === r.siteId),
        reportedBy: store.users.find((u) => u.id === r.reportedById),
        handledBy: store.users.find((u) => u.id === r.handledById),
      };
    });
  },

  createDowntimeReport(data: {
    equipmentId: string;
    siteId: string;
    shiftId?: string | null;
    reportedById: string;
    startTime: string;
    endTime?: string | null;
    category: DowntimeReportModel["category"];
    priority: DowntimeReportModel["priority"];
    description: string;
    actionTaken?: string | null;
    photoUrl?: string | null;
  }): DowntimeReportModel {
    const store = loadDatabase();
    let durationMinutes: number | null = null;
    if (data.endTime) {
      const start = new Date(data.startTime).getTime();
      const end = new Date(data.endTime).getTime();
      durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
    }

    const newReport: DowntimeReportModel = {
      id: `dt-${Date.now()}`,
      equipmentId: data.equipmentId,
      siteId: data.siteId,
      shiftId: data.shiftId || null,
      reportedById: data.reportedById,
      handledById: null,
      startTime: data.startTime,
      endTime: data.endTime || null,
      durationMinutes,
      category: data.category,
      priority: data.priority,
      description: data.description,
      actionTaken: data.actionTaken || null,
      status: "OPEN",
      photoUrl: data.photoUrl || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.downtimes.unshift(newReport);

    // Business rule: automatically update equipment status to BREAKDOWN or MAINTENANCE
    const eqIdx = store.equipment.findIndex((e) => e.id === data.equipmentId);
    if (eqIdx !== -1) {
      store.equipment[eqIdx].status = data.category === "MECHANICAL" || data.category === "ELECTRICAL" ? "BREAKDOWN" : "MAINTENANCE";
      store.equipment[eqIdx].updatedAt = new Date().toISOString();
    }

    // Create notification for site supervisors
    const supervisors = store.users.filter((u) => u.role === "SUPERVISOR");
    const eq = store.equipment.find((e) => e.id === data.equipmentId);
    supervisors.forEach((spv) => {
      store.notifications.unshift({
        id: `notif-${Date.now()}-${spv.id}`,
        userId: spv.id,
        title: `Laporan Downtime: ${eq?.code || "Alat Berat"}`,
        message: `Downtime ${data.category} dilaporkan untuk unit ${eq?.code} (${data.description.slice(0, 50)}...).`,
        type: "DOWNTIME",
        link: "/supervisor/equipment",
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    saveDatabase();
    return newReport;
  },

  updateDowntimeReport(id: string, data: Partial<DowntimeReportModel>, actorId: string): DowntimeReportModel {
    const store = loadDatabase();
    const idx = store.downtimes.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Laporan downtime tidak ditemukan");

    const current = store.downtimes[idx];
    const endTime = data.endTime !== undefined ? data.endTime : current.endTime;
    let durationMinutes = current.durationMinutes;

    if (endTime) {
      const start = new Date(current.startTime).getTime();
      const end = new Date(endTime).getTime();
      durationMinutes = Math.max(0, Math.round((end - start) / (1000 * 60)));
    }

    store.downtimes[idx] = {
      ...current,
      ...data,
      endTime,
      durationMinutes,
      handledById: actorId,
      updatedAt: new Date().toISOString(),
    };

    // If resolved, check if equipment can be set back to AVAILABLE
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      const eqIdx = store.equipment.findIndex((e) => e.id === current.equipmentId);
      if (eqIdx !== -1) {
        const check = this.canEquipmentBeAvailable(current.equipmentId, id);
        if (check.canBeAvailable) {
          store.equipment[eqIdx].status = "AVAILABLE";
        } else {
          // If PM is active, set to MAINTENANCE, else keep BREAKDOWN
          const hasPM = (store.preventiveMaintenances || []).some(
            (pm) => pm.equipmentId === current.equipmentId && (pm.status === "IN_PROGRESS" || pm.status === "SCHEDULED")
          );
          store.equipment[eqIdx].status = hasPM ? "MAINTENANCE" : "BREAKDOWN";
        }
        store.equipment[eqIdx].updatedAt = new Date().toISOString();
      }
    }

    saveDatabase();
    return store.downtimes[idx];
  },

  // TARGETS
  getProductionTargets(siteId?: string): ProductionTargetModel[] {
    const store = loadDatabase();
    let targets = store.productionTargets;
    if (siteId) targets = targets.filter((t) => t.siteId === siteId);
    return targets.map((t) => ({
      ...t,
      siteName: store.sites.find((s) => s.id === t.siteId)?.name,
      materialName: store.materials.find((m) => m.id === t.materialId)?.name,
    }));
  },

  createProductionTarget(data: {
    siteId: string;
    materialId: string;
    periodType: "DAILY" | "MONTHLY" | "SHIFT";
    startDate: string;
    endDate: string;
    shiftId?: string | null;
    targetAmount: number;
    unit?: string;
  }): ProductionTargetModel {
    const store = loadDatabase();
    const mat = store.materials.find((m) => m.id === data.materialId);
    const newTarget: ProductionTargetModel = {
      id: `tgt-${Date.now()}`,
      siteId: data.siteId,
      materialId: data.materialId,
      periodType: data.periodType,
      startDate: data.startDate,
      endDate: data.endDate,
      shiftId: data.shiftId || null,
      targetAmount: data.targetAmount,
      unit: data.unit || mat?.unit || "Ton",
      siteName: store.sites.find((s) => s.id === data.siteId)?.name,
      materialName: mat?.name,
    };
    store.productionTargets.push(newTarget);
    saveDatabase();
    return newTarget;
  },

  // PRODUCTION RECORDS & WORKFLOW
  getProductionRecords(filters?: {
    search?: string;
    siteId?: string;
    pitId?: string;
    shiftId?: string;
    materialId?: string;
    operatorId?: string;
    status?: ApprovalStatus;
    startDate?: string;
    endDate?: string;
  }): ProductionRecordModel[] {
    const store = loadDatabase();
    let items = store.productionRecords;

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      items = items.filter(
        (r) =>
          r.recordNumber.toLowerCase().includes(q) ||
          (r.notes && r.notes.toLowerCase().includes(q))
      );
    }
    if (filters?.siteId) items = items.filter((r) => r.siteId === filters.siteId);
    if (filters?.pitId) items = items.filter((r) => r.pitId === filters.pitId);
    if (filters?.shiftId) items = items.filter((r) => r.shiftId === filters.shiftId);
    if (filters?.materialId) items = items.filter((r) => r.materialId === filters.materialId);
    if (filters?.operatorId) items = items.filter((r) => r.operatorId === filters.operatorId);
    if (filters?.status) items = items.filter((r) => r.status === filters.status);
    if (filters?.startDate) {
      items = items.filter((r) => r.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      items = items.filter((r) => r.date <= filters.endDate!);
    }

    return items.map((r) => ({
      ...r,
      site: store.sites.find((s) => s.id === r.siteId),
      pit: store.pits.find((p) => p.id === r.pitId),
      workBlock: store.workBlocks.find((b) => b.id === r.workBlockId),
      shift: store.shifts.find((s) => s.id === r.shiftId),
      material: store.materials.find((m) => m.id === r.materialId),
      equipment: store.equipment.find((e) => e.id === r.equipmentId),
      operator: store.users.find((u) => u.id === r.operatorId),
      reviewedBy: store.users.find((u) => u.id === r.reviewedById),
    }));
  },

  getProductionRecordById(id: string): ProductionRecordModel | undefined {
    const store = loadDatabase();
    const r = store.productionRecords.find((rec) => rec.id === id);
    if (!r) return undefined;
    return {
      ...r,
      site: store.sites.find((s) => s.id === r.siteId),
      pit: store.pits.find((p) => p.id === r.pitId),
      workBlock: store.workBlocks.find((b) => b.id === r.workBlockId),
      shift: store.shifts.find((s) => s.id === r.shiftId),
      material: store.materials.find((m) => m.id === r.materialId),
      equipment: store.equipment.find((e) => e.id === r.equipmentId),
      operator: store.users.find((u) => u.id === r.operatorId),
      reviewedBy: store.users.find((u) => u.id === r.reviewedById),
    };
  },

  createProductionRecord(
    data: {
      date: string;
      siteId: string;
      pitId: string;
      workBlockId?: string | null;
      shiftId: string;
      materialId: string;
      equipmentId?: string | null;
      measurementType: "WEIGHED" | "RITASE";
      ritaseCount: number;
      grossWeight?: number | null;
      tareWeight?: number | null;
      netWeight: number;
      unit?: string;
      isEstimated?: boolean;
      startTime?: string | null;
      endTime?: string | null;
      notes?: string | null;
      photoUrl?: string | null;
      status?: ApprovalStatus;
      weighbridgeTicketId?: string | null;
      truckPlateNumber?: string | null;
      destination?: string | null;
      idempotencyKey?: string | null;
      syncStatus?: 'SYNCED' | 'PENDING_SYNC' | 'CONFLICT';
      weighmasterName?: string | null;
    },
    user: UserSession
  ): ProductionRecordModel {
    const store = loadDatabase();

    // Idempotency check: prevent duplicate transactions
    if (data.idempotencyKey) {
      const existing = store.productionRecords.find((r) => r.idempotencyKey === data.idempotencyKey);
      if (existing) {
        return existing;
      }
    }

    // Validation: if weighed, gross must be >= tare and net = gross - tare
    let netWeight = data.netWeight;
    let isEstimated = data.isEstimated || false;

    if (data.measurementType === "WEIGHED") {
      if (data.grossWeight === undefined || data.grossWeight === null || data.tareWeight === undefined || data.tareWeight === null) {
        throw new Error("Pencatatan timbang memerlukan data Berat Bruto dan Berat Tara.");
      }
      if (data.grossWeight < data.tareWeight) {
        throw new Error("Berat bruto harus lebih besar atau sama dengan berat tara.");
      }
      netWeight = Number((data.grossWeight - data.tareWeight).toFixed(2));
      isEstimated = false;
    } else {
      isEstimated = true;
    }

    if (netWeight < 0) {
      throw new Error("Berat bersih tidak boleh negatif.");
    }

    // Auto-generate record number PROD-YYYYMMDD-XXXX
    const dateStr = data.date.slice(0, 10).replace(/-/g, "");
    const countToday = store.productionRecords.filter((r) => r.recordNumber.startsWith(`PROD-${dateStr}`)).length;
    const recordNumber = `PROD-${dateStr}-${(countToday + 1).toString().padStart(4, "0")}`;

    const newRecordId = `rec-${Date.now()}`;
    const newRecord: ProductionRecordModel = {
      id: newRecordId,
      recordNumber,
      date: data.date,
      siteId: data.siteId,
      pitId: data.pitId,
      workBlockId: data.workBlockId || null,
      shiftId: data.shiftId,
      materialId: data.materialId,
      equipmentId: data.equipmentId || null,
      operatorId: user.id,
      measurementType: data.measurementType,
      ritaseCount: data.ritaseCount,
      grossWeight: data.grossWeight || null,
      tareWeight: data.tareWeight || null,
      netWeight,
      unit: data.unit || "Ton",
      isEstimated,
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      notes: data.notes || null,
      photoUrl: data.photoUrl || null,
      weighbridgeTicketId: data.weighbridgeTicketId || null,
      truckPlateNumber: data.truckPlateNumber || null,
      destination: data.destination || null,
      idempotencyKey: data.idempotencyKey || null,
      syncStatus: data.syncStatus || 'SYNCED',
      weighmasterName: data.weighmasterName || null,
      status: data.status || "DRAFT",
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistories: [
        {
          id: `hist-${Date.now()}`,
          productionRecordId: `rec-${Date.now()}`,
          changedById: user.id,
          changedByName: user.name,
          previousStatus: "DRAFT",
          newStatus: data.status || "DRAFT",
          reason: "Pembuatan catatan awal",
          createdAt: new Date().toISOString(),
        },
      ],
    };

    store.productionRecords.unshift(newRecord);

    // Audit log
    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: "CREATE",
      entityType: "PRODUCTION",
      entityId: newRecord.id,
      details: JSON.stringify({ recordNumber, netWeight, unit: newRecord.unit, status: newRecord.status }),
      createdAt: new Date().toISOString(),
    });

    // Notify supervisors if directly submitted
    if (newRecord.status === "SUBMITTED") {
      const supervisors = store.users.filter((u) => u.role === "SUPERVISOR");
      supervisors.forEach((spv) => {
        store.notifications.unshift({
          id: `notif-${Date.now()}-${spv.id}`,
          userId: spv.id,
          title: "Catatan Produksi Baru Menunggu Review",
          message: `Operator ${user.name} mengirim catatan ${recordNumber} (${netWeight} ${newRecord.unit}) untuk ditinjau.`,
          type: "APPROVAL",
          link: `/supervisor/production`,
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });
    }

    saveDatabase();
    return newRecord;
  },

  updateProductionRecord(
    id: string,
    data: Partial<ProductionRecordModel>,
    user: UserSession
  ): ProductionRecordModel {
    const store = loadDatabase();
    const idx = store.productionRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Catatan produksi tidak ditemukan");

    const current = store.productionRecords[idx];

    // Business rule: Operator can only edit their own records if status is DRAFT or NEEDS_REVISION
    if (user.role === "OPERATOR") {
      if (current.operatorId !== user.id) {
        throw new Error("Anda tidak memiliki izin mengubah catatan milik operator lain.");
      }
      if (current.status !== "DRAFT" && current.status !== "NEEDS_REVISION") {
        throw new Error("Catatan yang sudah diajukan atau disetujui tidak dapat diubah langsung.");
      }
    }

    let netWeight = data.netWeight !== undefined ? data.netWeight : current.netWeight;
    const measurementType = data.measurementType || current.measurementType;
    const grossWeight = data.grossWeight !== undefined ? data.grossWeight : current.grossWeight;
    const tareWeight = data.tareWeight !== undefined ? data.tareWeight : current.tareWeight;

    if (measurementType === "WEIGHED" && grossWeight !== null && tareWeight !== null && grossWeight !== undefined && tareWeight !== undefined) {
      if (grossWeight < tareWeight) {
        throw new Error("Berat bruto harus lebih besar atau sama dengan berat tara.");
      }
      netWeight = Number((grossWeight - tareWeight).toFixed(2));
    }

    store.productionRecords[idx] = {
      ...current,
      ...data,
      grossWeight,
      tareWeight,
      netWeight,
      updatedAt: new Date().toISOString(),
    };

    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: "UPDATE",
      entityType: "PRODUCTION",
      entityId: id,
      details: JSON.stringify({ recordNumber: current.recordNumber, updatedFields: Object.keys(data) }),
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    return store.productionRecords[idx];
  },

  submitProductionRecord(id: string, user: UserSession): ProductionRecordModel {
    const store = loadDatabase();
    const idx = store.productionRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Catatan produksi tidak ditemukan");

    const current = store.productionRecords[idx];
    if (user.role === "OPERATOR" && current.operatorId !== user.id) {
      throw new Error("Anda hanya dapat mengajukan catatan milik Anda sendiri.");
    }
    if (current.status !== "DRAFT" && current.status !== "NEEDS_REVISION") {
      throw new Error("Hanya catatan berstatus Draft atau Perlu Revisi yang dapat diajukan.");
    }

    const previousStatus = current.status;
    const newStatus: ApprovalStatus = "SUBMITTED";

    store.productionRecords[idx].status = newStatus;
    store.productionRecords[idx].updatedAt = new Date().toISOString();

    const histories = store.productionRecords[idx].statusHistories || [];
    histories.push({
      id: `hist-${Date.now()}`,
      productionRecordId: id,
      changedById: user.id,
      changedByName: user.name,
      previousStatus,
      newStatus,
      reason: "Diajukan oleh operator untuk review",
      createdAt: new Date().toISOString(),
    });
    store.productionRecords[idx].statusHistories = histories;

    // Notify supervisors
    const supervisors = store.users.filter((u) => u.role === "SUPERVISOR");
    supervisors.forEach((spv) => {
      store.notifications.unshift({
        id: `notif-${Date.now()}-${spv.id}`,
        userId: spv.id,
        title: "Catatan Produksi Baru Menunggu Review",
        message: `Operator ${user.name} mengajukan catatan ${current.recordNumber} (${current.netWeight} ${current.unit}).`,
        type: "APPROVAL",
        link: `/supervisor/production`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });

    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: "SUBMIT",
      entityType: "PRODUCTION",
      entityId: id,
      details: JSON.stringify({ recordNumber: current.recordNumber, previousStatus, newStatus }),
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    return store.productionRecords[idx];
  },

  reviewProductionRecord(
    id: string,
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION",
    reason: string | null | undefined,
    user: UserSession
  ): ProductionRecordModel {
    const store = loadDatabase();
    const idx = store.productionRecords.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Catatan produksi tidak ditemukan");

    if (user.role !== "SUPERVISOR" && user.role !== "ADMINISTRATOR") {
      throw new Error("Hanya Supervisor atau Administrator yang berwenang menyetujui catatan produksi.");
    }

    const current = store.productionRecords[idx];
    const previousStatus = current.status;
    let newStatus: ApprovalStatus = "APPROVED";

    if (action === "APPROVE") {
      newStatus = "APPROVED";
    } else if (action === "REJECT") {
      newStatus = "REJECTED";
      if (!reason || reason.trim().length === 0) throw new Error("Alasan penolakan wajib diisi.");
    } else if (action === "REQUEST_REVISION") {
      newStatus = "NEEDS_REVISION";
      if (!reason || reason.trim().length === 0) throw new Error("Alasan permintaan revisi wajib diisi.");
    }

    store.productionRecords[idx].status = newStatus;
    store.productionRecords[idx].rejectionReason = reason || null;
    store.productionRecords[idx].reviewedById = user.id;
    store.productionRecords[idx].reviewedAt = new Date().toISOString();
    store.productionRecords[idx].updatedAt = new Date().toISOString();

    const histories = store.productionRecords[idx].statusHistories || [];
    histories.push({
      id: `hist-${Date.now()}`,
      productionRecordId: id,
      changedById: user.id,
      changedByName: user.name,
      previousStatus,
      newStatus,
      reason: reason || (action === "APPROVE" ? "Disetujui oleh supervisor" : ""),
      createdAt: new Date().toISOString(),
    });
    store.productionRecords[idx].statusHistories = histories;

    // Send in-app notification to the operator
    const operator = store.users.find((u) => u.id === current.operatorId);
    if (operator) {
      let notifTitle = "";
      let notifMsg = "";
      let notifType = "INFO";

      if (newStatus === "APPROVED") {
        notifTitle = "Catatan Produksi Disetujui";
        notifMsg = `Catatan ${current.recordNumber} telah disetujui oleh ${user.name}.`;
        notifType = "APPROVAL";
      } else if (newStatus === "NEEDS_REVISION") {
        notifTitle = "Permintaan Revisi Catatan Produksi";
        notifMsg = `Catatan ${current.recordNumber} dikembalikan: "${reason}". Silakan perbaiki dan ajukan ulang.`;
        notifType = "REVISION";
      } else {
        notifTitle = "Catatan Produksi Ditolak";
        notifMsg = `Catatan ${current.recordNumber} ditolak: "${reason}".`;
        notifType = "REJECT";
      }

      store.notifications.unshift({
        id: `notif-${Date.now()}-${operator.id}`,
        userId: operator.id,
        title: notifTitle,
        message: notifMsg,
        type: notifType,
        link: `/operator/production`,
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    store.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      userId: user.id,
      userEmail: user.email,
      action: action,
      entityType: "PRODUCTION",
      entityId: id,
      details: JSON.stringify({ recordNumber: current.recordNumber, previousStatus, newStatus, reason }),
      createdAt: new Date().toISOString(),
    });

    saveDatabase();
    return store.productionRecords[idx];
  },

  // DAILY OPERATIONAL REPORTS
  getDailyReports(filters?: { siteId?: string; shiftId?: string; status?: ApprovalStatus; date?: string }): DailyOperationalReportModel[] {
    const store = loadDatabase();
    let reports = store.dailyReports;
    if (filters?.siteId) reports = reports.filter((r) => r.siteId === filters.siteId);
    if (filters?.shiftId) reports = reports.filter((r) => r.shiftId === filters.shiftId);
    if (filters?.status) reports = reports.filter((r) => r.status === filters.status);
    if (filters?.date) {
      const d = filters.date.slice(0, 10);
      reports = reports.filter((r) => r.date.startsWith(d));
    }

    return reports.map((r) => ({
      ...r,
      site: store.sites.find((s) => s.id === r.siteId),
      shift: store.shifts.find((s) => s.id === r.shiftId),
      createdBy: store.users.find((u) => u.id === r.createdById),
      approvedBy: store.users.find((u) => u.id === r.approvedById),
    }));
  },

  createDailyReport(
    data: {
      date: string;
      siteId: string;
      shiftId: string;
      summary: string;
      actualProduction: number;
      targetProduction: number;
      weather?: string | null;
      downtimeMinutes?: number;
      safetyIssuesCount?: number;
      operationalObstacles?: string | null;
      followUpPlan?: string | null;
      photoUrl?: string | null;
    },
    user: UserSession
  ): DailyOperationalReportModel {
    const store = loadDatabase();
    const dateStr = data.date.slice(0, 10).replace(/-/g, "");
    const count = store.dailyReports.length;
    const reportNumber = `LOH-${dateStr}-${(count + 1).toString().padStart(2, "0")}`;

    const newReport: DailyOperationalReportModel = {
      id: `dor-${Date.now()}`,
      reportNumber,
      date: data.date,
      siteId: data.siteId,
      shiftId: data.shiftId,
      createdById: user.id,
      approvedById: null,
      summary: data.summary,
      actualProduction: data.actualProduction,
      targetProduction: data.targetProduction,
      weather: data.weather || "CERAH",
      downtimeMinutes: data.downtimeMinutes || 0,
      safetyIssuesCount: data.safetyIssuesCount || 0,
      operationalObstacles: data.operationalObstacles || null,
      followUpPlan: data.followUpPlan || null,
      photoUrl: data.photoUrl || null,
      status: "SUBMITTED",
      rejectionReason: null,
      approvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.dailyReports.unshift(newReport);
    saveDatabase();
    return newReport;
  },

  reviewDailyReport(
    id: string,
    action: "APPROVE" | "REJECT" | "REQUEST_REVISION",
    reason: string | null | undefined,
    user: UserSession
  ): DailyOperationalReportModel {
    const store = loadDatabase();
    const idx = store.dailyReports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Laporan harian tidak ditemukan");

    if (user.role !== "SUPERVISOR" && user.role !== "ADMINISTRATOR") {
      throw new Error("Hanya Supervisor atau Administrator yang dapat menyetujui Laporan Operasional Harian.");
    }

    const current = store.dailyReports[idx];
    let newStatus: ApprovalStatus = "APPROVED";
    if (action === "REJECT") newStatus = "REJECTED";
    if (action === "REQUEST_REVISION") newStatus = "NEEDS_REVISION";

    store.dailyReports[idx].status = newStatus;
    store.dailyReports[idx].rejectionReason = reason || null;
    store.dailyReports[idx].approvedById = user.id;
    store.dailyReports[idx].approvedAt = new Date().toISOString();
    store.dailyReports[idx].updatedAt = new Date().toISOString();

    saveDatabase();
    return store.dailyReports[idx];
  },

  // SAFETY INCIDENTS
  getSafetyIncidents(filters?: { siteId?: string; severity?: string; status?: string }): SafetyIncidentModel[] {
    const store = loadDatabase();
    let incidents = store.safetyIncidents;
    if (filters?.siteId) incidents = incidents.filter((i) => i.siteId === filters.siteId);
    if (filters?.severity) incidents = incidents.filter((i) => i.severity === filters.severity);
    if (filters?.status) incidents = incidents.filter((i) => i.status === filters.status);

    return incidents.map((i) => ({
      ...i,
      site: store.sites.find((s) => s.id === i.siteId),
      reportedBy: store.users.find((u) => u.id === i.reportedById),
      assignedTo: store.users.find((u) => u.id === i.assignedToId),
    }));
  },

  createSafetyIncident(
    data: {
      dateTime: string;
      siteId: string;
      location: string;
      category: SafetyIncidentModel["category"];
      severity: SafetyIncidentModel["severity"];
      description: string;
      initialAction: string;
      assignedToId?: string | null;
      photoUrl?: string | null;
    },
    user: UserSession
  ): SafetyIncidentModel {
    const store = loadDatabase();
    const dateStr = data.dateTime.slice(0, 10).replace(/-/g, "");
    const count = store.safetyIncidents.length;
    const incidentNumber = `K3-${dateStr}-${(count + 1).toString().padStart(3, "0")}`;

    const newIncident: SafetyIncidentModel = {
      id: `saf-${Date.now()}`,
      incidentNumber,
      dateTime: data.dateTime,
      siteId: data.siteId,
      location: data.location,
      category: data.category,
      severity: data.severity,
      description: data.description,
      initialAction: data.initialAction,
      reportedById: user.id,
      assignedToId: data.assignedToId || null,
      photoUrl: data.photoUrl || null,
      status: "OPEN",
      resolvedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followUps: [],
    };

    store.safetyIncidents.unshift(newIncident);

    // If HIGH or CRITICAL, send high priority notification to all supervisors & managers
    if (data.severity === "HIGH" || data.severity === "CRITICAL") {
      const leaders = store.users.filter((u) => u.role === "SUPERVISOR" || u.role === "MANAGEMENT" || u.role === "ADMINISTRATOR");
      leaders.forEach((ldr) => {
        store.notifications.unshift({
          id: `notif-${Date.now()}-${ldr.id}`,
          userId: ldr.id,
          title: `PERINGATAN K3 (${data.severity}): ${incidentNumber}`,
          message: `${data.category} di ${data.location}: ${data.description.slice(0, 70)}...`,
          type: "SAFETY",
          link: "/supervisor/safety",
          isRead: false,
          createdAt: new Date().toISOString(),
        });
      });
    }

    saveDatabase();
    return newIncident;
  },

  updateSafetyIncident(id: string, data: Partial<SafetyIncidentModel>): SafetyIncidentModel {
    const store = loadDatabase();
    const idx = store.safetyIncidents.findIndex((i) => i.id === id);
    if (idx === -1) throw new Error("Insiden keselamatan tidak ditemukan");

    store.safetyIncidents[idx] = {
      ...store.safetyIncidents[idx],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    if (data.status === "RESOLVED" || data.status === "CLOSED") {
      store.safetyIncidents[idx].resolvedAt = new Date().toISOString();
    }

    saveDatabase();
    return store.safetyIncidents[idx];
  },

  addSafetyFollowUp(incidentId: string, actionDescription: string, actorName: string): SafetyFollowUpModel {
    const store = loadDatabase();
    const idx = store.safetyIncidents.findIndex((i) => i.id === incidentId);
    if (idx === -1) throw new Error("Insiden tidak ditemukan");

    const newFollowUp: SafetyFollowUpModel = {
      id: `flw-${Date.now()}`,
      incidentId,
      actionDescription,
      actionBy: actorName,
      status: "COMPLETED",
      createdAt: new Date().toISOString(),
    };

    const followUps = store.safetyIncidents[idx].followUps || [];
    followUps.push(newFollowUp);
    store.safetyIncidents[idx].followUps = followUps;
    store.safetyIncidents[idx].updatedAt = new Date().toISOString();

    saveDatabase();
    return newFollowUp;
  },

  // NOTIFICATIONS
  getNotifications(userId: string): NotificationModel[] {
    const store = loadDatabase();
    return store.notifications.filter((n) => n.userId === userId);
  },

  markNotificationRead(id: string) {
    const store = loadDatabase();
    const idx = store.notifications.findIndex((n) => n.id === id);
    if (idx !== -1) {
      store.notifications[idx].isRead = true;
      saveDatabase();
    }
    return true;
  },

  markAllNotificationsRead(userId: string) {
    const store = loadDatabase();
    store.notifications.forEach((n) => {
      if (n.userId === userId) n.isRead = true;
    });
    saveDatabase();
    return true;
  },

  // AUDIT LOGS
  getAuditLogs(filters?: { entityType?: string; action?: string; limit?: number }): AuditLogModel[] {
    const store = loadDatabase();
    let logs = store.auditLogs;
    if (filters?.entityType) logs = logs.filter((l) => l.entityType === filters.entityType);
    if (filters?.action) logs = logs.filter((l) => l.action === filters.action);
    const limit = filters?.limit || 50;
    return logs.slice(0, limit);
  },

  // ANALYTICS & PRODUCTION TOTALS
  getProductionAnalytics(filters?: { siteId?: string; materialId?: string; startDate?: string; endDate?: string }) {
    const store = loadDatabase();

    // Only APPROVED production counts for official reporting
    let approvedRecords = store.productionRecords.filter((r) => r.status === "APPROVED");

    if (filters?.siteId) approvedRecords = approvedRecords.filter((r) => r.siteId === filters.siteId);
    if (filters?.materialId) approvedRecords = approvedRecords.filter((r) => r.materialId === filters.materialId);
    if (filters?.startDate) approvedRecords = approvedRecords.filter((r) => r.date >= filters.startDate!);
    if (filters?.endDate) approvedRecords = approvedRecords.filter((r) => r.date <= filters.endDate!);

    // Totals by unit
    const totalCoalTon = approvedRecords
      .filter((r) => {
        const mat = store.materials.find((m) => m.id === r.materialId);
        return mat?.code === "COAL";
      })
      .reduce((sum, r) => sum + r.netWeight, 0);

    const totalOBBCM = approvedRecords
      .filter((r) => {
        const mat = store.materials.find((m) => m.id === r.materialId);
        return mat?.code === "OB";
      })
      .reduce((sum, r) => sum + r.netWeight, 0);

    // Target calculation
    let targets = store.productionTargets;
    if (filters?.siteId) targets = targets.filter((t) => t.siteId === filters.siteId);
    if (filters?.materialId) targets = targets.filter((t) => t.materialId === filters.materialId);

    const targetCoalTon = targets
      .filter((t) => {
        const mat = store.materials.find((m) => m.id === t.materialId);
        return mat?.code === "COAL";
      })
      .reduce((sum, t) => sum + t.targetAmount, 0);

    const achievementPercent = targetCoalTon > 0 ? (totalCoalTon / targetCoalTon) * 100 : 0;
    const diffProduction = totalCoalTon - targetCoalTon;

    // Daily production trend
    const dailyMap: Record<string, { date: string; coal: number; ob: number; target: number }> = {};
    // Seed with dates from approved records or default
    approvedRecords.forEach((r) => {
      const d = r.date.slice(0, 10);
      if (!dailyMap[d]) {
        dailyMap[d] = { date: d, coal: 0, ob: 0, target: targetCoalTon > 0 ? targetCoalTon : 2500 };
      }
      const mat = store.materials.find((m) => m.id === r.materialId);
      if (mat?.code === "COAL") dailyMap[d].coal += r.netWeight;
      if (mat?.code === "OB") dailyMap[d].ob += r.netWeight;
    });

    const trend = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date));

    // Material distribution
    const matMap: Record<string, { name: string; amount: number; unit: string }> = {};
    approvedRecords.forEach((r) => {
      const mat = store.materials.find((m) => m.id === r.materialId);
      const name = mat?.name || "Lainnya";
      if (!matMap[name]) matMap[name] = { name, amount: 0, unit: r.unit };
      matMap[name].amount += r.netWeight;
    });

    // Site comparison
    const siteMap: Record<string, { siteName: string; coal: number; ob: number }> = {};
    approvedRecords.forEach((r) => {
      const site = store.sites.find((s) => s.id === r.siteId);
      const name = site?.name || "Site";
      if (!siteMap[name]) siteMap[name] = { siteName: name, coal: 0, ob: 0 };
      const mat = store.materials.find((m) => m.id === r.materialId);
      if (mat?.code === "COAL") siteMap[name].coal += r.netWeight;
      if (mat?.code === "OB") siteMap[name].ob += r.netWeight;
    });

    // Equipment status summary
    const equipmentSummary = {
      total: store.equipment.length,
      available: store.equipment.filter((e) => e.status === "AVAILABLE").length,
      inUse: store.equipment.filter((e) => e.status === "IN_USE").length,
      maintenance: store.equipment.filter((e) => e.status === "MAINTENANCE").length,
      breakdown: store.equipment.filter((e) => e.status === "BREAKDOWN").length,
    };

    // Pending counts
    const pendingReviewCount = store.productionRecords.filter(
      (r) => r.status === "SUBMITTED" || r.status === "UNDER_REVIEW"
    ).length;

    const openIncidentCount = store.safetyIncidents.filter((i) => i.status !== "RESOLVED" && i.status !== "CLOSED").length;
    const activeDowntimeCount = store.downtimes.filter((d) => d.status === "OPEN" || d.status === "IN_PROGRESS").length;

    return {
      totalCoalTon: Number(totalCoalTon.toFixed(2)),
      totalOBBCM: Number(totalOBBCM.toFixed(2)),
      targetCoalTon: Number(targetCoalTon.toFixed(2)),
      achievementPercent: Number(achievementPercent.toFixed(1)),
      diffProduction: Number(diffProduction.toFixed(2)),
      trend,
      byMaterial: Object.values(matMap),
      bySite: Object.values(siteMap),
      equipmentSummary,
      pendingReviewCount,
      openIncidentCount,
      activeDowntimeCount,
    };
  },

  // DIGITAL WEIGHBRIDGE
  getWeighbridgeTickets(filters?: { siteId?: string; status?: string; search?: string; materialId?: string; isReconciled?: boolean }): WeighbridgeTicketModel[] {
    const store = loadDatabase();
    let tickets = store.weighbridgeTickets || [];

    if (filters?.siteId) tickets = tickets.filter((t) => t.siteId === filters.siteId);
    if (filters?.status) tickets = tickets.filter((t) => t.status === filters.status);
    if (filters?.materialId) tickets = tickets.filter((t) => t.materialId === filters.materialId);
    if (filters?.isReconciled !== undefined) tickets = tickets.filter((t) => t.isReconciled === filters.isReconciled);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.ticketNumber.toLowerCase().includes(q) ||
          t.truckPlateNumber.toLowerCase().includes(q) ||
          (t.driverName && t.driverName.toLowerCase().includes(q)) ||
          (t.notes && t.notes.toLowerCase().includes(q))
      );
    }

    return tickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  getWeighbridgeTicketById(id: string): WeighbridgeTicketModel | undefined {
    const store = loadDatabase();
    return (store.weighbridgeTickets || []).find((t) => t.id === id || t.ticketNumber === id);
  },

  createWeighbridgeTicket(data: Partial<WeighbridgeTicketModel>, user: UserSession): WeighbridgeTicketModel {
    const store = loadDatabase();

    if (!data.truckPlateNumber) {
      throw new Error("Nomor kendaraan / plat dump truck wajib diisi.");
    }
    if (data.grossWeight === undefined || data.tareWeight === undefined) {
      throw new Error("Berat bruto dan tara wajib diisi.");
    }
    if (data.grossWeight < data.tareWeight) {
      throw new Error("Berat bruto harus lebih besar atau sama dengan berat tara.");
    }

    const netWeight = Number((data.grossWeight - data.tareWeight).toFixed(2));
    if (netWeight < 0) {
      throw new Error("Berat netto tidak boleh bernilai negatif.");
    }

    // Auto-generate unique ticket number WB-YYYYMMDD-XXXX if not provided
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    let ticketNumber = data.ticketNumber;
    if (!ticketNumber) {
      const countToday = (store.weighbridgeTickets || []).filter((t) => t.ticketNumber.startsWith(`WB-${today}`)).length;
      ticketNumber = `WB-${today}-${(countToday + 1).toString().padStart(4, "0")}`;
    }

    // Duplicate check
    const existingTicket = (store.weighbridgeTickets || []).find((t) => t.ticketNumber === ticketNumber);
    if (existingTicket) {
      throw new Error(`Nomor tiket timbang ${ticketNumber} sudah digunakan.`);
    }

    const site = store.sites.find((s) => s.id === data.siteId);
    const pit = store.pits.find((p) => p.id === data.pitId);
    const material = store.materials.find((m) => m.id === data.materialId);
    const equipment = store.equipment.find((e) => e.id === data.equipmentId);

    const newTicket: WeighbridgeTicketModel = {
      id: `wb-${Date.now()}`,
      ticketNumber,
      truckPlateNumber: data.truckPlateNumber.trim().toUpperCase(),
      equipmentId: data.equipmentId || null,
      equipmentCode: equipment?.code || null,
      driverName: data.driverName || user.name,
      operatorId: data.operatorId || user.id,
      weighmasterId: user.id,
      weighmasterName: user.name,
      inTime: data.inTime || new Date().toISOString(),
      outTime: data.outTime || new Date().toISOString(),
      grossWeight: data.grossWeight,
      tareWeight: data.tareWeight,
      netWeight,
      unit: data.unit || "Ton",
      materialId: data.materialId || (material?.id || ""),
      materialName: material?.name,
      siteId: data.siteId || (site?.id || ""),
      siteName: site?.name,
      pitId: data.pitId || (pit?.id || ""),
      pitName: pit?.name,
      destination: data.destination || "Stockpile",
      dataSource: data.dataSource || "MANUAL_AUDITED",
      documentUrl: data.documentUrl || null,
      status: data.status || "VERIFIED",
      productionRecordId: data.productionRecordId || null,
      isReconciled: false,
      notes: data.notes || null,
      cancelledReason: null,
      correctionHistory: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!store.weighbridgeTickets) store.weighbridgeTickets = [];
    store.weighbridgeTickets.push(newTicket);

    // If productionRecordId provided, link back to production record
    if (data.productionRecordId) {
      const pIdx = store.productionRecords.findIndex((p) => p.id === data.productionRecordId);
      if (pIdx !== -1) {
        store.productionRecords[pIdx].weighbridgeTicketId = newTicket.id;
        store.productionRecords[pIdx].truckPlateNumber = newTicket.truckPlateNumber;
        store.productionRecords[pIdx].netWeight = newTicket.netWeight;
        store.productionRecords[pIdx].grossWeight = newTicket.grossWeight;
        store.productionRecords[pIdx].tareWeight = newTicket.tareWeight;
      }
    }

    this.createAuditLog(
      "CREATE",
      "WEIGHBRIDGE_TICKET",
      newTicket.id,
      `Tiket timbang diterbitkan: ${ticketNumber} (Netto ${netWeight} Ton, Kendaraan ${newTicket.truckPlateNumber})`,
      user
    );

    saveDatabase();
    return newTicket;
  },

  updateWeighbridgeTicket(id: string, updates: Partial<WeighbridgeTicketModel>, reason: string, user: UserSession): WeighbridgeTicketModel {
    const store = loadDatabase();
    const idx = (store.weighbridgeTickets || []).findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Tiket timbang tidak ditemukan.");

    const current = store.weighbridgeTickets[idx];
    if (current.status === "CANCELLED") {
      throw new Error("Tiket yang sudah dibatalkan tidak dapat diubah.");
    }
    if (!reason || reason.trim().length < 5) {
      throw new Error("Koreksi tiket timbang wajib menyertakan alasan perubahan (minimal 5 karakter).");
    }

    let gross = updates.grossWeight !== undefined ? updates.grossWeight : current.grossWeight;
    let tare = updates.tareWeight !== undefined ? updates.tareWeight : current.tareWeight;
    if (gross < tare) {
      throw new Error("Berat bruto harus lebih besar atau sama dengan berat tara.");
    }
    const newNet = Number((gross - tare).toFixed(2));

    const historyEntry = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      previousNet: current.netWeight,
      newNet,
      reason,
    };

    const updatedTicket: WeighbridgeTicketModel = {
      ...current,
      ...updates,
      grossWeight: gross,
      tareWeight: tare,
      netWeight: newNet,
      updatedAt: new Date().toISOString(),
      correctionHistory: [...(current.correctionHistory || []), historyEntry],
    };

    store.weighbridgeTickets[idx] = updatedTicket;

    // Sync with linked production record if exists
    if (updatedTicket.productionRecordId) {
      const pIdx = store.productionRecords.findIndex((p) => p.id === updatedTicket.productionRecordId);
      if (pIdx !== -1 && store.productionRecords[pIdx].status !== "APPROVED") {
        store.productionRecords[pIdx].netWeight = newNet;
        store.productionRecords[pIdx].grossWeight = gross;
        store.productionRecords[pIdx].tareWeight = tare;
      }
    }

    this.createAuditLog(
      "UPDATE",
      "WEIGHBRIDGE_TICKET",
      id,
      `Koreksi tiket ${current.ticketNumber}: Netto ${current.netWeight} -> ${newNet}. Alasan: ${reason}`,
      user
    );

    saveDatabase();
    return updatedTicket;
  },

  cancelWeighbridgeTicket(id: string, reason: string, user: UserSession): WeighbridgeTicketModel {
    const store = loadDatabase();
    const idx = (store.weighbridgeTickets || []).findIndex((t) => t.id === id);
    if (idx === -1) throw new Error("Tiket timbang tidak ditemukan.");

    if (!reason || reason.trim().length < 5) {
      throw new Error("Pembatalan tiket timbang wajib menyertakan alasan yang sah.");
    }

    const current = store.weighbridgeTickets[idx];
    current.status = "CANCELLED";
    current.cancelledReason = reason;
    current.updatedAt = new Date().toISOString();

    // Unlink from production record if linked
    if (current.productionRecordId) {
      const pIdx = store.productionRecords.findIndex((p) => p.id === current.productionRecordId);
      if (pIdx !== -1) {
        store.productionRecords[pIdx].weighbridgeTicketId = null;
      }
    }

    this.createAuditLog(
      "CANCEL",
      "WEIGHBRIDGE_TICKET",
      id,
      `Pembatalan tiket ${current.ticketNumber}. Alasan: ${reason}`,
      user
    );

    saveDatabase();
    return current;
  },

  // PREVENTIVE MAINTENANCE
  getPreventiveMaintenances(filters?: { equipmentId?: string; status?: string; siteId?: string }): PreventiveMaintenanceModel[] {
    const store = loadDatabase();
    let pms = store.preventiveMaintenances || [];

    if (filters?.equipmentId) pms = pms.filter((pm) => pm.equipmentId === filters.equipmentId);
    if (filters?.status) pms = pms.filter((pm) => pm.status === filters.status);
    if (filters?.siteId) pms = pms.filter((pm) => pm.siteId === filters.siteId);

    return pms.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  },

  createPreventiveMaintenance(data: Partial<PreventiveMaintenanceModel>, user: UserSession): PreventiveMaintenanceModel {
    const store = loadDatabase();
    if (!data.equipmentId || !data.title || !data.scheduledDate) {
      throw new Error("Data unit alat berat, judul pekerjaan, dan tanggal jadwal wajib diisi.");
    }

    const eq = store.equipment.find((e) => e.id === data.equipmentId);
    if (!eq) throw new Error("Unit alat berat tidak ditemukan.");

    const newPM: PreventiveMaintenanceModel = {
      id: `pm-${Date.now()}`,
      equipmentId: data.equipmentId,
      equipmentCode: eq.code,
      equipmentName: eq.name,
      siteId: data.siteId || eq.siteId,
      title: data.title,
      pmType: data.pmType || "SCHEDULED_PM",
      scheduledDate: data.scheduledDate,
      hourMeterThreshold: data.hourMeterThreshold || null,
      currentHourMeter: eq.operatingHours || 0,
      componentsChecklist: data.componentsChecklist || [
        { component: "Sistem Pelumasan & Filter", checked: false, condition: "PENDING" },
        { component: "Sistem Hidrolik Utama", checked: false, condition: "PENDING" },
        { component: "Sistem Pengereman & Kemudi", checked: false, condition: "PENDING" },
      ],
      technicianName: data.technicianName || user.name,
      assignedToId: data.assignedToId || user.id,
      status: data.status || "SCHEDULED",
      notes: data.notes || null,
      completionDate: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!store.preventiveMaintenances) store.preventiveMaintenances = [];
    store.preventiveMaintenances.push(newPM);

    if (newPM.status === "IN_PROGRESS") {
      eq.status = "MAINTENANCE";
      eq.updatedAt = new Date().toISOString();
    }

    this.createAuditLog("CREATE", "PREVENTIVE_MAINTENANCE", newPM.id, `Jadwal PM baru dibuat: ${newPM.title} untuk ${eq.code}`, user);
    saveDatabase();
    return newPM;
  },

  updatePreventiveMaintenance(id: string, updates: Partial<PreventiveMaintenanceModel>, user: UserSession): PreventiveMaintenanceModel {
    const store = loadDatabase();
    const idx = (store.preventiveMaintenances || []).findIndex((pm) => pm.id === id);
    if (idx === -1) throw new Error("Catatan preventive maintenance tidak ditemukan.");

    const current = store.preventiveMaintenances[idx];
    const prevStatus = current.status;

    store.preventiveMaintenances[idx] = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const updated = store.preventiveMaintenances[idx];

    // Status transitions
    const eq = store.equipment.find((e) => e.id === updated.equipmentId);
    if (eq) {
      if (updated.status === "IN_PROGRESS") {
        eq.status = "MAINTENANCE";
        eq.updatedAt = new Date().toISOString();
      } else if (updated.status === "COMPLETED" && prevStatus !== "COMPLETED") {
        updated.completionDate = new Date().toISOString();
        const check = this.canEquipmentBeAvailable(updated.equipmentId);
        if (check.canBeAvailable) {
          eq.status = "AVAILABLE";
        } else {
          eq.status = "MAINTENANCE";
        }
        eq.updatedAt = new Date().toISOString();
      }
    }

    this.createAuditLog(
      "UPDATE",
      "PREVENTIVE_MAINTENANCE",
      id,
      `Pembaruan PM ${updated.title}: status ${prevStatus} -> ${updated.status}`,
      user
    );

    saveDatabase();
    return updated;
  },

  // PRODUCTION RECONCILIATION
  getReconciliations(filters?: { siteId?: string; date?: string; status?: string }): ProductionReconciliationModel[] {
    const store = loadDatabase();
    let recons = store.productionReconciliations || [];

    if (filters?.siteId) recons = recons.filter((r) => r.siteId === filters.siteId);
    if (filters?.date) recons = recons.filter((r) => r.date.slice(0, 10) === filters.date!.slice(0, 10));
    if (filters?.status) recons = recons.filter((r) => r.status === filters.status);

    return recons.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  runReconciliationScan(siteId: string, date: string, shiftId: string, materialId: string, user: UserSession): ProductionReconciliationModel {
    const store = loadDatabase();
    const datePrefix = date.slice(0, 10);

    // 1. Fetch tickets for date, site, material
    const tickets = (store.weighbridgeTickets || []).filter(
      (t) =>
        t.siteId === siteId &&
        t.materialId === materialId &&
        t.createdAt.slice(0, 10) === datePrefix &&
        t.status !== "CANCELLED"
    );

    // 2. Fetch approved/submitted production records for date, site, shift, material
    const records = store.productionRecords.filter(
      (r) =>
        r.siteId === siteId &&
        r.shiftId === shiftId &&
        r.materialId === materialId &&
        r.date.slice(0, 10) === datePrefix &&
        r.status !== "REJECTED"
    );

    const totalTicketsWeight = Number(tickets.reduce((sum, t) => sum + t.netWeight, 0).toFixed(2));
    const totalProductionWeight = Number(records.reduce((sum, r) => sum + r.netWeight, 0).toFixed(2));
    const weightDiscrepancy = Number((totalTicketsWeight - totalProductionWeight).toFixed(2));

    const unlinkedTicketsCount = tickets.filter((t) => !t.productionRecordId).length;

    // Check duplicate references
    const linkedIds = tickets.map((t) => t.productionRecordId).filter(Boolean);
    const uniqueLinkedIds = new Set(linkedIds);
    const duplicateTicketsCount = linkedIds.length - uniqueLinkedIds.size;

    const hasEstimatedData = records.some((r) => r.isEstimated);

    const isBalanced = Math.abs(weightDiscrepancy) < 0.05 && unlinkedTicketsCount === 0 && duplicateTicketsCount === 0;
    const status = isBalanced ? "BALANCED" : "DISCREPANCY_DETECTED";

    const site = store.sites.find((s) => s.id === siteId);
    const shift = store.shifts.find((s) => s.id === shiftId);
    const material = store.materials.find((m) => m.id === materialId);

    const reconId = `rec-recon-${datePrefix}-${siteId}-${shiftId}-${materialId}`;
    const existingIdx = (store.productionReconciliations || []).findIndex((r) => r.id === reconId);

    const reconItem: ProductionReconciliationModel = {
      id: reconId,
      date: `${datePrefix}T00:00:00.000Z`,
      siteId,
      siteName: site?.name,
      shiftId,
      shiftName: shift?.name,
      materialId,
      materialName: material?.name,
      totalTicketsWeight,
      totalProductionWeight,
      weightDiscrepancy,
      ticketsCount: tickets.length,
      unlinkedTicketsCount,
      duplicateTicketsCount,
      hasEstimatedData,
      status,
      investigationNotes: isBalanced
        ? "Seluruh timbangan jembatan timbang dan catatan ritase produksi telah seimbang."
        : `Ditemukan selisih sebesar ${weightDiscrepancy} Ton (${tickets.length} tiket timbang vs ${records.length} ritase tercatat).`,
      resolutionNotes: existingIdx !== -1 ? store.productionReconciliations[existingIdx].resolutionNotes : null,
      resolvedById: isBalanced ? user.id : null,
      resolvedByName: isBalanced ? user.name : null,
      resolvedAt: isBalanced ? new Date().toISOString() : null,
      createdAt: existingIdx !== -1 ? store.productionReconciliations[existingIdx].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!store.productionReconciliations) store.productionReconciliations = [];
    if (existingIdx !== -1) {
      store.productionReconciliations[existingIdx] = reconItem;
    } else {
      store.productionReconciliations.push(reconItem);
    }

    // Mark tickets as reconciled if balanced
    if (isBalanced) {
      tickets.forEach((t) => {
        t.isReconciled = true;
      });
    }

    this.createAuditLog(
      "SCAN",
      "RECONCILIATION",
      reconId,
      `Pemindaian rekonsiliasi ${datePrefix}: Tiket ${totalTicketsWeight} Ton vs Produksi ${totalProductionWeight} Ton (Selisih: ${weightDiscrepancy} Ton)`,
      user
    );

    saveDatabase();
    return reconItem;
  },

  resolveReconciliation(id: string, resolutionNotes: string, user: UserSession): ProductionReconciliationModel {
    const store = loadDatabase();
    const idx = (store.productionReconciliations || []).findIndex((r) => r.id === id);
    if (idx === -1) throw new Error("Catatan rekonsiliasi tidak ditemukan.");

    if (!resolutionNotes || resolutionNotes.trim().length < 5) {
      throw new Error("Catatan resolusi wajib diisi (minimal 5 karakter).");
    }

    store.productionReconciliations[idx] = {
      ...store.productionReconciliations[idx],
      status: "RESOLVED",
      resolutionNotes,
      resolvedById: user.id,
      resolvedByName: user.name,
      resolvedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.createAuditLog("RESOLVE", "RECONCILIATION", id, `Resolusi rekonsiliasi oleh ${user.name}: ${resolutionNotes}`, user);
    saveDatabase();
    return store.productionReconciliations[idx];
  },

  // OPERATIONAL ALERTS
  getOperationalAlerts(filters?: { siteId?: string; role?: Role; isResolved?: boolean }): OperationalAlertModel[] {
    const store = loadDatabase();
    let alerts = store.operationalAlerts || [];

    if (filters?.siteId) alerts = alerts.filter((a) => a.siteId === filters.siteId);
    if (filters?.isResolved !== undefined) alerts = alerts.filter((a) => a.isResolved === filters.isResolved);
    if (filters?.role) alerts = alerts.filter((a) => a.targetRoles.includes(filters.role!));

    return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  createOperationalAlert(data: Partial<OperationalAlertModel>): OperationalAlertModel {
    const store = loadDatabase();
    const dedupKey = data.dedupKey || `ALERT-${data.alertType}-${data.entityId}-${new Date().toISOString().slice(0, 10)}`;

    if (!store.operationalAlerts) store.operationalAlerts = [];

    // Deduplication check: if unresolved alert with same dedupKey exists, return it
    const existing = store.operationalAlerts.find((a) => a.dedupKey === dedupKey && !a.isResolved);
    if (existing) {
      return existing;
    }

    const site = store.sites.find((s) => s.id === data.siteId);
    const newAlert: OperationalAlertModel = {
      id: `alt-${Date.now()}`,
      siteId: data.siteId || (site?.id || "site-kalbar-01"),
      siteName: site?.name || "Site Kalbar",
      alertType: data.alertType || "PRODUCTION_BELOW_TARGET",
      severity: data.severity || "MEDIUM",
      title: data.title || "Peringatan Operasional",
      message: data.message || "Terdapat kondisi operasional yang memerlukan perhatian.",
      entityType: data.entityType || "SYSTEM",
      entityId: data.entityId || null,
      targetRoles: data.targetRoles || ["ADMINISTRATOR", "SUPERVISOR"],
      isResolved: false,
      resolvedById: null,
      resolvedByName: null,
      resolvedAt: null,
      actionNotes: null,
      dedupKey,
      createdAt: new Date().toISOString(),
    };

    store.operationalAlerts.push(newAlert);
    saveDatabase();
    return newAlert;
  },

  resolveOperationalAlert(id: string, actionNotes: string, user: UserSession): OperationalAlertModel {
    const store = loadDatabase();
    const idx = (store.operationalAlerts || []).findIndex((a) => a.id === id);
    if (idx === -1) throw new Error("Peringatan operasional tidak ditemukan.");

    store.operationalAlerts[idx] = {
      ...store.operationalAlerts[idx],
      isResolved: true,
      resolvedById: user.id,
      resolvedByName: user.name,
      resolvedAt: new Date().toISOString(),
      actionNotes: actionNotes || "Peringatan telah ditindaklanjuti.",
    };

    this.createAuditLog("RESOLVE", "ALERT", id, `Peringatan operasional ditandai selesai: ${store.operationalAlerts[idx].title}`, user);
    saveDatabase();
    return store.operationalAlerts[idx];
  },

  scanAndGenerateAlerts(user?: UserSession): OperationalAlertModel[] {
    const store = loadDatabase();
    const generated: OperationalAlertModel[] = [];

    // 1. Scan open high-priority downtimes
    store.downtimes
      .filter((d) => (d.status === "OPEN" || d.status === "IN_PROGRESS") && (d.priority === "HIGH" || d.priority === "CRITICAL"))
      .forEach((d) => {
        const eq = store.equipment.find((e) => e.id === d.equipmentId);
        const alert = this.createOperationalAlert({
          siteId: d.siteId,
          alertType: "EQUIPMENT_DOWNTIME",
          severity: d.priority,
          title: `Kerusakan Armada Kritis: Unit ${eq?.code || d.equipmentId}`,
          message: `Unit mengalami downtime: ${d.description}`,
          entityType: "EQUIPMENT",
          entityId: d.equipmentId,
          targetRoles: ["ADMINISTRATOR", "SUPERVISOR"],
          dedupKey: `DOWNTIME-${d.id}`,
        });
        generated.push(alert);
      });

    // 2. Scan critical safety incidents
    store.safetyIncidents
      .filter((s) => s.status !== "RESOLVED" && s.status !== "CLOSED" && (s.severity === "HIGH" || s.severity === "CRITICAL"))
      .forEach((s) => {
        const alert = this.createOperationalAlert({
          siteId: s.siteId,
          alertType: "CRITICAL_SAFETY_INCIDENT",
          severity: s.severity,
          title: `Temuan K3 Kritis: ${s.incidentNumber}`,
          message: s.description,
          entityType: "SAFETY_INCIDENT",
          entityId: s.id,
          targetRoles: ["ADMINISTRATOR", "SUPERVISOR", "MANAGEMENT"],
          dedupKey: `SAFETY-${s.id}`,
        });
        generated.push(alert);
      });

    return generated;
  },

  // DOCUMENT STORAGE
  saveDocumentStorage(doc: DocumentStorageModel, user: UserSession): DocumentStorageModel {
    const store = loadDatabase();
    if (!store.documentStorages) store.documentStorages = [];

    const existingIdx = store.documentStorages.findIndex((d) => d.id === doc.id);
    if (existingIdx !== -1) {
      store.documentStorages[existingIdx] = doc;
    } else {
      store.documentStorages.push(doc);
    }

    this.createAuditLog(
      "UPLOAD",
      "DOCUMENT",
      doc.id,
      `Unggah berkas: ${doc.fileName} (${(doc.fileSize / 1024).toFixed(1)} KB, Kategori ${doc.category})`,
      user
    );

    saveDatabase();
    return doc;
  },

  getDocumentStorageById(id: string): DocumentStorageModel | undefined {
    const store = loadDatabase();
    return (store.documentStorages || []).find((d) => d.id === id);
  },

  getDocumentStorages(filters?: { category?: string; entityType?: string; entityId?: string }): DocumentStorageModel[] {
    const store = loadDatabase();
    let docs = store.documentStorages || [];

    if (filters?.category) docs = docs.filter((d) => d.category === filters.category);
    if (filters?.entityType) docs = docs.filter((d) => d.entityType === filters.entityType);
    if (filters?.entityId) docs = docs.filter((d) => d.entityId === filters.entityId);

    return docs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  deleteDocumentStorage(id: string, user: UserSession): boolean {
    const store = loadDatabase();
    const idx = (store.documentStorages || []).findIndex((d) => d.id === id);
    if (idx === -1) return false;

    const doc = store.documentStorages[idx];
    store.documentStorages.splice(idx, 1);

    this.createAuditLog("DELETE", "DOCUMENT", id, `Hapus berkas: ${doc.fileName}`, user);
    saveDatabase();
    return true;
  },

  // OFFLINE QUEUE SYNC
  syncOfflineQueue(items: OfflineSyncQueueItem[], user: UserSession): { syncedCount: number; results: any[] } {
    let syncedCount = 0;
    const results: any[] = [];

    for (const item of items) {
      try {
        if (item.action === "CREATE_PRODUCTION") {
          const rec = this.createProductionRecord(
            {
              ...item.payload,
              idempotencyKey: item.idempotencyKey,
              syncStatus: "SYNCED",
            },
            user
          );
          syncedCount++;
          results.push({ id: item.id, status: "SYNCED", recordId: rec.id });
        } else if (item.action === "CREATE_WEIGHBRIDGE") {
          const ticket = this.createWeighbridgeTicket(item.payload, user);
          syncedCount++;
          results.push({ id: item.id, status: "SYNCED", ticketId: ticket.id });
        } else if (item.action === "REPORT_DOWNTIME") {
          const dt = this.createDowntimeReport(item.payload);
          syncedCount++;
          results.push({ id: item.id, status: "SYNCED", downtimeId: dt.id });
        } else if (item.action === "REPORT_SAFETY") {
          const inc = this.createSafetyIncident(item.payload, user);
          syncedCount++;
          results.push({ id: item.id, status: "SYNCED", incidentId: inc.id });
        }
      } catch (err: any) {
        results.push({ id: item.id, status: "FAILED", error: err?.message || "Gagal memproses item antrean offline" });
      }
    }

    return { syncedCount, results };
  },
};

