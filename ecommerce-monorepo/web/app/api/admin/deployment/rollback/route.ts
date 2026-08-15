export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: Request) {
  try {
    const { backup } = await request.json();

    if (!backup) {
      return NextResponse.json(
        { message: 'Backup filename is required' },
        { status: 400 }
      );
    }

    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      return NextResponse.json(
        { message: 'Rollback is only available in production' },
        { status: 400 }
      );
    }

    // Restore database from backup
    const backupPath = `/home/djdn/backups/${backup}`;
    const command = `gunzip -c ${backupPath} | /www/server/pgsql/bin/psql -U ecommerce -d ecommerce`;

    await execAsync(command, {
      env: { ...process.env, PGPASSWORD: 'LzZH5p5SnRtNKfMy' },
    });

    // Restart PM2
    await execAsync('pm2 restart dromkok-web');

    return NextResponse.json({
      message: 'Rollback completed successfully',
      backup: backup,
    });
  } catch (error: any) {
    console.error('Failed to rollback:', error);
    return NextResponse.json(
      { message: 'Failed to rollback database', error: error.message },
      { status: 500 }
    );
  }
}
