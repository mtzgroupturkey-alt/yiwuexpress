-- Enforce the SystemSettings singleton at the database level.
--
-- SystemSettings is an intended singleton, but `id` is a random cuid with no unique
-- constraint. Different code paths (findFirst with no orderBy, upsert on a guessed id,
-- create()) could read and write different rows, so an admin "save store mode" could
-- succeed while the storefront kept reading a stale row. This migration collapses any
-- duplicate rows onto one canonical row and adds a unique `singletonKey` so the app can
-- address the single row deterministically (upsert/findUnique on singletonKey).
--
-- Runs in a transaction on Postgres (Prisma migrate), so it is atomic: if dedup leaves
-- more than one row, the unique-index creation fails and the whole migration rolls back.

-- 1. Re-point translation children of any non-canonical row onto the canonical row
--    (newest updatedAt, tie-broken by id ASC), skipping (locale,key) pairs the canonical
--    row already has so we do not violate the (systemSettingId, locale, key) unique.
UPDATE "system_setting_translations" t
SET "systemSettingId" = c."id"
FROM (SELECT "id" FROM "system_settings" ORDER BY "updatedAt" DESC, "id" ASC LIMIT 1) c
WHERE t."systemSettingId" <> c."id"
  AND NOT EXISTS (
    SELECT 1 FROM "system_setting_translations" x
    WHERE x."systemSettingId" = c."id"
      AND x."locale" = t."locale"
      AND x."key" = t."key"
  );

-- 2. Delete every non-canonical row. Any translations still attached to them (the
--    colliding (locale,key) pairs left behind in step 1) cascade-delete via the FK's
--    onDelete: Cascade, keeping the canonical row's copies.
DELETE FROM "system_settings"
WHERE "id" <> (SELECT "id" FROM "system_settings" ORDER BY "updatedAt" DESC, "id" ASC LIMIT 1);

-- 3. Add the singleton key (backfills the one remaining row to 'SINGLETON') and lock it
--    unique. Index name matches Prisma's convention (<table>_<column>_key) so `migrate dev`
--    does not later report drift.
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "singletonKey" TEXT NOT NULL DEFAULT 'SINGLETON';
CREATE UNIQUE INDEX IF NOT EXISTS "system_settings_singletonKey_key" ON "system_settings"("singletonKey");
