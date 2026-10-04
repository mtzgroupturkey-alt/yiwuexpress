-- DropIndex
DROP INDEX IF EXISTS "policy_rules_key_key";

-- AlterTable
ALTER TABLE "policy_rules" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS "isLatest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS "supersededBy" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "policy_rules_key_isLatest_idx" ON "policy_rules"("key", "isLatest");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "policy_rules_key_version_key" ON "policy_rules"("key", "version");
