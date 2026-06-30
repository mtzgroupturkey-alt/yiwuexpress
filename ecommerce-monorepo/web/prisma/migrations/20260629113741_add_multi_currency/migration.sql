-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "exchangeRate" DOUBLE PRECISION,
ADD COLUMN     "profit" DOUBLE PRECISION,
ADD COLUMN     "profitMargin" DOUBLE PRECISION,
ADD COLUMN     "purchaseCost" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "prices" JSONB,
ADD COLUMN     "purchaseCurrency" TEXT,
ADD COLUMN     "purchasePrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "purchase_orders" ADD COLUMN     "costInBase" DOUBLE PRECISION,
ADD COLUMN     "exchangeRate" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "currencies" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "symbolPosition" TEXT NOT NULL DEFAULT 'before',
    "decimalPlaces" INTEGER NOT NULL DEFAULT 2,
    "isBase" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "exchangeRate" DOUBLE PRECISION,
    "exchangeRateUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "currencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exchange_rate_history" (
    "id" TEXT NOT NULL,
    "fromCurrency" TEXT NOT NULL,
    "toCurrency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "currencies_code_key" ON "currencies"("code");

-- CreateIndex
CREATE INDEX "exchange_rate_history_fromCurrency_toCurrency_date_idx" ON "exchange_rate_history"("fromCurrency", "toCurrency", "date");
