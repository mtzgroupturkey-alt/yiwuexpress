import React, { useState, useCallback, useMemo } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
  Platform,
} from 'react-native'
import { Text, ActivityIndicator } from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { TrendingUp, Sparkles, ChevronRight } from 'lucide-react-native'
import apiClient, { Service } from '../api/client'
import AppHeader from '../components/AppHeader'
import { HeroSlider } from '../components/HeroSlider'
import { ProductCard } from '../components/ProductCard'
import { CategoryCard } from '../components/CategoryCard'
import { SearchBar } from '../components/SearchBar'
import { LoadingSkeleton } from '../components/LoadingSkeleton'
import { colors, spacing, typography, radius, shadows } from '../theme'
import { usePerformance } from '../hooks/usePerformance'
import { usePrefetch } from '../hooks/usePrefetch'
import { announceForAccessibility } from '../utils/accessibility'

export default function HomeScreenEnhanced() {
  const router = useRouter()
  const { debounce, throttle } = usePerformance()
  const { prefetchService, prefetchCategory } = usePrefetch()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const scrollY = React.useRef(new Animated.Value(0)).current

  // Fetch services with pagination
  const { data: servicesData, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['services', 'home', searchQuery, page],
    queryFn: async () => {
      const response = await fetch(
        `${apiClient.getBaseUrl()}/api/services?page=${page}&limit=12&search=${searchQuery}`
      )
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    staleTime: 60 * 1000, // 1 minute
    keepPreviousData: true,
  })

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories', 'home'],
    queryFn: async () => {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/categories?featured=true&limit=6`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch featured services
  const { data: featuredData } = useQuery({
    queryKey: ['services', 'featured'],
    queryFn: async () => {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/services?featured=true&limit=8`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
    staleTime: 5 * 60 * 1000,
  })

  // Debounced search
  const debouncedSearch = useMemo(
    () => debounce((text: string) => {
      setSearchQuery(text)
      setPage(1)
    }, 500),
    [debounce]
  )

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
    announceForAccessibility('Content refreshed')
  }, [refetch])

  // Toggle favorite
  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(id)
        ? prev.filter(fid => fid !== id)
        : [...prev, id]
      
      announceForAccessibility(
        newFavorites.includes(id) ? 'Added to favorites' : 'Removed from favorites'
      )
      
      return newFavorites
    })
  }, [])

  // Load more
  const handleLoadMore = useCallback(() => {
    if (!isFetching && servicesData?.services?.length >= 12) {
      setPage(prev => prev + 1)
    }
  }, [isFetching, servicesData])

  // Throttled scroll handler
  const handleScroll = useMemo(
    () => throttle(Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      { useNativeDriver: true }
    ), 16),
    [scrollY, throttle]
  )

  // Prefetch on item press
  const handleProductPress = useCallback((serviceId: string) => {
    prefetchService(serviceId)
    router.push({ pathname: '/service-detail', params: { serviceId } })
  }, [prefetchService, router])

  const handleCategoryPress = useCallback((slug: string) => {
    prefetchCategory(slug)
    router.push({ pathname: '/services', params: { category: slug } })
  }, [prefetchCategory, router])

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <LoadingSkeleton />
      </SafeAreaView>
    )
  }

  const services = servicesData?.services || []
  const categories = categoriesData?.categories || []
  const featured = featuredData?.services || []

  return (
    <SafeAreaView style={styles.container}>
      <Animated.ScrollView
        style={styles.scrollView}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <AppHeader />

        {/* Search Bar */}
        <SearchBar
          placeholder="Search services..."
          onChangeText={debouncedSearch}
          style={styles.searchBar}
        />

        {/* Hero Slider */}
        <HeroSlider />

        {/* Categories Section */}
        {categories.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Shop by Category</Text>
              <TouchableOpacity
                accessible
                accessibilityLabel="View all categories"
                accessibilityRole="button"
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((category: any) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onPress={() => handleCategoryPress(category.slug)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Featured Services */}
        {featured.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Sparkles size={20} color={colors.secondary} />
                <Text style={styles.sectionTitle}>Featured Services</Text>
              </View>
              <TouchableOpacity
                accessible
                accessibilityLabel="View all featured services"
                accessibilityRole="button"
              >
                <Text style={styles.seeAll}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsScroll}
            >
              {featured.map((product: Service) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  size="md"
                  onPress={() => handleProductPress(product.id)}
                  onQuotePress={() => router.push({ pathname: '/quote-request', params: { serviceId: product.id } })}
                  onFavoritePress={() => toggleFavorite(product.id)}
                  isFavorite={favorites.includes(product.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* New Arrivals */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <TrendingUp size={20} color={colors.success} />
              <Text style={styles.sectionTitle}>New Arrivals</Text>
            </View>
            <TouchableOpacity
              accessible
              accessibilityLabel="View all new arrivals"
              accessibilityRole="button"
            >
              <ChevronRight size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <View style={styles.productsGrid}>
            {services.slice(0, 4).map((product: Service) => (
              <ProductCard
                key={product.id}
                product={product}
                size="sm"
                onPress={() => handleProductPress(product.id)}
                onQuotePress={() => router.push({ pathname: '/quote-request', params: { serviceId: product.id } })}
                onFavoritePress={() => toggleFavorite(product.id)}
                isFavorite={favorites.includes(product.id)}
              />
            ))}
          </View>
        </View>

        {/* Trust Section */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Why Choose YIWU EXPRESS</Text>
          <View style={styles.trustGrid}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>✅</Text>
              <Text style={styles.trustLabel}>Verified Suppliers</Text>
              <Text style={styles.trustDescription}>Only trusted partners</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🚚</Text>
              <Text style={styles.trustLabel}>Fast Shipping</Text>
              <Text style={styles.trustDescription}>Express delivery</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustLabel}>Secure Payment</Text>
              <Text style={styles.trustDescription}>100% protected</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>💬</Text>
              <Text style={styles.trustLabel}>24/7 Support</Text>
              <Text style={styles.trustDescription}>Always here to help</Text>
            </View>
          </View>
        </View>

        {/* Loading more indicator */}
        {isFetching && (
          <View style={styles.loadingMore}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.loadingText}>Loading more...</Text>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  searchBar: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  section: {
    marginVertical: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    ...typography.subheading,
    fontSize: 18,
    color: colors.text,
  },
  seeAll: {
    ...typography.caption,
    color: colors.secondary,
    fontWeight: '600',
  },
  categoriesScroll: {
    paddingHorizontal: spacing.md,
  },
  productsScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  trustSection: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    borderRadius: radius.lg,
    ...shadows.sm,
  },
  trustTitle: {
    ...typography.subheading,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.md,
    color: colors.text,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  trustItem: {
    alignItems: 'center',
    width: '45%',
    paddingVertical: spacing.sm,
  },
  trustIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  trustLabel: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  trustDescription: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
  },
  loadingText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
})
