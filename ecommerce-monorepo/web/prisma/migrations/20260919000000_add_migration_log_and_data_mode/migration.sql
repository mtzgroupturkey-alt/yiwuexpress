-- Migration: add_migration_log_and_data_mode
-- Adds the MigrationLog table for data operation audit trail
-- Adds the dataMode column to the Deployment table

-- AddColumn: dataMode to deployments
ALTER TABLE "deployments" ADD COLUMN "dataMode" TEXT;

-- CreateTable: migration_logs
CREATE TABLE "migration_logs" (
    "id" TEXT NOT NULL,
    "scriptName" TEXT NOT NULL,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "executedBy" TEXT NOT NULL,
    "dataMode" TEXT NOT NULL,
    "rowsAffected" INTEGER NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL,
    "error" TEXT,
    "backupPath" TEXT,
    "durationMs" INTEGER,
    "metadata" JSONB,

    CONSTRAINT "migration_logs_pkey" PRIMARY KEY ("id")
);
