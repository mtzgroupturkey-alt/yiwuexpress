import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {
  parseAndValidatePolicyYaml,
  savePolicyRule,
} from '@/lib/autopilot/policy-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const department = searchParams.get('department');
    const allVersions = searchParams.get('allVersions') === 'true';

    const where: any = {};
    if (!allVersions) {
      where.isLatest = true;
    }
    if (department) {
      where.department = department;
    }

    const policies = await prisma.policyRule.findMany({
      where,
      orderBy: [{ department: 'asc' }, { priority: 'desc' }],
    });

    return NextResponse.json({
      success: true,
      count: policies.length,
      policies,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list policies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, department, yaml, priority, updatedBy } = body;

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
          error: validation.error || 'Invalid policy YAML',
          line: validation.line,
        },
        { status: 422 }
      );
    }

    const policyKey = key || validation.data.policy;
    const policyDept = department || validation.data.department;

    const saved = await savePolicyRule({
      key: policyKey,
      department: policyDept,
      yaml,
      priority: priority !== undefined ? Number(priority) : validation.data.priority,
      updatedBy: updatedBy || 'admin',
    });

    return NextResponse.json({
      success: true,
      policy: saved,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save policy rule' },
      { status: 500 }
    );
  }
}
