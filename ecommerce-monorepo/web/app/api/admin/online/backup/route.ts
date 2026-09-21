export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createBackup, listBackups, restoreBackup, deleteBackup, getBackupSize } from '@/lib/deploy/backup';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'list';

    if (action === 'list') {
      const backups = await listBackups();

      return NextResponse.json({ backups, dbBackups: [] });
    }

    if (action === 'size') {
      const size = await getBackupSize();
      return NextResponse.json({ size });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('Account is disabled'))) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
    const { action, filename, type } = await request.json();

    if (action === 'create') {
      const backupFilename = await createBackup(type || 'manual');

      return NextResponse.json({ success: true, filename: backupFilename });
    }

    if (action === 'restore') {
      if (!filename) {
        return NextResponse.json({ error: 'Filename required' }, { status: 400 });
      }

      const result = await restoreBackup(filename);
      return NextResponse.json({ success: true, result });
    }

    if (action === 'delete') {
      if (!filename) {
        return NextResponse.json({ error: 'Filename required' }, { status: 400 });
      }

      await deleteBackup(filename);

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('Account is disabled'))) {
      return createAuthErrorResponse(error);
    }
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
