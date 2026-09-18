/**
 * Deployment data-strategy mode definitions.
 *
 * Option A — Code + Schema Only (safe default)
 * Option B — Code + Schema + Data Migration (backfill, preserve rows)
 * Option C — Replace Data (destructive wipe + seed)
 */

export type DeployMode = 'A' | 'B' | 'C';

export interface DeployModeConfig {
  id: DeployMode;
  label: string;
  subtitle: string;
  description: string[];
  confirmPhrase: string | null;
  requiresBackup: boolean;
  isDestructive: boolean;
  estimatedSeconds: number;
  badgeColor: 'green' | 'yellow' | 'red';
}

export const DEPLOY_MODES: Record<DeployMode, DeployModeConfig> = {
  A: {
    id: 'A',
    label: 'Code + Schema Only',
    subtitle: 'RECOMMENDED',
    description: [
      'Push code to server',
      'Apply pending Prisma migrations (prisma migrate deploy)',
      'Production data — UNCHANGED',
    ],
    confirmPhrase: null,
    requiresBackup: false,
    isDestructive: false,
    estimatedSeconds: 35,
    badgeColor: 'green',
  },
  B: {
    id: 'B',
    label: 'Code + Schema + Data Migration',
    subtitle: 'SAFE TRANSFORM',
    description: [
      'Push code to server',
      'Apply pending Prisma migrations',
      'Run selected backfill / transformation scripts',
      'All existing rows PRESERVED',
      'Backup created automatically before execution',
    ],
    confirmPhrase: 'MIGRATE-PRODUCTION',
    requiresBackup: true,
    isDestructive: false,
    estimatedSeconds: 120,
    badgeColor: 'yellow',
  },
  C: {
    id: 'C',
    label: 'Replace Data',
    subtitle: '⚠️ DESTRUCTIVE',
    description: [
      'Push code to server',
      'Backup created automatically BEFORE wipe',
      'DROP all tables',
      'Recreate schema from Prisma',
      'Run seed script (fresh data)',
      'ALL current production data will be LOST',
    ],
    confirmPhrase: 'REPLACE-PRODUCTION',
    requiresBackup: true,
    isDestructive: true,
    estimatedSeconds: 150,
    badgeColor: 'red',
  },
};

export const DEFAULT_MODE: DeployMode = 'A';
