export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deploymentId = searchParams.get('deploymentId');
    const linesCount = parseInt(searchParams.get('lines') || '100', 10);

    // 1. If specific deploymentId requested, query database
    if (deploymentId) {
      try {
        const deployment = await prisma.deployment.findUnique({
          where: { id: deploymentId },
        });

        if (deployment) {
          return NextResponse.json({
            logs: deployment.logs || deployment.error || 'No logs available for this deployment.',
            deployment,
          });
        }
      } catch (dbError) {
        console.warn('Prisma query for deploymentId failed:', dbError);
      }
    }

    // 2. Check candidate log file locations
    const candidatePaths = [
      '/www/wwwroot/www.dromkok.com/web/deploy.log',
      path.join(process.cwd(), 'deploy.log'),
      path.join(process.cwd(), 'logs', 'deploy.log'),
    ];

    for (const logPath of candidatePaths) {
      if (existsSync(logPath)) {
        try {
          const content = await readFile(logPath, 'utf-8');
          const lines = content.split('\n');
          const recentLines = lines.slice(-linesCount).join('\n');
          return NextResponse.json({
            logs: recentLines || 'Log file is currently empty.',
          });
        } catch (readErr) {
          console.warn(`Failed reading log file at ${logPath}:`, readErr);
        }
      }
    }

    // 3. If no physical log file found, query latest deployment record in DB
    try {
      const latestDeployment = await prisma.deployment.findFirst({
        orderBy: { startedAt: 'desc' },
      });

      if (latestDeployment?.logs || latestDeployment?.error) {
        return NextResponse.json({
          logs: latestDeployment.logs || latestDeployment.error,
          deploymentId: latestDeployment.id,
        });
      }
    } catch (dbErr) {
      // Prisma table may be empty or unmigrated in dev
    }

    // 4. Default fallback for local dev / fresh deployments
    const isProduction = process.env.NODE_ENV === 'production';
    const fallbackMessage = [
      `[System] Deployment service online (${isProduction ? 'Production' : 'Development'} mode)`,
      `[Status] Ready. No active deployment logs recorded yet.`,
      `[Branch] Main & Production pipelines configured.`,
      `[Info] Deployments initiated via the Admin panel or GitHub Actions will stream logs here.`,
    ].join('\n');

    return NextResponse.json({
      logs: fallbackMessage,
    });
  } catch (error: any) {
    console.error('Failed to get deployment logs:', error);
    return NextResponse.json(
      {
        logs: `[Error] Failed to fetch deployment logs: ${error?.message || 'Unknown error'}`,
      },
      { status: 200 }
    );
  }
}
