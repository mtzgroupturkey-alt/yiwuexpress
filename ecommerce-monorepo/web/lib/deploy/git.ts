import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import {
  GitStatus,
  GitBranchInfo,
  GitLogEntry,
  IncomingCommit,
} from '@/types/deploy';

const rawExecFile = promisify(execFile);

/**
 * Validates a Git branch name to prevent flag injection and invalid ref syntax.
 * Rejects leading dashes (which could be interpreted as CLI options), control chars,
 * and characters illegal in git refs (~, ^, :, ?, *, [, \, @{, ..).
 */
export function validateBranchName(branch: string): string {
  if (typeof branch !== 'string') {
    throw new Error('Branch name must be a string');
  }

  const trimmed = branch.trim();
  if (!trimmed) {
    throw new Error('Branch name cannot be empty');
  }

  if (trimmed.startsWith('-')) {
    throw new Error('Branch name cannot start with a hyphen (flag injection prevention)');
  }

  if (trimmed.length > 250) {
    throw new Error('Branch name is too long (maximum 250 characters)');
  }

  // Git reference format safety checks
  // Disallows: spaces, control chars, ~, ^, :, ?, *, [, \, @{, .., ending with . or /, consecutive slashes
  const validBranchPattern = /^(?!.*\.\.)(?!.*\/\.)(?!.*@\{)[a-zA-Z0-9_\-\.\/]+(?<![\.\/])$/;
  if (!validBranchPattern.test(trimmed)) {
    throw new Error(`Invalid branch name format: "${trimmed}"`);
  }

  return trimmed;
}

/**
 * Validates and sanitizes a commit message.
 * Ensures the message is non-empty, strips null bytes, and enforces reasonable length.
 */
export function validateCommitMessage(message: string): string {
  if (typeof message !== 'string') {
    throw new Error('Commit message must be a string');
  }

  // Remove null bytes
  const sanitized = message.replace(/\0/g, '').trim();
  if (!sanitized) {
    throw new Error('Commit message cannot be empty');
  }

  if (sanitized.length > 10000) {
    throw new Error('Commit message exceeds maximum length of 10,000 characters');
  }

  return sanitized;
}

/**
 * Validates a list of relative file paths for git staging.
 * Prevents CLI flag injection (leading hyphens) and null bytes.
 */
export function validateFilePaths(files: string[]): string[] {
  if (!Array.isArray(files)) {
    throw new Error('Files must be an array of path strings');
  }

  return files.map((file) => {
    if (typeof file !== 'string') {
      throw new Error('File path must be a string');
    }
    const trimmed = file.trim().replace(/\0/g, '');
    if (!trimmed) {
      throw new Error('File path cannot be empty');
    }
    if (trimmed.startsWith('-')) {
      throw new Error('File path cannot start with a hyphen (flag injection prevention)');
    }
    return trimmed;
  });
}

/**
 * Validates a Git commit hash or short hash (hexadecimal only).
 */
export function validateCommitHash(hash: string): string {
  if (typeof hash !== 'string') {
    throw new Error('Commit hash must be a string');
  }
  const trimmed = hash.trim();
  if (!/^[a-fA-F0-9]{4,64}$/.test(trimmed)) {
    throw new Error(`Invalid commit hash: "${trimmed}"`);
  }
  return trimmed;
}

// Resolve the git repository root once.
let _repoRoot: string | null = null;
async function getRepoRoot(): Promise<string> {
  if (!_repoRoot) {
    const { stdout } = await rawExecFile('git', ['rev-parse', '--show-toplevel']);
    _repoRoot = stdout.trim().replace(/\r?\n/g, '');
  }
  return _repoRoot;
}

/**
 * Execute a Git command with parameterized arguments (no shell interpolation).
 * Retries on lock file contention.
 */
export async function gitExec(
  args: string[],
  retries = 3
): Promise<{ stdout: string; stderr: string }> {
  const cwd = await getRepoRoot();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await rawExecFile('git', args, {
        cwd,
        maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      });
    } catch (err: any) {
      const msg: string = err?.stderr || err?.stdout || err?.message || '';
      if (/index\.lock|Unable to create|File exists/i.test(msg) && attempt < retries) {
        await new Promise((r) => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`gitExec failed after ${retries} attempts for: git ${args.join(' ')}`);
}

/**
 * Retrieves the current Git status of the repository.
 */
export async function getGitStatus(): Promise<GitStatus> {
  try {
    const branchOut = (await gitExec(['rev-parse', '--abbrev-ref', 'HEAD'])).stdout.trim();
    const commitOut = (await gitExec(['rev-parse', 'HEAD'])).stdout.trim();
    const authorOut = (await gitExec(['log', '-1', '--pretty=format:%an'])).stdout.trim();
    const messageOut = (await gitExec(['log', '-1', '--pretty=format:%s'])).stdout.trim();
    const dateOut = (await gitExec(['log', '-1', '--pretty=format:%ar'])).stdout.trim();
    const remoteOut = (
      await gitExec(['config', '--get', 'remote.origin.url']).catch(() => ({ stdout: '' }))
    ).stdout.trim();
    const statusOut = (await gitExec(['status', '--porcelain'])).stdout;

    // Parse ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const aheadBehind = await gitExec([
        'rev-list',
        '--left-right',
        '--count',
        `${branchOut}...origin/${branchOut}`,
      ]);
      const [aheadStr, behindStr] = aheadBehind.stdout.trim().split('\t');
      ahead = parseInt(aheadStr, 10) || 0;
      behind = parseInt(behindStr, 10) || 0;
    } catch {
      // Remote branch may not exist yet
    }

    // Parse status lines
    const lines = statusOut.split('\n').filter((l) => l.trim());
    const modified: string[] = [];
    const staged: string[] = [];
    const untracked: string[] = [];

    lines.forEach((line) => {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3).trim();

      if (statusCode.startsWith('??')) {
        untracked.push(file);
      } else if (statusCode[0] !== ' ') {
        staged.push(file);
      } else if (statusCode[1] !== ' ') {
        modified.push(file);
      }
    });

    return {
      branch: branchOut,
      commit: commitOut,
      commitShort: commitOut.substring(0, 7),
      author: authorOut,
      message: messageOut,
      date: dateOut,
      remote: remoteOut,
      ahead,
      behind,
      modified,
      staged,
      untracked,
      clean: modified.length === 0 && staged.length === 0 && untracked.length === 0,
    };
  } catch (error: any) {
    throw new Error(`Failed to get git status: ${error?.message || error}`);
  }
}

