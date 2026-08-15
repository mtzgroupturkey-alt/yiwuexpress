-- CreateTable
CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "deploymentNumber" TEXT NOT NULL,
    "environment" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'in-progress',
    "type" TEXT NOT NULL DEFAULT 'deploy',
    "branch" TEXT,
    "commitHash" TEXT,
    "commitMessage" TEXT,
    "triggeredBy" TEXT,
    "metadata" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "logs" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);
