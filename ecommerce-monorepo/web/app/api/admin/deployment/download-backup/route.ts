export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { getBackupDirectory } from '@/lib/deploy/db-backup';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const file = searchParams.get('file');

    if (!file) {
      return NextResponse.json(
        { message: 'File parameter is required' },
        { status: 400 }
      );
    }

    // Validate filename to prevent path traversal
    const sanitizedFilename = path.basename(file);
    const backupDir = getBackupDirectory();
    const backupPath = path.join(backupDir, sanitizedFilename);

    if (!existsSync(backupPath)) {
      return NextResponse.json(
        { message: 'Backup file not found' },
        { status: 404 }
      );
    }

    const fileContent = await readFile(backupPath);

    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'application/gzip',
        'Content-Disposition': `attachment; filename="${sanitizedFilename}"`,
      },
    });
  } catch (error: any) {
    console.error('Failed to download backup:', error);
    return NextResponse.json(
      { message: 'Failed to download backup', error: error.message },
      { status: 500 }
    );
  }
}
