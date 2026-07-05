import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReviewStarsProps {
  rating: number // 0-5
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
  className?: string
}

export function ReviewStars({ 
  rating, 
  count, 
  size = 'md', 
  showCount = true,
  className 
}: ReviewStarsProps) {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const starSize = sizes[size]
  const textSize = textSizes[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Stars */}
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= Math.floor(rating)
          const isHalf = star === Math.ceil(rating) && rating % 1 !== 0
          
          return (
            <div key={star} className="relative">
              <Star 
                className={cn(
                  starSize,
                  isFilled 
                    ? 'fill-yellow-400 text-yellow-400' 
                    : 'fill-gray-200 text-gray-200'
                )}
              />
              {isHalf && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                  <Star className={cn(starSize, 'fill-yellow-400 text-yellow-400')} />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Rating & Count */}
      {showCount && (
        <span className={cn('text-gray-600 font-medium', textSize)}>
          {rating.toFixed(1)}
          {count !== undefined && (
            <span className="text-gray-400 ml-1">
              ({count.toLocaleString()})
            </span>
          )}
        </span>
      )}
    </div>
  )
}

// Interactive version for forms
interface InteractiveReviewStarsProps {
  value: number
  onChange: (rating: number) => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function InteractiveReviewStars({
  value,
  onChange,
  size = 'lg',
  className
}: InteractiveReviewStarsProps) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  const starSize = sizes[size]

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="group transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary-500 rounded"
          aria-label={`Rate ${star} stars`}
        >
          <Star 
            className={cn(
              starSize,
              'transition-colors',
              star <= value
                ? 'fill-yellow-400 text-yellow-400 group-hover:fill-yellow-500 group-hover:text-yellow-500'
                : 'fill-gray-200 text-gray-200 group-hover:fill-yellow-200 group-hover:text-yellow-200'
            )}
          />
        </button>
      ))}
    </div>
  )
}
