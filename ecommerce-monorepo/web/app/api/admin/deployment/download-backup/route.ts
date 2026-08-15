export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

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
    if (file.includes('..') || file.includes('/')) {
      return NextResponse.json(
        { message: 'Invalid filename' },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      return NextResponse.json(
        { message: 'Backup download is only available in production' },
        { status: 400 }
      );
    }

    const backupPath = `/home/djdn/backups/${file}`;

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
        'Content-Disposition': `attachment; filename="${file}"`,
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
