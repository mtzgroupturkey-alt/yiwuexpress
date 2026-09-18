import type { DeployMode } from './modes';
import { DEPLOY_MODES } from './modes';

export interface GuardError {
  field: string;
  message: string;
}

export interface GuardResult {
  ok: boolean;
  errors: GuardError[];
}

/**
 * Server-side safety guards run before any deployment execute.
 * Returns { ok: true } when all guards pass.
 */
export function checkDeploymentGuards(params: {
  mode: DeployMode;
  confirmPhrase: string;
  branch: string;
  /** Optional: current git branch name from server */
  gitBranch?: string;
}): GuardResult {
  const { mode, confirmPhrase, branch, gitBranch } = params;
  const modeConfig = DEPLOY_MODES[mode];
  const errors: GuardError[] = [];

  // Guard 1 — branch must be main or production
  const allowedBranches = ['main', 'production'];
  if (!allowedBranches.includes(branch)) {
    errors.push({
      field: 'branch',
      message: `Target branch must be "main" or "production", got: "${branch}"`,
    });
  }

  // Guard 2 — git working branch check (if available)
  if (gitBranch && !allowedBranches.includes(gitBranch)) {
    errors.push({
      field: 'gitBranch',
      message: `Current git branch is "${gitBranch}". Deploy only from main or production.`,
    });
  }

  // Guard 3 — confirmation phrase for Options B and C
  if (modeConfig.confirmPhrase !== null) {
    if (!confirmPhrase || confirmPhrase.trim() !== modeConfig.confirmPhrase) {
      errors.push({
        field: 'confirmPhrase',
        message: `Option ${mode} requires the exact phrase: "${modeConfig.confirmPhrase}"`,
      });
    }
  }

  // Guard 4 — Option C extra: never allow without explicit destructive phrase
  if (mode === 'C' && confirmPhrase !== 'REPLACE-PRODUCTION') {
    // Already caught above, but ensure it can never slip through
    if (!errors.find((e) => e.field === 'confirmPhrase')) {
      errors.push({
        field: 'confirmPhrase',
        message: 'Option C requires: REPLACE-PRODUCTION',
      });
    }
  }

  return { ok: errors.length === 0, errors };
}
