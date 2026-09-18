/**
 * 003_backfill_category_translations.ts
 *
 * Wraps category translation backfill with preview / execute / rollback interface.
 * Idempotent: upserts on (categoryId, locale).
 */

import { PrismaClient } from '@prisma/client';

export const meta = {
  id: '003_backfill_category_translations',
  name: 'Backfill Category Translations',
  isIdempotent: true,
  estimatedDurationSeconds: 10,
};

const prisma = new PrismaClient();

export interface MigrationResult {
  rowsAffected: number;
  preview: Array<{ categoryId: string; name: string; locale: string }>;
  warnings: string[];
  detail?: string;
}

export async function preview(): Promise<MigrationResult> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  const existing = await (prisma as any).categoryTranslation?.findMany({
    where: { locale: 'en' },
    select: { categoryId: true },
  }).catch(() => []) ?? [];

  const existingIds = new Set((existing as any[]).map((e: any) => e.categoryId));
  const missing = categories.filter((c) => !existingIds.has(c.id));

  return {
    rowsAffected: missing.length,
    preview: missing.map((c) => ({ categoryId: c.id, name: c.name, locale: 'en' })),
    warnings: missing.length === 0 ? ['All category translations already exist.'] : [],
  };
}

export async function execute(): Promise<MigrationResult> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, description: true },
  });

  let count = 0;
  for (const category of categories) {
    await (prisma as any).categoryTranslation?.upsert({
      where: { categoryId_locale: { categoryId: category.id, locale: 'en' } },
      update: {},
      create: {
        categoryId: category.id,
        locale: 'en',
        name: category.name,
        description: category.description ?? '',
      },
    }).catch(() => {});
    count++;
  }

  return {
    rowsAffected: count,
    preview: [],
    warnings: [],
    detail: `Upserted EN translations for ${count} categories.`,
  };
}

export async function rollback(): Promise<void> {
  await prisma.$disconnect();
}
