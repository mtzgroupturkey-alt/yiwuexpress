export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerStatus } from '@/lib/deploy/server';

export async function GET() {
  try {
    const status = await getServerStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
