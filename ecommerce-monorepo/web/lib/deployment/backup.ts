import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface BackupResult {
  ok: boolean;
  backupPath?: string;
  sizeBytes?: number;
  error?: string;
}

/** Minimum acceptable backup file size (100 KB). */
const MIN_BACKUP_BYTES = 100 * 1024;

const BACKUP_DIR = '/www/backup/dromkok';
const BACKUP_SCRIPT = path.join(
  '/www/wwwroot/www.dromkok.com/web',
  'prisma/migrations/backup.sh'
);

/**
 * Trigger a pg_dump backup on the server via the existing backup.sh script.
 * Returns the path to the created .sql.gz file.
 *
 * Only works when running on the production Linux server
 * (NODE_ENV === 'production'). In development it is a no-op that returns ok=true.
 */
export async function triggerBackup(): Promise<BackupResult> {
  if (process.env.NODE_ENV !== 'production') {
    // In local dev, skip the actual pg_dump
    return {
      ok: true,
      backupPath: '(skipped in development)',
      sizeBytes: 0,
    };
  }

  try {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-:T]/g, '')
      .slice(0, 14);
    const backupFile = path.join(BACKUP_DIR, `db_backup_${timestamp}.sql.gz`);

    // Run backup.sh (reads credentials from .env.production)
    const { stderr } = await execAsync(`bash "${BACKUP_SCRIPT}"`, {
      timeout: 5 * 60 * 1000, // 5 min timeout
    });

    if (stderr && stderr.includes('Backup failed')) {
      return { ok: false, error: stderr };
    }

    // Verify the file was created and is large enough
    const verification = verifyBackupFile(backupFile);
    return verification;
  } catch (err: any) {
    return { ok: false, error: err.message };
  }
}

/**
 * Verify that a backup file exists and meets the minimum size requirement.
 */
export function verifyBackupFile(filePath: string): BackupResult {
  if (!filePath || filePath === '(skipped in development)') {
    return { ok: true, backupPath: filePath };
  }

  try {
    const stat = fs.statSync(filePath);
    if (stat.size < MIN_BACKUP_BYTES) {
      return {
        ok: false,
        backupPath: filePath,
        sizeBytes: stat.size,
        error: `Backup file is too small (${stat.size} bytes < ${MIN_BACKUP_BYTES} minimum). The backup may be corrupt.`,
      };
    }
    return { ok: true, backupPath: filePath, sizeBytes: stat.size };
  } catch {
    return {
      ok: false,
      backupPath: filePath,
      error: `Backup file not found at: ${filePath}`,
    };
  }
}

/**
 * Find the most recently created backup file in BACKUP_DIR.
 */
export function findLatestBackup(): string | null {
  try {
    const files = fs
      .readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith('db_backup_') && f.endsWith('.sql.gz'))
      .map((f) => ({
        name: f,
        mtime: fs.statSync(path.join(BACKUP_DIR, f)).mtimeMs,
      }))
      .sort((a, b) => b.mtime - a.mtime);

    return files.length > 0 ? path.join(BACKUP_DIR, files[0].name) : null;
  } catch {
    return null;
  }
}
