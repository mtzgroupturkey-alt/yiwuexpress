import { exec } from 'child_process';
import { promisify } from 'util';
import { ServerStatus } from '@/types/deploy';

const execAsync = promisify(exec);

export async function getServerStatus(): Promise<ServerStatus> {
  try {
    // Check PM2 status
    let pm2Status = null;
    try {
      const { stdout } = await execAsync('pm2 jlist');
      const processes = JSON.parse(stdout);
      const app = processes.find((p: any) => p.name === 'dromkok-web');
      
      if (app) {
        pm2Status = {
          name: app.name,
          status: app.pm2_env.status,
          uptime: Math.floor((Date.now() - app.pm2_env.pm_uptime) / 1000),
          restarts: app.pm2_env.restart_time,
          cpu: app.monit.cpu,
          memory: app.monit.memory,
        };
      }
    } catch (e) {
      console.error('PM2 status error:', e);
    }

    // Check Nginx
    let nginxStatus = null;
    try {
      const { stdout } = await execAsync('nginx -v 2>&1');
      nginxStatus = {
        status: 'running',
        version: stdout.trim().split('/')[1] || 'unknown',
      };
    } catch (e) {
      nginxStatus = {
        status: 'not running',
        version: 'unknown',
      };
    }

    // Check PostgreSQL
    let postgresStatus = null;
    try {
      const [version, size, connections] = await Promise.all([
        execAsync('psql --version').then(r => r.stdout.trim()),
        execAsync('du -sh /var/lib/postgresql/data 2>/dev/null || echo "unknown"').then(r => r.stdout.trim().split('\t')[0]),
        execAsync('psql -U ecommerce -d ecommerce -c "SELECT count(*) FROM pg_stat_activity;"').then(r => {
          const match = r.stdout.match(/\d+/);
          return match ? parseInt(match[0]) : 0;
        }).catch(() => 0),
      ]);
      
      postgresStatus = {
        status: 'running',
        version: version.split(' ')[2] || 'unknown',
        size,
        connections,
      };
    } catch (e) {
      postgresStatus = {
        status: 'not running',
        version: 'unknown',
        size: 'unknown',
        connections: 0,
      };
    }

    // Check disk space
    let diskStatus = null;
    try {
      const { stdout } = await execAsync('df -h /');
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const parts = lines[1].split(/\s+/);
        diskStatus = {
          total: parts[1],
          used: parts[2],
          free: parts[3],
          percent: parseInt(parts[4]),
        };
      }
    } catch (e) {
      console.error('Disk status error:', e);
    }

    // Get git info
    let gitStatus = null;
    try {
      const [branch, commit, remote, status] = await Promise.all([
        execAsync('git rev-parse --abbrev-ref HEAD').then(r => r.stdout.trim()),
        execAsync('git rev-parse --short HEAD').then(r => r.stdout.trim()),
        execAsync('git config --get remote.origin.url').then(r => r.stdout.trim()),
        execAsync('git status --short').then(r => r.stdout.trim()),
      ]);

      gitStatus = {
        branch,
        commit,
        remote,
        status: status === '' ? 'clean' : 'modified',
      };
    } catch (e) {
      console.error('Git status error:', e);
    }

    // Basic server status
    const uptime = pm2Status
      ? formatUptime(pm2Status.uptime)
      : 'unknown';
    const memory = pm2Status
      ? formatBytes(pm2Status.memory)
      : 'unknown';
    const cpu = pm2Status
      ? `${pm2Status.cpu}%`
      : 'unknown';

    return {
      status: pm2Status?.status === 'online' ? 'online' : 'offline',
      uptime,
      memory,
      cpu,
      restarts: pm2Status?.restarts || 0,
      pm2: pm2Status || undefined,
      nginx: nginxStatus || undefined,
      postgresql: postgresStatus || undefined,
      disk: diskStatus || undefined,
      git: gitStatus || undefined,
    };
  } catch (error) {
    console.error('Server status error:', error);
    return {
      status: 'unknown',
      uptime: 'unknown',
      memory: 'unknown',
      cpu: 'unknown',
      restarts: 0,
    };
  }
}

export async function restartServer(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('pm2 restart dromkok-web');
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Server restart failed: ${error.message}`);
  }
}

export async function stopServer(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('pm2 stop dromkok-web');
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Server stop failed: ${error.message}`);
  }
}

export async function startServer(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('pm2 start dromkok-web');
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Server start failed: ${error.message}`);
  }
}

export async function getServerLogs(lines = 100): Promise<string> {
  try {
    const { stdout } = await execAsync(`pm2 logs dromkok-web --lines ${lines} --nostream`);
    return stdout;
  } catch (error: any) {
    throw new Error(`Failed to get logs: ${error.message}`);
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

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb > 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(0)} MB`;
}
