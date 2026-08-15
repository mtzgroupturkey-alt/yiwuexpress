export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { gitPullQuantity, gitPullCommits, gitGetIncomingCommits } from '@/lib/deploy/git';
import { logDeployment } from '@/lib/deploy/logs';
import { rateLimit } from '@/lib/deploy/ratelimit';

// GET: list incoming commits available to pull
export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  try {
    const commits = await gitGetIncomingCommits();
    return NextResponse.json({ commits, behind: commits.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(request, ['ADMIN']);
    const key = `pull:${user.id}`;
    if (!rateLimit(key, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Too many pull requests. Please wait a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();

    // New behaviour: pull specific selected commits.
    if (Array.isArray(body.commits) && body.commits.length > 0) {
      logDeployment('info', `Pull requested for ${body.commits.length} selected commit(s)`);
      const pulledCount = await gitPullCommits(body.commits as string[]);
      logDeployment('success', `Pulled ${pulledCount} commit(s) from GitHub`);
      return NextResponse.json({
        success: true,
        message: `Pulled ${pulledCount} commit(s) from GitHub`,
        pulledCount,
      });
    }

    // Fallback: pull by quantity.
    const raw = body.quantity;
    const quantity: number | 'all' =
      raw === 'all' || raw === undefined || raw === null
        ? 'all'
        : Math.max(1, parseInt(raw, 10) || 1);

    logDeployment('info', `Pull requested (quantity: ${quantity})`);
    const pulledCount = await gitPullQuantity(quantity);
    logDeployment('success', `Pulled ${pulledCount} commit(s) from GitHub`);

    return NextResponse.json({
      success: true,
      message: `Pulled ${pulledCount} commit(s) from GitHub`,
      pulledCount,
    });
  } catch (error: any) {
    logDeployment('error', `Pull failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
