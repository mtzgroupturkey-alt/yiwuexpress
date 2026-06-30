import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native'
import {
  Text,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Bell, MapPin, ChevronDown, Heart, Star, Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react-native'
import apiClient from '../api/client'

const { width } = Dimensions.get('window')
const CONTAINER_WIDTH = Math.min(428, width)

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

export default function ProductDetailScreen() {
  const router = useRouter()
  const { productId } = useLocalSearchParams<{ productId: string }>()
  const [quantity, setQuantity] = useState(1)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [addingToCart, setAddingToCart] = useState(false)
  const queryClient = useQueryClient()

  // Fetch product detail
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const response = await fetch(`${apiClient.getBaseUrl()}/api/products/${productId}`)
      if (!response.ok) throw new Error('Product not found')
      const result = await response.json()
      return result.data
    },
  })

  const product = productData

  const handleAddToCart = async () => {
    if (!product) return

    setAddingToCart(true)
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        setSnackbarMessage('Please log in to add items to your cart.')
        setSnackbarVisible(true)
        setTimeout(() => {
          router.push('/login')
        }, 1500)
        return
      }

      // Fetch user profile to get userId
      const userRes = await fetch(`${apiClient.getBaseUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = await userRes.json()
      const userId = userData?.user?.id

      if (!userId) {
        throw new Error('User not found')
      }

      // Add to cart
      const cartRes = await fetch(`${apiClient.getBaseUrl()}/api/cart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId: product.id,
          quantity
        })
      })

      const cartData = await cartRes.json()
      if (cartData.success) {
        setSnackbarMessage(`${quantity} item(s) added to cart!`)
        setSnackbarVisible(true)
        // Invalidate queries to refresh counts
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      } else {
        throw new Error(cartData.error || 'Failed to add item')
      }
    } catch (err: any) {
      setSnackbarMessage(err.message || 'Failed to add product to cart.')
      setSnackbarVisible(true)
    } finally {
      setAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    router.push('/services') // Services routes to Cart tab
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Product not found or error loading details
          </Text>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.headerBack} onPress={() => router.back()}>
            <ArrowLeft size={24} color={COLORS.textDark} />
          </TouchableOpacity>
          <Text style={styles.logo}>YIWU EXPRESS 🚚</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color={COLORS.textDark} />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>5</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Image Container */}
          <View style={styles.imageContainer}>
            {product.thumbnail ? (
              <Image
                source={{ uri: product.thumbnail.startsWith('http') ? product.thumbnail : `${apiClient.getBaseUrl()}${product.thumbnail}` }}
                style={styles.productImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.placeholderContainer}>
                <Text style={styles.placeholderEmoji}>📦</Text>
              </View>
            )}
          </View>

          {/* Product Details info */}
          <View style={styles.detailsCard}>
            <View style={styles.titleRow}>
              <Text style={styles.productName}>{product.name}</Text>
              <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            </View>

            <View style={styles.ratingRow}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>4.5</Text>
              <Text style={styles.reviewsText}>(1243 reviews)</Text>
              <View style={[styles.stockBadge, product.stock > 0 ? styles.stockIn : styles.stockOut]}>
                <Text style={[styles.stockBadgeText, product.stock > 0 ? styles.stockInText : styles.stockOutText]}>
                  {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
                </Text>
              </View>
            </View>

            <Divider style={styles.divider} />

            <Text style={styles.sectionTitle}>Product Description</Text>
            <Text style={styles.descriptionText}>
              {product.description || 'No description available for this product.'}
            </Text>

            <Divider style={styles.divider} />

            {/* Quantity selection */}
            <View style={styles.quantityRow}>
              <Text style={styles.quantityLabel}>Quantity</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
                >
                  <Minus size={16} color={quantity <= 1 ? '#cbd5e1' : COLORS.textDark} />
                </TouchableOpacity>
                <Text style={styles.quantityValue}>{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  style={[styles.qtyBtn, quantity >= product.stock && styles.qtyBtnDisabled]}
                >
                  <Plus size={16} color={quantity >= product.stock ? '#cbd5e1' : COLORS.textDark} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cartBtn}
              onPress={handleAddToCart}
              disabled={product.stock <= 0 || addingToCart}
            >
              <ShoppingCart size={18} color="white" style={styles.cartIcon} />
              <Text style={styles.cartBtnText}>Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buyBtn}
              onPress={handleBuyNow}
              disabled={product.stock <= 0 || addingToCart}
            >
              <Text style={styles.buyBtnText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.badgeRed,
    marginBottom: 16,
    textAlign: 'center',
  },
  backBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    width: CONTAINER_WIDTH,
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
  headerBack: {
    padding: 4,
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
  imageContainer: {
    height: 300,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderEmoji: {
    fontSize: 72,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    flex: 1,
    marginRight: 12,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  reviewsText: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  stockIn: {
    backgroundColor: '#DEF7EC',
  },
  stockOut: {
    backgroundColor: '#FDE8E8',
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  stockInText: {
    color: '#03543F',
  },
  stockOutText: {
    color: '#9B1C1C',
  },
  divider: {
    marginVertical: 14,
    backgroundColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textGray,
    lineHeight: 20,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  quantityValue: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    color: COLORS.textDark,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 32,
  },
  cartBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    marginRight: 6,
  },
  cartBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buyBtn: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.accent,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  snackbar: {
    backgroundColor: COLORS.primary,
  },
})