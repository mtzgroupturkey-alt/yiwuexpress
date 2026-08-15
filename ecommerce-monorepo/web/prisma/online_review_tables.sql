-- ============================================================================
--  ONLINE DEPLOY: create ONLY the review tables (idempotent / safe to re-run)
--  Run with:  psql "$DATABASE_URL" -f prisma/online_review_tables.sql
--  or:        npx prisma db execute --schema prisma/schema.prisma --file prisma/online_review_tables.sql
--
--  This does NOT alter any other table (products, users, etc.) and will not
--  drop or overwrite existing data. Uses IF NOT EXISTS so re-running is safe.
-- ============================================================================

-- CreateTable: reviews
CREATE TABLE IF NOT EXISTS "reviews" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "images" TEXT[],
    "isVerifiedPurchase" BOOLEAN NOT NULL DEFAULT false,
    "isApproved" BOOLEAN NOT NULL DEFAULT false,
    "helpfulCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable: review_replies
CREATE TABLE IF NOT EXISTS "review_replies" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "comment" TEXT NOT NULL,
    "isAdminReply" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "review_replies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "reviews_productId_idx" ON "reviews"("productId");
CREATE INDEX IF NOT EXISTS "reviews_userId_idx" ON "reviews"("userId");
CREATE INDEX IF NOT EXISTS "reviews_isApproved_idx" ON "reviews"("isApproved");
CREATE INDEX IF NOT EXISTS "review_replies_reviewId_idx" ON "review_replies"("reviewId");
CREATE INDEX IF NOT EXISTS "review_replies_userId_idx" ON "review_replies"("userId");

-- AddForeignKey (skipped gracefully if FKs already exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reviews_productId_fkey'
    ) THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_productId_fkey"
            FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'reviews_userId_fkey'
    ) THEN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_replies_reviewId_fkey'
    ) THEN
        ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_reviewId_fkey"
            FOREIGN KEY ("reviewId") REFERENCES "reviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'review_replies_userId_fkey'
    ) THEN
        ALTER TABLE "review_replies" ADD CONSTRAINT "review_replies_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
