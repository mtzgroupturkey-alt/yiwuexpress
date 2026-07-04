'use client'

import { Heart } from 'lucide-react'
import { useWishlist } from '@/hooks/useWishlist'
import { cn } from '@/lib/utils'
import { useState } from 'react'

interface WishlistButtonProps {
  productId: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  onToggle?: (isFavorited: boolean) => void
}

export function WishlistButton({
  productId,
  className,
  size = 'md',
  showText = false,
  onToggle,
}: WishlistButtonProps) {
  const { isInWishlist, toggleWishlist, isLoading } = useWishlist()
  const [isProcessing, setIsProcessing] = useState(false)

  const isFavorited = isInWishlist(productId)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isProcessing) return

    setIsProcessing(true)
    try {
      await toggleWishlist(productId)
      if (onToggle) onToggle(!isFavorited)
    } catch {
      // Error handled by useWishlist's onError toast
    } finally {
      setIsProcessing(false)
    }
  }

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2 text-sm',
    lg: 'p-3 text-base',
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  return (
    <button
      onClick={handleClick}
      disabled={isProcessing || isLoading}
      className={cn(
        'rounded-full transition-all duration-200 flex items-center gap-1.5 shadow-sm hover:shadow-md',
        isFavorited
          ? 'bg-red-50 text-red-500 hover:bg-red-100'
          : 'bg-white/90 backdrop-blur text-gray-400 hover:text-red-500 hover:bg-red-50',
        sizeClasses[size],
        className
      )}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <Heart
        className={cn(
          iconSizes[size],
          'transition-transform duration-200',
          isFavorited ? 'fill-current scale-110' : 'scale-100',
          isProcessing && 'animate-pulse'
        )}
      />
      {showText && (
        <span className="text-xs font-medium">
          {isFavorited ? 'Favorited' : 'Add to Favorites'}
        </span>
      )}
    </button>
  )
}
