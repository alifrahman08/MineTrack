-- AlterTable ProductionRecord with weighbridge and offline sync fields
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "weighbridgeTicketId" TEXT;
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "truckPlateNumber" TEXT;
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "destination" TEXT;
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "syncStatus" TEXT DEFAULT 'SYNCED';
ALTER TABLE "ProductionRecord" ADD COLUMN IF NOT EXISTS "weighmasterName" TEXT;

-- CreateTable WeighbridgeTicket
CREATE TABLE IF NOT EXISTS "WeighbridgeTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "truckPlateNumber" TEXT NOT NULL,
    "equipmentId" TEXT,
    "driverName" TEXT,
    "operatorId" TEXT,
    "weighmasterId" TEXT,
    "weighmasterName" TEXT,
    "inTime" TIMESTAMP(3) NOT NULL,
    "outTime" TIMESTAMP(3) NOT NULL,
    "grossWeight" DECIMAL(65,30) NOT NULL,
    "tareWeight" DECIMAL(65,30) NOT NULL,
    "netWeight" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'Ton',
    "materialId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "pitId" TEXT NOT NULL,
    "destination" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'MANUAL_AUDITED',
    "documentUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'VERIFIED',
    "productionRecordId" TEXT,
    "isReconciled" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "cancelledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeighbridgeTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable DocumentStorage
CREATE TABLE IF NOT EXISTS "DocumentStorage" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "storagePath" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "siteId" TEXT,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentStorage_pkey" PRIMARY KEY ("id")
);

-- CreateTable ProductionReconciliation
CREATE TABLE IF NOT EXISTS "ProductionReconciliation" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "siteId" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "materialId" TEXT NOT NULL,
    "totalTicketsWeight" DECIMAL(65,30) NOT NULL,
    "totalProductionWeight" DECIMAL(65,30) NOT NULL,
    "weightDiscrepancy" DECIMAL(65,30) NOT NULL,
    "ticketsCount" INTEGER NOT NULL DEFAULT 0,
    "unlinkedTicketsCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateTicketsCount" INTEGER NOT NULL DEFAULT 0,
    "hasEstimatedData" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'BALANCED',
    "investigationNotes" TEXT,
    "resolutionNotes" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionReconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateTable PreventiveMaintenance
CREATE TABLE IF NOT EXISTS "PreventiveMaintenance" (
    "id" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "pmType" TEXT NOT NULL DEFAULT 'SCHEDULED_PM',
    "scheduledDate" TIMESTAMP(3) NOT NULL,
    "hourMeterThreshold" DECIMAL(65,30),
    "currentHourMeter" DECIMAL(65,30),
    "componentsChecklist" JSONB,
    "technicianName" TEXT NOT NULL,
    "assignedToId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreventiveMaintenance_pkey" PRIMARY KEY ("id")
);

-- CreateTable OperationalAlert
CREATE TABLE IF NOT EXISTS "OperationalAlert" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "alertType" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "targetRoles" TEXT[],
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "actionNotes" TEXT,
    "dedupKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "WeighbridgeTicket_ticketNumber_key" ON "WeighbridgeTicket"("ticketNumber");
CREATE INDEX IF NOT EXISTS "WeighbridgeTicket_siteId_ticketNumber_idx" ON "WeighbridgeTicket"("siteId", "ticketNumber");
CREATE INDEX IF NOT EXISTS "WeighbridgeTicket_inTime_siteId_idx" ON "WeighbridgeTicket"("inTime", "siteId");

CREATE INDEX IF NOT EXISTS "DocumentStorage_category_entityType_entityId_idx" ON "DocumentStorage"("category", "entityType", "entityId");
CREATE INDEX IF NOT EXISTS "ProductionReconciliation_date_siteId_shiftId_idx" ON "ProductionReconciliation"("date", "siteId", "shiftId");
CREATE INDEX IF NOT EXISTS "PreventiveMaintenance_equipmentId_status_idx" ON "PreventiveMaintenance"("equipmentId", "status");
CREATE UNIQUE INDEX IF NOT EXISTS "OperationalAlert_dedupKey_key" ON "OperationalAlert"("dedupKey");
CREATE INDEX IF NOT EXISTS "OperationalAlert_siteId_isResolved_severity_idx" ON "OperationalAlert"("siteId", "isResolved", "severity");
