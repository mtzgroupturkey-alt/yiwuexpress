import { NextResponse } from 'next/server';
import { executeAction } from '@/lib/autopilot/actions/executor';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { actionKey, params, actor, decisionId } = body;

    if (!actionKey) {
      return NextResponse.json(
        { success: false, error: 'Missing required field "actionKey"' },
        { status: 400 }
      );
    }

    const result = await executeAction({
      actionKey,
      params: params || {},
      actor: actor || 'api:admin',
      decisionId,
    });

    return NextResponse.json({
      success: result.success,
      actionKey,
      result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Execution failed' },
      { status: 500 }
    );
  }
}
