import React, { useRef, useState, useEffect } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, FlatList, Platform } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { colors, spacing, typography, radius, shadows } from '../theme'

const { width } = Dimensions.get('window')
const SLIDER_WIDTH = Math.min(428, width) - spacing.md * 2

interface HeroSlide {
  id: string
  title: string
  description: string
  badgeText?: string
  ctaText?: string
  secondaryCtaText?: string
  backgroundColor?: string
}

export function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  // Mock data for now
  const slides: HeroSlide[] = [
    {
      id: '1',
      title: 'Global Trade Made Simple',
      description: 'Connect with verified suppliers from Yiwu, China',
      badgeText: 'NEW',
      ctaText: 'Explore Now',
      secondaryCtaText: 'Learn More',
      backgroundColor: colors.primary,
    },
    {
      id: '2',
      title: 'Reliable Shipping',
      description: 'Fast and secure worldwide delivery',
      badgeText: 'SPECIAL',
      ctaText: 'Get Quote',
      backgroundColor: colors.primaryDark,
    },
    {
      id: '3',
      title: 'Quality Assurance',
      description: 'Verified products with guaranteed quality',
      badgeText: 'HOT',
      ctaText: 'Shop Now',
      backgroundColor: colors.primaryLight,
    },
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slides.length
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true })
      setCurrentIndex(nextIndex)
    }, 5000)
    return () => clearInterval(interval)
  }, [currentIndex, slides.length])

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  )

  const renderItem = ({ item }: { item: HeroSlide }) => (
    <View style={[styles.slide, { backgroundColor: item.backgroundColor || colors.primary }]}>
      <View style={styles.slideContent}>
        {item.badgeText && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badgeText}</Text>
          </View>
        )}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <View style={styles.buttonRow}>
          {item.ctaText && (
            <TouchableOpacity style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>{item.ctaText}</Text>
            </TouchableOpacity>
          )}
          {item.secondaryCtaText && (
            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>{item.secondaryCtaText}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SLIDER_WIDTH)
          setCurrentIndex(index)
        }}
        scrollEventThrottle={16}
        snapToInterval={SLIDER_WIDTH}
        decelerationRate="fast"
      />
      
      {/* Dots Indicator */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index && styles.dotActive,
            ]}
          />
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.primary,
  },
  slide: {
    width: SLIDER_WIDTH,
    height: 280,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  slideContent: {
    flex: 1,
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    ...typography.heading,
    fontSize: 24,
    color: '#fff',
    marginBottom: spacing.sm,
  },
  description: {
    ...typography.body,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: spacing.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  primaryButtonText: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  secondaryButtonText: {
    ...typography.caption,
    color: '#fff',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: spacing.sm,
    left: 0,
    right: 0,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginHorizontal: 4,
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.secondary,
  },
})
