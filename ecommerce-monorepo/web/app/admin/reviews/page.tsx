'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Trash2, ShieldAlert, Star, MessageSquare, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Review {
  id: string
  rating: number
  title: string
  comment: string
  isApproved: boolean
  isVerifiedPurchase: boolean
  createdAt: string
  user: {
    name: string
    email: string
  }
  product: {
    name: string
    slug: string
  }
}

export default function AdminReviewsPage() {
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState<string | null>(null)

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/reviews')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      if (data.success) {
        setReviews(data.data)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReviews()
  }, [])

  const handleApprove = async (id: string) => {
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true })
      })
      if (res.ok) {
        setReviews(prev => prev.map(r => r.id === id ? { ...r, isApproved: true } : r))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActioningId(null)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return
    setActioningId(id)
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== id))
      }
    } catch (error) {
      console.error(error)
    } finally {
      setActioningId(null)
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="w-8 h-8 text-primary-600" />
            Review Moderation
          </h1>
          <p className="text-gray-500 mt-1">Approve or remove customer product reviews</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="text-gray-500 mt-4">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <Card className="text-center py-12 border border-dashed border-gray-300">
          <CardContent>
            <ShieldAlert className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Found</h3>
            <p className="text-gray-500">There are no reviews submitted yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {reviews.map((review) => (
            <Card key={review.id} className={`overflow-hidden border transition-shadow hover:shadow-md ${review.isApproved ? 'border-gray-200' : 'border-yellow-300 bg-yellow-50/20'}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-900 text-base">{review.user.name}</span>
                      <span className="text-sm text-gray-500">({review.user.email})</span>
                      {review.isVerifiedPurchase && (
                        <Badge className="bg-green-100 text-green-800 border-green-300 hover:bg-green-100 font-semibold text-xs">
                          Verified Purchase
                        </Badge>
                      )}
                      {review.isApproved ? (
                        <Badge className="bg-green-600 hover:bg-green-700 text-white font-bold text-xs">
                          Approved
                        </Badge>
                      ) : (
                        <Badge className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold text-xs">
                          Pending Approval
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-primary-700 font-medium">
                      <span>Product:</span>
                      <span className="font-bold">{review.product.name}</span>
                      <a href={`/products/${review.product.slug}`} target="_blank" rel="noopener noreferrer" className="hover:text-primary-800 inline-flex items-center gap-0.5">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 md:text-right">
                    {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                  </span>
                </div>

                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${star <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
                    />
                  ))}
                </div>

                <h4 className="font-bold text-gray-900 mb-1 text-base">{review.title}</h4>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{review.comment}</p>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  {!review.isApproved && (
                    <Button
                      onClick={() => handleApprove(review.id)}
                      disabled={actioningId === review.id}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold gap-1 text-xs"
                    >
                      <Check className="w-4 h-4" />
                      Approve Review
                    </Button>
                  )}
                  <Button
                    onClick={() => handleDelete(review.id)}
                    disabled={actioningId === review.id}
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50 font-bold gap-1 text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
