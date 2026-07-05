'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { InteractiveReviewStars } from './ReviewStars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'

const reviewSchema = z.object({
  rating: z.number().min(1, 'Please select a rating').max(5),
  title: z.string().min(5, 'Title must be at least 5 characters').max(100),
  comment: z.string().min(20, 'Review must be at least 20 characters').max(1000),
  reviewerName: z.string().min(2, 'Name is required').max(100),
  verifiedPurchase: z.boolean().optional(),
})

type ReviewFormData = z.infer<typeof reviewSchema>

interface ReviewFormProps {
  productId: string
  productName: string
  onSuccess?: () => void
}

export function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
    },
  })

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          productId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to submit review')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', productId] })
      setSubmitted(true)
      setTimeout(() => {
        reset()
        setRating(0)
        setSubmitted(false)
        onSuccess?.()
      }, 2000)
    },
  })

  const onSubmit = (data: ReviewFormData) => {
    mutation.mutate({ ...data, rating })
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-green-900 mb-2">
            Thank you for your review!
          </h3>
          <p className="text-green-700">
            Your feedback helps other customers make informed decisions.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Write a Review</CardTitle>
        <CardDescription>
          Share your experience with {productName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="mb-2 block">
              Overall Rating <span className="text-red-500">*</span>
            </Label>
            <InteractiveReviewStars value={rating} onChange={setRating} />
            {rating === 0 && errors.rating && (
              <p className="text-sm text-red-600 mt-1">Please select a rating</p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="title">
              Review Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Sum up your experience in one line"
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Review Comment */}
          <div>
            <Label htmlFor="comment">
              Your Review <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              {...register('comment')}
              placeholder="Tell us what you liked or didn't like about this product..."
              rows={5}
              className="mt-1"
            />
            {errors.comment && (
              <p className="text-sm text-red-600 mt-1">{errors.comment.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Minimum 20 characters
            </p>
          </div>

          {/* Reviewer Name */}
          <div>
            <Label htmlFor="reviewerName">
              Your Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reviewerName"
              {...register('reviewerName')}
              placeholder="How should we display your name?"
              className="mt-1"
            />
            {errors.reviewerName && (
              <p className="text-sm text-red-600 mt-1">{errors.reviewerName.message}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={mutation.isPending || rating === 0}
              className="flex-1"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Review'
              )}
            </Button>
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {mutation.error instanceof Error ? mutation.error.message : 'Failed to submit review'}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
