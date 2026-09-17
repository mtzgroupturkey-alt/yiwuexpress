import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { spawn } from 'child_process';
import { getDatabaseUrl, detectEnvironment } from '@/lib/db-detector';

export interface BackupItem {
  filename: string;
  size: string;
  sizeBytes: number;
  date: string;
  path: string;
}

/**
 * Locate PostgreSQL binaries (pg_dump, psql) across cross-platform environments.
 */
export function getPostgresBinaries(): { pgDump: string; psql: string } {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    const candidateDump = [
      'C:\\Program Files\\PostgreSQL\\18\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\16\\bin\\pg_dump.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\pg_dump.exe',
    ];
    const candidatePsql = [
      'C:\\Program Files\\PostgreSQL\\18\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
    ];

    const pgDump = candidateDump.find((p) => fs.existsSync(p)) || 'pg_dump';
    const psql = candidatePsql.find((p) => fs.existsSync(p)) || 'psql';
    return { pgDump, psql };
  }

  // Linux / Ubuntu production paths
  const linuxCandidateDump = [
    '/www/server/pgsql/bin/pg_dump',
    '/usr/lib/postgresql/16/bin/pg_dump',
    '/usr/lib/postgresql/15/bin/pg_dump',
    '/usr/bin/pg_dump',
  ];
  const linuxCandidatePsql = [
    '/www/server/pgsql/bin/psql',
    '/usr/lib/postgresql/16/bin/psql',
    '/usr/lib/postgresql/15/bin/psql',
    '/usr/bin/psql',
  ];

  const pgDump = linuxCandidateDump.find((p) => fs.existsSync(p)) || 'pg_dump';
  const psql = linuxCandidatePsql.find((p) => fs.existsSync(p)) || 'psql';
  return { pgDump, psql };
}

/**
 * Returns the directory where backups are stored.
 */
export function getBackupDirectory(): string {
  const env = detectEnvironment();

  if (env === 'production') {
    const prodDir = '/home/djdn/backups';
    try {
      if (!fs.existsSync(prodDir)) {
        fs.mkdirSync(prodDir, { recursive: true });
      }
      return prodDir;
    } catch {
      // Fallback if permission denied
    }
  }

  // Development or local fallback
  const localDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  return localDir;
}

/**
 * Parse database connection credentials from getDatabaseUrl()
 */
