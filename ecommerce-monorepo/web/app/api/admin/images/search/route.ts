export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import {
  searchUnsplash,
  searchPexels,
  searchPixabay,
  searchTargetWebsite,
  isCompetitorUrl,
  checkRateLimit,
  CandidateResult,
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
  const rate = checkRateLimit(admin.email || 'admin', 'search');
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Maximum 100 image searches per hour.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { productId, query, sources = ['unsplash'], targetSite, customUrl } = body;

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true, sku: true },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const searchQuery = (query || product.name).trim();
    const candidates: CandidateResult[] = [];

    // Search requested sources in parallel
    const searchTasks: Promise<CandidateResult[]>[] = [];

    // If targetSite is specified, search the target website
    if (targetSite && typeof targetSite === 'string' && targetSite.trim()) {
      searchTasks.push(searchTargetWebsite(searchQuery, targetSite.trim()));
    }

    if (Array.isArray(sources)) {
      if (sources.includes('unsplash')) {
        searchTasks.push(searchUnsplash(searchQuery));
      }
      if (sources.includes('pexels')) {
        searchTasks.push(searchPexels(searchQuery));
      }
      if (sources.includes('pixabay')) {
        searchTasks.push(searchPixabay(searchQuery));
      }
    }

    const results = await Promise.all(searchTasks);
    for (const r of results) {
      candidates.push(...r);
    }

    // Handle optional direct custom URL provided by admin
    if (customUrl && typeof customUrl === 'string') {
      const trimmedUrl = customUrl.trim();
      const isCompetitor = isCompetitorUrl(trimmedUrl);
      candidates.unshift({
        source: isCompetitor ? 'external' : 'manual',
        sourceUrl: trimmedUrl,
        thumbnail: trimmedUrl,
        title: isCompetitor ? `Direct URL (Potential Competitor)` : `Direct Manufacturer / Web URL`,
        author: 'Manual Entry',
        license: isCompetitor ? 'copyrighted' : 'unknown',
        isCompetitor,
        status: 'PENDING',
      });
    }

    // Save discovered candidates to the database for this product
    const savedCandidates = await Promise.all(
      candidates.map(async (c) => {
        return prisma.imageSearchCandidate.create({
          data: {
            productId,
            source: c.source,
            sourceUrl: c.sourceUrl,
            thumbnail: c.thumbnail,
            title: c.title,
            author: c.author,
            license: c.license,
            status: 'PENDING',
          },
        });
      })
    );

    // Audit log
    await prisma.imageSearchLog.create({
      data: {
        productId,
        source: sources.join(','),
        action: 'search',
        adminUser: admin.email,
        details: {
          query: searchQuery,
          count: savedCandidates.length,
          timestamp: new Date().toISOString(),
        },
      },
    }).catch(() => null);

    return NextResponse.json({
      success: true,
      query: searchQuery,
      candidates: savedCandidates.map((c) => ({
        ...c,
        isCompetitor: isCompetitorUrl(c.sourceUrl),
      })),
      rateRemaining: rate.remaining,
    });
  } catch (error: any) {
    console.error('[SearchImages API Error]:', error);
    return NextResponse.json({ error: error.message || 'Image search failed' }, { status: 500 });
  }
}
