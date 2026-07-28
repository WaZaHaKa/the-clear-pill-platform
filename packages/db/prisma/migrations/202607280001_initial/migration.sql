-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'MANAGER', 'MEMBER', 'VIEWER');
CREATE TYPE "PlanHorizon" AS ENUM ('FIVE_YEAR', 'YEAR', 'QUARTER', 'MONTH', 'WEEK');
CREATE TYPE "PlanStatus" AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETE', 'ARCHIVED');
CREATE TYPE "ObjectiveStatus" AS ENUM ('DRAFT', 'ACTIVE', 'AT_RISK', 'COMPLETE', 'CANCELLED');
CREATE TYPE "WorkItemStatus" AS ENUM ('BACKLOG', 'READY', 'BLOCKED', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE "EnergyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH');
CREATE TYPE "GenerationStatus" AS ENUM ('STARTED', 'SUCCEEDED', 'FAILED');
CREATE TYPE "MissionStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'DONE', 'SKIPPED', 'RESCHEDULED');
CREATE TYPE "MissionSource" AS ENUM ('DETERMINISTIC', 'AI_PROPOSED', 'MANUAL');
CREATE TYPE "MissionEventType" AS ENUM ('CREATED', 'STARTED', 'COMPLETED', 'SKIPPED', 'RESCHEDULED', 'NOTE_ADDED');

CREATE TABLE "Workspace" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Jerusalem',
    "missionGenerationMinute" INTEGER NOT NULL DEFAULT 480,
    "dailyCapacityMinutes" INTEGER NOT NULL DEFAULT 180,
    "maxDailyMissions" INTEGER NOT NULL DEFAULT 3,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'he-IL',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkspaceMember" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkspaceMember_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Plan" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "parentPlanId" UUID,
    "horizon" "PlanHorizon" NOT NULL,
    "title" TEXT NOT NULL,
    "narrative" TEXT NOT NULL,
    "startDateKey" VARCHAR(10) NOT NULL,
    "endDateKey" VARCHAR(10) NOT NULL,
    "status" "PlanStatus" NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Plan_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Objective" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "planId" UUID NOT NULL,
    "parentObjectiveId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ObjectiveStatus" NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 50,
    "weight" INTEGER NOT NULL DEFAULT 100,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "targetDateKey" VARCHAR(10),
    "metricName" TEXT,
    "metricTarget" DOUBLE PRECISION,
    "metricCurrent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Objective_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkItem" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "objectiveId" UUID NOT NULL,
    "ownerId" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'BACKLOG',
    "estimatedMinutes" INTEGER NOT NULL DEFAULT 30,
    "dueDateKey" VARCHAR(10),
    "availableDateKey" VARCHAR(10),
    "impact" INTEGER NOT NULL DEFAULT 3,
    "urgency" INTEGER NOT NULL DEFAULT 3,
    "strategicFit" INTEGER NOT NULL DEFAULT 3,
    "revenueImpact" INTEGER NOT NULL DEFAULT 1,
    "dependencyUnlock" INTEGER NOT NULL DEFAULT 1,
    "confidence" INTEGER NOT NULL DEFAULT 3,
    "requiredEnergy" "EnergyLevel" NOT NULL DEFAULT 'MEDIUM',
    "blockedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyCheckIn" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "capacityMinutes" INTEGER NOT NULL,
    "energy" "EnergyLevel" NOT NULL,
    "focusText" TEXT,
    "constraints" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyCheckIn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyReflection" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "wins" TEXT,
    "blockers" TEXT,
    "lesson" TEXT,
    "tomorrowNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyReflection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionGenerationRun" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "dateKey" VARCHAR(10) NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "status" "GenerationStatus" NOT NULL DEFAULT 'STARTED',
    "inputSnapshot" JSONB NOT NULL,
    "outputSnapshot" JSONB,
    "errorMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "MissionGenerationRun_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DailyMission" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "workItemId" UUID NOT NULL,
    "generationRunId" UUID,
    "dateKey" VARCHAR(10) NOT NULL,
    "sequence" INTEGER NOT NULL,
    "titleSnapshot" TEXT NOT NULL,
    "objectivePath" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "status" "MissionStatus" NOT NULL DEFAULT 'PLANNED',
    "source" "MissionSource" NOT NULL DEFAULT 'DETERMINISTIC',
    "completionEvidence" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "DailyMission_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MissionEvent" (
    "id" UUID NOT NULL,
    "missionId" UUID NOT NULL,
    "type" "MissionEventType" NOT NULL,
    "note" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MissionEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "workspaceId" UUID NOT NULL,
    "actorId" UUID,
    "eventType" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Workspace_slug_key" ON "Workspace"("slug");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");
CREATE INDEX "WorkspaceMember_userId_isActive_idx" ON "WorkspaceMember"("userId", "isActive");
CREATE INDEX "Plan_workspaceId_horizon_status_idx" ON "Plan"("workspaceId", "horizon", "status");
CREATE INDEX "Plan_parentPlanId_idx" ON "Plan"("parentPlanId");
CREATE INDEX "Objective_workspaceId_status_priority_idx" ON "Objective"("workspaceId", "status", "priority");
CREATE INDEX "Objective_planId_idx" ON "Objective"("planId");
CREATE INDEX "Objective_parentObjectiveId_idx" ON "Objective"("parentObjectiveId");
CREATE INDEX "WorkItem_workspaceId_ownerId_status_idx" ON "WorkItem"("workspaceId", "ownerId", "status");
CREATE INDEX "WorkItem_objectiveId_idx" ON "WorkItem"("objectiveId");
CREATE INDEX "WorkItem_dueDateKey_idx" ON "WorkItem"("dueDateKey");
CREATE UNIQUE INDEX "DailyCheckIn_workspaceId_userId_dateKey_key" ON "DailyCheckIn"("workspaceId", "userId", "dateKey");
CREATE UNIQUE INDEX "DailyReflection_workspaceId_userId_dateKey_key" ON "DailyReflection"("workspaceId", "userId", "dateKey");
CREATE UNIQUE INDEX "MissionGenerationRun_idempotencyKey_key" ON "MissionGenerationRun"("idempotencyKey");
CREATE INDEX "MissionGenerationRun_workspaceId_userId_dateKey_idx" ON "MissionGenerationRun"("workspaceId", "userId", "dateKey");
CREATE UNIQUE INDEX "DailyMission_workspaceId_userId_dateKey_sequence_key" ON "DailyMission"("workspaceId", "userId", "dateKey", "sequence");
CREATE UNIQUE INDEX "DailyMission_workItemId_dateKey_key" ON "DailyMission"("workItemId", "dateKey");
CREATE INDEX "DailyMission_workspaceId_userId_dateKey_status_idx" ON "DailyMission"("workspaceId", "userId", "dateKey", "status");
CREATE INDEX "MissionEvent_missionId_createdAt_idx" ON "MissionEvent"("missionId", "createdAt");
CREATE INDEX "AuditEvent_workspaceId_createdAt_idx" ON "AuditEvent"("workspaceId", "createdAt");
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Plan" ADD CONSTRAINT "Plan_parentPlanId_fkey" FOREIGN KEY ("parentPlanId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Objective" ADD CONSTRAINT "Objective_parentObjectiveId_fkey" FOREIGN KEY ("parentObjectiveId") REFERENCES "Objective"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_objectiveId_fkey" FOREIGN KEY ("objectiveId") REFERENCES "Objective"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyCheckIn" ADD CONSTRAINT "DailyCheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyReflection" ADD CONSTRAINT "DailyReflection_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyReflection" ADD CONSTRAINT "DailyReflection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionGenerationRun" ADD CONSTRAINT "MissionGenerationRun_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MissionGenerationRun" ADD CONSTRAINT "MissionGenerationRun_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DailyMission" ADD CONSTRAINT "DailyMission_generationRunId_fkey" FOREIGN KEY ("generationRunId") REFERENCES "MissionGenerationRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "MissionEvent" ADD CONSTRAINT "MissionEvent_missionId_fkey" FOREIGN KEY ("missionId") REFERENCES "DailyMission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
