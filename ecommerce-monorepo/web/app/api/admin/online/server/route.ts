export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { restartServer, stopServer, startServer } from '@/lib/deploy/server';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    let result: string;

    switch (action) {
      case 'restart':
        result = await restartServer();
        break;

      case 'stop':
        result = await stopServer();
        break;

      case 'start':
        result = await startServer();
        break;

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
