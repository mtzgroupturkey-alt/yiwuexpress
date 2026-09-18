export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { DEPLOY_MODES, DEFAULT_MODE, type DeployMode } from '@/lib/deployment/modes';
import { checkDeploymentGuards } from '@/lib/deployment/guards';
import { triggerBackup, findLatestBackup } from '@/lib/deployment/backup';
import {
  runPrismaMigrations,
  runMigrationScript,
  resetDatabase,
  type StepResult,
} from '@/lib/deployment/migration-runner';
import { MIGRATION_SCRIPTS } from '@/scripts/migrations/index';
import { prisma } from '@/lib/db';

/**
 * POST /api/admin/deployment/execute
 *
 * Body: {
 *   mode: "A" | "B" | "C",
 *   branch: "main" | "production",
 *   confirmPhrase: string,
 *   selectedScripts?: string[],   // Option B only: script IDs to run
 *   executedBy?: string,           // admin user id
 * }
 *
 * Safety guards are enforced server-side regardless of UI state.
 */
export async function POST(request: NextRequest) {
  const logs: string[] = [];
  const stepResults: StepResult[] = [];
  const overallStart = Date.now();

  function log(msg: string) {
    const ts = new Date().toLocaleTimeString();
    const entry = `[${ts}] ${msg}`;
    logs.push(entry);
    console.log(`[deployment/execute] ${entry}`);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const mode: DeployMode = ['A', 'B', 'C'].includes(body.mode)
      ? body.mode
      : DEFAULT_MODE;
    const branch: string = body.branch === 'main' ? 'main' : 'production';
    const confirmPhrase: string = (body.confirmPhrase || '').trim();
    const selectedScriptIds: string[] = Array.isArray(body.selectedScripts)
      ? body.selectedScripts
      : [];
    const executedBy: string = body.executedBy || 'admin';

    log(`Deployment execute started — Mode: ${mode}, Branch: ${branch}`);

    // ── Safety Guards ──────────────────────────────────────────────────────
    const guardResult = checkDeploymentGuards({ mode, confirmPhrase, branch });
    if (!guardResult.ok) {
      log(`Guard check FAILED: ${guardResult.errors.map((e) => e.message).join('; ')}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Safety guard failed',
          guardErrors: guardResult.errors,
          logs: logs.join('\n'),
        },
        { status: 400 }
      );
    }
    log('Guard checks passed.');

    // ── Backup (required for B and C) ──────────────────────────────────────
    let backupPath: string | undefined;
    const modeConfig = DEPLOY_MODES[mode];

    if (modeConfig.requiresBackup) {
      log('Creating automatic backup before data operations...');
      const backupResult = await triggerBackup();
      if (!backupResult.ok) {
        log(`BACKUP FAILED: ${backupResult.error}`);
        return NextResponse.json(
          {
            success: false,
            error: `Cannot proceed — backup failed: ${backupResult.error}`,
            logs: logs.join('\n'),
          },
          { status: 500 }
        );
      }
      backupPath = backupResult.backupPath ?? findLatestBackup() ?? undefined;
      log(`Backup completed: ${backupPath} (${((backupResult.sizeBytes ?? 0) / 1024).toFixed(1)} KB)`);
    }

    // ── Option A & B: prisma migrate deploy ────────────────────────────────
    if (mode === 'A' || mode === 'B') {
      log('Running prisma migrate deploy...');
      const migrateResult = await runPrismaMigrations();
      stepResults.push(migrateResult);
      log(
        migrateResult.ok
          ? `Migrations applied in ${migrateResult.durationMs}ms. ${migrateResult.detail}`
          : `Migration FAILED: ${migrateResult.error}`
      );

      if (!migrateResult.ok) {
        await writeMigrationLog({
          scriptName: 'prisma migrate deploy',
          executedBy,
          mode,
          rowsAffected: 0,
          success: false,
          error: migrateResult.error,
          backupPath,
          durationMs: Date.now() - overallStart,
        });
        return NextResponse.json(
          {
            success: false,
            error: `Migration deploy failed: ${migrateResult.error}`,
            steps: stepResults,
            logs: logs.join('\n'),
          },
          { status: 500 }
        );
      }
    }

    // ── Option B: run selected backfill scripts ────────────────────────────
    if (mode === 'B') {
      const scriptsToRun =
        selectedScriptIds.length > 0
          ? MIGRATION_SCRIPTS.filter((s) => selectedScriptIds.includes(s.id))
          : MIGRATION_SCRIPTS;

      for (const scriptMeta of scriptsToRun) {
        log(`Running script: ${scriptMeta.name}...`);
        const result = await runMigrationScript(scriptMeta.file, 'execute');
        stepResults.push(result);

        await writeMigrationLog({
          scriptName: scriptMeta.id,
          executedBy,
          mode,
          rowsAffected: result.rowsAffected,
          success: result.ok,
          error: result.error,
          backupPath,
          durationMs: result.durationMs,
          metadata: { detail: result.detail },
        });

        log(
          result.ok
            ? `  ✅ ${scriptMeta.name}: ${result.rowsAffected} rows affected in ${result.durationMs}ms`
            : `  ❌ ${scriptMeta.name} FAILED: ${result.error}`
        );

        if (!result.ok) {
          return NextResponse.json(
            {
              success: false,
              error: `Script failed: ${scriptMeta.name} — ${result.error}`,
              steps: stepResults,
              logs: logs.join('\n'),
            },
            { status: 500 }
          );
        }
      }
    }

    // ── Option C: reset database + seed ───────────────────────────────────
    if (mode === 'C') {
      log('⚠️  DESTRUCTIVE: Running database reset (drop all + recreate + seed)...');
      const resetResult = await resetDatabase();
      stepResults.push(resetResult);

      await writeMigrationLog({
        scriptName: 'database reset + seed',
        executedBy,
        mode,
        rowsAffected: 0,
        success: resetResult.ok,
        error: resetResult.error,
        backupPath,
        durationMs: resetResult.durationMs,
      });

      log(
        resetResult.ok
          ? `Database reset completed in ${resetResult.durationMs}ms.`
          : `Database reset FAILED: ${resetResult.error}`
      );

      if (!resetResult.ok) {
        return NextResponse.json(
          {
            success: false,
            error: `Database reset failed: ${resetResult.error}`,
            steps: stepResults,
            logs: logs.join('\n'),
          },
          { status: 500 }
        );
      }
    }

    // ── Done ──────────────────────────────────────────────────────────────
    const totalDurationMs = Date.now() - overallStart;
    log(`✅ Deployment execute completed in ${(totalDurationMs / 1000).toFixed(1)}s`);

    // Record final deployment entry
    try {
      await prisma.deployment.create({
        data: {
          deploymentNumber: `DEP-${Date.now()}`,
          environment: process.env.NODE_ENV === 'production' ? 'production' : 'development',
          status: 'success',
          type: 'deploy',
          dataMode: mode,
          branch,
          triggeredBy: executedBy,
          logs: logs.join('\n'),
          duration: Math.round(totalDurationMs / 1000),
        },
      });
    } catch {
      // Non-fatal: logging failure should not block deploy response
    }

    return NextResponse.json({
      success: true,
      mode,
      branch,
      backupPath,
      steps: stepResults,
      totalDurationMs,
      logs: logs.join('\n'),
      message: `Option ${mode} deployment completed successfully in ${(totalDurationMs / 1000).toFixed(1)}s`,
    });
  } catch (error: any) {
    log(`Unexpected error: ${error.message}`);
    console.error('[deployment/execute] unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Deployment execute failed',
        logs: logs.join('\n'),
      },
      { status: 500 }
    );
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function writeMigrationLog(data: {
  scriptName: string;
  executedBy: string;
  mode: string;
  rowsAffected: number;
  success: boolean;
  error?: string;
  backupPath?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}) {
  try {
    await (prisma as any).migrationLog.create({
      data: {
        scriptName: data.scriptName,
        executedBy: data.executedBy,
        dataMode: data.mode,
        rowsAffected: data.rowsAffected,
        success: data.success,
        error: data.error ?? null,
        backupPath: data.backupPath ?? null,
        durationMs: data.durationMs ?? null,
        metadata: data.metadata ?? null,
      },
    });
  } catch {
    // Non-fatal
  }
}
