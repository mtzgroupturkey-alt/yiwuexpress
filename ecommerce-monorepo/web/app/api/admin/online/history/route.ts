export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getDeploymentHistory } from '@/lib/deploy/deployment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    const history = await getDeploymentHistory(limit);

    return NextResponse.json(history);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
