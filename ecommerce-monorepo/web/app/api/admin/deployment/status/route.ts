export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Check if running in production (server has PM2)
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Local development mode
      return NextResponse.json({
        status: 'online',
        uptime: 'N/A (Development)',
        memory: 'N/A',
        cpu: 'N/A',
        restarts: 0,
      });
    }

    // Get PM2 status
    const { stdout } = await execAsync('pm2 jlist');
    const processes = JSON.parse(stdout);
    
    const dromkokProcess = processes.find((p: any) => p.name === 'dromkok-web');

    if (!dromkokProcess) {
      return NextResponse.json({
        status: 'offline',
        uptime: '0',
        memory: '0 MB',
        cpu: '0%',
        restarts: 0,
      });
    }

    const uptime = Math.floor(dromkokProcess.pm2_env.pm_uptime / 1000);
    const uptimeFormatted = formatUptime(uptime);
    const memory = (dromkokProcess.monit.memory / 1024 / 1024).toFixed(2);
    const cpu = dromkokProcess.monit.cpu;

    return NextResponse.json({
      status: dromkokProcess.pm2_env.status === 'online' ? 'online' : 'offline',
      uptime: uptimeFormatted,
      memory: `${memory} MB`,
      cpu: `${cpu}%`,
      restarts: dromkokProcess.pm2_env.restart_time || 0,
    });
  } catch (error) {
    console.error('Failed to get server status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch server status' },
      { status: 500 }
    );
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
