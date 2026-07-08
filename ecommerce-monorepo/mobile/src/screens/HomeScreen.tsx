// Figma Design - React Native Mobile Version
// Exact match to Figma design but using React Native components
// Shows real product data from API with infinite scroll pagination

import React, { useState, useEffect } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  Platform,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  ActivityIndicator,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { 
  Bell, 
  MapPin, 
  Mic, 
  Camera, 
  TrendingUp, 
  Heart,
  Star,
  Grid3x3,
  List as ListIcon,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Scan,
  Home,
  FolderOpen,
  ShoppingCart,
  Package,
  User,
  Zap,
  ArrowRight,
} from 'lucide-react-native'
import apiClient from '../api/client'

// Product interface (for actual e-commerce products)
interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  thumbnail?: string | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  type?: string
}

interface FlashSaleProduct {
  id: string
  name: string
  price: number
  flashSalePrice: number
  flashSaleStart: string
  flashSaleEnd: string
  flashSaleStock: number | null
  thumbnail: string | null
  discount: number
  timeRemaining: number
  hasLimitedStock: boolean
  stockRemaining: number
  category: {
    id: string
    name: string
    slug: string
  } | null
}
import AppHeader from '../components/AppHeader'
import { TouchableWithMinSize } from '../components/ui/TouchableWithMinSize'
import { AnimatedProductCard } from '../components/AnimatedProductCard'

const { width } = Dimensions.get('window')
const CONTAINER_WIDTH = Math.min(428, width) // iPhone 14 Pro Max width
const CARD_WIDTH = (CONTAINER_WIDTH - 48) / 2 // 2 columns

// Figma Colors (exact)
const COLORS = {
  primary: '#1A3C5E',
  accent: '#F59E0B',
  background: '#F5F7FA',
  white: '#FFFFFF',
  textDark: '#111827',
  textGray: '#6b7280',
  border: '#e5e7eb',
  badgeRed: '#dc2626',
}

