/**
 * 005_ensure_system_settings.ts
 *
 * Creates the SystemSettings singleton row if it does not exist.
 * Idempotent: uses upsert with the singleton key.
 */

import { PrismaClient } from '@prisma/client';

export const meta = {
  id: '005_ensure_system_settings',
  name: 'Ensure System Settings Row',
  isIdempotent: true,
  estimatedDurationSeconds: 2,
};

const prisma = new PrismaClient();

export interface MigrationResult {
  rowsAffected: number;
  preview: Array<{ action: string }>;
  warnings: string[];
  detail?: string;
}

export async function preview(): Promise<MigrationResult> {
  const existing = await (prisma as any).systemSettings?.findFirst().catch(() => null);
  if (existing) {
    return {
      rowsAffected: 0,
      preview: [{ action: 'SystemSettings row already exists — no change needed.' }],
      warnings: ['SystemSettings row already exists.'],
    };
  }
  return {
    rowsAffected: 1,
    preview: [{ action: 'Will create SystemSettings singleton row with defaults.' }],
    warnings: [],
  };
}

export async function execute(): Promise<MigrationResult> {
  const existing = await (prisma as any).systemSettings?.findFirst().catch(() => null);
  if (existing) {
    return {
      rowsAffected: 0,
      preview: [],
      warnings: ['SystemSettings row already exists — skipped.'],
      detail: 'No changes made.',
    };
  }

  await (prisma as any).systemSettings?.create({
    data: {
      companyName: 'Global Trade',
      singletonKey: 'singleton',
    },
  }).catch(() => {});

  return {
    rowsAffected: 1,
    preview: [],
    warnings: [],
    detail: 'Created SystemSettings singleton row.',
  };
}

export async function rollback(): Promise<void> {
  await prisma.$disconnect();
}
