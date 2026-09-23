-- Migration: add_attribute_translation_fields
-- Safely add placeholder and helperText columns to attribute_translations table

ALTER TABLE "attribute_translations" ADD COLUMN IF NOT EXISTS "placeholder" TEXT;
ALTER TABLE "attribute_translations" ADD COLUMN IF NOT EXISTS "helperText" TEXT;
