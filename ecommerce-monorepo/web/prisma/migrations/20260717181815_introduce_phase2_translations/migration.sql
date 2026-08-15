-- CreateTable
CREATE TABLE "contact_location_translations" (
    "id" TEXT NOT NULL,
    "contactLocationId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "hours" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_location_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_translations" (
    "id" TEXT NOT NULL,
    "attributeId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attribute_value_translations" (
    "id" TEXT NOT NULL,
    "attributeValueId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "attribute_value_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_banner_translations" (
    "id" TEXT NOT NULL,
    "pageBannerId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "title" TEXT,
    "subtitle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "page_banner_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipping_method_translations" (
    "id" TEXT NOT NULL,
    "shippingMethodId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipping_method_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contact_location_translations_locale_idx" ON "contact_location_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "contact_location_translations_contactLocationId_locale_key" ON "contact_location_translations"("contactLocationId", "locale");

-- CreateIndex
CREATE INDEX "attribute_translations_locale_idx" ON "attribute_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_translations_attributeId_locale_key" ON "attribute_translations"("attributeId", "locale");

-- CreateIndex
CREATE INDEX "attribute_value_translations_locale_idx" ON "attribute_value_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "attribute_value_translations_attributeValueId_locale_key" ON "attribute_value_translations"("attributeValueId", "locale");

-- CreateIndex
CREATE INDEX "page_banner_translations_locale_idx" ON "page_banner_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "page_banner_translations_pageBannerId_locale_key" ON "page_banner_translations"("pageBannerId", "locale");

-- CreateIndex
CREATE INDEX "shipping_method_translations_locale_idx" ON "shipping_method_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "shipping_method_translations_shippingMethodId_locale_key" ON "shipping_method_translations"("shippingMethodId", "locale");

-- AddForeignKey
ALTER TABLE "contact_location_translations" ADD CONSTRAINT "contact_location_translations_contactLocationId_fkey" FOREIGN KEY ("contactLocationId") REFERENCES "contact_locations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_translations" ADD CONSTRAINT "attribute_translations_attributeId_fkey" FOREIGN KEY ("attributeId") REFERENCES "attributes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attribute_value_translations" ADD CONSTRAINT "attribute_value_translations_attributeValueId_fkey" FOREIGN KEY ("attributeValueId") REFERENCES "attribute_values"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_banner_translations" ADD CONSTRAINT "page_banner_translations_pageBannerId_fkey" FOREIGN KEY ("pageBannerId") REFERENCES "breadcrumb_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipping_method_translations" ADD CONSTRAINT "shipping_method_translations_shippingMethodId_fkey" FOREIGN KEY ("shippingMethodId") REFERENCES "shipping_methods"("id") ON DELETE CASCADE ON UPDATE CASCADE;
