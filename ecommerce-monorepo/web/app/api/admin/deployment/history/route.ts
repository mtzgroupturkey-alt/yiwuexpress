export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';

export async function GET() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Return mock data for development
      return NextResponse.json([
        {
          timestamp: new Date().toISOString(),
          status: 'success',
          duration: '2m 15s',
          commit: 'Add deployment pipeline',
          author: 'Developer',
        },
        {
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          status: 'success',
          duration: '1m 45s',
          commit: 'Update admin features',
          author: 'Developer',
        },
      ]);
    }

    const logPath = '/www/wwwroot/www.dromkok.com/web/deploy.log';

    if (!existsSync(logPath)) {
      return NextResponse.json([]);
    }

    const logContent = await readFile(logPath, 'utf-8');
    const deployments = parseDeploymentLog(logContent);

    return NextResponse.json(deployments);
  } catch (error) {
    console.error('Failed to read deployment history:', error);
    return NextResponse.json([], { status: 200 });
  }
}

function parseDeploymentLog(logContent: string): any[] {
  const deployments: any[] = [];
  const lines = logContent.split('\n');
  
  let currentDeployment: any = null;
  
  lines.forEach((line) => {
    if (line.includes('STARTING DEPLOYMENT')) {
      if (currentDeployment) {
        deployments.push(currentDeployment);
      }
      const timestampMatch = line.match(/\[(.+?)\]/);
      currentDeployment = {
        timestamp: timestampMatch ? timestampMatch[1] : new Date().toISOString(),
        status: 'in-progress',
        duration: 'N/A',
        commit: 'Unknown',
        author: 'System',
      };
    } else if (line.includes('DEPLOYMENT COMPLETED SUCCESSFULLY') && currentDeployment) {
      currentDeployment.status = 'success';
    } else if (line.includes('FAILED') || line.includes('ERROR') && currentDeployment) {
      currentDeployment.status = 'failed';
    }
  });

  if (currentDeployment) {
    deployments.push(currentDeployment);
  }

  return deployments.slice(-10).reverse(); // Return last 10 deployments
}
