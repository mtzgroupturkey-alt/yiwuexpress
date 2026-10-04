-- CreateTable
CREATE TABLE "domain_events" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "aggregateId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correlationId" TEXT NOT NULL,
    "causationId" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "hashPrev" TEXT NOT NULL,
    "hashSelf" TEXT NOT NULL,

    CONSTRAINT "domain_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materialized_views" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materialized_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_cycles" (
    "id" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "trigger" TEXT NOT NULL,
    "councilConsensus" JSONB,
    "briefing" TEXT,
    "criticalCount" INTEGER NOT NULL DEFAULT 0,
    "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "correlationId" TEXT NOT NULL,

    CONSTRAINT "autopilot_cycles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "department_probes" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metrics" JSONB NOT NULL,
    "issues" JSONB NOT NULL,
    "severity" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "durationMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "department_probes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_decisions" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "evidence" JSONB NOT NULL,
    "action" JSONB NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopilot_decisions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "action_approvals" (
    "id" TEXT NOT NULL,
    "decisionId" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "slaDeadline" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "result" JSONB,

    CONSTRAINT "action_approvals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_rules" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "yaml" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policy_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decision_memory" (
    "id" TEXT NOT NULL,
    "contextText" TEXT NOT NULL,
    "embedding" TEXT,
    "decision" JSONB NOT NULL,
    "outcome" TEXT,
    "outcomeScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_memory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_predictions" (
    "id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "horizon" TEXT NOT NULL,
    "predicted" DOUBLE PRECISION NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "actualValue" DOUBLE PRECISION,
    "accuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopilot_predictions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "autopilot_audit_entries" (
    "id" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "hashPrev" TEXT NOT NULL,
    "hashSelf" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "autopilot_audit_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "domain_events_type_idx" ON "domain_events"("type");

-- CreateIndex
CREATE INDEX "domain_events_aggregateId_idx" ON "domain_events"("aggregateId");

-- CreateIndex
CREATE INDEX "domain_events_correlationId_idx" ON "domain_events"("correlationId");

-- CreateIndex
CREATE INDEX "domain_events_occurredAt_idx" ON "domain_events"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "materialized_views_name_key_key" ON "materialized_views"("name", "key");

-- CreateIndex
CREATE UNIQUE INDEX "autopilot_cycles_correlationId_key" ON "autopilot_cycles"("correlationId");

-- CreateIndex
CREATE INDEX "autopilot_cycles_status_idx" ON "autopilot_cycles"("status");

-- CreateIndex
CREATE INDEX "autopilot_cycles_startedAt_idx" ON "autopilot_cycles"("startedAt");

-- CreateIndex
CREATE INDEX "department_probes_cycleId_idx" ON "department_probes"("cycleId");

-- CreateIndex
CREATE INDEX "department_probes_department_idx" ON "department_probes"("department");

-- CreateIndex
CREATE INDEX "department_probes_status_idx" ON "department_probes"("status");

-- CreateIndex
CREATE INDEX "autopilot_decisions_cycleId_idx" ON "autopilot_decisions"("cycleId");

-- CreateIndex
CREATE INDEX "autopilot_decisions_type_idx" ON "autopilot_decisions"("type");

-- CreateIndex
CREATE INDEX "action_approvals_decisionId_idx" ON "action_approvals"("decisionId");

-- CreateIndex
CREATE INDEX "action_approvals_status_idx" ON "action_approvals"("status");

-- CreateIndex
CREATE INDEX "action_approvals_riskLevel_idx" ON "action_approvals"("riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "policy_rules_key_key" ON "policy_rules"("key");

-- CreateIndex
CREATE INDEX "policy_rules_department_idx" ON "policy_rules"("department");

-- CreateIndex
CREATE INDEX "policy_rules_enabled_idx" ON "policy_rules"("enabled");

-- CreateIndex
CREATE INDEX "decision_memory_createdAt_idx" ON "decision_memory"("createdAt");

-- CreateIndex
CREATE INDEX "autopilot_predictions_metric_idx" ON "autopilot_predictions"("metric");

-- CreateIndex
CREATE INDEX "autopilot_predictions_createdAt_idx" ON "autopilot_predictions"("createdAt");

-- CreateIndex
CREATE INDEX "autopilot_audit_entries_actor_idx" ON "autopilot_audit_entries"("actor");

-- CreateIndex
CREATE INDEX "autopilot_audit_entries_action_idx" ON "autopilot_audit_entries"("action");

-- CreateIndex
CREATE INDEX "autopilot_audit_entries_createdAt_idx" ON "autopilot_audit_entries"("createdAt");

-- AddForeignKey
ALTER TABLE "department_probes" ADD CONSTRAINT "department_probes_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "autopilot_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "autopilot_decisions" ADD CONSTRAINT "autopilot_decisions_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "autopilot_cycles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "action_approvals" ADD CONSTRAINT "action_approvals_decisionId_fkey" FOREIGN KEY ("decisionId") REFERENCES "autopilot_decisions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
