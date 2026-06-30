-- AlterTable
ALTER TABLE "purchase_order_items" ADD COLUMN     "variantAttributes" JSONB,
ADD COLUMN     "variantId" TEXT,
ADD COLUMN     "variantName" TEXT;

-- AddForeignKey
ALTER TABLE "purchase_order_items" ADD CONSTRAINT "purchase_order_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;
