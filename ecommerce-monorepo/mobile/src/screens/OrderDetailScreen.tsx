import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

interface OrderItem {
  id: string
  productId: string
  quantity: number
  price: number
  product: {
    id: string
    name: string
    image: string | null
  }
}

interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  subtotal: number
  shipping: number
  tax: number
  shippingAddress: string
  city: string
  postalCode: string
  country: string
  phone: string
  paymentMethod: string
  trackingNumber: string | null
  items: OrderItem[]
}

const statusColors: Record<Order['status'], string> = {
  pending: '#f59e0b',
  processing: '#3b82f6',
  shipped: '#8b5cf6',
  delivered: '#059669',
  cancelled: '#ef4444',
}

const statusLabels: Record<Order['status'], string> = {
  pending: 'Pending',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

export default function OrderDetailScreen() {
  const router = useRouter()
  const { orderId } = useLocalSearchParams<{ orderId: string }>()

  const {
    data: orderData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      // Mock order data - replace with actual API call
      const mockOrder: Order = {
        id: orderId,
        orderNumber: 'ORD-2026-001',
        createdAt: '2026-06-20T10:30:00Z',
        status: 'shipped',
        total: 299.99,
        subtotal: 274.99,
        shipping: 15.0,
        tax: 10.0,
        shippingAddress: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
        phone: '+1 234-567-8900',
        paymentMethod: 'Credit Card',
        trackingNumber: 'YW123456789CN',
        items: [
          {
            id: '1',
            productId: 'p1',
            quantity: 2,
            price: 99.99,
            product: {
              id: 'p1',
              name: 'Premium Product A',
              image: null,
            },
          },
          {
            id: '2',
            productId: 'p2',
            quantity: 1,
            price: 75.01,
            product: {
              id: 'p2',
              name: 'Quality Product B',
              image: null,
            },
          },
        ],
      }
      return { order: mockOrder }
    },
  })

  const order = orderData?.order

  const handleTrackShipment = () => {
    if (order?.trackingNumber) {
      router.push({ pathname: '/track', params: { trackingNumber: order.trackingNumber } })
    }
  }

  const handleCancelOrder = () => {
    Alert.alert(
      'Cancel Order',
      'Are you sure you want to cancel this order?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => {
            // Implement cancel order logic
            Alert.alert('Success', 'Order cancelled successfully')
          },
        },
      ]
    )
  }

  const handleRequestReturn = () => {
    Alert.alert(
      'Request Return',
      'Would you like to return items from this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // Navigate to return request screen
            Alert.alert('Info', 'Return request feature coming soon')
          },
        },
      ]
    )
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Order not found or error loading details
          </Text>
          <Button mode="contained" onPress={() => router.back()}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <Text variant="headlineSmall" style={styles.orderNumber}>
                  {order.orderNumber}
                </Text>
                <Text variant="bodySmall" style={styles.orderDate}>
                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
              <Chip
                style={[styles.statusChip, { backgroundColor: statusColors[order.status] + '20' }]}
                textStyle={[styles.statusText, { color: statusColors[order.status] }]}
              >
                {statusLabels[order.status]}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Tracking */}
        {order.trackingNumber && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Tracking Information
              </Text>
              <Text style={styles.trackingNumber}>{order.trackingNumber}</Text>
              <Button mode="contained" onPress={handleTrackShipment} style={styles.trackButton}>
                Track Shipment
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Items */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Order Items
            </Text>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                {item.product.image ? (
                  <Image
                    source={{ uri: item.product.image }}
                    style={styles.itemImage}
                  />
                ) : (
                  <View style={[styles.itemImage, styles.placeholderImage]}>
                    <Text style={styles.placeholderText}>📦</Text>
                  </View>
                )}
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>
                    {item.product.name}
                  </Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <Text style={styles.itemPrice}>${(item.price * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Shipping Address */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Shipping Address
            </Text>
            <Text style={styles.addressText}>{order.shippingAddress}</Text>
            <Text style={styles.addressText}>
              {order.city}, {order.postalCode}
            </Text>
            <Text style={styles.addressText}>{order.country}</Text>
            <Text style={styles.addressText}>Phone: {order.phone}</Text>
          </Card.Content>
        </Card>

        {/* Order Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Order Summary
            </Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>${order.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>${order.shipping.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${order.tax.toFixed(2)}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>${order.total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Payment Method</Text>
              <Text style={styles.summaryValue}>{order.paymentMethod}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          {order.status === 'pending' && (
            <Button
              mode="outlined"
              onPress={handleCancelOrder}
              style={styles.actionButton}
              textColor="#ef4444"
            >
              Cancel Order
            </Button>
          )}
          {order.status === 'delivered' && (
            <Button
              mode="contained"
              onPress={handleRequestReturn}
              style={styles.actionButton}
            >
              Request Return
            </Button>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#ef4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  orderNumber: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  orderDate: {
    color: '#6b7280',
  },
  statusChip: {
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
  },
  trackingNumber: {
    fontSize: 16,
    fontFamily: 'monospace',
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#1f2937',
  },
  trackButton: {
    backgroundColor: '#0ea5e9',
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'center',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    color: '#1f2937',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 12,
    color: '#6b7280',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  addressText: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    color: '#1f2937',
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
  actions: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
})
