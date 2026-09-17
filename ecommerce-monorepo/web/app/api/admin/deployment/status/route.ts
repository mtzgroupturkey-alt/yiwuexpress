export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function getGitInfo() {
  try {
    const { stdout: branchOut } = await execAsync('git rev-parse --abbrev-ref HEAD');
    const { stdout: commitShort } = await execAsync('git rev-parse --short HEAD');
    const { stdout: commitFull } = await execAsync('git rev-parse HEAD');
    const { stdout: message } = await execAsync('git log -1 --pretty=format:%s');
    const { stdout: author } = await execAsync('git log -1 --pretty=format:%an');
    const { stdout: date } = await execAsync('git log -1 --pretty=format:%cd --date=relative');
    const { stdout: statusOut } = await execAsync('git status --porcelain');

    const lines = statusOut.split('\n').filter(l => l.trim());
    const modifiedCount = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
    const untrackedCount = lines.filter(l => l.startsWith('??')).length;
    const stagedCount = lines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ')).length;

    return {
      branch: branchOut.trim(),
      commit: commitShort.trim(),
      commitFull: commitFull.trim(),
      message: message.trim(),
      author: author.trim(),
      date: date.trim(),
      isClean: lines.length === 0,
      uncommittedCount: lines.length,
      modifiedCount,
      untrackedCount,
      stagedCount,
    };
  } catch (err) {
    console.error('Failed to get git status:', err);
    return null;
  }
}

export async function GET() {
  try {
    const gitInfo = await getGitInfo();
    const isProduction = process.env.NODE_ENV === 'production';

    if (!isProduction) {
      // Local development mode
      return NextResponse.json({
        status: 'online',
        uptime: 'N/A (Development)',
        memory: 'N/A',
        cpu: 'N/A',
        restarts: 0,
        git: gitInfo,
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
        git: gitInfo,
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
      git: gitInfo,
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
