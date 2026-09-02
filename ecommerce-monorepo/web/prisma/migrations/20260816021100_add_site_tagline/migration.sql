-- Reconciliation migration. `siteTagline` was previously created with `prisma db push`,
-- which records no migration history, leaving this folder empty and the migration
-- unrecorded in `_prisma_migrations`. Idempotent: safe whether or not the column exists,
-- so `migrate deploy` heals both a fresh DB and one already patched via db push.
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "siteTagline" TEXT;
