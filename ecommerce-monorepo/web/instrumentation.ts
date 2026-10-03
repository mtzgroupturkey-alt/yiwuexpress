/**
 * Next.js Instrumentation Hook
 * Runs once at server startup (before any request handler).
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // -------------------------------------------------------------------------
    // 1. Fix IPv6 fetch failures on Linux (Ubuntu 24.04 production).
    //    Node.js on Linux defaults to IPv6 DNS (AAAA records first).
    //    If the server lacks full IPv6 routing, all outbound fetch() calls to
    //    external AI providers (openrouter.ai, llm.gcat.ir, etc.) fail silently.
    // -------------------------------------------------------------------------
    const dns = await import('dns')
    if (typeof dns.setDefaultResultOrder === 'function') {
      dns.setDefaultResultOrder('ipv4first')
    }

    // -------------------------------------------------------------------------
    // 2. Apply safe DB schema patches.
    //    These ALTER TABLE ... IF NOT EXISTS statements are idempotent —
    //    safe to run on every startup. They fix columns added to schema.prisma
    //    that were never included in a formal migration SQL file.
    // -------------------------------------------------------------------------
    try {
      const { PrismaClient } = await import('@prisma/client')
      const prisma = new PrismaClient()
      await Promise.all([
        // Cart and order columns
        prisma.$executeRawUnsafe(
          `ALTER TABLE "carts" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL'`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "mode" TEXT NOT NULL DEFAULT 'RETAIL'`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "cart_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "order_items" ADD COLUMN IF NOT EXISTS "selectedOptions" JSONB`
        ),
        // System settings columns
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "openrouterApiKey" TEXT`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "geminiApiKey" TEXT`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "primaryAiProvider" TEXT DEFAULT 'openai'`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "storeMode" TEXT DEFAULT 'WHOLESALE'`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiApiKey" TEXT`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiBaseUrl" TEXT DEFAULT 'https://api.z.ai/api/paas/v4'`
        ),
        prisma.$executeRawUnsafe(
          `ALTER TABLE "system_settings" ADD COLUMN IF NOT EXISTS "zaiModel" TEXT DEFAULT 'glm-4.7-flash'`
        ),
      ])
      await prisma.$disconnect()
      console.log('[Startup] DB schema patches applied successfully.')
    } catch (err) {
      // Non-fatal: log and continue. The app can still serve most pages.
      console.warn('[Startup] DB schema patch warning:', err instanceof Error ? err.message : err)
    }
  }
}
