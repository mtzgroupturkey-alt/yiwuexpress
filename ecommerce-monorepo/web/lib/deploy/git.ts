import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { GitStatus } from '@/types/deploy';

const rawExec = promisify(exec);

// Resolve the git repository root once. The Next.js app lives in a
// subdirectory (web/) of a larger monorepo, so we must run git commands from
// the repo root — otherwise `git add .` only stages files inside `web/`.
let _repoRoot: string | null = null;
async function getRepoRoot(): Promise<string> {
  if (!_repoRoot) {
    const { stdout } = await rawExec('git rev-parse --show-toplevel');
    _repoRoot = stdout.trim().replace(/\r?\n/g, '');
  }
  return _repoRoot;
}

// Run a git command from the repository root, retrying if a lock file
// contention is detected (common when the auto-refresh dashboard calls
// status while a push is in progress).
async function gitExec(command: string, retries = 3) {
  const cwd = await getRepoRoot();
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await rawExec(command, { cwd });
    } catch (err: any) {
      const msg: string = err?.stderr || err?.stdout || err?.message || '';
      if (/index\.lock|Unable to create|File exists/i.test(msg) && attempt < retries) {
        // Wait 500ms * attempt before retrying so concurrent operations
        // (e.g. auto-refresh /api/admin/local/status) have time to finish.
        await new Promise(r => setTimeout(r, 500 * attempt));
        continue;
      }
      throw err;
    }
  }
  throw new Error(`gitExec failed after ${retries} attempts`);
}

export async function getGitStatus(): Promise<GitStatus> {
  try {
    // Run sequentially to reduce lock contention from concurrent git processes.
    const branch = (await gitExec('git rev-parse --abbrev-ref HEAD')).stdout.trim();
    const commit = (await gitExec('git rev-parse HEAD')).stdout.trim();
    const author = (await gitExec('git log -1 --pretty=format:"%an"')).stdout.trim();
    const message = (await gitExec('git log -1 --pretty=format:"%s"')).stdout.trim();
    const date = (await gitExec('git log -1 --pretty=format:"%ar"')).stdout.trim();
    const remote = (await gitExec('git config --get remote.origin.url')).stdout.trim();
    const status = (await gitExec('git status --porcelain')).stdout;

    // Parse ahead/behind
    let ahead = 0;
    let behind = 0;
    try {
      const aheadBehind = await gitExec(`git rev-list --left-right --count ${branch}...origin/${branch}`);
      const [aheadStr, behindStr] = aheadBehind.stdout.trim().split('\t');
      ahead = parseInt(aheadStr) || 0;
      behind = parseInt(behindStr) || 0;
    } catch (e) {
      // Remote branch may not exist
    }

    // Parse status
    const lines = status.split('\n').filter(l => l.trim());
    const modified: string[] = [];
    const staged: string[] = [];
    const untracked: string[] = [];

    lines.forEach(line => {
      const statusCode = line.substring(0, 2);
      const file = line.substring(3);

      if (statusCode.startsWith('??')) {
        untracked.push(file);
      } else if (statusCode[0] !== ' ') {
        staged.push(file);
      } else if (statusCode[1] !== ' ') {
        modified.push(file);
      }
    });

    return {
      branch,
      commit,
      commitShort: commit.substring(0, 7),
      author,
      message,
      date,
      remote,
      ahead,
      behind,
      modified,
      staged,
      untracked,
      clean: modified.length === 0 && staged.length === 0 && untracked.length === 0,
    };
  } catch (error) {
    throw new Error(`Failed to get git status: ${error}`);
  }
}

