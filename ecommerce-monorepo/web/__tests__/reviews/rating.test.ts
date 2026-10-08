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

describe('getProductRating helper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates count, average, and distribution for approved reviews', async () => {
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

    const result = await getProductRating('prod-123');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(result.count).toBe(3);
    expect(result.average).toBe(4.0);
    expect(result.distribution).toEqual({
      5: 1,
      4: 1,
      3: 1,
      2: 0,
      1: 0,
    });
  });

  it('returns all zeros when product has 0 approved reviews', async () => {
    const mockAgg = {
      _avg: { rating: null },
      _count: { _all: 0 },
    };
    const mockDist: any[] = [];

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockAgg, mockDist] as any);

    const result = await getProductRating('empty-prod');

    expect(result.count).toBe(0);
    expect(result.average).toBe(0);
    expect(result.distribution).toEqual({
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    });
  });

  it('correctly rounds average to 1 decimal place (e.g. 4.333 -> 4.3)', async () => {
    const mockAgg = {
      _avg: { rating: 4.333333333333333 },
      _count: { _all: 3 },
    };

    const mockDist = [
      { rating: 5, _count: { _all: 1 } },
      { rating: 4, _count: { _all: 2 } },
    ];

    vi.mocked(prisma.$transaction).mockResolvedValueOnce([mockAgg, mockDist] as any);

    const result = await getProductRating('prod-round');

    expect(result.count).toBe(3);
    expect(result.average).toBe(4.3);
    expect(result.distribution[5]).toBe(1);
    expect(result.distribution[4]).toBe(2);
  });
});
