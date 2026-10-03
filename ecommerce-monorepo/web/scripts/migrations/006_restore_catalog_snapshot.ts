import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export const meta = {
  id: '006_restore_catalog_snapshot',
  name: 'Sync Full Catalog Snapshot (6,743 products & 122 categories)',
  description: 'Imports the complete Scandinavian catalog snapshot with all categories, products, and trilingual translations (EN, RU, ZH).',
  isIdempotent: true,
  estimatedDurationSeconds: 15,
  estimatedRows: '6,743 products, 122 categories, 20,229 translations',
  file: '006_restore_catalog_snapshot',
};

export async function preview() {
  return {
    rowsAffected: 6743,
    preview: [
      { action: 'import', entity: 'categories', count: 122 },
      { action: 'import', entity: 'products', count: 6743 },
      { action: 'import', entity: 'translations', count: 20229 }
    ]
  };
}

export async function execute() {
  const scriptPath = path.join(process.cwd(), 'scripts', 'restore-catalog-snapshot.js');
  const { stdout, stderr } = await execAsync(`node "${scriptPath}" --force`);
  return {
    rowsAffected: 6743,
    detail: stdout.trim().slice(-400)
  };
}

export async function rollback() {
  return {
    rowsAffected: 0,
    detail: 'Catalog rollback not automated; use snapshot restore.'
  };
}
