-- CreateTable
CREATE TABLE "breadcrumb_settings" (
    "id" TEXT NOT NULL,
    "pageType" TEXT NOT NULL,
    "pageSlug" TEXT,
    "categoryId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "mobileImageUrl" TEXT,
    "overlayColor" TEXT,
    "title" TEXT,
    "subtitle" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breadcrumb_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "breadcrumb_settings_pageType_pageSlug_key" ON "breadcrumb_settings"("pageType", "pageSlug");

-- CreateIndex
CREATE UNIQUE INDEX "breadcrumb_settings_pageType_categoryId_key" ON "breadcrumb_settings"("pageType", "categoryId");

-- AddForeignKey
ALTER TABLE "breadcrumb_settings" ADD CONSTRAINT "breadcrumb_settings_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
