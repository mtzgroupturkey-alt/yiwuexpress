export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  downloadAndAssignCandidate,
  downloadAndAssignMultipleCandidates,
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
    const {
      candidateId,
      candidateIds,
      candidates: rawCandidates,
      productId,
      mode = 'thumbnail', // 'thumbnail' | 'gallery' | 'replace'
      confirmRights = false,
      asThumbnail = true,
    } = body;

    // Collect list of items to process
    let itemsToProcess: Array<{
      candidateId?: string;
      productId: string;
      sourceUrl: string;
      source: string;
      author?: string;
      license?: string;
    }> = [];

    // Case 1: multiple candidateIds provided
    if (Array.isArray(candidateIds) && candidateIds.length > 0) {
      const dbCandidates = await prisma.imageSearchCandidate.findMany({
        where: { id: { in: candidateIds } },
      });

      itemsToProcess = dbCandidates.map((c) => ({
        candidateId: c.id,
        productId: productId || c.productId,
        sourceUrl: c.sourceUrl,
        source: c.source,
        author: c.author || '',
        license: c.license || 'free',
      }));
    }
    // Case 2: raw candidate objects provided
    else if (Array.isArray(rawCandidates) && rawCandidates.length > 0) {
      itemsToProcess = rawCandidates.map((c) => ({
        candidateId: c.candidateId || c.id,
        productId: productId || c.productId,
        sourceUrl: c.sourceUrl,
        source: c.source || 'external',
        author: c.author || '',
        license: c.license || 'unknown',
      }));
    }
    // Case 3: single candidateId provided
    else if (candidateId) {
      const candidate = await prisma.imageSearchCandidate.findUnique({
        where: { id: candidateId },
      });

      if (!candidate) {
        return NextResponse.json({ error: 'Candidate image not found' }, { status: 404 });
      }

      itemsToProcess = [
        {
          candidateId: candidate.id,
          productId: productId || candidate.productId,
          sourceUrl: candidate.sourceUrl,
          source: candidate.source,
          author: candidate.author || '',
          license: candidate.license || 'free',
        },
      ];
    }
    // Case 4: direct sourceUrl & productId
    else if (body.sourceUrl && productId) {
      itemsToProcess = [
        {
          productId,
          sourceUrl: body.sourceUrl,
          source: body.source || 'manual',
          author: body.author || 'Manual',
          license: body.license || 'unknown',
        },
      ];
    } else {
      return NextResponse.json(
        { error: 'Either candidateId, candidateIds, or (productId and sourceUrl) is required' },
        { status: 400 }
      );
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json({ error: 'No valid images found to process' }, { status: 400 });
    }

    const targetProductId = itemsToProcess[0].productId;

    // Legal safety check across all items
    const hasCompetitorOrCopyrighted = itemsToProcess.some(
      (item) => isCompetitorUrl(item.sourceUrl) || item.license === 'copyrighted'
    );

    if (hasCompetitorOrCopyrighted && !confirmRights) {
      return NextResponse.json(
        {
          error:
            '⚠️ This image may be copyrighted. You are responsible for ensuring you have the right to use it. Please check the confirmation box before downloading.',
          requiresConfirmation: true,
        },
        { status: 400 }
      );
    }

    // Process multi or single assignment
    if (itemsToProcess.length > 1) {
      const multiResult = await downloadAndAssignMultipleCandidates({
        candidates: itemsToProcess,
        productId: targetProductId,
        confirmRights: Boolean(confirmRights),
        mode: mode as 'thumbnail' | 'gallery' | 'replace',
        adminEmail: admin.email || 'admin',
      });

      return NextResponse.json({
        success: true,
        newUrls: multiResult.newUrls,
        assignedCount: multiResult.newUrls.length,
        errors: multiResult.errors,
        rateRemaining: rate.remaining,
      });
    }

    // Single image assignment
    const single = itemsToProcess[0];
    const result = await downloadAndAssignCandidate({
      candidateId: single.candidateId,
      productId: targetProductId,
      sourceUrl: single.sourceUrl,
      source: single.source,
      author: single.author,
      license: single.license,
      confirmRights: Boolean(confirmRights),
      asThumbnail: mode === 'gallery' ? false : Boolean(asThumbnail),
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
