-- AlterEnum
ALTER TYPE "AttributeType" ADD VALUE 'COLOR_MULTI';

-- AlterTable
ALTER TABLE "attributes" ADD COLUMN     "colorOptions" JSONB;
