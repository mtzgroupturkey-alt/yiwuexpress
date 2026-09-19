-- Migration: sync_system_settings_fields
-- Ensures all columns on system_settings, and the return_to_supplier tables exist idempotently.

-- 1. Create Enums if not exist
DO $$ BEGIN
  CREATE TYPE "ReturnStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'SHIPPED', 'RECEIVED', 'COMPLETED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "RefundMethod" AS ENUM ('STORE_CREDIT', 'BANK_TRANSFER', 'REPLACE_GOODS', 'ORIGINAL_PAYMENT');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. AlterTable system_settings: add missing columns safely with IF NOT EXISTS
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeHours" TEXT DEFAULT '08:00 – 23:00';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "freeShippingThreshold" DOUBLE PRECISION DEFAULT 35.00;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "announcementTicker" TEXT;

-- AI provider keys and models
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openaiApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openaiBaseUrl" TEXT DEFAULT 'https://llm.gcat.ir/v1';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openaiModel" TEXT DEFAULT 'gpt-4o';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT 'openai';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "deepseekApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "qwenApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "kimiApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "cerebrasApiKey" TEXT;

-- 3. CreateTable returns_to_supplier (idempotent)
CREATE TABLE IF NOT EXISTS "returns_to_supplier" (
    "id" TEXT NOT NULL,
    "returnNumber" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "purchaseOrderId" TEXT,
    "status" "ReturnStatus" NOT NULL DEFAULT 'DRAFT',
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "refundMethod" "RefundMethod" NOT NULL DEFAULT 'STORE_CREDIT',
    "notes" TEXT,
    "shippedAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "returns_to_supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable return_to_supplier_items (idempotent)
CREATE TABLE IF NOT EXISTS "return_to_supplier_items" (
    "id" TEXT NOT NULL,
    "returnId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "return_to_supplier_items_pkey" PRIMARY KEY ("id")
);

-- Unique index on returnNumber
CREATE UNIQUE INDEX IF NOT EXISTS "returns_to_supplier_returnNumber_key" ON "returns_to_supplier"("returnNumber");

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "returns_to_supplier_supplierId_idx" ON "returns_to_supplier"("supplierId");
CREATE INDEX IF NOT EXISTS "returns_to_supplier_warehouseId_idx" ON "returns_to_supplier"("warehouseId");
CREATE INDEX IF NOT EXISTS "returns_to_supplier_status_idx" ON "returns_to_supplier"("status");
CREATE INDEX IF NOT EXISTS "return_to_supplier_items_returnId_idx" ON "return_to_supplier_items"("returnId");
CREATE INDEX IF NOT EXISTS "return_to_supplier_items_productId_idx" ON "return_to_supplier_items"("productId");
