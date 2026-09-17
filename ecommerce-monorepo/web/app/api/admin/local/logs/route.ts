export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { getLogs } from '@/lib/deploy/logs';

export async function GET(request: Request) {
  try {
    await requireRole(request, ['ADMIN']);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 401 });
  }

  try {
    const logs = getLogs();
    return NextResponse.json({
      success: true,
      logs,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
