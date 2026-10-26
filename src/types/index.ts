export type Role = 'ADMINISTRATOR' | 'SUPERVISOR' | 'OPERATOR' | 'MANAGEMENT';

export type EquipmentType = 'EXCAVATOR' | 'DUMP_TRUCK' | 'BULLDOZER' | 'WHEEL_LOADER' | 'GRADER' | 'OTHER';

export type EquipmentStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'BREAKDOWN' | 'INACTIVE';

export type MeasurementType = 'WEIGHED' | 'RITASE';

export type ApprovalStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'NEEDS_REVISION';

export type DowntimeCategory = 'MECHANICAL' | 'ELECTRICAL' | 'OPERATIONAL' | 'WAITING_MATERIAL' | 'WEATHER' | 'OTHER';

export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SafetyCategory = 'INCIDENT' | 'NEAR_MISS' | 'UNSAFE_CONDITION' | 'UNSAFE_ACTION' | 'INSPECTION_FINDING';

export type IncidentStatus = 'OPEN' | 'UNDER_INVESTIGATION' | 'ACTION_REQUIRED' | 'RESOLVED' | 'CLOSED';

export interface UserSession {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  siteIds?: string[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  siteAccesses?: { siteId: string; siteName?: string }[];
}

export interface SiteModel {
  id: string;
  code: string;
  name: string;
  location: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pits?: PitModel[];
}

export interface PitModel {
  id: string;
  siteId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  siteName?: string;
}

export interface WorkBlockModel {
  id: string;
  pitId: string;
  siteId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  pitName?: string;
  siteName?: string;
}

export interface MaterialModel {
  id: string;
  code: string;
  name: string;
  unit: string;
  density?: number | null;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftModel {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  crossesMidnight: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ShiftAssignmentModel {
  id: string;
  date: string;
  shiftId: string;
  siteId: string;
  operatorId: string;
  supervisorId?: string | null;
  equipmentId?: string | null;
  status: string;
  notes?: string | null;
  shift?: ShiftModel;
  site?: SiteModel;
  operator?: UserProfile;
  supervisor?: UserProfile;
  equipment?: EquipmentModel;
}

export interface EquipmentModel {
  id: string;
  code: string;
  name: string;
  type: EquipmentType;
  model: string;
  siteId: string;
  status: EquipmentStatus;
  operatingHours: number;
  lastMaintenanceDate?: string | null;
  nextMaintenanceDate?: string | null;
  conditionNotes?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  siteName?: string;
}

export interface DowntimeReportModel {
  id: string;
  equipmentId: string;
  siteId: string;
  shiftId?: string | null;
  reportedById: string;
  handledById?: string | null;
  startTime: string;
  endTime?: string | null;
  durationMinutes?: number | null;
  category: DowntimeCategory;
  priority: PriorityLevel;
  description: string;
  actionTaken?: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  photoUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  equipment?: EquipmentModel;
  site?: SiteModel;
  reportedBy?: UserProfile;
  handledBy?: UserProfile;
}

export interface ProductionTargetModel {
  id: string;
  siteId: string;
  materialId: string;
  periodType: 'DAILY' | 'MONTHLY' | 'SHIFT';
  startDate: string;
  endDate: string;
  shiftId?: string | null;
  targetAmount: number;
  unit: string;
  siteName?: string;
  materialName?: string;
}

export interface ProductionRecordModel {
  id: string;
  recordNumber: string;
  date: string;
  siteId: string;
  pitId: string;
  workBlockId?: string | null;
  shiftId: string;
  materialId: string;
  equipmentId?: string | null;
  operatorId: string;
  measurementType: MeasurementType;
  ritaseCount: number;
  grossWeight?: number | null;
  tareWeight?: number | null;
  netWeight: number;
  unit: string;
  isEstimated: boolean;
  startTime?: string | null;
  endTime?: string | null;
  notes?: string | null;
  photoUrl?: string | null;
  weighbridgeTicketId?: string | null;
  truckPlateNumber?: string | null;
  destination?: string | null;
  idempotencyKey?: string | null;
  syncStatus?: 'SYNCED' | 'PENDING_SYNC' | 'CONFLICT';
  weighmasterName?: string | null;
  status: ApprovalStatus;
  rejectionReason?: string | null;
  reviewedById?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  site?: SiteModel;
  pit?: PitModel;
  workBlock?: WorkBlockModel;
  shift?: ShiftModel;
  material?: MaterialModel;
  equipment?: EquipmentModel;
  operator?: UserProfile;
  reviewedBy?: UserProfile;
  statusHistories?: ProductionStatusHistoryModel[];
}

export interface ProductionStatusHistoryModel {
  id: string;
  productionRecordId: string;
  changedById: string;
  changedByName?: string;
  previousStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  reason?: string | null;
  createdAt: string;
}

export interface DailyOperationalReportModel {
  id: string;
  reportNumber: string;
  date: string;
  siteId: string;
  shiftId: string;
  createdById: string;
  approvedById?: string | null;
  summary: string;
  actualProduction: number;
  targetProduction: number;
  weather?: string | null;
  downtimeMinutes: number;
  safetyIssuesCount: number;
  operationalObstacles?: string | null;
  followUpPlan?: string | null;
  photoUrl?: string | null;
  status: ApprovalStatus;
  rejectionReason?: string | null;
  approvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  site?: SiteModel;
  shift?: ShiftModel;
  createdBy?: UserProfile;
  approvedBy?: UserProfile;
}

export interface SafetyIncidentModel {
  id: string;
  incidentNumber: string;
  dateTime: string;
  siteId: string;
  location: string;
  category: SafetyCategory;
  severity: PriorityLevel;
  description: string;
  initialAction: string;
  reportedById: string;
  assignedToId?: string | null;
  photoUrl?: string | null;
  status: IncidentStatus;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  site?: SiteModel;
  reportedBy?: UserProfile;
  assignedTo?: UserProfile;
  followUps?: SafetyFollowUpModel[];
}

export interface SafetyFollowUpModel {
  id: string;
  incidentId: string;
  actionDescription: string;
  actionBy: string;
  status: string;
  createdAt: string;
}

export interface NotificationModel {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  link?: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuditLogModel {
  id: string;
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  details: string;
  ipAddress?: string | null;
  createdAt: string;
}

export type WeighbridgeDataSource = 'MANUAL_AUDITED' | 'DIGITAL_SCALE_BRIDGE' | 'EXTERNAL_SCALE';
export type WeighbridgeStatus = 'VERIFIED' | 'PENDING_REVIEW' | 'FLAGGED' | 'CANCELLED';

export interface WeighbridgeTicketModel {
  id: string;
  ticketNumber: string;
  truckPlateNumber: string;
  equipmentId?: string | null;
  equipmentCode?: string | null;
  driverName?: string | null;
  operatorId?: string | null;
  weighmasterId?: string | null;
  weighmasterName?: string | null;
  inTime: string;
  outTime: string;
  grossWeight: number;
  tareWeight: number;
  netWeight: number;
  unit: string;
  materialId: string;
  materialName?: string;
  siteId: string;
  siteName?: string;
  pitId: string;
  pitName?: string;
  destination?: string | null;
  dataSource: WeighbridgeDataSource;
  documentUrl?: string | null;
  status: WeighbridgeStatus;
  productionRecordId?: string | null;
  isReconciled: boolean;
  notes?: string | null;
  cancelledReason?: string | null;
  correctionHistory?: {
    timestamp: string;
    userId: string;
    userName: string;
    previousNet: number;
    newNet: number;
    reason: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

export type StorageCategory = 'WEIGHBRIDGE_TICKET' | 'EQUIPMENT_CONDITION' | 'SAFETY_EVIDENCE' | 'OPERATIONAL_REPORT' | 'GENERAL';

export interface DocumentStorageModel {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storagePath: string;
  url: string;
  category: StorageCategory;
  entityType: string;
  entityId?: string | null;
  siteId?: string | null;
  uploadedById: string;
  uploadedByName?: string;
  createdAt: string;
}

export type ReconciliationStatus = 'BALANCED' | 'DISCREPANCY_DETECTED' | 'UNDER_INVESTIGATION' | 'RESOLVED';

export interface ProductionReconciliationModel {
  id: string;
  date: string;
  siteId: string;
  siteName?: string;
  shiftId: string;
  shiftName?: string;
  materialId: string;
  materialName?: string;
  totalTicketsWeight: number;
  totalProductionWeight: number;
  weightDiscrepancy: number;
  ticketsCount: number;
  unlinkedTicketsCount: number;
  duplicateTicketsCount: number;
  hasEstimatedData: boolean;
  status: ReconciliationStatus;
  investigationNotes?: string | null;
  resolutionNotes?: string | null;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PreventiveMaintenanceType = 'SCHEDULED_PM' | 'HOURLY_PM' | 'KM_PM' | 'INSPECTION';
export type PreventiveMaintenanceStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';

export interface PreventiveMaintenanceModel {
  id: string;
  equipmentId: string;
  equipmentCode?: string;
  equipmentName?: string;
  siteId: string;
  title: string;
  pmType: PreventiveMaintenanceType;
  scheduledDate: string;
  hourMeterThreshold?: number | null;
  currentHourMeter?: number | null;
  componentsChecklist: {
    component: string;
    checked: boolean;
    condition: 'GOOD' | 'NEEDS_ATTENTION' | 'REPLACED' | 'PENDING';
    notes?: string;
  }[];
  technicianName: string;
  assignedToId?: string | null;
  status: PreventiveMaintenanceStatus;
  notes?: string | null;
  completionDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type OperationalAlertType =
  | 'PRODUCTION_BELOW_TARGET'
  | 'SHIFT_REPORT_MISSING'
  | 'REPORT_OVERDUE_REVIEW'
  | 'EQUIPMENT_DOWNTIME'
  | 'MAINTENANCE_OVERDUE'
  | 'CRITICAL_SAFETY_INCIDENT'
  | 'UNRECONCILED_TICKETS'
  | 'SYNC_FAILED';

export interface OperationalAlertModel {
  id: string;
  siteId: string;
  siteName?: string;
  alertType: OperationalAlertType;
  severity: PriorityLevel;
  title: string;
  message: string;
  entityType: string;
  entityId?: string | null;
  targetRoles: Role[];
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  actionNotes?: string | null;
  dedupKey: string;
  createdAt: string;
}

export interface HealthStatusModel {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: 'CONNECTED' | 'DISCONNECTED';
    latencyMs: number;
    recordCountEstimate: number;
  };
  storage: {
    status: 'ONLINE' | 'OFFLINE';
    provider: 'LOCAL_SECURE' | 'SUPABASE_STORAGE';
    freeSpaceMb?: number;
  };
  system: {
    nodeVersion: string;
    platform: string;
    memoryUsageMb: number;
  };
}

export interface OfflineSyncQueueItem {
  id: string;
  idempotencyKey: string;
  action: 'CREATE_PRODUCTION' | 'CREATE_WEIGHBRIDGE' | 'REPORT_DOWNTIME' | 'REPORT_SAFETY';
  payload: any;
  clientTimestamp: string;
  attempts: number;
  syncStatus: 'QUEUED' | 'SYNCING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  errorMessage?: string;
}

