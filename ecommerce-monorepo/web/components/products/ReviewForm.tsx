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
import { useTranslations } from 'next-intl'

interface ReviewFormProps {
  productId: string
  productName: string
  onSuccess?: () => void
}

export function ReviewForm({ productId, productName, onSuccess }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const queryClient = useQueryClient()
  const t = useTranslations('Product')

  const reviewSchema = z.object({
    rating: z.number().min(1, t('errRating')).max(5),
    title: z.string().min(5, t('errTitle')).max(100),
    comment: z.string().min(20, t('errComment')).max(1000),
    reviewerName: z.string().min(2, t('errName')).max(100),
    verifiedPurchase: z.boolean().optional(),
  })

  type ReviewFormData = z.infer<typeof reviewSchema>

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
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: data.rating,
          title: data.title,
          comment: data.comment,
          images: [], // can be extended for uploads later
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
            {t('thankYouReview')}
          </h3>
          <p className="text-green-700">
            {t('feedbackHelps')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('reviewFormTitle')}</CardTitle>
        <CardDescription>
          {t('shareExperience', { name: productName })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Rating */}
          <div>
            <Label className="mb-2 block">
              {t('overallRating')} <span className="text-red-500">*</span>
            </Label>
            <InteractiveReviewStars value={rating} onChange={setRating} />
            {rating === 0 && errors.rating && (
              <p className="text-sm text-red-600 mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="title">
              {t('reviewTitle')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              {...register('title')}
              placeholder={t('reviewTitlePlaceholder')}
              className="mt-1"
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Review Comment */}
          <div>
            <Label htmlFor="comment">
              {t('yourReview')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              {...register('comment')}
              placeholder={t('reviewCommentPlaceholder')}
              rows={5}
              className="mt-1"
            />
            {errors.comment && (
              <p className="text-sm text-red-600 mt-1">{errors.comment.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t('min20')}
            </p>
          </div>

          {/* Reviewer Name */}
          <div>
            <Label htmlFor="reviewerName">
              {t('yourName')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="reviewerName"
              {...register('reviewerName')}
              placeholder={t('yourNamePlaceholder')}
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
                  {t('submitting')}
                </>
              ) : (
                t('submitReview')
              )}
            </Button>
          </div>

          {/* Error Message */}
          {mutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">
                {mutation.error instanceof Error ? mutation.error.message : t('submitReview')}
              </p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