export function getParsedDbConfig() {
  const rawUrl = getDatabaseUrl();
  try {
    const parsed = new URL(rawUrl);
    return {
      host: parsed.hostname || 'localhost',
      port: parsed.port || '5432',
      user: decodeURIComponent(parsed.username || 'postgres'),
      password: decodeURIComponent(parsed.password || ''),
      database: decodeURIComponent(parsed.pathname.replace(/^\//, '') || 'ecommerce'),
    };
  } catch (err) {
    return {
      host: 'localhost',
      port: '5432',
      user: 'postgres',
      password: '',
      database: 'ecommerce',
    };
  }
}

/**
 * Formats a date string from timestamp or file stat.
 */
function formatDate(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const Y = date.getFullYear();
  const M = pad(date.getMonth() + 1);
  const D = pad(date.getDate());
  const h = pad(date.getHours());
  const m = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${Y}-${M}-${D} ${h}:${m}:${s}`;
}

/**
 * Creates a gzipped PostgreSQL database backup.
 */
export async function createDatabaseBackup(): Promise<BackupItem> {
  const backupDir = getBackupDirectory();
  const dbConfig = getParsedDbConfig();
  const { pgDump } = getPostgresBinaries();

  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const timestamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
  const filename = `db_backup_${timestamp}.sql.gz`;
  const outputPath = path.join(backupDir, filename);

  const writeStream = fs.createWriteStream(outputPath);
  const gzipStream = zlib.createGzip({ level: 9 });

  const args = [
    '-h', dbConfig.host,
    '-p', dbConfig.port,
    '-U', dbConfig.user,
    '-d', dbConfig.database,
    '--no-owner',
    '--no-privileges',
  ];

  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  return new Promise((resolve, reject) => {
    const proc = spawn(pgDump, args, { env });

    let stderrData = '';
    proc.stderr.on('data', (chunk) => {
      stderrData += chunk.toString();
    });

    proc.stdout.pipe(gzipStream).pipe(writeStream);

    proc.on('error', (err) => {
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
      reject(new Error(`Failed to execute ${pgDump}: ${err.message}`));
    });

    writeStream.on('finish', () => {
      try {
        const stats = fs.statSync(outputPath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

        // Prune old backups, keep newest 10
        pruneOldBackups(backupDir, 10);

        resolve({
          filename,
          size: `${sizeInMB} MB`,
          sizeBytes: stats.size,
          date: formatDate(now),
          path: outputPath,
        });
      } catch (statErr: any) {
        reject(statErr);
      }
    });

    writeStream.on('error', (err) => {
      try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
      reject(new Error(`Failed writing backup archive: ${err.message}`));
    });

    proc.on('close', (code) => {
      if (code !== 0) {
        try { if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath); } catch {}
        reject(new Error(`pg_dump exited with error code ${code}: ${stderrData}`));
      }
    });
  });
}

/**
 * List all database backups in the backup folder.
 */
export async function listDatabaseBackups(): Promise<BackupItem[]> {
  const backupDir = getBackupDirectory();
  if (!fs.existsSync(backupDir)) {
    return [];
  }

  const files = fs.readdirSync(backupDir);
  const backupFiles = files.filter(
    (f) => (f.startsWith('db_backup_') || f.startsWith('backup_')) && (f.endsWith('.sql.gz') || f.endsWith('.sql'))
  );

  const results: BackupItem[] = [];

  for (const file of backupFiles) {
    try {
      const filePath = path.join(backupDir, file);
      const stats = fs.statSync(filePath);
      const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

      // Extract date from filename if possible: db_backup_YYYYMMDD_HHMMSS
      const match = file.match(/(\d{4})(\d{2})(\d{2})_(\d{2})(\d{2})(\d{2})/);
      let dateStr = '';
      if (match) {
        const [, Y, M, D, h, m, s] = match;
        dateStr = `${Y}-${M}-${D} ${h}:${m}:${s}`;
      } else {
        dateStr = formatDate(stats.mtime);
      }

      results.push({
        filename: file,
        size: `${sizeInMB} MB`,
        sizeBytes: stats.size,
        date: dateStr,
        path: filePath,
      });
    } catch {
      // Ignore unreadable file
    }
  }

  // Sort newest first
  results.sort((a, b) => b.filename.localeCompare(a.filename));
  return results;
}

/**
 * Restores a database backup.
 */
export async function restoreDatabaseBackup(filename: string): Promise<string> {
  const backupDir = getBackupDirectory();
  // Prevent path traversal
  const sanitized = path.basename(filename);
  const filePath = path.join(backupDir, sanitized);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Backup file "${sanitized}" does not exist`);
  }

  const dbConfig = getParsedDbConfig();
  const { psql } = getPostgresBinaries();

  const args = [
    '-h', dbConfig.host,
    '-p', dbConfig.port,
    '-U', dbConfig.user,
    '-d', dbConfig.database,
  ];

  const env = {
    ...process.env,
    PGPASSWORD: dbConfig.password,
  };

  return new Promise((resolve, reject) => {
    const proc = spawn(psql, args, { env });
    let stderr = '';
    let stdout = '';

    proc.stdout.on('data', (d) => (stdout += d.toString()));
    proc.stderr.on('data', (d) => (stderr += d.toString()));

    if (filePath.endsWith('.gz')) {
      const gunzip = zlib.createGunzip();
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(gunzip).pipe(proc.stdin);
    } else {
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(proc.stdin);
    }

    proc.on('close', (code) => {
      if (code === 0 || !stderr || stderr.includes('NOTICE')) {
        resolve(`Restored backup ${sanitized} successfully.\n${stdout}`);
      } else {
        reject(new Error(`psql exited with code ${code}: ${stderr}`));
      }
    });

    proc.on('error', (err) => {
      reject(new Error(`Failed to execute psql: ${err.message}`));
    });
  });
}

/**
 * Prunes old backups, keeping the newest `keepCount` files.
 */
function pruneOldBackups(backupDir: string, keepCount: number) {
  try {
    const files = fs
      .readdirSync(backupDir)
      .filter((f) => f.startsWith('db_backup_') && f.endsWith('.sql.gz'))
      .sort()
      .reverse();

    if (files.length > keepCount) {
      const toDelete = files.slice(keepCount);
      for (const f of toDelete) {
        try {
          fs.unlinkSync(path.join(backupDir, f));
        } catch {}
      }
    }
  } catch {}
}
