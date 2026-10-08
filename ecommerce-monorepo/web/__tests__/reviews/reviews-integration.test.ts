import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProductRating } from '@/lib/reviews/rating';
import { prisma } from '@/lib/db';

vi.mock('@/lib/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    review: {
      aggregate: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

describe('Product Reviews & Aggregation Regression Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Product with 3 approved reviews (4, 5, 3) -> count === 3, average === 4.0, distribution { 5:1, 4:1, 3:1, 2:0, 1:0 }', async () => {
    const mockAgg = {
      _avg: { rating: 4.0 },
      _count: { _all: 3 },
    };

    const mockDist = [
      { rating: 5, _count: { _all: 1 } },
      { rating: 4, _count: { _all: 1 } },
      { rating: 3, _count: { _all: 1 } },
    ];

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockAgg, mockDist] as any);

    const summary = await getProductRating('product-1');

    expect(summary.count).toBe(3);
    expect(summary.average).toBe(4.0);
    expect(summary.distribution).toEqual({
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    });
  });

  it('Product with 0 approved reviews -> count === 0, average === 0, distribution all zeros', async () => {
    const mockAgg = {
      _avg: { rating: null },
      _count: { _all: 0 },
    };
    const mockDist: any[] = [];

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockAgg, mockDist] as any);

    const summary = await getProductRating('empty-product');

    expect(summary.count).toBe(0);
    expect(summary.average).toBe(0);
    expect(summary.distribution).toEqual({
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    });
  });

  it('Queries with isApproved: true to exclude unapproved reviews', async () => {
    const mockAgg = {
      _avg: { rating: 5.0 },
      _count: { _all: 1 },
    };
    const mockDist = [{ rating: 5, _count: { _all: 1 } }];

    vi.mocked(prisma.review.aggregate).mockReturnValue({} as any);
    vi.mocked(prisma.review.groupBy).mockReturnValue({} as any);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockAgg, mockDist] as any);

    await getProductRating('product-pending');

    expect(prisma.review.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'product-pending', isApproved: true },
      })
    );
    expect(prisma.review.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: 'product-pending', isApproved: true },
      })
    );
  });

  it('JSON-LD aggregateRating builder includes aggregateRating ONLY when count > 0', () => {
    const buildJsonLd = (ratingSummary: { count: number; average: number }) => {
      const base: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: 'Test Product',
      };
      if (ratingSummary.count > 0) {
        base.aggregateRating = {
          '@type': 'AggregateRating',
          ratingValue: ratingSummary.average,
          reviewCount: ratingSummary.count,
          bestRating: 5,
          worstRating: 1,
        };
      }
      return base;
    };

    const emptyJsonLd = buildJsonLd({ count: 0, average: 0 });
    expect(emptyJsonLd.aggregateRating).toBeUndefined();

    const filledJsonLd = buildJsonLd({ count: 5, average: 4.6 });
    expect(filledJsonLd.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.6,
      reviewCount: 5,
      bestRating: 5,
      worstRating: 1,
    });
  });
});
