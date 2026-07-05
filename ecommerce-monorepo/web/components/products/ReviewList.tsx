'use client'

import { useState } from 'react'
import { ReviewStars } from './ReviewStars'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Flag, User, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  reviewerName: string
  verifiedPurchase?: boolean
  helpful: number
  notHelpful: number
  createdAt: string
  images?: string[]
}

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent')

  const toggleExpanded = (id: string) => {
    setExpandedReviews(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    switch (sortBy) {
      case 'recent':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'helpful':
        return b.helpful - a.helpful
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    // TODO: Implement API call
    console.log('Mark as helpful:', reviewId, isHelpful)
  }

  const handleReport = async (reviewId: string) => {
    // TODO: Implement API call
    console.log('Report review:', reviewId)
  }

  return (
    <div className="space-y-6">
      {/* Sort Options */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="recent">Most Recent</option>
            <option value="helpful">Most Helpful</option>
            <option value="rating">Highest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews */}
      <div className="space-y-4">
        {sortedReviews.map((review) => {
          const isExpanded = expandedReviews.has(review.id)
          const isLongReview = review.comment.length > 300

          return (
            <Card key={review.id}>
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {review.reviewerName}
                        </span>
                        {review.verifiedPurchase && (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-600">
                            <CheckCircle className="w-3 h-3" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  {/* Report Button */}
                  <button
                    onClick={() => handleReport(review.id)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Report review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                </div>

                {/* Rating */}
                <ReviewStars rating={review.rating} showCount={false} className="mb-2" />

                {/* Title */}
                <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>

                {/* Comment */}
                <p className="text-gray-700 leading-relaxed">
                  {isExpanded || !isLongReview
                    ? review.comment
                    : `${review.comment.substring(0, 300)}...`}
                </p>

                {/* Read More */}
                {isLongReview && (
                  <button
                    onClick={() => toggleExpanded(review.id)}
                    className="text-primary-500 hover:text-primary-600 text-sm font-medium mt-2"
                  >
                    {isExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}

                {/* Review Images (if any) */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((image, index) => (
                      <div
                        key={index}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100"
                      >
                        <img
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Was this helpful?</span>
                  <button
                    onClick={() => handleHelpful(review.id, true)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>Yes ({review.helpful})</span>
                  </button>
                  <button
                    onClick={() => handleHelpful(review.id, false)}
                    className="flex items-center gap-1 text-sm text-gray-600 hover:text-primary-500 transition-colors"
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>No ({review.notHelpful})</span>
                  </button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