export default function HomeScreenFigma() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [favorites, setFavorites] = useState<string[]>([])
  const [sortBy, setSortBy] = useState('popular')
  const [page, setPage] = useState(1)
  const [allServices, setAllServices] = useState<Product[]>([])
  const [hasMore, setHasMore] = useState(true)

  // Figma categories
  const categories = [
    { id: 'all', name: 'All', emoji: '📦' },
    { id: 'shipping', name: 'Shipping', emoji: '🚢' },
    { id: 'customs', name: 'Customs', emoji: '📋' },
    { id: 'warehousing', name: 'Warehouse', emoji: '🏭' },
    { id: 'sourcing', name: 'Sourcing', emoji: '🔍' },
  ]

  const recentSearches = ['Headphones', 'Laptop', 'Running Shoes']
  const trendingSearches = ['iPhone 15', 'Nike Air Max', 'PS5 Controller']

  // Fetch products (instead of services for showing actual products with images)
  const { data, isLoading, isFetching } = useQuery({
    queryKey: ['products', activeCategory, searchQuery, page],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '10')
      
      // Map category to product category if needed
      if (activeCategory !== 'all') {
        params.append('category', activeCategory)
      }
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }

      const url = `${apiClient.getBaseUrl()}/api/products?${params}`
      console.log('🔍 Fetching products from:', url)
      
      const response = await fetch(url)
      if (!response.ok) {
        console.error('❌ Products API error:', response.status, response.statusText)
        throw new Error('Failed to fetch')
      }
      
      const result = await response.json()
      console.log('✅ Products API response:', JSON.stringify(result, null, 2))
      console.log('📦 Number of products:', result.data?.length || 0)
      
      // Log first product for debugging
      if (result.data && result.data.length > 0) {
        console.log('🖼️ First product:', result.data[0].name)
        console.log('🖼️ First product thumbnail:', result.data[0].thumbnail)
      }
      
      // Return in format expected by the component
      return {
        products: result.data || [],
        total: result.pagination?.total || 0
      }
    },
    keepPreviousData: true,
  })

  // Fetch flash sales
  const { data: flashSalesData } = useQuery({
    queryKey: ['flashSales'],
    queryFn: async () => {
      const url = `${apiClient.getBaseUrl()}/api/products/flash-sales`
      const response = await fetch(url)
      if (!response.ok) throw new Error('Failed to fetch flash sales')
      const result = await response.json()
      return result.data || []
    },
  })

  // Update products when data changes
  React.useEffect(() => {
    if (data?.products) {
      if (page === 1) {
        setAllServices(data.products)
      } else {
        setAllServices(prev => [...prev, ...data.products])
      }
      // Check if there are more pages
      setHasMore(data.products.length === 10)
    }
  }, [data, page])

  // Reset pagination when filters change
  React.useEffect(() => {
    setPage(1)
    setAllServices([])
    setHasMore(true)
  }, [activeCategory, searchQuery])

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  // Load more when reaching end
  const handleLoadMore = () => {
    if (!isFetching && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  // Render footer loading indicator
  const renderFooter = () => {
    if (!isFetching) return null
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.primary} />
        <Text style={styles.footerLoaderText}>Loading more...</Text>
      </View>
    )
  }

  // Product Card Component (Figma Style)
  const ProductCard = ({ item }: { item: Product }) => {
    const isFavorite = favorites.includes(item.id)
    
    // Debug: Log product data
    React.useEffect(() => {
      console.log('Product item:', item.name)
      console.log('Thumbnail:', item.thumbnail)
      console.log('Base URL:', apiClient.getBaseUrl())
      if (item.thumbnail) {
        const imageUrl = item.thumbnail.startsWith('http') 
          ? item.thumbnail 
          : `${apiClient.getBaseUrl()}${item.thumbnail}`
        console.log('Full image URL:', imageUrl)
      }
    }, [item])
    
    // Get emoji based on category or default
    const getProductEmoji = () => {
      if (item.category?.slug?.includes('cookware')) return '🍳'
      if (item.category?.slug?.includes('bake')) return '🧁'
      if (item.category?.slug?.includes('utensil')) return '🍴'
      if (item.category?.slug?.includes('appliance')) return '⚡'
      if (item.category?.slug?.includes('table')) return '🍽️'
      return '📦'
    }
    
    // Construct image URL with fallback to placeholder
    const getImageUrl = () => {
      if (item.thumbnail) {
        // Real product image exists
        return item.thumbnail.startsWith('http') 
          ? item.thumbnail 
          : `${apiClient.getBaseUrl()}${item.thumbnail}`
      } else {
        // Use placeholder image (different for each product for variety)
        const seed = item.id.slice(0, 8) // Use part of ID as seed
        return `https://picsum.photos/seed/${seed}/400/500`
      }
    }
    
    const imageUrl = getImageUrl()
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
        activeOpacity={0.9}
      >
        {/* Image Container with 3:4 ratio */}
        <View style={styles.productImageContainer}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.productImage}
            resizeMode="cover"
            onError={(error) => {
              console.error('Image load error for:', item.name, error.nativeEvent.error)
            }}
            onLoad={() => {
              console.log('Image loaded successfully:', item.name)
            }}
          />
          
          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => toggleFavorite(item.id)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            accessibilityHint="Double tap to toggle favorite"
          >
            <Heart
              size={16}
              color={isFavorite ? COLORS.badgeRed : '#9ca3af'}
              fill={isFavorite ? COLORS.badgeRed : 'transparent'}
            />
          </TouchableOpacity>

          {/* Discount Badge */}
          {item.price && item.stock > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-50%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star size={12} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>4.5</Text>
            <Text style={styles.reviewsText}>(128)</Text>
          </View>

          {/* Product Name */}
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>

          {/* Price Row */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>
                ${item.price?.toFixed(2) || '0.00'}
              </Text>
              {item.stock > 0 && (
                <Text style={styles.duration}>
                  📦 {item.stock} in stock
                </Text>
              )}
            </View>
            <TouchableOpacity
              style={styles.quoteBtn}
              onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
            >
              <Text style={styles.quoteBtnText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Flash Sale Card with real data
  const FlashSaleCard = ({ item }: { item: FlashSaleProduct }) => {
    const [timeLeft, setTimeLeft] = useState(item.timeRemaining)

    useEffect(() => {
      const interval = setInterval(() => {
        setTimeLeft(prev => Math.max(0, prev - 1000))
      }, 1000)
      return () => clearInterval(interval)
    }, [item.timeRemaining])

    const hours = Math.floor(timeLeft / 3600000)
    const minutes = Math.floor((timeLeft % 3600000) / 60000)
    const seconds = Math.floor((timeLeft % 60000) / 1000)

    const pad = (n: number) => n.toString().padStart(2, '0')

    return (
      <TouchableOpacity
        style={styles.flashSaleCard}
        onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
        activeOpacity={0.9}
      >
        <View style={styles.flashSaleBadge}>
          <Zap size={10} color="white" fill="white" />
          <Text style={styles.flashSaleBadgeText}>{item.discount}% OFF</Text>
        </View>
        <View style={styles.flashSaleContent}>
          <Text style={styles.flashSaleTitle} numberOfLines={1}>{item.name}</Text>
          <View style={styles.flashSalePriceRow}>
            <Text style={styles.flashSalePrice}>${item.flashSalePrice.toFixed(2)}</Text>
            <Text style={styles.flashSaleOriginalPrice}>${item.price.toFixed(2)}</Text>
          </View>
          <View style={styles.flashSaleTimer}>
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{pad(hours)}</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{pad(minutes)}</Text>
            </View>
            <Text style={styles.timerColon}>:</Text>
            <View style={styles.timerBlock}>
              <Text style={styles.timerValue}>{pad(seconds)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (isLoading && page === 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading products...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={allServices}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
        ListHeaderComponent={() => (
          <View style={styles.mobileContainer}>
            <AppHeader />

            {/* Search */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={16} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for products, brands, categories..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onFocus={() => setShowSearchSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
                />
                <View style={styles.searchIcons}>
                  <TouchableWithMinSize style={styles.searchIconBtn} minSize={36} accessibilityLabel="Voice search" accessibilityHint="Double tap to search by voice">
                    <Mic size={18} color={COLORS.textGray} />
                  </TouchableWithMinSize>
                  <TouchableWithMinSize style={styles.searchIconBtn} minSize={36} accessibilityLabel="Camera search" accessibilityHint="Double tap to search by image">
                    <Camera size={18} color={COLORS.textGray} />
                  </TouchableWithMinSize>
                </View>
              </View>

              {/* Search Suggestions */}
              {showSearchSuggestions && (
                <View style={styles.suggestions}>
                  <View style={styles.suggestionSection}>
                    <Text style={styles.suggestionTitle}>Recent Searches</Text>
                    <View style={styles.suggestionChips}>
                      {recentSearches.map((search, idx) => (
                        <TouchableWithMinSize key={idx} style={styles.suggestionChip} accessibilityLabel={`Search for ${search}`} accessibilityHint="Double tap to search">
                          <Text style={styles.suggestionChipText}>{search}</Text>
                        </TouchableWithMinSize>
                      ))}
                    </View>
                  </View>
                  <View style={styles.suggestionSection}>
                    <View style={styles.trendingHeader}>
                      <TrendingUp size={12} color={COLORS.textGray} />
                      <Text style={styles.suggestionTitle}>Trending</Text>
                    </View>
                    <View style={styles.suggestionChips}>
                      {trendingSearches.map((search, idx) => (
                        <TouchableWithMinSize key={idx} style={styles.trendingChip} accessibilityLabel={`Trending search ${search}`} accessibilityHint="Double tap to search">
                          <Text style={styles.trendingChipText}>🔥 {search}</Text>
                        </TouchableWithMinSize>
                      ))}
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Categories */}
            <View style={styles.categoriesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoriesRow}>
                  {categories.map((cat) => (
                    <TouchableWithMinSize
                      key={cat.id}
                      style={[
                        styles.categoryBtn,
                        activeCategory === cat.id && styles.categoryBtnActive
                      ]}
                      onPress={() => setActiveCategory(cat.id)}
                      accessibilityLabel={`Filter by ${cat.name}`}
                      accessibilityHint="Double tap to filter products"
                    >
                      <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                      <Text style={[
                        styles.categoryText,
                        activeCategory === cat.id && styles.categoryTextActive
                      ]}>
                        {cat.name}
                      </Text>
                    </TouchableWithMinSize>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Flash Sales */}
            <View style={styles.flashSalesSection}>
              <Text style={styles.flashSalesTitle}>⚡ Flash Sales</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.flashSalesRow}>
                  {flashSalesData?.map((item: FlashSaleProduct) => (
                    <FlashSaleCard key={item.id} item={item} />
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Filter & Sort Bar */}
            <View style={styles.filterBar}>
              <View style={styles.filterLeft}>
                <TouchableWithMinSize style={styles.sortBtn} accessibilityLabel="Sort by Popular" accessibilityHint="Double tap to change sort order">
                  <Text style={styles.sortBtnText}>Popular</Text>
                  <ChevronDown size={14} color={COLORS.textGray} />
                </TouchableWithMinSize>
                <TouchableWithMinSize style={styles.filterBtn} accessibilityLabel="Filter products" accessibilityHint="Double tap to open filters">
                  <SlidersHorizontal size={16} color={COLORS.textGray} />
                  <Text style={styles.filterBtnText}>Filter</Text>
                </TouchableWithMinSize>
              </View>
              <View style={styles.viewToggle}>
                <TouchableWithMinSize
                  style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
                  onPress={() => setViewMode('grid')}
                  accessibilityLabel="Grid view"
                  accessibilityHint="Double tap to switch to grid layout"
                >
                  <Grid3x3 size={16} color={viewMode === 'grid' ? 'white' : COLORS.textGray} />
                </TouchableWithMinSize>
                <TouchableWithMinSize
                  style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
                  onPress={() => setViewMode('list')}
                  accessibilityLabel="List view"
                  accessibilityHint="Double tap to switch to list layout"
                >
                  <ListIcon size={16} color={viewMode === 'list' ? 'white' : COLORS.textGray} />
                </TouchableWithMinSize>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <AnimatedProductCard
            product={{
              ...item,
              image: item.thumbnail,
            }}
            isFavorite={favorites.includes(item.id)}
            onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item.id } })}
            onQuotePress={() => router.push({ pathname: '/quote-request', params: { serviceId: item.id } })}
            onFavoritePress={() => toggleFavorite(item.id)}
          />
        )}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No products found</Text>
          </View>
        )}
      />

      {/* FAB - Scan Button */}
      <TouchableWithMinSize style={styles.fab} accessibilityLabel="Scan barcode" accessibilityHint="Double tap to scan a product barcode">
        <Scan size={24} color="white" />
      </TouchableWithMinSize>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  flatListContent: {
    paddingBottom: 100,
  },
  mobileContainer: {
    backgroundColor: COLORS.white,
    width: CONTAINER_WIDTH,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 25,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 20,
  },
  footerLoaderText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
  endMessage: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  endMessageText: {
    color: COLORS.textGray,
    fontSize: 14,
  },

  // Header
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.badgeRed,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textGray,
  },

  // Search
  searchSection: {
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    height: 44,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingLeft: 40,
    paddingRight: 80,
    fontSize: 14,
  },
  searchIcons: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    gap: 4,
  },
  searchIconBtn: {
    padding: 6,
    borderRadius: 20,
  },
  suggestions: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  suggestionSection: {
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 8,
    fontWeight: '600',
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  suggestionChipText: {
    fontSize: 14,
    color: '#374151',
  },
  trendingChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  trendingChipText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '600',
  },

  // Categories
  categoriesSection: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 12,
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
  },
  categoryBtnActive: {
    backgroundColor: COLORS.primary,
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  categoryTextActive: {
    color: 'white',
  },

  // Flash Sales
  flashSalesSection: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  flashSalesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  flashSalesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  flashSaleCard: {
    width: 220,
    height: 290,
    backgroundColor: '#334155',
    borderRadius: 16,
    padding: 16,
    position: 'relative',
  },
  flashSaleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  flashSaleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  flashSaleContent: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  flashSaleTitle: {
    color: 'white',
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.9,
  },
  flashSalePriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 12,
  },
  flashSalePrice: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flashSaleOriginalPrice: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  flashSaleTimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerBlock: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 6,
    borderRadius: 8,
  },
  timerValue: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timerColon: {
    color: 'rgba(255,255,255,0.5)',
  },

  // Filter Bar
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filterLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  sortBtnText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
  },
  filterBtnText: {
    fontSize: 14,
    color: COLORS.textDark,
  },
  viewToggle: {
    flexDirection: 'row',
    gap: 4,
  },
  viewBtn: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#f3f4f6',
  },
  viewBtnActive: {
    backgroundColor: COLORS.primary,
  },

  // Products
  productGrid: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    maxWidth: (CONTAINER_WIDTH - 48) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  productImageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageEmoji: {
    fontSize: 48,
  },
  productCardImage: {
    width: '100%',
    height: '100%',
  },
  wishlistBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  discountBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  discountBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  productInfo: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  reviewsText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 20,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  duration: {
    fontSize: 12,
    color: COLORS.textGray,
    marginTop: 2,
  },
  quoteBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quoteBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 14,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    backgroundColor: COLORS.accent,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
})
