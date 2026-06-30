// Figma Design - React Native Mobile Version
// Exact match to Figma design but using React Native components
// Shows real product data from API

import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  TextInput,
  Platform,
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
import apiClient, { Service } from '../api/client'

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

  // Figma categories
  const categories = [
    { id: 'all', name: 'All', emoji: '📦' },
    { id: 'electronics', name: 'Electronics', emoji: '📱' },
    { id: 'fashion', name: 'Fashion', emoji: '👗' },
    { id: 'grocery', name: 'Grocery', emoji: '🍎' },
    { id: 'home', name: 'Home & Living', emoji: '🏠' },
    { id: 'books', name: 'Books', emoji: '📚' },
  ]

  const recentSearches = ['Headphones', 'Laptop', 'Running Shoes']
  const trendingSearches = ['iPhone 15', 'Nike Air Max', 'PS5 Controller']

  // Fetch services (will be used as products)
  const { data, isLoading } = useQuery({
    queryKey: ['services', activeCategory, searchQuery],
    queryFn: async () => {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/services?page=1&limit=20&type=${activeCategory !== 'all' ? activeCategory : ''}&search=${searchQuery}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const services: Service[] = data?.services || []

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  // Product Card Component (Figma Style)
  const ProductCard = ({ item }: { item: Service }) => {
    const isFavorite = favorites.includes(item.id)
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item.id } })}
        activeOpacity={0.9}
      >
        {/* Image Container with 3:4 ratio */}
        <View style={styles.productImageContainer}>
          <View style={styles.productImagePlaceholder}>
            <Text style={styles.productImageEmoji}>
              {item.type === 'shipping' ? '🚢' : 
               item.type === 'customs' ? '📋' : 
               item.type === 'warehousing' ? '🏭' : 
               item.type === 'sourcing' ? '🔍' : '📦'}
            </Text>
          </View>
          
          {/* Wishlist Button */}
          <TouchableOpacity
            style={styles.wishlistBtn}
            onPress={() => toggleFavorite(item.id)}
          >
            <Heart
              size={14}
              color={isFavorite ? COLORS.badgeRed : '#9ca3af'}
              fill={isFavorite ? COLORS.badgeRed : 'transparent'}
            />
          </TouchableOpacity>

          {/* Discount Badge */}
          {item.price && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>-50%</Text>
            </View>
          )}
        </View>

        {/* Product Info */}
        <View style={styles.productInfo}>
          {/* Rating */}
          <View style={styles.ratingRow}>
            <Star size={10} color="#f59e0b" fill="#f59e0b" />
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
                ${item.price?.toFixed(2) || '149.99'}
              </Text>
              <Text style={styles.duration}>
                🕒 {item.duration || '2-3 days'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.quoteBtn}
              onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: item.id } })}
            >
              <Text style={styles.quoteBtnText}>Quote</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  // Flash Sale Card (dummy for now)
  const FlashSaleCard = ({ index }: { index: number }) => (
    <View style={styles.flashSaleCard}>
      <View style={styles.flashSaleBadge}>
        <Zap size={10} color="white" fill="white" />
        <Text style={styles.flashSaleBadgeText}>50% OFF</Text>
      </View>
      <View style={styles.flashSaleContent}>
        <Text style={styles.flashSaleTitle}>Premium Product</Text>
        <View style={styles.flashSalePriceRow}>
          <Text style={styles.flashSalePrice}>$149.99</Text>
          <Text style={styles.flashSaleOriginalPrice}>$299.99</Text>
        </View>
        <View style={styles.flashSaleTimer}>
          <View style={styles.timerBlock}>
            <Text style={styles.timerValue}>02</Text>
          </View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBlock}>
            <Text style={styles.timerValue}>34</Text>
          </View>
          <Text style={styles.timerColon}>:</Text>
          <View style={styles.timerBlock}>
            <Text style={styles.timerValue}>56</Text>
          </View>
        </View>
      </View>
    </View>
  )

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={[styles.mobileContainer, { width: CONTAINER_WIDTH }]}>
        
        {/* Header - Sticky */}
        <View style={styles.header}>
          {/* Top Bar */}
          <View style={styles.topBar}>
            <Text style={styles.logo}>ShopHub</Text>
            
            <View style={styles.headerRight}>
              {/* Notifications */}
              <TouchableOpacity style={styles.iconBtn}>
                <Bell size={20} color={COLORS.textDark} />
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>5</Text>
                </View>
              </TouchableOpacity>

              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>U</Text>
              </View>
            </View>
          </View>

          {/* Location */}
          <TouchableOpacity style={styles.locationRow}>
            <MapPin size={12} color={COLORS.textGray} />
            <Text style={styles.locationText}>Deliver to: San Francisco, USA</Text>
            <ChevronDown size={12} color={COLORS.textGray} />
          </TouchableOpacity>
        </View>

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
              <TouchableOpacity style={styles.searchIconBtn}>
                <Mic size={16} color={COLORS.textGray} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchIconBtn}>
                <Camera size={16} color={COLORS.textGray} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Suggestions */}
          {showSearchSuggestions && (
            <View style={styles.suggestions}>
              <View style={styles.suggestionSection}>
                <Text style={styles.suggestionTitle}>Recent Searches</Text>
                <View style={styles.suggestionChips}>
                  {recentSearches.map((search, idx) => (
                    <TouchableOpacity key={idx} style={styles.suggestionChip}>
                      <Text style={styles.suggestionChipText}>{search}</Text>
                    </TouchableOpacity>
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
                    <TouchableOpacity key={idx} style={styles.trendingChip}>
                      <Text style={styles.trendingChipText}>🔥 {search}</Text>
                    </TouchableOpacity>
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
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryBtn,
                    activeCategory === cat.id && styles.categoryBtnActive
                  ]}
                  onPress={() => setActiveCategory(cat.id)}
                >
                  <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                  <Text style={[
                    styles.categoryText,
                    activeCategory === cat.id && styles.categoryTextActive
                  ]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Flash Sales */}
        <View style={styles.flashSalesSection}>
          <Text style={styles.flashSalesTitle}>⚡ Flash Sales</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.flashSalesRow}>
              {[0, 1, 2].map((idx) => (
                <FlashSaleCard key={idx} index={idx} />
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Filter & Sort Bar */}
        <View style={styles.filterBar}>
          <View style={styles.filterLeft}>
            <TouchableOpacity style={styles.sortBtn}>
              <Text style={styles.sortBtnText}>Popular</Text>
              <ChevronDown size={14} color={COLORS.textGray} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterBtn}>
              <SlidersHorizontal size={16} color={COLORS.textGray} />
              <Text style={styles.filterBtnText}>Filter</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'grid' && styles.viewBtnActive]}
              onPress={() => setViewMode('grid')}
            >
              <Grid3x3 size={16} color={viewMode === 'grid' ? 'white' : COLORS.textGray} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.viewBtn, viewMode === 'list' && styles.viewBtnActive]}
              onPress={() => setViewMode('list')}
            >
              <ListIcon size={16} color={viewMode === 'list' ? 'white' : COLORS.textGray} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Products Grid */}
        <FlatList
          data={services}
          renderItem={({ item }) => <ProductCard item={item} />}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.productRow}
          contentContainerStyle={styles.productGrid}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No products found</Text>
            </View>
          }
        />

        {/* FAB - Scan Button */}
        <TouchableOpacity style={styles.fab}>
          <Scan size={24} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  mobileContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
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
    fontSize: 10,
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
    fontSize: 11,
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
    fontSize: 11,
    color: '#374151',
  },
  trendingChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  trendingChipText: {
    fontSize: 11,
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
    fontSize: 10,
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
    fontSize: 11,
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
    paddingBottom: 100,
  },
  productRow: {
    gap: 12,
  },
  productCard: {
    flex: 1,
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
    marginBottom: 12,
  },
  productImageContainer: {
    aspectRatio: 3 / 4,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  productImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageEmoji: {
    fontSize: 48,
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
    fontSize: 9,
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
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  reviewsText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  productName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
    lineHeight: 16,
    marginBottom: 8,
    height: 32,
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
    fontSize: 9,
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
    fontSize: 11,
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
