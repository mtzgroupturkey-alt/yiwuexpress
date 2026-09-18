/**
 * 004_sync_category_levels.ts
 *
 * Recalculates the `level` field on all Category rows based on parentId hierarchy.
 * Root categories = level 0, children = level 1, grandchildren = level 2, etc.
 * Idempotent: updating the same value is a no-op.
 */

import { PrismaClient } from '@prisma/client';

export const meta = {
  id: '004_sync_category_levels',
  name: 'Sync Category Levels',
  isIdempotent: true,
  estimatedDurationSeconds: 5,
};

const prisma = new PrismaClient();

export interface MigrationResult {
  rowsAffected: number;
  preview: Array<{ id: string; name: string; currentLevel: number | null; newLevel: number }>;
  warnings: string[];
  detail?: string;
}

type CategoryRow = { id: string; name: string; parentId: string | null; level: number | null };

function computeLevels(categories: CategoryRow[]): Map<string, number> {
  const parentMap = new Map<string, string | null>(
    categories.map((c) => [c.id, c.parentId])
  );
  const levelMap = new Map<string, number>();

  function getLevel(id: string, visited = new Set<string>()): number {
    if (levelMap.has(id)) return levelMap.get(id)!;
    if (visited.has(id)) return 0; // cycle guard
    visited.add(id);
    const parentId = parentMap.get(id);
    const level = parentId ? getLevel(parentId, visited) + 1 : 0;
    levelMap.set(id, level);
    return level;
  }

  for (const cat of categories) {
    getLevel(cat.id);
  }
  return levelMap;
}

export async function preview(): Promise<MigrationResult> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true, level: true },
  });

  const computed = computeLevels(categories);
  const changes = categories
    .filter((c) => computed.get(c.id) !== (c.level ?? 0))
    .map((c) => ({
      id: c.id,
      name: c.name,
      currentLevel: c.level,
      newLevel: computed.get(c.id) ?? 0,
    }));

  return {
    rowsAffected: changes.length,
    preview: changes,
    warnings: changes.length === 0 ? ['All category levels are already correct.'] : [],
  };
}

export async function execute(): Promise<MigrationResult> {
  const categories = await prisma.category.findMany({
    select: { id: true, name: true, parentId: true, level: true },
  });

  const computed = computeLevels(categories);
  const toUpdate = categories.filter(
    (c) => computed.get(c.id) !== (c.level ?? 0)
  );

  await prisma.$transaction(
    toUpdate.map((c) =>
      prisma.category.update({
        where: { id: c.id },
        data: { level: computed.get(c.id) ?? 0 },
      })
    )
  );

  return {
    rowsAffected: toUpdate.length,
    preview: [],
    warnings: [],
    detail: `Updated level field on ${toUpdate.length} categories.`,
  };
}

export async function rollback(): Promise<void> {
  // Level is a computed/derived field — rollback is restore from backup.
  await prisma.$disconnect();
}
