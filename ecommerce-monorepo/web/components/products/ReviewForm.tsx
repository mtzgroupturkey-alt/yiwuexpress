'use client'

import { useState, useEffect } from 'react'
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
import { useAuth } from '@/hooks/useAuth'

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
  const { user } = useAuth()

  const reviewSchema = z.object({
    rating: z.number().min(1, t('errRating') || 'Please select a rating').max(5),
    title: z.string().min(2, 'Title must be at least 2 characters').max(100),
    comment: z.string().min(3, 'Review must be at least 3 characters').max(1000),
    reviewerName: z.string().min(1, t('errName') || 'Name is required').max(100),
    verifiedPurchase: z.boolean().optional(),
  })

  type ReviewFormData = z.infer<typeof reviewSchema>

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
    reset,
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      title: '',
      comment: '',
      reviewerName: user?.name || '',
    },
  })

  useEffect(() => {
    if (user?.name) {
      setValue('reviewerName', user.name)
    }
  }, [user?.name, setValue])

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    setValue('rating', newRating, { shouldValidate: true })
  }

  const mutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          rating: data.rating || rating,
          title: data.title,
          comment: data.comment,
          reviewerName: data.reviewerName,
          images: [],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || errorData.message || 'Failed to submit review')
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
    const finalRating = data.rating || rating
    if (!finalRating || finalRating === 0) {
      setError('rating', { type: 'manual', message: t('errRating') || 'Please select a rating' })
      return
    }
    mutation.mutate({ ...data, rating: finalRating })
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
            <Label className="mb-2 block font-medium">
              {t('overallRating')} <span className="text-red-500">*</span>
            </Label>
            <InteractiveReviewStars value={rating} onChange={handleRatingChange} />
            {errors.rating && (
              <p className="text-sm text-red-600 mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* Review Title */}
          <div>
            <Label htmlFor="title" className="font-medium">
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
            <Label htmlFor="comment" className="font-medium">
              {t('yourReview')} <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="comment"
              {...register('comment')}
              placeholder={t('reviewCommentPlaceholder')}
              rows={4}
              className="mt-1"
            />
            {errors.comment && (
              <p className="text-sm text-red-600 mt-1">{errors.comment.message}</p>
            )}
          </div>

          {/* Reviewer Name */}
          <div>
            <Label htmlFor="reviewerName" className="font-medium">
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
              disabled={mutation.isPending}
              className="flex-1 bg-[#00407a] hover:bg-[#003366] text-white font-bold h-11 rounded-xl shadow-xs"
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
