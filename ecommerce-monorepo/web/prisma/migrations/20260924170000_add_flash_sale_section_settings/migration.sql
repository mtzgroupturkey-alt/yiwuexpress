-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleStartDate" TIMESTAMP(3);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleEndDate" TIMESTAMP(3);
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleTitle" TEXT DEFAULT 'Seasonal Discounts & Flash Home Deals';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleSubtitle" TEXT DEFAULT 'Special prices on furniture, kitchenware, and smart living appliances';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "flashSaleBadgeText" TEXT DEFAULT 'LIMITED QUANTITY';
