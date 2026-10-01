-- Migration: add_cart_items_selected_options
-- Adds missing columns across tables that exist in schema.prisma but were missing from migration files.
-- Idempotent using ADD COLUMN IF NOT EXISTS.

-- 1. Cart and Order Items
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB;
ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL';
ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL';
ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB;

-- 2. System Settings & AI Providers
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeMode" TEXT DEFAULT 'WHOLESALE';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "deepseekApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "qwenApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "kimiApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "cerebrasApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT 'openai';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "facebookUrl" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "wechatId" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "whatsappNumber" TEXT;

-- 3. Products
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "availableForRetail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "availableForWholesale" BOOLEAN NOT NULL DEFAULT true;

-- 4. User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "userType" TEXT NOT NULL DEFAULT 'BUYER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationNotes" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verifiedAt" TIMESTAMP(3);

-- 5. Orders
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "reservationExpiresAt" TIMESTAMP(3);
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "isDirectContainer" BOOLEAN NOT NULL DEFAULT false;
