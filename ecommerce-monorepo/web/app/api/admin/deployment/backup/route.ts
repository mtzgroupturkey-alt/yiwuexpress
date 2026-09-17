export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createDatabaseBackup } from '@/lib/deploy/db-backup';

export async function POST() {
  try {
    const backup = await createDatabaseBackup();

    return NextResponse.json({
      message: `Database backup created successfully: ${backup.filename} (${backup.size})`,
      backup,
    });
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to create database backup' },
      { status: 500 }
    );
  }
}
