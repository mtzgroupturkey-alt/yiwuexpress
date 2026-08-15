-- CreateTable
CREATE TABLE "system_setting_translations" (
    "id" TEXT NOT NULL,
    "systemSettingId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_setting_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "country_translations" (
    "id" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "country_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "supplier_translations" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "profileText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_translations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_templates" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_template_translations" (
    "id" TEXT NOT NULL,
    "emailTemplateId" TEXT NOT NULL,
    "locale" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "bodyText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_template_translations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_setting_translations_locale_idx" ON "system_setting_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "system_setting_translations_systemSettingId_locale_key_key" ON "system_setting_translations"("systemSettingId", "locale", "key");

-- CreateIndex
CREATE INDEX "country_translations_locale_idx" ON "country_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "country_translations_countryId_locale_key" ON "country_translations"("countryId", "locale");

-- CreateIndex
CREATE INDEX "supplier_translations_locale_idx" ON "supplier_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "supplier_translations_supplierId_locale_key" ON "supplier_translations"("supplierId", "locale");

-- CreateIndex
CREATE UNIQUE INDEX "email_templates_type_key" ON "email_templates"("type");

-- CreateIndex
CREATE INDEX "email_template_translations_locale_idx" ON "email_template_translations"("locale");

-- CreateIndex
CREATE UNIQUE INDEX "email_template_translations_emailTemplateId_locale_key" ON "email_template_translations"("emailTemplateId", "locale");

-- AddForeignKey
ALTER TABLE "system_setting_translations" ADD CONSTRAINT "system_setting_translations_systemSettingId_fkey" FOREIGN KEY ("systemSettingId") REFERENCES "system_settings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "country_translations" ADD CONSTRAINT "country_translations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "supplier_translations" ADD CONSTRAINT "supplier_translations_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_template_translations" ADD CONSTRAINT "email_template_translations_emailTemplateId_fkey" FOREIGN KEY ("emailTemplateId") REFERENCES "email_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;
