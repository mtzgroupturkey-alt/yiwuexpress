export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

const MIME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

// GET /api/admin/licenses/[id] - Stream secure license document (Admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Require ADMIN role (with localhost development fallback for preview image tags)
    try {
      await requireRole(request, ['ADMIN']);
    } catch (authError) {
      const host = request.headers.get('host') || '';
      const isLocalhost = host.startsWith('localhost:') || host.startsWith('127.0.0.1:');
      console.log('[DEBUG LICENSES]', { host, isLocalhost, nodeEnv: process.env.NODE_ENV });
      if (process.env.NODE_ENV !== 'production' && isLocalhost) {
        // Allow localhost dev preview
      } else {
        throw authError;
      }
    }

    const docId = params.id;
    if (!docId) {
      return NextResponse.json({ error: 'Document ID required' }, { status: 400 });
    }

    // 2. Fetch VerificationDocument
    const doc = await prisma.verificationDocument.findUnique({
      where: { id: docId },
      include: { user: { select: { id: true, name: true, companyName: true } } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'License document not found' }, { status: 404 });
    }

    // 3. Locate file on disk (Check secure storage and fallback locations)
    const rawFileName = doc.fileName || path.basename(doc.fileUrl || '');
    const cleanFileName = path.basename(rawFileName);

    const cwd = process.cwd();
    const candidatePaths = [
      path.join(cwd, 'storage', 'licenses', cleanFileName),
      path.join(cwd, 'public', 'uploads', 'licenses', cleanFileName),
      path.join(cwd, 'web', 'storage', 'licenses', cleanFileName),
      path.join(cwd, 'web', 'public', 'uploads', 'licenses', cleanFileName),
      path.join(cwd, 'ecommerce-monorepo', 'web', 'storage', 'licenses', cleanFileName),
      path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'uploads', 'licenses', cleanFileName),
      path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'storage', 'licenses', cleanFileName),
      path.join('/www', 'wwwroot', 'www.dromkok.com', 'storage', 'licenses', cleanFileName),
      path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', 'licenses', cleanFileName),
      path.join('/www', 'wwwroot', 'www.dromkok.com', 'public', 'uploads', 'licenses', cleanFileName),
    ];

    let resolvedPath: string | null = null;
    for (const p of candidatePaths) {
      try {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          resolvedPath = p;
          break;
        }
      } catch {}
    }

    if (!resolvedPath) {
      return NextResponse.json({ error: 'Physical document file missing on server' }, { status: 404 });
    }

    const fileBuffer = await fs.promises.readFile(resolvedPath);
    const ext = doc.fileName.split('.').pop()?.toLowerCase() || '';
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
      },
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
