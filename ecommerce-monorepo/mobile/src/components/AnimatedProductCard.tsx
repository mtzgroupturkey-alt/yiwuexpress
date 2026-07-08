import React, { memo } from 'react'
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated'
import { ProductCard } from './ProductCard'
import { useHapticFeedback } from '../hooks/useHapticFeedback'

interface AnimatedProductCardProps {
  product: {
    id: string
    name: string
    price?: number
    rating?: number
    reviews?: number
    duration?: string
    type?: string
    thumbnail?: string | null
    image?: string | null
  }
  size?: 'sm' | 'md' | 'lg'
  onPress?: () => void
  onQuotePress?: () => void
  onFavoritePress?: () => void
  isFavorite?: boolean
}

export const AnimatedProductCard = memo(({
  product,
  size,
  onPress,
  onQuotePress,
  onFavoritePress,
  isFavorite,
}: AnimatedProductCardProps) => {
  const scale = useSharedValue(1)
  const haptics = useHapticFeedback()

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 15, stiffness: 200 })
    haptics.light()
  }

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 200 })
  }

  return (
    <Animated.View style={animatedStyle}>
      <ProductCard
        product={product}
        size={size}
        onPress={() => {
          handlePressOut()
          onPress?.()
        }}
        onQuotePress={onQuotePress}
        onFavoritePress={() => {
          haptics.medium()
          onFavoritePress?.()
        }}
        isFavorite={isFavorite}
      />
    </Animated.View>
  )
})
