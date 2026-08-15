export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Return mock data for development
      return NextResponse.json([
        {
          filename: 'db_backup_20260713_120000.sql.gz',
          size: '12.5 MB',
          date: '2026-07-13 12:00:00',
        },
        {
          filename: 'db_backup_20260713_080000.sql.gz',
          size: '12.3 MB',
          date: '2026-07-13 08:00:00',
        },
      ]);
    }

    const backupDir = '/home/djdn/backups';

    if (!existsSync(backupDir)) {
      return NextResponse.json([]);
    }

    const files = await readdir(backupDir);
    const backupFiles = files.filter(file => file.startsWith('db_backup_') && file.endsWith('.sql.gz'));

    const backups = await Promise.all(
      backupFiles.map(async (file) => {
        const filePath = `${backupDir}/${file}`;
        const stats = await stat(filePath);
        const sizeInMB = (stats.size / 1024 / 1024).toFixed(2);

        // Extract date from filename (db_backup_YYYYMMDD_HHMMSS.sql.gz)
        const dateMatch = file.match(/db_backup_(\d{8})_(\d{6})/);
        let formattedDate = 'Unknown';
        if (dateMatch) {
          const date = dateMatch[1];
          const time = dateMatch[2];
          const year = date.substring(0, 4);
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);
          const hour = time.substring(0, 2);
          const minute = time.substring(2, 4);
          const second = time.substring(4, 6);
          formattedDate = `${year}-${month}-${day} ${hour}:${minute}:${second}`;
        }

        return {
          filename: file,
          size: `${sizeInMB} MB`,
          date: formattedDate,
        };
      })
    );

    // Sort by date (newest first)
    backups.sort((a, b) => b.date.localeCompare(a.date));

    return NextResponse.json(backups);
  } catch (error) {
    console.error('Failed to list backups:', error);
    return NextResponse.json([], { status: 200 });
  }
}
