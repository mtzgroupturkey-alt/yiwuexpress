export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      return NextResponse.json(
        { message: 'Database backup is only available in production' },
        { status: 400 }
      );
    }

    // Execute backup script
    const { stdout, stderr } = await execAsync('bash /www/wwwroot/www.dromkok.com/web/prisma/migrations/backup.sh');

    if (stderr && !stderr.includes('Backup created')) {
      throw new Error(stderr);
    }

    return NextResponse.json({
      message: 'Database backup created successfully',
      output: stdout,
    });
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    return NextResponse.json(
      { message: 'Failed to create database backup', error: error.message },
      { status: 500 }
    );
  }
}
