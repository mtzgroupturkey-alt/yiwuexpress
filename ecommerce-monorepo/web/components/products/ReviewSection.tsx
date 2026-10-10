'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ReviewStars } from './ReviewStars'
import { ReviewList } from './ReviewList'
import { ReviewForm } from './ReviewForm'
import { MessageSquare, Star, PenLine } from 'lucide-react'
import { useTranslations } from 'next-intl'
import type { ProductRatingSummary } from '@/lib/reviews/rating'

interface ReviewSectionProps {
  productId: string
  productName: string
  initialSummary?: ProductRatingSummary
}

export function ReviewSection({ productId, productName, initialSummary }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const t = useTranslations('Product')
  const router = useRouter()

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      return response.json()
    },
  })

  const reviews = reviewData?.data || []
  const hasLoaded = !isLoading && reviewData !== undefined

  // Total count & average derived from live query or server initialSummary
  const totalReviews = hasLoaded
    ? reviews.length
    : (initialSummary?.count ?? reviews.length)

  const averageRating = hasLoaded
    ? totalReviews > 0
      ? Math.round((reviews.reduce((acc: number, r: any) => acc + (r.rating || 5), 0) / totalReviews) * 10) / 10
      : 0
    : (initialSummary?.average ?? 0)

  // Calculate rating distribution (5, 4, 3, 2, 1)
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => {
    let count = 0
    if (hasLoaded) {
      count = reviews.filter((r: any) => r.rating === stars).length
    } else if (initialSummary?.distribution) {
      count = initialSummary.distribution[stars as 1 | 2 | 3 | 4 | 5] || 0
    }
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars, count, percentage }
  })

  const handleReviewSuccess = () => {
    setShowForm(false)
    router.refresh()
  }

  if (isLoading && !initialSummary) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  return (
    <section className="space-y-6" id="reviews">
      {/* Overall Rating & Distribution Summary - Only shown when count > 0 */}
      {totalReviews > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
            <MessageSquare className="w-5 h-5 text-[#00407a]" />
            <h3 className="text-base font-bold text-slate-900">
              {t('customerReviews')}
            </h3>
          </div>
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Overall Rating */}
              <div className="text-center md:text-left">
                <div className="inline-block">
                  <div className="text-5xl font-black text-slate-900 mb-2">
                    {averageRating.toFixed(1)}
                  </div>
                  <ReviewStars rating={averageRating} count={totalReviews} size="lg" />
                  <p className="text-xs text-slate-500 mt-2">
                    {t('basedOnReviews', { n: totalReviews })}
                  </p>
                </div>
              </div>

              {/* Right: Rating Distribution */}
              <div className="space-y-2">
                {ratingDistribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <div className="flex items-center gap-1 w-20">
                      <span className="text-xs font-bold text-slate-700">{stars}</span>
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-slate-500 w-12 text-right">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Write Review Button */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className={`w-full md:w-auto px-5 py-2.5 rounded-xl font-bold text-xs transition-colors cursor-pointer shadow-xs ${
                  showForm
                    ? 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                    : 'bg-[#00407a] hover:bg-[#003366] text-white'
                }`}
              >
                {showForm ? t('cancel') : t('writeReview')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Form Drawer/Card */}
      {showForm && (
        <ReviewForm
          productId={productId}
          productName={productName}
          onSuccess={handleReviewSuccess}
        />
      )}

      {/* Reviews List OR Clean Empty State */}
      {totalReviews > 0 ? (
        <ReviewList reviews={reviews} />
      ) : !showForm ? (
        <div className="bg-gradient-to-b from-slate-50/70 via-white to-slate-50/40 border border-slate-200/90 rounded-2xl p-8 sm:p-12 text-center shadow-2xs">
          <div className="flex items-center justify-center gap-1.5 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star key={star} className="w-5 h-5 fill-amber-400 text-amber-400 drop-shadow-xs" />
            ))}
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 mb-1.5 tracking-tight">
            {t('noReviews')}
          </h3>
          <p className="text-sm text-slate-600 mb-6 max-w-md mx-auto leading-relaxed">
            {t('beFirst')}
          </p>
          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <PenLine className="w-4 h-4" />
              <span>{t('writeReview')}</span>
            </button>
          </div>

          {/* Trust assurance pills */}
          <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {t('verifiedBuyerReviews')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {t('transparentRatings')}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              {t('communityModerated')}
            </span>
          </div>
        </div>
      ) : null}
    </section>
  )
}
