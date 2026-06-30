import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native'
import {
  Text,
  ActivityIndicator,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ScrollView } from 'react-native'
import { ShoppingCart, Search, Heart, Star } from 'lucide-react-native'
import AppHeader from '../components/AppHeader'

const { width } = Dimensions.get('window')
const CONTAINER_WIDTH = Math.min(428, width)
const CARD_WIDTH = (CONTAINER_WIDTH - 48) / 2

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

import apiClient from '../api/client'

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
}

export default function ProductListScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [favorites, setFavorites] = useState<string[]>([])

  const categories = [
    { label: 'All', value: '' },
    { label: 'Cookware', value: 'cookware' },
    { label: 'Bakeware', value: 'bakeware' },
    { label: 'Kitchen Utensils', value: 'kitchen-utensils' },
    { label: 'Kitchen Appliances', value: 'kitchen-appliances' },
    { label: 'Tableware', value: 'tableware' },
    { label: 'Storage', value: 'storage-organization' },
  ]

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', page, category, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (category) params.append('category', category)
      if (searchQuery) params.append('search', searchQuery)

      const response = await fetch(`${apiClient.getBaseUrl()}/api/products?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to fetch')
      return response.json()
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const toggleFavorite = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    )
  }

  const products = productsData?.data || []

  const renderProductItem = ({ item }: { item: Product }) => {
    const isFavorite = favorites.includes(item.id)
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
        style={styles.productCard}
        activeOpacity={0.9}
      >
        <View style={styles.productImageContainer}>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail.startsWith('http') ? item.thumbnail : `${apiClient.getBaseUrl()}${item.thumbnail}` }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImageEmoji}>📦</Text>
            </View>
          )}
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
          {item.stock <= 10 && item.stock > 0 && (
            <View style={styles.stockBadgeWarning}>
              <Text style={styles.stockBadgeText}>Low Stock</Text>
            </View>
          )}
          {item.stock === 0 && (
            <View style={styles.stockBadgeDanger}>
              <Text style={styles.stockBadgeText}>Out of Stock</Text>
            </View>
          )}
        </View>
        <View style={styles.productInfo}>
          <View style={styles.ratingRow}>
            <Star size={10} color="#f59e0b" fill="#f59e0b" />
            <Text style={styles.ratingText}>4.5</Text>
            <Text style={styles.reviewsText}>(1243)</Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={styles.priceRow}>
            <Text style={styles.price}>
              ${item.price.toFixed(2)}
            </Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.flatListContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListHeaderComponent={() => (
          <View style={styles.mobileContainer}>
            {/* Search */}
            <View style={styles.searchSection}>
              <View style={styles.searchContainer}>
                <Search size={16} color="#9ca3af" style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search for categories, products..."
                  placeholderTextColor="#9ca3af"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>
            </View>

            {/* Categories scroll section */}
            <View style={styles.categoriesSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.categoriesRow}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat.label}
                      style={[
                        styles.categoryBtn,
                        category === cat.value && styles.categoryBtnActive
                      ]}
                      onPress={() => {
                        setCategory(cat.value)
                        setPage(1)
                      }}
                    >
                      <Text style={styles.categoryEmoji}>📂</Text>
                      <Text style={[
                        styles.categoryText,
                        category === cat.value && styles.categoryTextActive
                      ]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No products found' : 'No products available'}
            </Text>
          </View>
        }
      />
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
    paddingRight: 20,
    fontSize: 14,
  },
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
  productRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 16,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  productImageContainer: {
    position: 'relative',
    height: 160,
    backgroundColor: '#f3f4f6',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImageEmoji: {
    fontSize: 48,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stockBadgeWarning: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeDanger: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  productInfo: {
    padding: 12,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  reviewsText: {
    fontSize: 10,
    color: COLORS.textGray,
  },
  productName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
    height: 36,
    lineHeight: 18,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  quoteBtn: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  quoteBtnText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: COLORS.textGray,
    fontSize: 14,
  },
})
