export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  downloadAndAssignCandidate,
  checkRateLimit,
  isCompetitorUrl,
} from '@/lib/storage/image-search-service';

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get('auth_token')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload || payload.role !== 'ADMIN') return null;
  return payload;
}

export async function POST(request: NextRequest) {
  const admin = await verifyAdmin(request);
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 401 });
  }

  // Rate limit check
  const rate = checkRateLimit(admin.email || 'admin', 'download');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 50 image assignments per hour.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { candidateId, productId, confirmRights = false, asThumbnail = true } = body;

    let targetProductId = productId;
    let sourceUrl = '';
    let source = 'unknown';
    let author = '';
    let license = 'free';

    if (candidateId) {
      const candidate = await prisma.imageSearchCandidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        return NextResponse.json({ error: 'Candidate image not found' }, { status: 404 });
      }

      targetProductId = candidate.productId;
      sourceUrl = candidate.sourceUrl;
      source = candidate.source;
      author = candidate.author || '';
      license = candidate.license || 'free';
    } else if (body.sourceUrl && body.productId) {
      targetProductId = body.productId;
      sourceUrl = body.sourceUrl;
      source = body.source || 'manual';
      author = body.author || 'Manual';
      license = body.license || 'unknown';
    } else {
      return NextResponse.json(
        { error: 'Either candidateId or (productId and sourceUrl) is required' },
        { status: 400 }
      );
    }

    const isCompetitor = isCompetitorUrl(sourceUrl);
    if ((isCompetitor || license === 'copyrighted') && !confirmRights) {
      return NextResponse.json(
        {
          error:
            '⚠️ This image may be copyrighted. You are responsible for ensuring you have the right to use it. Please check the confirmation box before downloading.',
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }

    const result = await downloadAndAssignCandidate({
      candidateId,
      productId: targetProductId,
      sourceUrl,
      source,
      author,
      license,
      confirmRights: Boolean(confirmRights),
      asThumbnail: Boolean(asThumbnail),
      adminEmail: admin.email || 'admin',
    });

    return NextResponse.json({
      success: true,
      newUrl: result.newUrl,
      rateRemaining: rate.remaining,
    });
  } catch (error: any) {
    console.error('[ApproveImage API Error]:', error);
    return NextResponse.json({ error: error.message || 'Failed to download and assign image' }, { status: 500 });
  }
}
