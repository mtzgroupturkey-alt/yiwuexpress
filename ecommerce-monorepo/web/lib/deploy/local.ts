import { exec } from 'child_process';
import { promisify } from 'util';
import { LocalServerStatus, BuildStatus, TestStatus } from '@/types/deploy';

const execAsync = promisify(exec);

export async function getLocalServerStatus(): Promise<LocalServerStatus> {
  try {
    // Check if dev server is running
    let devRunning = false;
    // Honor the actual port the dev server listens on.
    const devPort = parseInt(process.env.PORT || '', 10) || 3005;
    let devPid: number | undefined;

    try {
      // Check if the configured port is in use (Windows)
      const { stdout } = await execAsync(`netstat -ano | findstr :${devPort}`);
      if (stdout.trim()) {
        devRunning = true;
        const match = stdout.match(/LISTENING\s+(\d+)/);
        if (match) {
          devPid = parseInt(match[1]);
        }
      }
    } catch (e) {
      devRunning = false;
    }

    // Check database connection
    let dbConnected = false;
    let dbUrl = process.env.DATABASE_URL || 'Not configured';
    let dbTables: string[] = [];

    try {
      const { stdout } = await execAsync('npx prisma db execute --stdin < "SELECT tablename FROM pg_tables WHERE schemaname=\'public\';"', {
        cwd: process.cwd(),
      });
      dbConnected = true;
      // Parse table names from output
      const lines = stdout.split('\n').filter(l => l.trim() && !l.includes('tablename') && !l.includes('---'));
      dbTables = lines.map(l => l.trim()).filter(Boolean);
    } catch (e) {
      dbConnected = false;
    }

    return {
      dev: {
        running: devRunning,
        port: devPort,
        pid: devPid,
      },
      database: {
        connected: dbConnected,
        url: dbUrl.replace(/:[^:@]+@/, ':****@'), // Hide password
        tables: dbTables,
      },
    };
  } catch (error) {
    console.error('Local server status error:', error);
    return {
      dev: {
        running: false,
        port: 3001,
      },
      database: {
        connected: false,
        url: 'unknown',
        tables: [],
      },
    };
  }
}

export async function buildProject(): Promise<BuildStatus> {
  try {
    const startTime = Date.now();
    const { stdout, stderr } = await execAsync('npm run build', {
      cwd: process.cwd(),
    });
    const duration = Math.floor((Date.now() - startTime) / 1000);

    return {
      status: 'success',
      output: stdout + stderr,
      duration,
    };
  } catch (error: any) {
    return {
      status: 'failed',
      output: error.stdout || '',
      error: error.message,
    };
  }
}

export async function runTests(): Promise<TestStatus> {
  try {
    const startTime = Date.now();
    const { stdout } = await execAsync('npm test', {
      cwd: process.cwd(),
    });
    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Parse test results (adjust based on your test runner)
    const passedMatch = stdout.match(/(\d+) passed/);
    const failedMatch = stdout.match(/(\d+) failed/);
    const totalMatch = stdout.match(/(\d+) total/);

    const passed = passedMatch ? parseInt(passedMatch[1]) : 0;
    const failed = failedMatch ? parseInt(failedMatch[1]) : 0;
    const total = totalMatch ? parseInt(totalMatch[1]) : passed + failed;

    return {
      status: failed === 0 ? 'passed' : 'failed',
      passed,
      failed,
      total,
      duration,
      output: stdout,
    };
  } catch (error: any) {
    return {
      status: 'failed',
      passed: 0,
      failed: 0,
      total: 0,
      output: error.stdout || error.message,
    };
  }
}

export async function lintCode(): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync('npm run lint', {
      cwd: process.cwd(),
    });
    return {
      success: true,
      output: stdout + stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.message,
    };
  }
}

export async function typeCheck(): Promise<{ success: boolean; output: string }> {
  try {
    const { stdout, stderr } = await execAsync('npx tsc --noEmit', {
      cwd: process.cwd(),
    });
    return {
      success: true,
      output: stdout + stderr,
    };
  } catch (error: any) {
    return {
      success: false,
      output: error.stdout || error.message,
    };
  }
}

export async function cleanBuild(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('rmdir /s /q .next && npm run build', {
      cwd: process.cwd(),
    });
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Clean build failed: ${error.message}`);
  }
}

export async function syncPrismaSchema(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('npx prisma db push', {
      cwd: process.cwd(),
    });
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Prisma sync failed: ${error.message}`);
  }
}

export async function generatePrismaClient(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('npx prisma generate', {
      cwd: process.cwd(),
    });
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Prisma generate failed: ${error.message}`);
  }
}

export async function seedDatabase(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync('npm run db:seed', {
      cwd: process.cwd(),
    });
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Database seed failed: ${error.message}`);
  }
}

export async function openPrismaStudio(): Promise<string> {
  try {
    // This will start Prisma Studio in background
    exec('npx prisma studio', {
      cwd: process.cwd(),
    });
    return 'Prisma Studio started on http://localhost:5555';
  } catch (error: any) {
    throw new Error(`Failed to start Prisma Studio: ${error.message}`);
  }
}

export async function exportDatabase(): Promise<string> {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `local-export-${timestamp}.sql`;
    const { stdout, stderr } = await execAsync(`pg_dump ${process.env.DATABASE_URL} > ${filename}`);
    return `Database exported to ${filename}`;
  } catch (error: any) {
    throw new Error(`Database export failed: ${error.message}`);
  }
}
