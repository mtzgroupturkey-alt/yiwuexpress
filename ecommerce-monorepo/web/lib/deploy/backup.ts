import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { DatabaseBackup } from '@/types/deploy';

const execAsync = promisify(exec);

const BACKUP_DIR = process.env.BACKUP_DIR || '/home/djdn/backups';
const DB_NAME = process.env.DB_NAME || 'ecommerce';
const DB_USER = process.env.DB_USER || 'ecommerce';
const DB_PASSWORD = process.env.DB_PASSWORD || 'LzZH5p5SnRtNKfMy';

export async function createBackup(type: 'manual' | 'auto' = 'auto'): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${DB_NAME}-${type}-${timestamp}.sql.gz`;
    const filepath = path.join(BACKUP_DIR, filename);

    // Ensure backup directory exists
    await execAsync(`mkdir -p ${BACKUP_DIR}`);

    // Create backup with pg_dump and gzip
    const cmd = `PGPASSWORD="${DB_PASSWORD}" pg_dump -U ${DB_USER} -h localhost ${DB_NAME} | gzip > ${filepath}`;
    await execAsync(cmd);

    // Verify backup was created
    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file was not created');
    }

    return filename;
  } catch (error: any) {
    throw new Error(`Backup creation failed: ${error.message}`);
  }
}

export async function listBackups(): Promise<DatabaseBackup[]> {
  try {
    // Ensure backup directory exists
    await execAsync(`mkdir -p ${BACKUP_DIR}`);

    const { stdout } = await execAsync(`ls -lh ${BACKUP_DIR}/*.sql.gz 2>/dev/null || true`);
    
    if (!stdout.trim()) {
      return [];
    }

    const lines = stdout.trim().split('\n');
    const backups: DatabaseBackup[] = [];

    for (const line of lines) {
      const parts = line.split(/\s+/);
      if (parts.length < 9) continue;

      const size = parts[4];
      const filename = path.basename(parts[8]);
      const filepath = parts[8];
      
      // Get file stats
      const stats = fs.statSync(filepath);
      
      backups.push({
        id: filename,
        filename,
        filepath,
        size,
        sizeBytes: stats.size,
        date: stats.mtime.toISOString(),
        type: filename.includes('manual') ? 'manual' : 'auto',
        environment: 'production',
        status: 'completed',
      });
    }

    // Sort by date descending
    return backups.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error: any) {
    console.error('List backups error:', error);
    return [];
  }
}

export async function restoreBackup(filename: string): Promise<string> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);

    // Verify backup file exists
    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file not found');
    }

    // Restore backup
    const cmd = `gunzip -c ${filepath} | PGPASSWORD="${DB_PASSWORD}" psql -U ${DB_USER} -h localhost ${DB_NAME}`;
    const { stdout, stderr } = await execAsync(cmd);

    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Backup restoration failed: ${error.message}`);
  }
}

export async function deleteBackup(filename: string): Promise<void> {
  try {
    const filepath = path.join(BACKUP_DIR, filename);

    // Verify backup file exists
    if (!fs.existsSync(filepath)) {
      throw new Error('Backup file not found');
    }

    // Delete backup file
    fs.unlinkSync(filepath);
  } catch (error: any) {
    throw new Error(`Backup deletion failed: ${error.message}`);
  }
}

export async function cleanupOldBackups(keepCount = 5): Promise<number> {
  try {
    const backups = await listBackups();
    
    if (backups.length <= keepCount) {
      return 0;
    }

    const toDelete = backups.slice(keepCount);
    let deletedCount = 0;

    for (const backup of toDelete) {
      try {
        await deleteBackup(backup.filename);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete backup ${backup.filename}:`, error);
      }
    }

    return deletedCount;
  } catch (error: any) {
    throw new Error(`Cleanup failed: ${error.message}`);
  }
}

export async function getBackupSize(): Promise<string> {
  try {
    const { stdout } = await execAsync(`du -sh ${BACKUP_DIR} 2>/dev/null || echo "0"`);
    return stdout.trim().split('\t')[0];
  } catch (error) {
    return 'unknown';
  }
}
