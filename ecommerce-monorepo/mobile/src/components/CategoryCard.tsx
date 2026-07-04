import React, { memo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { colors, spacing, typography, radius, shadows } from '../theme'

interface CategoryCardProps {
  category: {
    id: string
    name: string
    slug: string
    emoji?: string
    productCount?: number
  }
  onPress?: () => void
}

export const CategoryCard = memo(({ category, onPress }: CategoryCardProps) => {
  const getEmoji = () => {
    if (category.emoji) return category.emoji
    // Default emoji based on category name
    const name = category.name.toLowerCase()
    if (name.includes('ship')) return '🚢'
    if (name.includes('custom')) return '📋'
    if (name.includes('warehouse')) return '🏭'
    if (name.includes('sourc')) return '🔍'
    return '📦'
  }

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.8}
      accessible
      accessibilityLabel={`${category.name} category, ${category.productCount || 0} products`}
      accessibilityRole="button"
    >
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{getEmoji()}</Text>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {category.name}
      </Text>
      {category.productCount !== undefined && (
        <Text style={styles.count}>
          {category.productCount} items
        </Text>
      )}
    </TouchableOpacity>
  )
})

const styles = StyleSheet.create({
  container: {
    width: 100,
    marginRight: spacing.sm,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    ...shadows.sm,
  },
  emoji: {
    fontSize: 36,
  },
  name: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 2,
  },
  count: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
})
