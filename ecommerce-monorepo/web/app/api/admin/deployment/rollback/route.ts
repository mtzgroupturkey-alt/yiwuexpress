export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { restoreDatabaseBackup } from '@/lib/deploy/db-backup';

export async function POST(request: Request) {
  try {
    const { backup } = await request.json();

    if (!backup) {
      return NextResponse.json(
        { message: 'Backup filename is required' },
        { status: 400 }
      );
    }

    const output = await restoreDatabaseBackup(backup);

    return NextResponse.json({
      message: `Database rolled back successfully from ${backup}`,
      backup,
      output,
    });
  } catch (error: any) {
    console.error('Failed to rollback:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to rollback database' },
      { status: 500 }
    );
  }
}
