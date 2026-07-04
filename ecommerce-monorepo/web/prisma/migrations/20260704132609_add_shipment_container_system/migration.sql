-- AlterTable
ALTER TABLE "Shipment" ADD COLUMN     "currentLocation" TEXT,
ADD COLUMN     "dimensions" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingMethodId" TEXT,
ADD COLUMN     "statusHistory" JSONB,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "carrierType" TEXT NOT NULL DEFAULT 'COMPANY',
ADD COLUMN     "containerId" TEXT,
ADD COLUMN     "containerNumber" TEXT,
ADD COLUMN     "customerCarrier" TEXT,
ADD COLUMN     "customerCarrierContact" TEXT,
ADD COLUMN     "customerCarrierNotes" TEXT,
ADD COLUMN     "customerCarrierTracking" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION,
ADD COLUMN     "shippingMethod" TEXT;

-- CreateTable
CREATE TABLE "shipping_methods" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "defaultStatuses" JSONB,
    "customStatusesAllowed" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "containers" (
    "id" TEXT NOT NULL,
    "containerNumber" TEXT NOT NULL,
    "shippingMethodId" TEXT,
    "vesselName" TEXT,
    "voyageNumber" TEXT,
    "methodDetails" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "statusHistory" JSONB,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "transitPoints" JSONB,
    "estimatedDeparture" TIMESTAMP(3),
    "estimatedArrival" TIMESTAMP(3),
    "actualDeparture" TIMESTAMP(3),
    "actualArrival" TIMESTAMP(3),
    "containerType" TEXT,
    "weight" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "containers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "shipping_methods_slug_key" ON "shipping_methods"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "containers_containerNumber_key" ON "containers"("containerNumber");

-- CreateIndex
CREATE INDEX "containers_containerNumber_idx" ON "containers"("containerNumber");

-- CreateIndex
CREATE INDEX "containers_status_idx" ON "containers"("status");

-- CreateIndex
CREATE INDEX "Shipment_orderId_idx" ON "Shipment"("orderId");

-- CreateIndex
CREATE INDEX "Shipment_trackingNumber_idx" ON "Shipment"("trackingNumber");

-- CreateIndex
CREATE INDEX "Shipment_status_idx" ON "Shipment"("status");

-- CreateIndex
CREATE INDEX "orders_containerId_idx" ON "orders"("containerId");

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_containerId_fkey" FOREIGN KEY ("containerId") REFERENCES "containers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "containers" ADD CONSTRAINT "containers_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE SET NULL ON UPDATE CASCADE;
