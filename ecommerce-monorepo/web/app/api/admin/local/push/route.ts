export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { gitPushQuantity } from '@/lib/deploy/git';
import { logDeployment } from '@/lib/deploy/logs';
import { rateLimit } from '@/lib/deploy/ratelimit';

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    const key = `push:${user.id}`;
    if (!rateLimit(key, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many push requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const message: string = (body.message || '').toString().trim();
    if (!message) {
      return NextResponse.json(
        { error: 'Commit message is required' },
        { status: 400 }
      );
    }

    const allowedBranches = ['main', 'production'];
    const targetBranch: string | undefined =
      body.branch && allowedBranches.includes(body.branch) ? body.branch : undefined;

    const raw = body.quantity;
    const quantity: number | 'all' =
      raw === 'all' || raw === undefined || raw === null
        ? 'all'
        : Math.max(1, parseInt(raw, 10) || 1);

    logDeployment('info', `Push requested (message: "${message}", quantity: ${quantity}${targetBranch ? `, branch: ${targetBranch}` : ''})`);

    let pushedCount: number;
    try {
      pushedCount = await gitPushQuantity(message, quantity, targetBranch);
    } catch (gitError: any) {
      // Log the full raw git error output so it shows in the deployment log panel
      const rawMsg: string = gitError.stderr || gitError.stdout || gitError.message || String(gitError);
      rawMsg.split('\n').filter((l: string) => l.trim()).forEach((line: string) => {
        logDeployment('error', `[git] ${line}`);
      });
      logDeployment('error', `Push failed: ${gitError.message}`);
      return NextResponse.json({ error: gitError.message }, { status: 500 });
    }

    if (pushedCount === 0) {
      logDeployment('info', 'Already in sync with remote — nothing to commit or push');
      return NextResponse.json({
        success: true,
        message: 'Already in sync — no new changes to push',
        pushedCount: 0,
        branch: targetBranch,
      });
    }

    logDeployment('success', `Pushed ${pushedCount} commit(s) to ${targetBranch || 'current branch'}`);

    // Pushing to production triggers the GitHub Actions workflow
    // (.github/workflows/deploy.yml runs on: push: branches: [production]),
    // which SSHes into the server and runs the full build + PM2 restart.
    // We do NOT run deploy commands here — this API runs on the local machine
    // (Windows in dev), where pm2/rm/npm ci don't apply and would spew false
    // errors that make a successful push look broken.
    if (targetBranch === 'production') {
      logDeployment('success', '🚀 Pushed to production — GitHub Actions is now building and deploying to the server automatically.');
      logDeployment('info', 'Track progress on GitHub → Actions → "Deploy to Production". The live site updates when the workflow finishes (~5-10 min).');

      return NextResponse.json({
        success: true,
        message: `Pushed ${pushedCount} commit(s) to production — GitHub Actions deploy started`,
        pushedCount,
        branch: targetBranch,
        deployTriggered: true,
      });
    }

    logDeployment('info', 'Main branch selected — no auto-deploy');
    return NextResponse.json({
      success: true,
      message: `Pushed ${pushedCount} commit(s) to ${targetBranch || 'current branch'}`,
      pushedCount,
      branch: targetBranch,
      deployTriggered: false,
    });
  } catch (error: any) {
    logDeployment('error', `Push failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
