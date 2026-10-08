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
    // 1. Require ADMIN role
    await requireRole(request, ['ADMIN']);

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

    // 3. Locate file on disk (Check secure storage first, then legacy public fallback)
    const securePath = path.join(process.cwd(), 'storage', 'licenses', doc.fileName);
    const legacyPublicPath = path.join(process.cwd(), 'public', 'uploads', 'licenses', doc.fileName);

    let resolvedPath: string | null = null;
    if (fs.existsSync(securePath)) {
      resolvedPath = securePath;
    } else if (fs.existsSync(legacyPublicPath)) {
      resolvedPath = legacyPublicPath;
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
