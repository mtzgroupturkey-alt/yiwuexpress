import React from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
  Dimensions,
} from 'react-native'
import {
  Text,
  Divider,
  ActivityIndicator,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Trash2, Bell, MapPin, ChevronDown, Minus, Plus } from 'lucide-react-native'
import apiClient from '../api/client'
import AppHeader from '../components/AppHeader'
import { TouchableWithMinSize } from '../components/ui/TouchableWithMinSize'

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

interface CartItem {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string | null
  stock: number
}

export default function CartScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // Fetch user profile and cart data
  const { data: cartData, isLoading, refetch } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const token = await AsyncStorage.getItem('token')
      if (!token) return null

      // Get user info
      const userRes = await fetch(`${apiClient.getBaseUrl()}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const userData = await userRes.json()
      const userId = userData?.user?.id
      if (!userId) return null

      const response = await fetch(`${apiClient.getBaseUrl()}/api/cart?userId=${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Failed to fetch cart')
      const result = await response.json()
      return result.data
    }
  })

  const cartItemsFromDb = cartData?.cart?.items || []
  const cartItems: CartItem[] = cartItemsFromDb.map((item: any) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    price: item.product.price,
    quantity: item.quantity,
    image: item.product.thumbnail,
    stock: item.product.stock,
  }))

  const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta
    if (newQty < 1) return

    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${apiClient.getBaseUrl()}/api/cart/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ quantity: newQty })
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    } catch (err) {
      console.error('Error updating quantity:', err)
    }
  }

  const removeItem = async (itemId: string) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) return

      const response = await fetch(`${apiClient.getBaseUrl()}/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (response.ok) {
        queryClient.invalidateQueries({ queryKey: ['cart'] })
      }
    } catch (err) {
      console.error('Error removing item:', err)
    }
  }

  // Use summary from API response or fall back to calculation
  const summary = cartData?.summary || { subtotal: 0 }
  const subtotal = summary.subtotal
  const shipping = subtotal > 0 ? 15.0 : 0
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      router.push('/checkout')
    }
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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Shopping Cart</Text>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
            <Text style={styles.emptyText}>Add some products to get started</Text>
            <TouchableWithMinSize
              style={styles.shopButton}
              onPress={() => router.push('/(tabs)/products')}
              accessibilityLabel="Start shopping"
              accessibilityHint="Double tap to browse products"
            >
              <Text style={styles.shopButtonText}>Start Shopping</Text>
            </TouchableWithMinSize>
          </View>
        ) : (
          <View style={styles.cartContainer}>
            {/* Cart Items */}
            <View style={styles.itemsContainer}>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={styles.itemRow}>
                    {/* Product Image */}
                    <View style={styles.itemImageContainer}>
                      {item.image ? (
                        <Image
                          source={{ uri: item.image.startsWith('http') ? item.image : `${apiClient.getBaseUrl()}${item.image}` }}
                          style={styles.itemImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Text style={styles.itemImageEmoji}>📦</Text>
                      )}
                    </View>

                    {/* Product Info */}
                    <View style={styles.itemInfo}>
                      <Text style={styles.itemName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.itemPrice}>
                        ${item.price.toFixed(2)}
                      </Text>

                      {/* Quantity & Delete Controls */}
                      <View style={styles.quantityRow}>
                        <View style={styles.quantityControls}>
                          <TouchableWithMinSize
                            onPress={() => updateQuantity(item.id, item.quantity, -1)}
                            disabled={item.quantity <= 1}
                            style={[styles.qtyBtn, item.quantity <= 1 && styles.qtyBtnDisabled]}
                            accessibilityLabel="Decrease quantity"
                            accessibilityHint="Double tap to decrease quantity by 1"
                            minSize={36}
                          >
                            <Minus size={16} color={item.quantity <= 1 ? '#cbd5e1' : COLORS.textDark} />
                          </TouchableWithMinSize>
                          <Text style={styles.quantityText}>{item.quantity}</Text>
                          <TouchableWithMinSize
                            onPress={() => updateQuantity(item.id, item.quantity, 1)}
                            disabled={item.quantity >= item.stock}
                            style={[styles.qtyBtn, item.quantity >= item.stock && styles.qtyBtnDisabled]}
                            accessibilityLabel="Increase quantity"
                            accessibilityHint="Double tap to increase quantity by 1"
                            minSize={36}
                          >
                            <Plus size={16} color={item.quantity >= item.stock ? '#cbd5e1' : COLORS.textDark} />
                          </TouchableWithMinSize>
                        </View>

                        <TouchableWithMinSize
                          onPress={() => removeItem(item.id)}
                          style={styles.removeButton}
                          accessibilityLabel="Remove item from cart"
                          accessibilityHint="Double tap to remove this item"
                        >
                          <Trash2 color={COLORS.badgeRed} size={20} />
                        </TouchableWithMinSize>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {/* Order Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Order Summary</Text>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Shipping</Text>
                <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax (10%)</Text>
                <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
              </View>

              <Divider style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
              </View>

              <TouchableWithMinSize
                onPress={handleCheckout}
                style={styles.checkoutButton}
                accessibilityLabel="Proceed to checkout"
                accessibilityHint="Double tap to continue to payment"
              >
                <Text style={styles.checkoutButtonText}>Proceed to Checkout</Text>
              </TouchableWithMinSize>
            </View>
          </View>
        )}
      </ScrollView>
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
  scrollContent: {
    paddingBottom: 120,
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
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 12,
  },
  cartContainer: {
    width: CONTAINER_WIDTH,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  emptyText: {
    color: COLORS.textGray,
    marginBottom: 24,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemsContainer: {
    paddingHorizontal: 16,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
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
  itemRow: {
    flexDirection: 'row',
  },
  itemImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: '100%',
  },
  itemImageEmoji: {
    fontSize: 36,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.5,
  },
  quantityText: {
    fontSize: 14,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    color: COLORS.textDark,
  },
  removeButton: {
    padding: 6,
  },
  summaryCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  summaryValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 12,
    backgroundColor: COLORS.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutButton: {
    marginTop: 16,
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
})
