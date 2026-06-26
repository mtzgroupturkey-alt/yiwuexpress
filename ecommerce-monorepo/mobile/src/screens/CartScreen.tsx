import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Divider,
  IconButton,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { Trash2 } from 'lucide-react-native'

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
  
  // Mock cart data - replace with actual state management
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: '1',
      productId: '1',
      name: 'Premium Wireless Headphones',
      price: 199.99,
      quantity: 1,
      image: null,
      stock: 50,
    },
    {
      id: '2',
      productId: '3',
      name: 'Smart LED Desk Lamp',
      price: 79.99,
      quantity: 2,
      image: null,
      stock: 25,
    },
  ])

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: Math.max(1, Math.min(item.stock, item.quantity + delta)),
            }
          : item
      )
    )
  }

  const removeItem = (id: string) => {
    setCartItems((items) => items.filter((item) => item.id !== id))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shipping = subtotal > 0 ? 15.0 : 0
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  const handleCheckout = () => {
    if (cartItems.length > 0) {
      router.push('/checkout')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text variant="headlineMedium" style={styles.title}>
            Shopping Cart
          </Text>
        </View>

        {cartItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛒</Text>
            <Text variant="titleLarge" style={styles.emptyTitle}>
              Your cart is empty
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              Add some products to get started
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push('/(tabs)/products')}
              style={styles.shopButton}
            >
              Start Shopping
            </Button>
          </View>
        ) : (
          <>
            {/* Cart Items */}
            <View style={styles.itemsContainer}>
              {cartItems.map((item) => (
                <Card key={item.id} style={styles.itemCard}>
                  <Card.Content style={styles.itemContent}>
                    <View style={styles.itemRow}>
                      {/* Product Image */}
                      {item.image ? (
                        <Image
                          source={{ uri: item.image }}
                          style={styles.itemImage}
                        />
                      ) : (
                        <View style={[styles.itemImage, styles.placeholderImage]}>
                          <Text style={styles.placeholderText}>📦</Text>
                        </View>
                      )}

                      {/* Product Info */}
                      <View style={styles.itemInfo}>
                        <Text variant="titleMedium" style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text variant="titleMedium" style={styles.itemPrice}>
                          ${item.price.toFixed(2)}
                        </Text>

                        {/* Quantity Controls */}
                        <View style={styles.quantityRow}>
                          <View style={styles.quantityControls}>
                            <IconButton
                              icon="minus"
                              size={20}
                              onPress={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                              style={styles.quantityButton}
                            />
                            <Text style={styles.quantityText}>{item.quantity}</Text>
                            <IconButton
                              icon="plus"
                              size={20}
                              onPress={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                              style={styles.quantityButton}
                            />
                          </View>

                          {/* Remove Button */}
                          <TouchableOpacity
                            onPress={() => removeItem(item.id)}
                            style={styles.removeButton}
                          >
                            <Trash2 color="#ef4444" size={20} />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>

            {/* Order Summary */}
            <Card style={styles.summaryCard}>
              <Card.Content>
                <Text variant="titleLarge" style={styles.summaryTitle}>
                  Order Summary
                </Text>

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

                <Button
                  mode="contained"
                  onPress={handleCheckout}
                  style={styles.checkoutButton}
                  contentStyle={styles.checkoutButtonContent}
                >
                  Proceed to Checkout
                </Button>
              </Card.Content>
            </Card>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: 'white',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    marginBottom: 8,
  },
  backText: {
    color: '#0ea5e9',
    fontSize: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  emptyTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  shopButton: {
    backgroundColor: '#0ea5e9',
  },
  itemsContainer: {
    padding: 16,
  },
  itemCard: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  itemContent: {
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 40,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  itemPrice: {
    color: '#0ea5e9',
    fontWeight: 'bold',
    marginBottom: 12,
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
  },
  quantityButton: {
    margin: 0,
  },
  quantityText: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    color: '#1f2937',
  },
  removeButton: {
    padding: 8,
  },
  summaryCard: {
    margin: 16,
    marginTop: 0,
    backgroundColor: 'white',
  },
  summaryTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  checkoutButton: {
    marginTop: 16,
    backgroundColor: '#059669',
  },
  checkoutButtonContent: {
    paddingVertical: 8,
  },
})
