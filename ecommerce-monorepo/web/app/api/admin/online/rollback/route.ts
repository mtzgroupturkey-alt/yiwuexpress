export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { rollbackDeployment } from '@/lib/deploy/deployment';

export async function POST(request: Request) {
  try {
    const { filename } = await request.json();

    if (!filename) {
      return NextResponse.json(
        { error: 'Backup filename required' },
        { status: 400 }
      );
    }

    const result = await rollbackDeployment(filename);

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
