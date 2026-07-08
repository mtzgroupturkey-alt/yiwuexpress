import React, { memo } from 'react'
import { View, Text, StyleSheet, Platform, Image } from 'react-native'
import { Heart, Star } from 'lucide-react-native'
import { colors, spacing, typography, radius, shadows } from '../theme'
import { TouchableWithMinSize } from './ui/TouchableWithMinSize'
import apiClient from '../api/client'

interface ProductCardProps {
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

export const ProductCard = memo(({
  product,
  size = 'md',
  onPress,
  onQuotePress,
  onFavoritePress,
  isFavorite = false,
}: ProductCardProps) => {
  const cardWidth = size === 'sm' ? 160 : size === 'lg' ? 200 : 180

  const getEmoji = (type?: string) => {
    switch (type) {
      case 'shipping': return '🚢'
      case 'customs': return '📋'
      case 'warehousing': return '🏭'
      case 'sourcing': return '🔍'
      default: return '📦'
    }
  }

  return (
    <TouchableWithMinSize
      style={[styles.container, { width: cardWidth }]}
      onPress={onPress}
      activeOpacity={0.9}
      accessibilityLabel={`${product.name}, priced at $${product.price?.toFixed(2) || '0.00'}`}
      accessibilityHint="Double tap to view product details"
    >
      {/* Image Container */}
      <View style={styles.imageContainer}>
        {(product.thumbnail || product.image) ? (
          <Image
            source={{ uri: (product.thumbnail || product.image || '').startsWith('http')
              ? (product.thumbnail || product.image || '')
              : `${apiClient.getBaseUrl()}${product.thumbnail || product.image || ''}`
            }}
            style={styles.productImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.emoji}>{getEmoji(product.type)}</Text>
          </View>
        )}
        
        {/* Favorite Button */}
        <TouchableWithMinSize
          style={styles.favoriteButton}
          onPress={(e) => {
            e.stopPropagation()
            onFavoritePress?.()
          }}
          accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            size={16}
            color={isFavorite ? colors.error : colors.textSecondary}
            fill={isFavorite ? colors.error : 'transparent'}
          />
        </TouchableOpacity>

        {/* Discount Badge */}
        {product.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-15%</Text>
          </View>
        )}
      </View>

      {/* Product Info */}
      <View style={styles.info}>
        {/* Rating */}
        {product.rating && (
          <View style={styles.ratingRow}>
            <Star size={12} color={colors.warning} fill={colors.warning} />
            <Text style={styles.ratingText}>{product.rating}</Text>
            {product.reviews && (
              <Text style={styles.reviewsText}>({product.reviews})</Text>
            )}
          </View>
        )}

        {/* Name */}
        <Text style={styles.name} numberOfLines={2}>
          {product.name}
        </Text>

        {/* Price & Duration */}
        <View style={styles.priceRow}>
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              ${product.price?.toFixed(2) || '149.99'}
            </Text>
            {product.duration && (
              <Text style={styles.duration}>
                🕒 {product.duration}
              </Text>
            )}
          </View>
          
          {onQuotePress && (
            <TouchableWithMinSize
              style={styles.quoteButton}
              onPress={(e) => {
                e.stopPropagation()
                onQuotePress()
              }}
              accessibilityLabel="Request quote"
              minSize={36}
            >
              <Text style={styles.quoteButtonText}>Quote</Text>
            </TouchableWithMinSize>
          )}
        </View>
      </View>
    </TouchableWithMinSize>
  )
})

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.sm,
    ...shadows.md,
  },
  imageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  imagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 48,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  discountBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  info: {
    padding: spacing.sm,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  reviewsText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  name: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
    minHeight: 36,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  priceContainer: {
    flex: 1,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  duration: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  quoteButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    minHeight: 32,
    justifyContent: 'center',
  },
  quoteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
})
