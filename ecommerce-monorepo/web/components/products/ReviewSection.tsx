'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReviewStars } from './ReviewStars'
import { ReviewList } from './ReviewList'
import { ReviewForm } from './ReviewForm'
import { Button } from '@/components/ui/button'
import { MessageSquare, Star, ThumbsUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTranslations } from 'next-intl'

interface ReviewSectionProps {
  productId: string
  productName: string
}

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false)
  const t = useTranslations('Product')

  const { data: reviewData, isLoading } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: async () => {
      const response = await fetch(`/api/products/${productId}/reviews`)
      if (!response.ok) throw new Error('Failed to fetch reviews')
      return response.json()
    }
  })

  const reviews = reviewData?.data || []
  const totalReviews = reviews.length
  const averageRating = totalReviews > 0
    ? reviews.reduce((acc: number, r: any) => acc + r.rating, 0) / totalReviews
    : 0

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => {
    const count = reviews.filter((r: any) => r.rating === stars).length
    const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0
    return { stars, count, percentage }
  })

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-slate-100 rounded-xl" />
        <div className="h-64 bg-slate-100 rounded-xl" />
      </div>
    )
  }

  return (
    <section className="space-y-6" id="reviews">
      {/* Overall Rating Summary */}
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

      {/* Review Form */}
      {showForm && (
        <ReviewForm 
          productId={productId}
          productName={productName}
          onSuccess={() => setShowForm(false)}
        />
      )}

      {/* Reviews List */}
      {totalReviews > 0 ? (
        <ReviewList reviews={reviews} />
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-2xs">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 mb-1">
            {t('noReviews')}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {t('beFirst')}
          </p>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {t('writeFirstReview')}
          </button>
        </div>
      )}
    </section>
  )
}
