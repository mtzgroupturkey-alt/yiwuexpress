export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listDatabaseBackups } from '@/lib/deploy/db-backup';

export async function GET() {
  try {
    const backups = await listDatabaseBackups();
    return NextResponse.json(backups);
  } catch (error: any) {
    console.error('Failed to list backups:', error);
    return NextResponse.json([], { status: 200 });
  }
}
