-- Add motionType column to hero_slides table
ALTER TABLE "hero_slides" 
ADD COLUMN IF NOT EXISTS "motionType" TEXT NOT NULL DEFAULT 'slide';

-- Add comment to the column
COMMENT ON COLUMN "hero_slides"."motionType" IS 'Animation type: slide, fade, zoom, flip, rotate, scale';
