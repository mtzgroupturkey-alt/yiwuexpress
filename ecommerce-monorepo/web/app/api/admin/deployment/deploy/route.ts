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
        { message: 'Deployment is only available in production' },
        { status: 400 }
      );
    }

    // Execute deployment script in background
    exec('bash /www/wwwroot/www.dromkok.com/web/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('Deployment error:', error);
      }
      console.log('Deployment output:', stdout);
      if (stderr) console.error('Deployment stderr:', stderr);
    });

    return NextResponse.json({
      message: 'Deployment started successfully',
      status: 'in-progress',
    });
  } catch (error) {
    console.error('Failed to trigger deployment:', error);
    return NextResponse.json(
      { message: 'Failed to trigger deployment' },
      { status: 500 }
    );
  }
}
