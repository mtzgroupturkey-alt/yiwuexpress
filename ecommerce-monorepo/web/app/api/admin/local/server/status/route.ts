export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getLocalServerStatus } from '@/lib/deploy/local';
import { logDeployment } from '@/lib/deploy/logs';

export async function POST(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  try {
    const status = await getLocalServerStatus();
    const running = status.dev.running;
    const pid = status.dev.pid;

    logDeployment('info', `Server status checked — ${running ? `running (pid ${pid})` : 'stopped'}`);

    return NextResponse.json({
      running,
      ...(pid !== undefined ? { pid } : {}),
    });
  } catch (error: any) {
    logDeployment('error', `Server status check failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
