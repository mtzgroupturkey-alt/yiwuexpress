export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getLocalServerStatus } from '@/lib/deploy/local';
import { getGitStatus, getPendingChangesCount } from '@/lib/deploy/git';
import { logDeployment } from '@/lib/deploy/logs';

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  try {
    // Run git commands sequentially to avoid lock contention; server status
    // is independent so it can run in parallel.
    const [serverStatus, gitStatus, pendingChanges] = await Promise.all([
      getLocalServerStatus(),
      getGitStatus(),
      getPendingChangesCount(),
    ]);

    logDeployment('info', `Status checked — branch ${gitStatus.branch}, ${pendingChanges} pending change(s)`);

    return NextResponse.json({
      branch: gitStatus.branch,
      commitHash: gitStatus.commitShort,
      serverStatus: serverStatus.dev.running ? 'Running' : 'Stopped',
      pendingChanges,
    });
  } catch (error: any) {
    logDeployment('error', `Status check failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
