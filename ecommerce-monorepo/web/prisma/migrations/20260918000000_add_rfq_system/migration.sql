-- CreateEnum (idempotent)
DO $$ BEGIN
  CREATE TYPE "ProductQuoteStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PRICED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable SystemSettings (idempotent via IF NOT EXISTS)
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "defaultSalesWarehouseId" TEXT DEFAULT 'cmu149zqd0007w4gois6udmjc';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "defaultProcurementWarehouseId" TEXT DEFAULT 'cmu12i65n0000w43wy8bb90uz';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "retailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "showBackorderOption" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "backorderLeadTimeDays" INTEGER NOT NULL DEFAULT 28;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "wholesaleApprovalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "wholesaleDefaultMoq" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "wholesaleDiscountPercent" DOUBLE PRECISION DEFAULT 15.0;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "rfqEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "rfqModel" TEXT NOT NULL DEFAULT 'RFQ';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "rfqDefaultExpiryDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "rfqAllowGuestSubmissions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "rfqAutoSuggestCatalogPrice" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "reservationExpiryHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable Orders (idempotent)
ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "quoteId" TEXT;

-- CreateIndex on orders.quoteId (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "orders_quoteId_key" ON "orders"("quoteId");

-- CreateTable product_quotes (idempotent)
CREATE TABLE IF NOT EXISTS "product_quotes" (
    "id" TEXT NOT NULL,
    "quoteNumber" TEXT NOT NULL,
    "userId" TEXT,
    "guestEmail" TEXT,
    "guestName" TEXT,
    "guestCompany" TEXT,
    "guestPhone" TEXT,
    "guestTaxId" TEXT,
    "shippingCountry" TEXT DEFAULT 'Belarus',
    "shippingCity" TEXT,
    "shippingAddress" TEXT,
    "targetDeliveryDate" TIMESTAMP(3),
    "preferredShippingMode" TEXT,
    "status" "ProductQuoteStatus" NOT NULL DEFAULT 'PENDING',
    "secureToken" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "subtotal" DOUBLE PRECISION,
    "shippingCost" DOUBLE PRECISION,
    "discountAmount" DOUBLE PRECISION DEFAULT 0.0,
    "totalAmount" DOUBLE PRECISION,
    "paymentTerms" TEXT DEFAULT 'PREPAYMENT',
    "validUntil" TIMESTAMP(3),
    "customerNotes" TEXT,
    "adminNotes" TEXT,
    "internalNotes" TEXT,
    "rejectionReason" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_quote_items (idempotent)
CREATE TABLE IF NOT EXISTS "product_quote_items" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productImage" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceRequested" DOUBLE PRECISION,
    "unitPriceQuoted" DOUBLE PRECISION,
    "lineDiscountPercent" DOUBLE PRECISION DEFAULT 0.0,
    "lineTotal" DOUBLE PRECISION,
    "sourceWarehouseId" TEXT,
    "isBackorder" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeDays" INTEGER DEFAULT 0,
    "customerNotes" TEXT,
    "adminNotes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_quote_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_quote_status_history (idempotent)
CREATE TABLE IF NOT EXISTS "product_quote_status_history" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "fromStatus" "ProductQuoteStatus",
    "toStatus" "ProductQuoteStatus" NOT NULL,
    "changedByUserId" TEXT,
    "changedByRole" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_quote_status_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable product_quote_messages (idempotent)
CREATE TABLE IF NOT EXISTS "product_quote_messages" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "senderType" TEXT NOT NULL,
    "senderId" TEXT,
    "senderName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "attachments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_quote_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS "product_quotes_quoteNumber_key" ON "product_quotes"("quoteNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "product_quotes_secureToken_key" ON "product_quotes"("secureToken");
CREATE INDEX IF NOT EXISTS "product_quotes_userId_idx" ON "product_quotes"("userId");
CREATE INDEX IF NOT EXISTS "product_quotes_status_idx" ON "product_quotes"("status");
CREATE INDEX IF NOT EXISTS "product_quotes_quoteNumber_idx" ON "product_quotes"("quoteNumber");
CREATE INDEX IF NOT EXISTS "product_quotes_secureToken_idx" ON "product_quotes"("secureToken");
CREATE INDEX IF NOT EXISTS "product_quotes_createdAt_idx" ON "product_quotes"("createdAt");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "product_quote_items_quoteId_idx" ON "product_quote_items"("quoteId");
CREATE INDEX IF NOT EXISTS "product_quote_items_productId_idx" ON "product_quote_items"("productId");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "product_quote_status_history_quoteId_idx" ON "product_quote_status_history"("quoteId");
CREATE INDEX IF NOT EXISTS "product_quote_status_history_createdAt_idx" ON "product_quote_status_history"("createdAt");

-- CreateIndex (idempotent)
CREATE INDEX IF NOT EXISTS "product_quote_messages_quoteId_idx" ON "product_quote_messages"("quoteId");
CREATE INDEX IF NOT EXISTS "product_quote_messages_createdAt_idx" ON "product_quote_messages"("createdAt");

-- AddForeignKey (idempotent via DO block)
DO $$ BEGIN
  ALTER TABLE "orders" ADD CONSTRAINT "orders_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_quotes" ADD CONSTRAINT "product_quotes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_quote_items" ADD CONSTRAINT "product_quote_items_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_quote_items" ADD CONSTRAINT "product_quote_items_productId_fkey"
    FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_quote_status_history" ADD CONSTRAINT "product_quote_status_history_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "product_quote_messages" ADD CONSTRAINT "product_quote_messages_quoteId_fkey"
    FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
