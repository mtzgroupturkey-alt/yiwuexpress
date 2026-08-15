import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { DeploymentLog } from '@/types/deploy';
import { PrismaClient } from '@prisma/client';

const execAsync = promisify(exec);
const prisma = new PrismaClient();

const LOCK_FILE = '/tmp/deployment.lock';
const DEPLOY_SCRIPT = process.env.DEPLOY_SCRIPT || '/www/wwwroot/www.dromkok.com/web/deploy.sh';

export async function deployToProduction(): Promise<{ success: boolean; deploymentId: string; logs: string }> {
  let deploymentId: string | null = null;

  try {
    // Check for existing lock
    if (fs.existsSync(LOCK_FILE)) {
      throw new Error('Another deployment is already in progress');
    }

    // Create lock file
    fs.writeFileSync(LOCK_FILE, Date.now().toString());

    // Get git info before deployment
    const [branch, commit, message, author] = await Promise.all([
      execAsync('git rev-parse --abbrev-ref HEAD').then(r => r.stdout.trim()).catch(() => 'unknown'),
      execAsync('git rev-parse HEAD').then(r => r.stdout.trim()).catch(() => 'unknown'),
      execAsync('git log -1 --pretty=format:"%s"').then(r => r.stdout.trim()).catch(() => 'No message'),
      execAsync('git log -1 --pretty=format:"%an"').then(r => r.stdout.trim()).catch(() => 'Unknown'),
    ]);

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        deploymentNumber: `DEP-${Date.now()}`,
        environment: 'production',
        status: 'in-progress',
        type: 'deploy',
        branch,
        commitHash: commit,
        commitMessage: message,
        triggeredBy: 'admin',
      },
    });

    deploymentId = deployment.id;

    const startTime = Date.now();

    // Run deployment script
    const { stdout, stderr } = await execAsync(`bash ${DEPLOY_SCRIPT}`);
    const logs = stdout + stderr;

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update deployment record
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: 'success',
        completedAt: new Date(),
        duration,
        logs,
      },
    });

    // Remove lock file
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }

    return {
      success: true,
      deploymentId: deployment.id,
      logs,
    };
  } catch (error: any) {
    // Update deployment record with error
    if (deploymentId) {
      await prisma.deployment.update({
        where: { id: deploymentId },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: error.message,
        },
      });
    }

    // Remove lock file
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }

    throw new Error(`Deployment failed: ${error.message}`);
  }
}

export async function getDeploymentHistory(limit = 10): Promise<DeploymentLog[]> {
  try {
    const deployments = await prisma.deployment.findMany({
      where: {
        environment: 'production',
      },
      orderBy: {
        startedAt: 'desc',
      },
      take: limit,
    });

    return deployments.map(d => ({
      id: d.id,
      deploymentNumber: d.deploymentNumber,
      timestamp: d.startedAt.toISOString(),
      status: d.status as 'success' | 'failed' | 'in-progress',
      duration: d.duration ? `${d.duration}s` : 'N/A',
      commit: d.commitHash?.substring(0, 7) || 'unknown',
      commitMessage: d.commitMessage || '',
      author: 'admin',
      branch: d.branch || 'unknown',
      type: d.type,
      error: d.error || undefined,
    }));
  } catch (error) {
    console.error('Failed to get deployment history:', error);
    return [];
  }
}

export async function getDeploymentLogs(deploymentId: string): Promise<string> {
  try {
    const deployment = await prisma.deployment.findUnique({
      where: { id: deploymentId },
    });

    return deployment?.logs || 'No logs available';
  } catch (error) {
    return 'Failed to fetch logs';
  }
}

export async function rollbackDeployment(backupFilename: string): Promise<string> {
  try {
    // Check for existing lock
    if (fs.existsSync(LOCK_FILE)) {
      throw new Error('Another deployment is already in progress');
    }

    // Create lock file
    fs.writeFileSync(LOCK_FILE, Date.now().toString());

    // Create deployment record
    const deployment = await prisma.deployment.create({
      data: {
        deploymentNumber: `RB-${Date.now()}`,
        environment: 'production',
        status: 'in-progress',
        type: 'rollback',
        triggeredBy: 'admin',
        metadata: { backupFilename },
      },
    });

    const startTime = Date.now();

    // Run rollback script
    const rollbackScript = '/www/wwwroot/www.dromkok.com/web/scripts/rollback.sh';
    const { stdout, stderr } = await execAsync(`bash ${rollbackScript} ${backupFilename}`);
    const logs = stdout + stderr;

    const duration = Math.floor((Date.now() - startTime) / 1000);

    // Update deployment record
    await prisma.deployment.update({
      where: { id: deployment.id },
      data: {
        status: 'success',
        completedAt: new Date(),
        duration,
        logs,
      },
    });

    // Remove lock file
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }

    return logs;
  } catch (error: any) {
    // Remove lock file
    if (fs.existsSync(LOCK_FILE)) {
      fs.unlinkSync(LOCK_FILE);
    }

    throw new Error(`Rollback failed: ${error.message}`);
  }
}

export function isDeploymentInProgress(): boolean {
  return fs.existsSync(LOCK_FILE);
}
