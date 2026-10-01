-- Migration: add_cart_mode_column
-- Adds the `mode` column to carts and cart_items tables.
-- The column was added to Prisma schema but no migration SQL was created,
-- causing 500 errors on production where the column does not exist.

-- carts table
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL';

-- cart_items table
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL';
