export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const branch: 'main' | 'production' = body.branch === 'main' ? 'main' : 'production';
    const isProduction = process.env.NODE_ENV === 'production';

    // 1. If running on production server: execute deployment bash script with branch argument
    if (isProduction) {
      exec(`bash /www/wwwroot/www.dromkok.com/web/deploy.sh ${branch}`, (error, stdout, stderr) => {
        if (error) {
          console.error('Deployment error:', error);
        }
        console.log('Deployment output:', stdout);
        if (stderr) console.error('Deployment stderr:', stderr);
      });

      return NextResponse.json({
        message: `Deployment started successfully on server for branch: ${branch}`,
        status: 'in-progress',
        branch,
      });
    }

    // 2. If running in local development (e.g. localhost:3001)
    // When branch === 'production', push to GitHub production branch to trigger GitHub Actions deployment to live server
    // When branch === 'main', push to GitHub main branch
    const repoCwd = process.cwd();

    let pushCommand = '';
    if (branch === 'production') {
      pushCommand = 'git push origin main:production';
    } else {
      pushCommand = 'git push origin main';
    }

    // Execute git push in background / async
    exec(pushCommand, { cwd: repoCwd }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Local git push error for branch ${branch}:`, error);
      }
      console.log(`Git push output for branch ${branch}:`, stdout);
      if (stderr) console.error(`Git push stderr for branch ${branch}:`, stderr);
    });

    const successMessage =
      branch === 'production'
        ? 'Pushing to GitHub production branch! GitHub Actions will automatically update and restart the online host server.'
        : 'Pushing to GitHub main branch successfully!';

    return NextResponse.json({
      message: successMessage,
      status: 'in-progress',
      branch,
    });
  } catch (error: any) {
    console.error('Failed to trigger deployment:', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to trigger deployment' },
      { status: 500 }
    );
  }
}
