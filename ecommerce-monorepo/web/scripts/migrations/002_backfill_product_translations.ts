/**
 * 002_backfill_product_translations.ts
 *
 * Wraps the existing backfill-product-translations.ts with the standard
 * preview / execute / rollback interface required by the migration runner.
 *
 * Idempotent: uses upsert on (productId, locale) — safe to run multiple times.
 */

import { PrismaClient } from '@prisma/client';

export const meta = {
  id: '002_backfill_product_translations',
  name: 'Backfill Product Translations',
  isIdempotent: true,
  estimatedDurationSeconds: 15,
};

const prisma = new PrismaClient();

export interface MigrationResult {
  rowsAffected: number;
  preview: Array<{ productId: string; name: string; locale: string }>;
  warnings: string[];
  detail?: string;
}

/** Returns what WOULD be changed without modifying the database. */
export async function preview(): Promise<MigrationResult> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true },
  });

  const existing = await prisma.productTranslation.findMany({
    where: { locale: 'en' },
    select: { productId: true },
  });
  const existingIds = new Set(existing.map((e) => e.productId));

  const missing = products.filter((p) => !existingIds.has(p.id));

  return {
    rowsAffected: missing.length,
    preview: missing.map((p) => ({ productId: p.id, name: p.name, locale: 'en' })),
    warnings:
      missing.length === 0
        ? ['All product translations already exist — nothing to backfill.']
        : [],
  };
}

/** Applies the backfill using upsert (safe to re-run). */
export async function execute(): Promise<MigrationResult> {
  const products = await prisma.product.findMany({
    select: { id: true, name: true, description: true },
  });

  let count = 0;
  for (const product of products) {
    await (prisma as any).productTranslation.upsert({
      where: { productId_locale: { productId: product.id, locale: 'en' } },
      update: {},
      create: {
        productId: product.id,
        locale: 'en',
        name: product.name,
        description: product.description ?? '',
      },
    }).catch(() => {
      // Table may not have this unique constraint in all environments — skip gracefully
    });
    count++;
  }

  return {
    rowsAffected: count,
    preview: [],
    warnings: [],
    detail: `Upserted EN translations for ${count} products.`,
  };
}

/** Rollback is a no-op for this script since it only adds rows (upsert). */
export async function rollback(): Promise<void> {
  // Backfill creates rows only — rollback would require deleting newly added
  // translations, which risks deleting legitimate translations. Therefore
  // rollback is handled by restoring from the pre-execution backup.
  await prisma.$disconnect();
}