/**
 * Returns the current active branch name.
 */
export async function getCurrentBranch(): Promise<string> {
  const { stdout } = await gitExec(['rev-parse', '--abbrev-ref', 'HEAD']);
  return stdout.trim();
}

/**
 * Pulls latest changes from origin for current branch.
 */
export async function gitPull(): Promise<string> {
  try {
    const branch = await getCurrentBranch();
    validateBranchName(branch);
    const { stdout, stderr } = await gitExec(['pull', 'origin', branch]);
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Git pull failed: ${error.message}`);
  }
}

/**
 * Pushes commits on current branch to origin.
 */
export async function gitPush(): Promise<string> {
  try {
    const branch = await getCurrentBranch();
    validateBranchName(branch);
    const { stdout, stderr } = await gitExec(['push', 'origin', branch]);
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Git push failed: ${error.message}`);
  }
}

/**
 * Commits pending changes and pushes to origin.
 */
export async function gitCommitAndPush(userNote?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const notePart = userNote ? ` - ${userNote.trim()}` : '';
  const message = `System Push on ${timestamp} backup${notePart}`;

  await gitCommit(message);
  const branch = await getCurrentBranch();
  validateBranchName(branch);
  const { stdout, stderr } = await gitExec(['push', 'origin', branch]);
  return `${message}\n${stdout}${stderr}`;
}

/**
 * Counts how many local changes are pending (modified + staged + untracked).
 */
