-- AlterTable
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "mapProvider" TEXT DEFAULT 'yandex';
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "yandexMapsApiKey" TEXT;
ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "yandexGeocoderApiKey" TEXT;
