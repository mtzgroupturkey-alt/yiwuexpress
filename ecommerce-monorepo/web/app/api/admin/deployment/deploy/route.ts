export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  const steps: Array<{ step: string; status: 'completed' | 'failed' | 'in-progress' | 'skipped'; detail: string }> = [];
  const logEntries: string[] = [];

  function addLog(msg: string) {
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    logEntries.push(entry);
    console.log(entry);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const branch: 'main' | 'production' = body.branch === 'main' ? 'main' : 'production';
    const rawCommitMessage: string = (body.commitMessage || '').trim();
    const autoCommit: boolean = body.autoCommit !== false;
    const isProduction = process.env.NODE_ENV === 'production';

    addLog(`Initiating deployment pipeline for target branch: ${branch.toUpperCase()}`);
    steps.push({ step: 'Initialize', status: 'completed', detail: `Target branch: ${branch}` });

    // Step 1: Check Working Tree
    const { stdout: statusOut } = await execAsync('git status --porcelain').catch(() => ({ stdout: '' }));
    const dirty = statusOut.trim().length > 0;
    const changedLines = statusOut.split('\n').filter((l) => l.trim());

    addLog(`Git status: ${dirty ? `${changedLines.length} modified/untracked file(s)` : 'Clean working directory'}`);

    // Step 2: Auto-commit if commit message provided or autoCommit with dirty tree
    let commitHash = '';
    let finalCommitMsg = '';

    if (dirty && (rawCommitMessage || autoCommit)) {
      const msg = rawCommitMessage || `chore(deploy): automated sync before deploy to ${branch}`;
      addLog(`Staging all working directory changes (git add -A)...`);
      await execAsync('git add -A');
      addLog(`Creating commit: "${msg}"...`);
      // Escape double quotes and backslashes in commit message
      const sanitizedMsg = msg.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      await execAsync(`git commit -m "${sanitizedMsg}"`);
      steps.push({ step: 'Commit Changes', status: 'completed', detail: msg });
    } else if (rawCommitMessage && !dirty) {
      addLog(`Working tree is clean; deploying existing HEAD commit.`);
      steps.push({ step: 'Commit Verification', status: 'completed', detail: 'Clean working tree' });
    } else {
      steps.push({ step: 'Working Tree Check', status: 'completed', detail: 'Clean working tree' });
    }

    const { stdout: shortHash } = await execAsync('git rev-parse --short HEAD').catch(() => ({ stdout: 'unknown' }));
    const { stdout: commitMsgOut } = await execAsync('git log -1 --pretty=format:%s').catch(() => ({ stdout: '' }));
    commitHash = shortHash.trim();
    finalCommitMsg = commitMsgOut.trim();

    addLog(`Deploying commit: [${commitHash}] "${finalCommitMsg}"`);

    // Step 3: Push to GitHub Remotes
    // Push to origin
    const pushOriginCmd = branch === 'production' ? 'git push origin main:production' : 'git push origin main';
    addLog(`Pushing to origin (${pushOriginCmd})...`);
    try {
      const { stdout: originOut, stderr: originErr } = await execAsync(pushOriginCmd);
      addLog(`Origin push result: ${originOut || originErr || 'Up to date'}`);
      steps.push({ step: 'Push to Origin', status: 'completed', detail: `origin/${branch}` });
    } catch (pushErr: any) {
      addLog(`Error pushing to origin: ${pushErr.message}`);
      steps.push({ step: 'Push to Origin', status: 'failed', detail: pushErr.message });
      throw new Error(`Failed pushing to origin: ${pushErr.message}`);
    }

    // Push to dromkok remote (if configured)
    try {
      const pushDromkokCmd = branch === 'production' ? 'git push dromkok main:production' : 'git push dromkok main';
      addLog(`Syncing with dromkok remote (${pushDromkokCmd})...`);
      const { stdout: dromkokOut } = await execAsync(pushDromkokCmd);
      addLog(`Dromkok push result: ${dromkokOut || 'Synced'}`);
      steps.push({ step: 'Sync Dromkok Remote', status: 'completed', detail: `dromkok/${branch}` });
    } catch (dromkokErr: any) {
      addLog(`Dromkok remote sync notice: ${dromkokErr.message}`);
      // Not fatal if dromkok remote doesn't exist
    }

    // Step 4: Server Deploy (if running on production server)
    if (isProduction) {
      addLog(`Executing production server deploy script (/www/wwwroot/www.dromkok.com/web/deploy.sh ${branch})...`);
      exec(`bash /www/wwwroot/www.dromkok.com/web/deploy.sh ${branch}`, (error, stdout, stderr) => {
        if (error) console.error('Deploy script error:', error);
        if (stdout) console.log('Deploy script stdout:', stdout);
      });
      steps.push({ step: 'Server Script', status: 'completed', detail: 'Triggered deploy.sh' });
    } else {
      addLog(`Local environment: GitHub Actions will build and deploy branch ${branch.toUpperCase()}.`);
      steps.push({ step: 'CI / GitHub Actions', status: 'completed', detail: `Triggered deployment for ${branch}` });
    }

    // Step 5: Save log file and Prisma deployment record
    const fullLog = logEntries.join('\n');
    try {
      const deployLogPath = path.join(process.cwd(), 'deploy.log');
      fs.appendFileSync(deployLogPath, `\n=== Deployment ${new Date().toISOString()} ===\n` + fullLog + '\n');
    } catch (logErr) {}

    try {
      await prisma.deployment.create({
        data: {
          deploymentNumber: `DEP-${Date.now()}`,
          environment: isProduction ? 'production' : 'development',
          status: 'success',
          type: 'deploy',
          branch,
          commitHash,
          commitMessage: finalCommitMsg,
          triggeredBy: 'admin',
          logs: fullLog,
        },
      });
    } catch (prismaErr) {}

    const successMessage =
      branch === 'production'
        ? `Successfully pushed to GitHub production branch! GitHub Actions is building and deploying commit [${commitHash}] to live server.`
        : `Successfully pushed commit [${commitHash}] to GitHub main branch!`;

    return NextResponse.json({
      success: true,
      message: successMessage,
      status: 'success',
      branch,
      commit: {
        hash: commitHash,
        message: finalCommitMsg,
      },
      steps,
      logs: fullLog,
    });
  } catch (error: any) {
    addLog(`Deployment failed: ${error.message}`);
    steps.push({ step: 'Deployment Status', status: 'failed', detail: error.message });
    return NextResponse.json(
      {
        success: false,
        message: error.message || 'Deployment failed',
        status: 'failed',
        steps,
        logs: logEntries.join('\n'),
      },
      { status: 500 }
    );
  }
}
