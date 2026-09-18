export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { DEPLOY_MODES, DEFAULT_MODE, type DeployMode } from '@/lib/deployment/modes';
import { MIGRATION_SCRIPTS } from '@/scripts/migrations/index';
import { getPendingMigrations } from '@/lib/deployment/migration-runner';

/**
 * GET /api/admin/deployment/preview?mode=A&branch=production&scripts=002,...
 *
 * Returns a dry-run summary of what the selected deployment mode would do.
 * No database changes are made.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const mode = (searchParams.get('mode') || DEFAULT_MODE) as DeployMode;
    const branch = searchParams.get('branch') || 'production';
    const selectedScriptIds = (searchParams.get('scripts') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!['A', 'B', 'C'].includes(mode)) {
      return NextResponse.json({ error: `Invalid mode: ${mode}` }, { status: 400 });
    }

    const modeConfig = DEPLOY_MODES[mode];

    // Get pending migrations
    const pendingMigrations = await getPendingMigrations();

    // Build steps preview
    const steps: Array<{
      label: string;
      detail: string;
      type: 'safe' | 'warn' | 'danger';
    }> = [];

    // Step 1: prisma migrate deploy (all modes)
    steps.push({
      label: 'Apply pending Prisma migrations',
      detail:
        pendingMigrations.length > 0
          ? `${pendingMigrations.length} migration(s) will be applied:\n${pendingMigrations.map((m) => `  · ${m}`).join('\n')}`
          : 'No pending migrations — schema already up to date.',
      type: 'safe',
    });

    // Option B: selected backfill scripts
    if (mode === 'B') {
      const scriptsToRun =
        selectedScriptIds.length > 0
          ? MIGRATION_SCRIPTS.filter((s) => selectedScriptIds.includes(s.id))
          : MIGRATION_SCRIPTS;

      for (const script of scriptsToRun) {
        steps.push({
          label: `Run: ${script.name}`,
          detail: `${script.description}\nEstimated rows: ${script.estimatedRows}\nIdempotent: ${script.isIdempotent ? 'yes' : 'no'}`,
          type: 'warn',
        });
      }

      steps.push({
        label: 'Automatic backup before execution',
        detail: 'A pg_dump backup will be created before any data changes.',
        type: 'safe',
      });
    }

    // Option C: destructive steps
    if (mode === 'C') {
      steps.push({
        label: '⚠️ Automatic backup before wipe',
        detail: 'A pg_dump backup will be created BEFORE dropping tables.',
        type: 'warn',
      });
      steps.push({
        label: '🔴 DROP all tables + recreate schema',
        detail: 'prisma migrate reset --force will drop all tables and recreate from schema.',
        type: 'danger',
      });
      steps.push({
        label: '🔴 Run seed script',
        detail: 'npm run db:seed — populates fresh sample data.',
        type: 'danger',
      });
    }

    // Rollback plan
    const rollbackPlan =
      mode === 'A'
        ? 'git revert HEAD + prisma migrate resolve --rolled-back <migration>'
        : 'Restore from the automatic pre-deploy backup (path recorded in MigrationLog)';

    // Estimated duration
    const baseDurationSeconds = modeConfig.estimatedSeconds;
    const scriptDurationSeconds =
      mode === 'B'
        ? (selectedScriptIds.length > 0
            ? MIGRATION_SCRIPTS.filter((s) => selectedScriptIds.includes(s.id))
            : MIGRATION_SCRIPTS
          ).reduce((sum, s) => sum + s.estimatedDurationSeconds, 0)
        : 0;
    const estimatedSeconds = baseDurationSeconds + scriptDurationSeconds;

    return NextResponse.json({
      mode,
      modeConfig,
      branch,
      pendingMigrations,
      steps,
      rollbackPlan,
      estimatedSeconds,
      requiresConfirmPhrase: modeConfig.confirmPhrase,
      requiresBackup: modeConfig.requiresBackup,
      isDestructive: modeConfig.isDestructive,
      availableScripts: mode === 'B' ? MIGRATION_SCRIPTS : [],
    });
  } catch (error: any) {
    console.error('[deployment/preview] error:', error);
    return NextResponse.json(
      { error: error.message || 'Preview failed' },
      { status: 500 }
    );
  }
}
