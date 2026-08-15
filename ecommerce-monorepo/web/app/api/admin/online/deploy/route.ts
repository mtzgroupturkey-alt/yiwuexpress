export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { deployToProduction, isDeploymentInProgress } from '@/lib/deploy/deployment';

export async function POST() {
  try {
    // Check if deployment is already in progress
    if (isDeploymentInProgress()) {
      return NextResponse.json(
        { error: 'Another deployment is already in progress' },
        { status: 409 }
      );
    }

    const result = await deployToProduction();

    return NextResponse.json({
      success: true,
      deploymentId: result.deploymentId,
      logs: result.logs,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const inProgress = isDeploymentInProgress();
    return NextResponse.json({ inProgress });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
