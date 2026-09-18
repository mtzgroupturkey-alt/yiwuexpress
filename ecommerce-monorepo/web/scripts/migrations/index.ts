/**
 * Migration script registry.
 * Each entry is a script that can be selected for Option B (data migration).
 */

export interface MigrationScriptMeta {
  id: string;
  name: string;
  description: string;
  isIdempotent: boolean;
  estimatedDurationSeconds: number;
  estimatedRows: string;
  /** Path relative to scripts/migrations/ (without .ts) */
  file: string;
}

export const MIGRATION_SCRIPTS: MigrationScriptMeta[] = [
  {
    id: '002_backfill_product_translations',
    name: 'Backfill Product Translations',
    description: 'Copies name/description from Product rows into ProductTranslation table (EN locale). Safe to run multiple times.',
    isIdempotent: true,
    estimatedDurationSeconds: 15,
    estimatedRows: 'up to 500 products',
    file: '002_backfill_product_translations',
  },
  {
    id: '003_backfill_category_translations',
    name: 'Backfill Category Translations',
    description: 'Copies name/description from Category rows into CategoryTranslation table (EN locale).',
    isIdempotent: true,
    estimatedDurationSeconds: 10,
    estimatedRows: 'up to 200 categories',
    file: '003_backfill_category_translations',
  },
  {
    id: '004_sync_category_levels',
    name: 'Sync Category Levels',
    description: 'Recalculates the `level` field on all Category rows based on parentId hierarchy.',
    isIdempotent: true,
    estimatedDurationSeconds: 5,
    estimatedRows: 'all categories',
    file: '004_sync_category_levels',
  },
  {
    id: '005_ensure_system_settings',
    name: 'Ensure System Settings Row',
    description: 'Creates the SystemSettings singleton row if it does not exist (company name, logos, social links).',
    isIdempotent: true,
    estimatedDurationSeconds: 2,
    estimatedRows: '1 row',
    file: '005_ensure_system_settings',
  },
];

export function getScriptById(id: string): MigrationScriptMeta | undefined {
  return MIGRATION_SCRIPTS.find((s) => s.id === id);
}
