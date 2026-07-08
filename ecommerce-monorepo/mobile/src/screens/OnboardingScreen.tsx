import React, { useState, useRef } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  FlatList,
  Dimensions,
  Platform,
} from 'react-native'
import { Text, Button } from 'react-native-paper'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors, spacing, radius } from '../theme'
import { TouchableWithMinSize } from '../components/ui/TouchableWithMinSize'

const { width } = Dimensions.get('window')

interface Slide {
  id: string
  emoji: string
  title: string
  description: string
}

const slides: Slide[] = [
  {
    id: '1',
    emoji: '🌍',
    title: 'Global Trade Simplified',
    description: 'Connect with verified suppliers from Yiwu, China. Source products directly with confidence.',
  },
  {
    id: '2',
    emoji: '🚢',
    title: 'Reliable Shipping',
    description: 'Fast and secure worldwide delivery with real-time tracking for all your shipments.',
  },
  {
    id: '3',
    emoji: '📋',
    title: 'Customs Clearance',
    description: 'Hassle-free customs documentation and clearance services for international trade.',
  },
  {
    id: '4',
    emoji: '🤝',
    title: 'B2B Marketplace',
    description: 'Request quotes, manage orders, and grow your business with YIWU EXPRESS.',
  },
]

export default function OnboardingScreen() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const flatListRef = useRef<FlatList>(null)

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 })
      setCurrentIndex(currentIndex + 1)
    }
  }

  const handleSkip = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true')
    router.replace('/')
  }

  const handleGetStarted = async () => {
    await AsyncStorage.setItem('onboarding_complete', 'true')
    router.replace('/')
  }

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index ?? 0)
    }
  }).current

  const renderItem = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <View style={styles.emojiContainer}>
        <Text style={styles.emoji}>{item.emoji}</Text>
      </View>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.description}>{item.description}</Text>
    </View>
  )

  const isLastSlide = currentIndex === slides.length - 1

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableWithMinSize
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityHint="Double tap to skip"
          style={styles.skipBtn}
        >
          <Text style={styles.skipText}>Skip</Text>
        </TouchableWithMinSize>
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width)
          setCurrentIndex(index)
        }}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
        bounces={false}
        scrollEventThrottle={16}
        decelerationRate="fast"
      />

      <View style={styles.footer}>
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

        {isLastSlide ? (
          <Button
            mode="contained"
            onPress={handleGetStarted}
            buttonColor={colors.primary}
            style={styles.getStartedBtn}
            contentStyle={styles.getStartedContent}
            accessibilityLabel="Get started"
            accessibilityHint="Double tap to start using the app"
          >
            Get Started
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleNext}
            buttonColor={colors.primary}
            style={styles.nextBtn}
            contentStyle={styles.nextBtnContent}
            accessibilityLabel="Next slide"
            accessibilityHint="Double tap to see next slide"
          >
            Next
          </Button>
        )}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  skipBtn: {
    padding: spacing.sm,
  },
  skipText: {
    ...Platform.select({ default: { fontSize: 16, color: colors.textSecondary, fontWeight: '600' } }),
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emojiContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 28,
    backgroundColor: colors.primary,
    borderRadius: 5,
  },
  getStartedBtn: {
    width: '100%',
    borderRadius: radius.lg,
  },
  getStartedContent: {
    paddingVertical: 6,
  },
  nextBtn: {
    width: '100%',
    borderRadius: radius.lg,
  },
  nextBtnContent: {
    paddingVertical: 6,
  },
})
