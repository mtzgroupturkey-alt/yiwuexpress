'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ReviewStars } from './ReviewStars'
import { ReviewList } from './ReviewList'
import { ReviewForm } from './ReviewForm'
import { Button } from '@/components/ui/button'
import { MessageSquare, Star, ThumbsUp } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface ReviewSectionProps {
  productId: string
  productName: string
}

export function ReviewSection({ productId, productName }: ReviewSectionProps) {
  const [showForm, setShowForm] = useState(false)

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
        <div className="h-32 bg-gray-200 rounded-lg" />
        <div className="h-64 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  return (
    <section className="space-y-6" id="reviews">
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary-500" />
            Customer Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left: Overall Rating */}
            <div className="text-center md:text-left">
              <div className="inline-block">
                <div className="text-5xl font-bold text-primary-500 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <ReviewStars rating={averageRating} count={totalReviews} size="lg" />
                <p className="text-sm text-gray-600 mt-2">
                  Based on {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            {/* Right: Rating Distribution */}
            <div className="space-y-2">
              {ratingDistribution.map(({ stars, count, percentage }) => (
                <div key={stars} className="flex items-center gap-2">
                  <div className="flex items-center gap-1 w-20">
                    <span className="text-sm font-medium">{stars}</span>
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-yellow-400 transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Write Review Button */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <Button 
              onClick={() => setShowForm(!showForm)}
              variant={showForm ? 'outline' : 'default'}
              className="w-full md:w-auto"
            >
              {showForm ? 'Cancel' : 'Write a Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

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
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No reviews yet
            </h3>
            <p className="text-gray-600 mb-4">
              Be the first to review {productName}!
            </p>
            <Button onClick={() => setShowForm(true)}>
              Write the First Review
            </Button>
          </CardContent>
        </Card>
      )}
    </section>
  )
}
