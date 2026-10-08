import { prisma } from '@/lib/db';

export interface ProductRatingSummary {
  count: number;
  average: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

/**
 * Calculates approved review count, arithmetic mean rounded to 1 decimal place,
 * and 1-5 star distribution in a single database transaction.
 */
export async function getProductRating(productId: string): Promise<ProductRatingSummary> {
  if (!productId) {
    return {
      count: 0,
      average: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    };
  }

  const [agg, dist] = await prisma.$transaction([
    prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { _all: true },
    }),
    prisma.review.groupBy({
      by: ['rating'],
      where: { productId, isApproved: true },
      _count: { _all: true },
      orderBy: { rating: 'asc' },
    }),
  ]);

  const count = agg._count?._all || 0;
  const rawAvg = agg._avg?.rating || 0;
  // Round to 1 decimal place: 4.28 -> 4.3, 0 -> 0
  const average = count > 0 ? Math.round(rawAvg * 10) / 10 : 0;

  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const item of dist) {
    if (item.rating >= 1 && item.rating <= 5) {
      const cnt = (item as any)._count?._all ?? (item as any)._count?.rating ?? (item as any)._count ?? 0;
      distribution[item.rating as 1 | 2 | 3 | 4 | 5] = typeof cnt === 'number' ? cnt : Number(cnt) || 0;
    }
  }

  return {
    count,
    average,
    distribution,
  };
}
