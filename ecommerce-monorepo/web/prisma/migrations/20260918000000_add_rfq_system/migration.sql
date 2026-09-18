-- CreateEnum
CREATE TYPE "ProductQuoteStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'PRICED', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- AlterTable SystemSettings
ALTER TABLE "system_settings" ADD COLUMN "defaultSalesWarehouseId" TEXT DEFAULT 'cmu149zqd0007w4gois6udmjc';
ALTER TABLE "system_settings" ADD COLUMN "defaultProcurementWarehouseId" TEXT DEFAULT 'cmu12i65n0000w43wy8bb90uz';
ALTER TABLE "system_settings" ADD COLUMN "retailEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "showBackorderOption" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "backorderLeadTimeDays" INTEGER NOT NULL DEFAULT 28;
ALTER TABLE "system_settings" ADD COLUMN "wholesaleEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "wholesaleApprovalRequired" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "system_settings" ADD COLUMN "wholesaleDefaultMoq" INTEGER NOT NULL DEFAULT 10;
ALTER TABLE "system_settings" ADD COLUMN "wholesaleDiscountPercent" DOUBLE PRECISION DEFAULT 15.0;
ALTER TABLE "system_settings" ADD COLUMN "rfqEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "rfqModel" TEXT NOT NULL DEFAULT 'RFQ';
ALTER TABLE "system_settings" ADD COLUMN "rfqDefaultExpiryDays" INTEGER NOT NULL DEFAULT 7;
ALTER TABLE "system_settings" ADD COLUMN "rfqAllowGuestSubmissions" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "rfqAutoSuggestCatalogPrice" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "system_settings" ADD COLUMN "reservationExpiryHours" INTEGER NOT NULL DEFAULT 24;

-- AlterTable Orders
ALTER TABLE "orders" ADD COLUMN "quoteId" TEXT;

-- CreateIndex on orders.quoteId
CREATE UNIQUE INDEX "orders_quoteId_key" ON "orders"("quoteId");

-- CreateTable product_quotes
CREATE TABLE "product_quotes" (
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

-- CreateTable product_quote_items
CREATE TABLE "product_quote_items" (
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

-- CreateTable product_quote_status_history
CREATE TABLE "product_quote_status_history" (
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

-- CreateTable product_quote_messages
CREATE TABLE "product_quote_messages" (
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

-- CreateIndex
CREATE UNIQUE INDEX "product_quotes_quoteNumber_key" ON "product_quotes"("quoteNumber");
CREATE UNIQUE INDEX "product_quotes_secureToken_key" ON "product_quotes"("secureToken");
CREATE INDEX "product_quotes_userId_idx" ON "product_quotes"("userId");
CREATE INDEX "product_quotes_status_idx" ON "product_quotes"("status");
CREATE INDEX "product_quotes_quoteNumber_idx" ON "product_quotes"("quoteNumber");
CREATE INDEX "product_quotes_secureToken_idx" ON "product_quotes"("secureToken");
CREATE INDEX "product_quotes_createdAt_idx" ON "product_quotes"("createdAt");

-- CreateIndex
CREATE INDEX "product_quote_items_quoteId_idx" ON "product_quote_items"("quoteId");
CREATE INDEX "product_quote_items_productId_idx" ON "product_quote_items"("productId");

-- CreateIndex
CREATE INDEX "product_quote_status_history_quoteId_idx" ON "product_quote_status_history"("quoteId");
CREATE INDEX "product_quote_status_history_createdAt_idx" ON "product_quote_status_history"("createdAt");

-- CreateIndex
CREATE INDEX "product_quote_messages_quoteId_idx" ON "product_quote_messages"("quoteId");
CREATE INDEX "product_quote_messages_createdAt_idx" ON "product_quote_messages"("createdAt");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quotes" ADD CONSTRAINT "product_quotes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_items" ADD CONSTRAINT "product_quote_items_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_items" ADD CONSTRAINT "product_quote_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_status_history" ADD CONSTRAINT "product_quote_status_history_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_quote_messages" ADD CONSTRAINT "product_quote_messages_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "product_quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
