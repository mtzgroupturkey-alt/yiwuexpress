-- Add featured and new arrival ordering fields to products table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "featuredOrder" INTEGER DEFAULT 999;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isNewArrival" BOOLEAN DEFAULT false;
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "newArrivalOrder" INTEGER DEFAULT 999;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "idx_products_featured" ON "products"("isFeatured", "featuredOrder");
CREATE INDEX IF NOT EXISTS "idx_products_new_arrival" ON "products"("isNewArrival", "newArrivalOrder");
