'use client'

import { useState } from 'react'
import { ReviewStars } from './ReviewStars'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, Flag, User, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  user: {
    name: string
    profilePhoto?: string | null
  }
  isVerifiedPurchase: boolean
  helpfulCount: number
  createdAt: string
  images?: string[]
  replies?: Array<{
    id: string
    comment: string
    isAdminReply: boolean
    createdAt: string
    user: {
      name: string
      role: string
    }
  }>
}

interface ReviewListProps {
  reviews: Review[]
}

export function ReviewList({ reviews }: ReviewListProps) {
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent')
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({})

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
        const helpfulA = (helpfulVotes[a.id] || 0) + a.helpfulCount
        const helpfulB = (helpfulVotes[b.id] || 0) + b.helpfulCount
        return helpfulB - helpfulA
      case 'rating':
        return b.rating - a.rating
      default:
        return 0
    }
  })

  const handleHelpful = async (reviewId: string) => {
    if (helpfulVotes[reviewId]) return // Already voted
    setHelpfulVotes(prev => ({ ...prev, [reviewId]: 1 }))
    try {
      // Opt-in API: POST /api/reviews/[id]/helpful (would be nice, but simple state works for demo)
      await fetch(`/api/admin/reviews/${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }) // keep it approved but we can add a helpful api if needed
      })
    } catch (e) {
      console.error(e)
    }
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
          const currentHelpful = review.helpfulCount + (helpfulVotes[review.id] || 0)

          return (
            <Card key={review.id} className="overflow-hidden border border-gray-150 hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold overflow-hidden border border-primary-200">
                      {review.user.profilePhoto ? (
                        <img src={review.user.profilePhoto} alt={review.user.name} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900">
                          {review.user.name}
                        </span>
                        {review.isVerifiedPurchase && (
                          <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50 font-medium">
                            <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Rating */}
                <ReviewStars rating={review.rating} showCount={false} className="mb-2" />

                {/* Title */}
                <h4 className="font-bold text-gray-900 mb-2">{review.title}</h4>

                {/* Comment */}
                <p className="text-gray-700 leading-relaxed text-sm">
                  {isExpanded || !isLongReview
                    ? review.comment
                    : `${review.comment.substring(0, 300)}...`}
                </p>

                {/* Read More */}
                {isLongReview && (
                  <button
                    onClick={() => toggleExpanded(review.id)}
                    className="text-primary-600 hover:text-primary-700 text-sm font-semibold mt-2"
                  >
                    {isExpanded ? 'Show Less' : 'Read More'}
                  </button>
                )}

                {/* Review Images */}
                {review.images && review.images.length > 0 && (
                  <div className="flex gap-2 mt-4">
                    {review.images.map((image, index) => (
                      <div
                        key={index}
                        className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200"
                      >
                        <img
                          src={image}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-zoom-in"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs text-gray-500">Was this review helpful?</span>
                  <button
                    onClick={() => handleHelpful(review.id)}
                    disabled={!!helpfulVotes[review.id]}
                    className={cn(
                      "flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border transition-colors",
                      helpfulVotes[review.id]
                        ? "text-green-700 bg-green-50 border-green-200"
                        : "text-gray-600 border-gray-200 hover:bg-gray-50"
                    )}
                  >
                    <ThumbsUp className="w-3.5 h-3.5" />
                    <span>{helpfulVotes[review.id] ? 'Thank you!' : `Helpful (${currentHelpful})`}</span>
                  </button>
                </div>

                {/* Replies */}
                {review.replies && review.replies.length > 0 && (
                  <div className="mt-4 pl-4 border-l-2 border-primary-200 space-y-3 bg-gray-50 p-3 rounded-r-lg">
                    {review.replies.map((reply) => (
                      <div key={reply.id} className="text-xs">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-gray-900">
                            {reply.user.name}
                          </span>
                          {reply.isAdminReply && (
                            <Badge className="bg-primary-600 hover:bg-primary-700 text-[10px] py-0 px-1.5 font-bold">
                              Official Staff
                            </Badge>
                          )}
                          <span className="text-[10px] text-gray-400">
                            {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-gray-700">{reply.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
