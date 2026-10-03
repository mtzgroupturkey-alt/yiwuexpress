export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const forceFlag = body.force !== false ? '--force' : '';
    const scriptPath = path.join(process.cwd(), 'scripts', 'restore-catalog-snapshot.js');

    console.log(`[API /admin/catalog/restore] Executing restore-catalog-snapshot.js ${forceFlag}...`);
    const { stdout, stderr } = await execAsync(`node "${scriptPath}" ${forceFlag}`, {
      timeout: 10 * 60 * 1000
    });

    console.log(`[API /admin/catalog/restore] Output:\n${stdout}`);
    if (stderr) console.warn(`[API /admin/catalog/restore] Stderr:\n${stderr}`);

    return NextResponse.json({
      success: true,
      message: 'Catalog snapshot restored successfully',
      output: stdout
    });
  } catch (error: any) {
    console.error('[API /admin/catalog/restore] Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to restore catalog snapshot'
    }, { status: 500 });
  }
}
