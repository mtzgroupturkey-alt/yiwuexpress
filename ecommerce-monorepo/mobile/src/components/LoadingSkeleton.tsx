import React, { useEffect, useRef } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { colors, spacing, radius } from '../theme'

export function LoadingSkeleton() {
  const shimmerAnimation = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnimation, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const opacity = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <View style={styles.container}>
      {/* Header Skeleton */}
      <View style={styles.header}>
        <Animated.View style={[styles.headerBox, { opacity }]} />
        <View style={styles.headerRight}>
          <Animated.View style={[styles.headerCircle, { opacity }]} />
          <Animated.View style={[styles.headerCircle, { opacity }]} />
        </View>
      </View>

      {/* Search Bar Skeleton */}
      <Animated.View style={[styles.searchBar, { opacity }]} />

      {/* Categories Skeleton */}
      <View style={styles.categories}>
        {[1, 2, 3, 4].map((item) => (
          <Animated.View key={item} style={[styles.category, { opacity }]} />
        ))}
      </View>

      {/* Hero Slider Skeleton */}
      <Animated.View style={[styles.hero, { opacity }]} />

      {/* Products Grid Skeleton */}
      <View style={styles.productsGrid}>
        {[1, 2, 3, 4].map((item) => (
          <View key={item} style={styles.productCard}>
            <Animated.View style={[styles.productImage, { opacity }]} />
            <View style={styles.productInfo}>
              <Animated.View style={[styles.productTitle, { opacity }]} />
              <Animated.View style={[styles.productPrice, { opacity }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerBox: {
    width: 120,
    height: 32,
    backgroundColor: colors.border,
    borderRadius: radius.md,
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  searchBar: {
    height: 48,
    backgroundColor: colors.border,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  categories: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  category: {
    width: 80,
    height: 80,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
  },
  hero: {
    height: 200,
    backgroundColor: colors.border,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  productCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: colors.border,
  },
  productInfo: {
    padding: spacing.sm,
  },
  productTitle: {
    height: 16,
    backgroundColor: colors.border,
    borderRadius: radius.sm,
    marginBottom: spacing.xs,
  },
  productPrice: {
    height: 14,
    width: '60%',
    backgroundColor: colors.border,
    borderRadius: radius.sm,
  },
})