export async function getPendingChangesCount(): Promise<number> {
  try {
    const { stdout } = await gitExec(['status', '--porcelain']);
    return stdout.split('\n').filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

/**
 * Lists commits on origin that are not present locally.
 */
export async function gitGetIncomingCommits(): Promise<IncomingCommit[]> {
  const branch = await getCurrentBranch();
  validateBranchName(branch);
  await gitExec(['fetch', 'origin', branch]);

  const { stdout } = await gitExec([
    'log',
    '--pretty=format:%H%x1f%an%x1f%ar%x1f%s',
    `HEAD..origin/${branch}`,
  ]).catch(() => ({ stdout: '' }));

  return stdout
    .split('\n')
    .filter((l) => l.trim())
    .map((line) => {
      const [hash = '', author = '', date = '', message = ''] = line.split('\x1f');
      return {
        hash,
        shortHash: hash.substring(0, 7),
        author,
        date,
        message,
      };
    });
}

/**
 * Pulls selected commits by fast-forwarding to the oldest selected one.
 */
export async function gitPullCommits(hashes: string[]): Promise<number> {
  const branch = await getCurrentBranch();
  validateBranchName(branch);
  await gitExec(['fetch', 'origin', branch]);

  if (!Array.isArray(hashes) || !hashes.length) return 0;

  const validatedHashes = hashes.map(validateCommitHash);

  // Oldest selected commit becomes merge target
  const { stdout } = await gitExec(['rev-list', '--reverse', ...validatedHashes]);
  const lines = stdout.split('\n').filter((l) => l.trim());
  if (!lines.length) return 0;
  const target = lines[0];

  const { stdout: countOut } = await gitExec(['rev-list', '--count', `HEAD..${target}`]);
  const pulled = parseInt(countOut.trim(), 10) || 0;
  if (pulled === 0) return 0;

  await gitExec(['merge', '--ff-only', target]);
  return pulled;
}

/**
 * Pulls a specific quantity of commits (or 'all').
 */
export async function gitPullQuantity(quantity: number | 'all'): Promise<number> {
  const branch = await getCurrentBranch();
  validateBranchName(branch);

  await gitExec(['fetch', 'origin', branch]);

  const { stdout: behindOut } = await gitExec([
    'rev-list',
    '--count',
    `HEAD..origin/${branch}`,
  ]).catch(() => ({ stdout: '0' }));
  const behind = parseInt(behindOut.trim(), 10) || 0;

  if (behind === 0) {
    return 0;
  }

  const wanted = quantity === 'all' ? behind : Math.min(quantity, behind);

  let target: string;
  if (wanted >= behind) {
    target = `origin/${branch}`;
  } else {
    const { stdout } = await gitExec([
      'rev-list',
      '--reverse',
      `--max-count=${wanted}`,
      `HEAD..origin/${branch}`,
    ]);
    const lines = stdout.split('\n').filter((l) => l.trim());
    target = lines[lines.length - 1];
  }

  await gitExec(['merge', '--ff-only', target]);
  return wanted;
}

/**
 * Clean leftover git state from previously crashed operations.
 */
export async function cleanStaleGitState(): Promise<void> {
  try {
    const cwd = await getRepoRoot();
    const lock = path.join(cwd, '.git', 'index.lock');
    if (fs.existsSync(lock)) fs.unlinkSync(lock);
    const rebaseMerge = path.join(cwd, '.git', 'rebase-merge');
    const rebaseApply = path.join(cwd, '.git', 'rebase-apply');
    if (fs.existsSync(rebaseMerge)) fs.rmSync(rebaseMerge, { recursive: true, force: true });
    if (fs.existsSync(rebaseApply)) fs.rmSync(rebaseApply, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

/**
 * Stages files and creates a commit.
 */
export async function gitCommit(message: string, files: string[] = []): Promise<string> {
  try {
    const validMessage = validateCommitMessage(message);
    const validFiles = validateFilePaths(files);

    if (validFiles.length > 0) {
      await gitExec(['add', '--', ...validFiles]);
    } else {
      await gitExec(['add', '.']);
    }

    const { stdout, stderr } = await gitExec(['commit', '-m', validMessage]);
    const combined = stdout + stderr;
    if (combined.includes('nothing to commit') || combined.includes('nothing added to commit')) {
      return 'Nothing to commit, working tree clean';
    }
    return stdout;
  } catch (error: any) {
    if (
      error.message?.includes('nothing to commit') ||
      error.stderr?.includes('nothing to commit') ||
      error.stdout?.includes('nothing to commit')
    ) {
      return 'Nothing to commit, working tree clean';
    }
    throw new Error(`Git commit failed: ${error.message}`);
  }
}

/**
 * Switches to an existing Git branch.
 */
export async function gitCheckout(branch: string): Promise<string> {
  try {
    const validBranch = validateBranchName(branch);
    const { stdout } = await gitExec(['checkout', validBranch]);
    return stdout;
  } catch (error: any) {
    throw new Error(`Git checkout failed: ${error.message}`);
  }
}

/**
 * Creates and optionally checks out a new branch.
 */
export async function gitCreateBranch(name: string, checkout = true): Promise<string> {
  try {
    const validBranch = validateBranchName(name);
    const args = checkout ? ['checkout', '-b', validBranch] : ['branch', validBranch];
    const { stdout } = await gitExec(args);
    return stdout;
  } catch (error: any) {
    throw new Error(`Git create branch failed: ${error.message}`);
  }
}

/**
 * Retrieves commit history logs.
 */
export async function gitLog(limit = 10): Promise<GitLogEntry[]> {
  try {
    const safeLimit = Math.max(1, Math.min(100, Math.floor(limit)));
    const { stdout } = await gitExec([
      'log',
      `-${safeLimit}`,
      '--pretty=format:{"commit":"%H","author":"%an","date":"%ar","message":"%s"}',
    ]);

    const lines = stdout.trim().split('\n');
    const entries: GitLogEntry[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const parsed = JSON.parse(line);
        if (parsed.commit && parsed.author) {
          entries.push(parsed);
        }
      } catch {
        // Skip malformed lines
      }
    }

    return entries;
  } catch (error: any) {
    throw new Error(`Git log failed: ${error.message}`);
  }
}

/**
 * Lists local branches and identifies active branch.
 */
export async function gitBranches(): Promise<GitBranchInfo[]> {
  try {
    const { stdout } = await gitExec(['branch']);
    return stdout
      .split('\n')
      .filter((b) => b.trim())
      .map((branch) => ({
        name: branch.replace('* ', '').trim(),
        current: branch.startsWith('*'),
      }));
  } catch (error: any) {
    throw new Error(`Git branches failed: ${error.message}`);
  }
}

/**
 * Commits pending changes and pushes to the target branch.
 */
export async function gitPushQuantity(
  message: string,
  quantity: number | 'all',
  targetBranch?: string
): Promise<number> {
  const allowedBranches = ['main', 'production'];
  const dest =
    targetBranch && allowedBranches.includes(targetBranch) ? targetBranch : 'production';
  validateBranchName(dest);
  const validMessage = validateCommitMessage(message);

  await cleanStaleGitState();

  // Refresh remote tracking info
  await gitExec(['fetch', 'origin', dest]).catch(() => {/* offline is fine */});

  const pendingChanges = await getPendingChangesCount();
  if (pendingChanges > 0) {
    await gitCommit(validMessage);
  }

  const remoteExists = await gitExec(['show-ref', '--verify', `refs/remotes/origin/${dest}`])
    .then(() => true)
    .catch(() => false);

  let ahead = 0;
  if (remoteExists) {
    const { stdout: aheadOut } = await gitExec([
      'rev-list',
      '--count',
      `origin/${dest}..HEAD`,
    ]).catch(() => ({ stdout: '0' }));
    ahead = parseInt(aheadOut.trim(), 10) || 0;

    const treeDiff = await gitExec(['diff', '--stat', `origin/${dest}`, 'HEAD'])
      .then((r) => r.stdout.trim())
      .catch(() => '');
    if (ahead === 0 || !treeDiff) {
      return 0;
    }
  } else {
    const { stdout: totalOut } = await gitExec(['rev-list', '--count', 'HEAD']).catch(
      () => ({ stdout: '1' })
    );
    ahead = parseInt(totalOut.trim(), 10) || 1;
  }

  try {
    await gitExec(['push', 'origin', `HEAD:refs/heads/${dest}`]);
  } catch (e: any) {
    const detail: string = e?.stderr || e?.stdout || e?.message || String(e);
    if (/non-fast-forward|fetch first|behind its remote/i.test(detail)) {
      throw new Error(
        `Push rejected: the "${dest}" branch on GitHub has commits you don't have locally. ` +
        `Use "Pull from GitHub" first to integrate them, then push again.`
      );
    }
    throw new Error(`Push failed: ${detail}`);
  }

  return ahead;
}

export {
  type GitStatus,
  type GitBranchInfo,
  type GitLogEntry,
  type IncomingCommit,
};
