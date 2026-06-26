import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  TextInput,
  RadioButton,
  ActivityIndicator,
  Divider,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import apiClient from '../api/client'

interface CartItem {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image: string | null
  }
}

export default function CheckoutScreen() {
  const router = useRouter()
  const [shippingAddress, setShippingAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [country, setCountry] = useState('')
  const [phone, setPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('credit_card')

  const { data: cartData, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      // Mock cart data - replace with actual API call
      return {
        items: [] as CartItem[],
        total: 0,
      }
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: async (orderData: any) => {
      // Replace with actual checkout API call
      return new Promise((resolve) => setTimeout(resolve, 1000))
    },
    onSuccess: () => {
      Alert.alert(
        'Order Placed!',
        'Your order has been placed successfully.',
        [
          {
            text: 'View Orders',
            onPress: () => router.push('/orders'),
          },
        ]
      )
    },
    onError: () => {
      Alert.alert('Error', 'Failed to place order. Please try again.')
    },
  })

  const handleCheckout = () => {
    if (!shippingAddress || !city || !postalCode || !country || !phone) {
      Alert.alert('Error', 'Please fill in all shipping details.')
      return
    }

    checkoutMutation.mutate({
      shippingAddress,
      city,
      postalCode,
      country,
      phone,
      paymentMethod,
    })
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

  const cartItems = cartData?.items || []
  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  )
  const shipping = 15.0
  const tax = subtotal * 0.1
  const total = subtotal + shipping + tax

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineMedium" style={styles.title}>
          Checkout
        </Text>

        {/* Shipping Information */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Shipping Information
            </Text>
            
            <TextInput
              label="Full Address"
              value={shippingAddress}
              onChangeText={setShippingAddress}
              mode="outlined"
              style={styles.input}
              multiline
              numberOfLines={2}
            />
            
            <TextInput
              label="City"
              value={city}
              onChangeText={setCity}
              mode="outlined"
              style={styles.input}
            />
            
            <View style={styles.row}>
              <TextInput
                label="Postal Code"
                value={postalCode}
                onChangeText={setPostalCode}
                mode="outlined"
                style={[styles.input, styles.halfWidth]}
              />
              <TextInput
                label="Country"
                value={country}
                onChangeText={setCountry}
                mode="outlined"
                style={[styles.input, styles.halfWidth]}
              />
            </View>
            
            <TextInput
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
            />
          </Card.Content>
        </Card>

        {/* Payment Method */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Payment Method
            </Text>
            
            <RadioButton.Group
              onValueChange={setPaymentMethod}
              value={paymentMethod}
            >
              <View style={styles.radioOption}>
                <RadioButton value="credit_card" />
                <Text style={styles.radioLabel}>Credit/Debit Card</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="paypal" />
                <Text style={styles.radioLabel}>PayPal</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="bank_transfer" />
                <Text style={styles.radioLabel}>Bank Transfer</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton value="cod" />
                <Text style={styles.radioLabel}>Cash on Delivery</Text>
              </View>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Order Summary */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Order Summary
            </Text>
            
            {cartItems.length === 0 ? (
              <Text style={styles.emptyText}>Your cart is empty</Text>
            ) : (
              <>
                {cartItems.map((item) => (
                  <View key={item.id} style={styles.orderItem}>
                    <View style={styles.orderItemInfo}>
                      <Text style={styles.itemName} numberOfLines={1}>
                        {item.product.name}
                      </Text>
                      <Text style={styles.itemQuantity}>
                        Qty: {item.quantity}
                      </Text>
                    </View>
                    <Text style={styles.itemPrice}>
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </Text>
                  </View>
                ))}
                
                <Divider style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Shipping</Text>
                  <Text style={styles.summaryValue}>${shipping.toFixed(2)}</Text>
                </View>
                
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Tax</Text>
                  <Text style={styles.summaryValue}>${tax.toFixed(2)}</Text>
                </View>
                
                <Divider style={styles.divider} />
                
                <View style={styles.summaryRow}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Checkout Button */}
        <Button
          mode="contained"
          onPress={handleCheckout}
          disabled={cartItems.length === 0 || checkoutMutation.isPending}
          loading={checkoutMutation.isPending}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          {checkoutMutation.isPending ? 'Processing...' : 'Place Order'}
        </Button>
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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  card: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioLabel: {
    fontSize: 16,
    color: '#1f2937',
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 12,
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
  emptyText: {
    color: '#9ca3af',
    textAlign: 'center',
    paddingVertical: 24,
  },
  divider: {
    marginVertical: 12,
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
    backgroundColor: '#059669',
    marginTop: 8,
  },
  checkoutButtonContent: {
    paddingVertical: 12,
  },
})
