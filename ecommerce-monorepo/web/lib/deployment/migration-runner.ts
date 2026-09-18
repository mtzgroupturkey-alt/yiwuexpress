import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export interface StepResult {
  name: string;
  ok: boolean;
  rowsAffected: number;
  durationMs: number;
  detail?: string;
  error?: string;
}

export interface RunnerResult {
  steps: StepResult[];
  totalRowsAffected: number;
  totalDurationMs: number;
  ok: boolean;
  logs: string[];
}

const SCRIPTS_DIR = path.join(process.cwd(), 'scripts', 'migrations');
const PROJECT_DIR = process.cwd();

/**
 * Run `prisma migrate deploy` — applies all pending migrations to the DB.
 * Safe to call on every deploy (idempotent).
 */
export async function runPrismaMigrations(): Promise<StepResult> {
  const start = Date.now();
  try {
    const { stdout, stderr } = await execAsync('npx prisma migrate deploy', {
      cwd: PROJECT_DIR,
      timeout: 5 * 60 * 1000,
    });
    const output = stdout + stderr;
    return {
      name: 'prisma migrate deploy',
      ok: true,
      rowsAffected: 0,
      durationMs: Date.now() - start,
      detail: output.trim().slice(0, 500),
    };
  } catch (err: any) {
    return {
      name: 'prisma migrate deploy',
      ok: false,
      rowsAffected: 0,
      durationMs: Date.now() - start,
      error: err.message?.slice(0, 1000),
    };
  }
}

/**
 * Reset the database (drop all data, re-apply schema, run seed).
 * Used for Option C only. DESTRUCTIVE.
 */
export async function resetDatabase(): Promise<StepResult> {
  const start = Date.now();
  const steps: string[] = [];
  try {
    // prisma migrate reset --force drops + recreates + runs seed
    steps.push('Running prisma migrate reset --force --skip-seed...');
    await execAsync('npx prisma migrate reset --force --skip-seed', {
      cwd: PROJECT_DIR,
      timeout: 10 * 60 * 1000,
    });

    steps.push('Running seed...');
    const { stdout: seedOut } = await execAsync('npm run db:seed', {
      cwd: PROJECT_DIR,
      timeout: 10 * 60 * 1000,
    });
    steps.push(seedOut.slice(0, 200));

    return {
      name: 'database reset + seed',
      ok: true,
      rowsAffected: 0,
      durationMs: Date.now() - start,
      detail: steps.join('\n'),
    };
  } catch (err: any) {
    return {
      name: 'database reset + seed',
      ok: false,
      rowsAffected: 0,
      durationMs: Date.now() - start,
      error: err.message?.slice(0, 1000),
    };
  }
}

/**
 * Run a single named migration script from scripts/migrations/.
 * Each script must export: preview(), execute(), rollback(), meta.
 */
export async function runMigrationScript(
  scriptName: string,
  mode: 'preview' | 'execute'
): Promise<StepResult> {
  const start = Date.now();
  try {
    const modulePath = path.join(SCRIPTS_DIR, `${scriptName}.ts`);
    // Dynamic import — works with tsx at runtime
    const mod = await import(modulePath);

    if (mode === 'preview') {
      const result = await mod.preview();
      return {
        name: scriptName,
        ok: true,
        rowsAffected: result?.rowsAffected ?? 0,
        durationMs: Date.now() - start,
        detail: JSON.stringify(result?.preview ?? []).slice(0, 500),
      };
    } else {
      const result = await mod.execute();
      return {
        name: scriptName,
        ok: true,
        rowsAffected: result?.rowsAffected ?? 0,
        durationMs: Date.now() - start,
        detail: result?.detail ?? 'Done',
      };
    }
  } catch (err: any) {
    return {
      name: scriptName,
      ok: false,
      rowsAffected: 0,
      durationMs: Date.now() - start,
      error: err.message?.slice(0, 1000),
    };
  }
}

/**
 * Count pending Prisma migrations that have not yet been applied.
 */
export async function getPendingMigrations(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('npx prisma migrate status --json 2>/dev/null || npx prisma migrate status', {
      cwd: PROJECT_DIR,
      timeout: 30 * 1000,
    });
    // Parse the text output — look for lines with "following migration(s) have not yet been applied"
    const lines = stdout.split('\n');
    const pending: string[] = [];
    let inPendingBlock = false;
    for (const line of lines) {
      if (line.includes('not yet been applied') || line.includes('pending')) {
        inPendingBlock = true;
      }
      if (inPendingBlock && /^\s+\d{14}_/.test(line)) {
        pending.push(line.trim());
      }
    }
    return pending;
  } catch {
    return [];
  }
}
