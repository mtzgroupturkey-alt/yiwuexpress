import { NextRequest, NextResponse } from 'next/server';
import { parseAndValidatePolicyYaml, evaluatePolicy } from '@/lib/autopilot/policy-engine';
import { captureBusinessSnapshot } from '@/lib/autopilot/state-observer';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { yaml, customSnapshot } = body;

    if (!yaml || typeof yaml !== 'string') {
      return NextResponse.json(
        { success: false, error: 'YAML policy definition string is required' },
        { status: 400 }
      );
    }

    const validation = parseAndValidatePolicyYaml(yaml);
    if (!validation.valid || !validation.data) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: validation.error || 'Invalid policy YAML format',
          line: validation.line,
        },
        { status: 422 }
      );
    }

    // Evaluate against provided snapshot or live state snapshot
    let snapshot = customSnapshot;
    if (!snapshot) {
      snapshot = await captureBusinessSnapshot();
    }

    const matchedActions = evaluatePolicy(validation.data, snapshot);

    return NextResponse.json({
      success: true,
      valid: true,
      matched: matchedActions.length > 0,
      matchedActionsCount: matchedActions.length,
      actions: matchedActions,
      policy: validation.data,
      snapshotTimestamp: snapshot.timestamp,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to simulate policy evaluation' },
      { status: 500 }
    );
  }
}
