/**
 * Auto-Pilot Probe: Product & Catalog Department
 * Monitors catalog health, unreviewed customer feedback, and rating anomalies.
 */

import { prisma } from '../../db';
import { BusinessSnapshot, ProbeResult, Severity } from '../types';

export async function probeProduct(snapshot: BusinessSnapshot): Promise<ProbeResult> {
  const start = Date.now();
  const issues: ProbeResult['issues'] = [];

  const [lowRatingReviews, pendingReviewReplies] = await Promise.all([
    prisma.review.count({
      where: { rating: { lte: 2 }, isApproved: true },
    }),
    prisma.review.count({
      where: { replies: { none: {} }, rating: { lte: 3 } },
    }),
  ]);

  let severity: Severity = 'low';
  let status: ProbeResult['status'] = 'ok';

  if (lowRatingReviews >= 10 && pendingReviewReplies >= 5) {
    status = 'critical';
    severity = 'critical';
    issues.push({
      code: 'PRODUCT_CUSTOMER_SATISFACTION_DROP',
      message: `${pendingReviewReplies} negative review(s) (<= 3 stars) unaddressed without merchant replies`,
      severity: 'critical',
      evidence: { lowRatingReviews, pendingReviewReplies },
    });
  } else if (lowRatingReviews > 0 || pendingReviewReplies > 0) {
    status = 'degraded';
    severity = 'medium';
    issues.push({
      code: 'PRODUCT_PENDING_REVIEWS',
      message: `${pendingReviewReplies} product review(s) awaiting response`,
      severity: 'medium',
      evidence: { pendingReviewReplies, lowRatingReviews },
    });
  }

  return {
    department: 'product',
    status,
    severity,
    confidence: 0.95,
    metrics: {
      totalActiveProducts: snapshot.inventory.totalSkuCount,
      lowRatingReviews,
      unansweredLowReviews: pendingReviewReplies,
    },
    issues,
    durationMs: Date.now() - start,
  };
}
