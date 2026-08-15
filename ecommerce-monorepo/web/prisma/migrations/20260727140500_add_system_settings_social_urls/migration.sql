ALTER TABLE "system_settings"
ADD COLUMN "instagramUrl" TEXT,
ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "twitterUrl" TEXT;

ALTER TABLE "system_settings"
ALTER COLUMN "companyName" SET DEFAULT 'Global Trade';
