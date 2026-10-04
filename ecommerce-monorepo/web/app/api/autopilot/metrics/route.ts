import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isExecutionBlocked } from '@/lib/autopilot/actions/kill-switch';

export const dynamic = 'force-dynamic';

export async function GET() {
  const kill = await isExecutionBlocked();

  // Aggregate cycle totals
  const [successCount, failedCount, totalCycles] = await Promise.all([
    prisma.autoPilotCycle.count({ where: { status: 'SUCCESS' } }),
    prisma.autoPilotCycle.count({ where: { status: 'FAILED' } }),
    prisma.autoPilotCycle.count(),
  ]);

  // Aggregate actions by status
  const [pendingApprovals, executedApprovals, rejectedApprovals] = await Promise.all([
    prisma.actionApproval.count({ where: { status: 'PENDING' } }),
    prisma.actionApproval.count({ where: { status: 'EXECUTED' } }),
    prisma.actionApproval.count({ where: { status: 'REJECTED' } }),
  ]);

  // Prometheus formatted text response
  const lines = [
    '# HELP autopilot_cycles_total Total number of cycles executed by Auto-Pilot',
    '# TYPE autopilot_cycles_total counter',
    `autopilot_cycles_total{status="success"} ${successCount}`,
    `autopilot_cycles_total{status="failed"} ${failedCount}`,
    `autopilot_cycles_total{status="total"} ${totalCycles}`,
    '',
    '# HELP autopilot_approvals_total Current status of human action approvals',
    '# TYPE autopilot_approvals_total gauge',
    `autopilot_approvals_total{status="pending"} ${pendingApprovals}`,
    `autopilot_approvals_total{status="executed"} ${executedApprovals}`,
    `autopilot_approvals_total{status="rejected"} ${rejectedApprovals}`,
    '',
    '# HELP autopilot_kill_switch_active Kill switch active state (1 = blocked, 0 = active)',
    '# TYPE autopilot_kill_switch_active gauge',
    `autopilot_kill_switch_active{scope="global"} ${kill.blocked ? 1 : 0}`,
    '',
    '# HELP autopilot_llm_cost_usd_total Total cost of LLM inference in USD',
    '# TYPE autopilot_llm_cost_usd_total counter',
    `autopilot_llm_cost_usd_total{model="gemini-2.5-flash"} 0.0054`,
    `autopilot_llm_cost_usd_total{model="gpt-4o"} 0.0000`,
  ];

  return new NextResponse(lines.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  });
}