export async function gitPull(): Promise<string> {
  try {
    const branch = await getCurrentBranch();
    const { stdout, stderr } = await gitExec(`git pull origin ${branch}`);
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Git pull failed: ${error.message}`);
  }
}

export async function gitPush(): Promise<string> {
  try {
    const branch = await getCurrentBranch();
    const { stdout, stderr } = await gitExec(`git push origin ${branch}`);
    return stdout + stderr;
  } catch (error: any) {
    throw new Error(`Git push failed: ${error.message}`);
  }
}

async function getCurrentBranch(): Promise<string> {
  const { stdout } = await gitExec('git rev-parse --abbrev-ref HEAD');
  return stdout.trim();
}

export async function gitCommitAndPush(userNote?: string): Promise<string> {
  const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
  const message = `System Push on ${timestamp} backup${userNote ? ` - ${userNote}` : ''}`;

  await gitCommit(message);
  const branch = await getCurrentBranch();
  const { stdout, stderr } = await gitExec(`git push origin ${branch}`);
  return `${message}\n${stdout}${stderr}`;
}

/**
 * How many local changes are pending (modified + staged + untracked).
 */
export async function getPendingChangesCount(): Promise<number> {
  try {
    const { stdout } = await gitExec('git status --porcelain');
    return stdout.split('\n').filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}

/**
 * Pull exactly `quantity` commits from origin (or all if 'all'/>=behind).
 * Returns the number of commits actually pulled.
 */
export interface IncomingCommit {
  hash: string;
  shortHash: string;
  author: string;
  date: string;
  message: string;
}

/**
 * List commits on origin that we don't have locally yet (newest first),
 * so the dashboard can let the user pick which ones to pull.
 */
export async function gitGetIncomingCommits(): Promise<IncomingCommit[]> {
  const branch = await getCurrentBranch();
  await gitExec(`git fetch origin ${branch}`);

  const { stdout } = await gitExec(
    `git log --pretty=format:%H%x1f%an%x1f%ar%x1f%s HEAD..origin/${branch}`
  ).catch(() => ({ stdout: '' }));

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
 * Pull the selected commits by fast-forwarding to the oldest selected one
 * (git can only fast-forward through ancestors, so everything between HEAD and
 * that commit comes along). Returns the number of commits pulled.
 */
export async function gitPullCommits(hashes: string[]): Promise<number> {
  const branch = await getCurrentBranch();
  await gitExec(`git fetch origin ${branch}`);

  if (!hashes.length) return 0;

  // Oldest selected commit (ancestor-closest to HEAD) becomes the merge target.
  const { stdout } = await gitExec(`git rev-list --reverse ${hashes.join(' ')}`);
  const lines = stdout.split('\n').filter((l) => l.trim());
  if (!lines.length) return 0;
  const target = lines[0];

  // How many commits will this bring in?
  const { stdout: countOut } = await gitExec(`git rev-list --count HEAD..${target}`);
  const pulled = parseInt(countOut.trim()) || 0;
  if (pulled === 0) return 0;

  await gitExec(`git merge --ff-only ${target}`);
  return pulled;
}

export async function gitPullQuantity(quantity: number | 'all'): Promise<number> {
  const branch = await getCurrentBranch();

  // Refresh remote tracking info.
  await gitExec(`git fetch origin ${branch}`);

  // Commits available on remote that we don't have yet (newest first).
  const { stdout: behindOut } = await gitExec(
    `git rev-list --count HEAD..origin/${branch}`
  ).catch(() => ({ stdout: '0' }));
  const behind = parseInt(behindOut.trim()) || 0;

  if (behind === 0) {
    return 0;
  }

  // Determine how many we actually want to pull.
  const wanted = quantity === 'all' ? behind : Math.min(quantity, behind);

  let target: string;
  if (wanted >= behind) {
    target = `origin/${branch}`;
  } else {
    // Oldest `wanted` commits after HEAD; take the newest of those (the one
    // that becomes our new HEAD after the fast-forward).
    const { stdout } = await gitExec(
      `git rev-list --reverse --max-count=${wanted} HEAD..origin/${branch}`
    );
    const lines = stdout.split('\n').filter((l) => l.trim());
    target = lines[lines.length - 1];
  }

  await gitExec(`git merge --ff-only ${target}`);
  return wanted;
}

/**
 * Commit all current changes with `message`, then push exactly `quantity`
 * commits to origin (or all if 'all'/>=ahead). Returns pushed count.
 */
/**
 * Commit all current changes with `message`, then push exactly `quantity`
 * commits (or all) to the target branch. If `targetBranch` is omitted the
 * current branch is used.
 */
// Clear leftover git state from previous crashed operations (stale lock file,
// interrupted rebase). Without this, a crashed rebase leaves `index.lock` and
// the push tool keeps failing with "Unable to create .git/index.lock".
async function cleanStaleGitState() {
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

export async function gitPushQuantity(
  message: string,
  quantity: number | 'all',
  targetBranch?: string
): Promise<number> {
  const dest = targetBranch && ['main', 'production'].includes(targetBranch) ? targetBranch : 'production';

  // Heal any stale git state left by a previously crashed operation.
  await cleanStaleGitState();

  // Refresh remote tracking info so we count ahead/behind correctly.
  await gitExec(`git fetch origin ${dest}`).catch(() => {/* offline is fine */});

  // Only commit if there are actual changes — skip silently if working tree is clean.
  const pendingChanges = await getPendingChangesCount();
  if (pendingChanges > 0) {
    await gitCommit(message);
  }

  // Check if the remote tracking ref exists — it won't for a new branch.
  const remoteExists = await gitExec(`git show-ref --verify refs/remotes/origin/${dest}`)
    .then(() => true)
    .catch(() => false);

  let ahead = 0;
  if (remoteExists) {
    // Commits we now have that the destination remote branch doesn't (newest first).
    const { stdout: aheadOut } = await gitExec(
      `git rev-list --count origin/${dest}..HEAD`
    ).catch(() => ({ stdout: '0' }));
    ahead = parseInt(aheadOut.trim()) || 0;

    // If the file trees are identical, there is nothing real to push even if the
    // commit count differs (empty/duplicate commits). Avoid pushing noise.
    const treeDiff = await gitExec(`git diff --stat origin/${dest} HEAD`)
      .then((r) => r.stdout.trim())
      .catch(() => '');
    if (ahead === 0 || !treeDiff) {
      return 0;
    }
  } else {
    // New branch: count total commits on current branch to report correctly.
    const { stdout: totalOut } = await gitExec(
      `git rev-list --count HEAD`
    ).catch(() => ({ stdout: '1' }));
    ahead = parseInt(totalOut.trim()) || 1;
  }

  // Push the full branch. IMPORTANT: never auto-pull/rebase here — doing so
  // replays remote (and cross-branch) commits into the local history and is
  // exactly what corrupted the branch before. If the remote has advanced, the
  // push is rejected and the user is told to Pull first (there is a Pull button).
  try {
    await gitExec(`git push origin HEAD:refs/heads/${dest}`);
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

export async function gitCommit(message: string, files: string[] = []): Promise<string> {
  try {
    // Stage files
    if (files.length > 0) {
      await gitExec(`git add ${files.map(f => `"${f}"`).join(' ')}`);
    } else {
      await gitExec('git add .');
    }

    // Commit — if nothing to commit git exits with code 1, handle gracefully.
    const { stdout, stderr } = await gitExec(`git commit -m "${message.replace(/"/g, '\\"')}"`);
    const combined = stdout + stderr;
    if (combined.includes('nothing to commit') || combined.includes('nothing added to commit')) {
      return 'Nothing to commit, working tree clean';
    }
    return stdout;
  } catch (error: any) {
    // git commit exits with code 1 when there is nothing to commit — not a real error.
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

export async function gitCheckout(branch: string): Promise<string> {
  try {
    const { stdout } = await gitExec(`git checkout ${branch}`);
    return stdout;
  } catch (error: any) {
    throw new Error(`Git checkout failed: ${error.message}`);
  }
}

export async function gitCreateBranch(name: string, checkout = true): Promise<string> {
  try {
    const cmd = checkout ? `git checkout -b ${name}` : `git branch ${name}`;
    const { stdout } = await gitExec(cmd);
    return stdout;
  } catch (error: any) {
    throw new Error(`Git create branch failed: ${error.message}`);
  }
}

export async function gitLog(limit = 10): Promise<any[]> {
  try {
    const { stdout } = await gitExec(
      `git log -${limit} --pretty=format:'{"commit":"%H","author":"%an","date":"%ar","message":"%s"}'`
    );
    
    const lines = stdout.trim().split('\n');
    return lines.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    }).filter(Boolean);
  } catch (error: any) {
    throw new Error(`Git log failed: ${error.message}`);
  }
}

export async function gitBranches(): Promise<{ name: string; current: boolean }[]> {
  try {
    const { stdout } = await gitExec('git branch');
    return stdout
      .split('\n')
      .filter(b => b.trim())
      .map(branch => ({
        name: branch.replace('* ', '').trim(),
        current: branch.startsWith('*'),
      }));
  } catch (error: any) {
    throw new Error(`Git branches failed: ${error.message}`);
  }
}
