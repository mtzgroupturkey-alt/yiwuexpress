import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  List,
  Divider,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient, { CartItem } from '../api/client'

export default function CartScreen() {
  const queryClient = useQueryClient()
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const {
    data,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
  })

  const cartItems = data?.cart || []

  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + (item.product.price * item.quantity)
  }, 0)

  const renderCartItem = ({ item }: { item: CartItem }) => (
    <List.Item
      title={item.product.name}
      description={`$${item.product.price.toFixed(2)} x ${item.quantity}`}
      left={props => (
        <List.Icon {...props} icon="shopping" />
      )}
      right={props => (
        <Text style={styles.itemTotal}>
          ${(item.product.price * item.quantity).toFixed(2)}
        </Text>
      )}
    />
  )

  const handleCheckout = async () => {
    try {
      // Navigate to checkout or create order
      setSnackbarMessage('Checkout functionality coming soon!')
      setSnackbarVisible(true)
    } catch (err) {
      setSnackbarMessage('Checkout failed. Please try again.')
      setSnackbarVisible(true)
    }
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

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Error loading cart
          </Text>
          <Button mode="contained" onPress={() => queryClient.invalidateQueries({ queryKey: ['cart'] })}>
            Retry
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Shopping Cart
          </Text>

          {cartItems.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.emptyText}>
                  Your cart is empty
                </Text>
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Add some products to get started!
                </Text>
                <Button
                  mode="contained"
                  onPress={() => {
                    // Navigate to products
                  }}
                  style={styles.shopButton}
                >
                  Browse Products
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <>
              <Card style={styles.cartCard}>
                <FlatList
                  data={cartItems}
                  renderItem={renderCartItem}
                  keyExtractor={(item) => item.id}
                  ItemSeparatorComponent={Divider}
                  scrollEnabled={false}
                />
              </Card>

              <Card style={styles.summaryCard}>
                <Card.Content>
                  <Text variant="titleMedium" style={styles.summaryTitle}>
                    Order Summary
                  </Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Subtotal</Text>
                    <Text style={styles.summaryValue}>${totalPrice.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Shipping</Text>
                    <Text style={styles.summaryValue}>$0.00</Text>
                  </View>
                  <Divider style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.totalLabel}>Total</Text>
                    <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
                  </View>
                </Card.Content>
              </Card>

              <View style={styles.actionButtons}>
                <Button
                  mode="contained"
                  onPress={handleCheckout}
                  style={styles.checkoutButton}
                  contentStyle={styles.buttonContent}
                >
                  Proceed to Checkout
                </Button>
                <Button
                  mode="outlined"
                  onPress={() => {
                    // Clear cart
                  }}
                  style={styles.clearButton}
                >
                  Clear Cart
                </Button>
              </View>
            </>
          )}
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
    marginBottom: 16,
    color: '#ef4444',
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 16,
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#1f2937',
  },
  emptyCard: {
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 8,
    color: '#6b7280',
  },
  emptySubtext: {
    textAlign: 'center',
    marginBottom: 24,
    color: '#9ca3af',
  },
  shopButton: {
    backgroundColor: '#0ea5e9',
  },
  cartCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  summaryCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  summaryTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    color: '#6b7280',
    fontSize: 16,
  },
  summaryValue: {
    color: '#1f2937',
    fontSize: 16,
  },
  summaryDivider: {
    marginVertical: 16,
  },
  totalLabel: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    color: '#0ea5e9',
    fontSize: 20,
    fontWeight: 'bold',
  },
  actionButtons: {
    gap: 12,
  },
  checkoutButton: {
    backgroundColor: '#059669',
  },
  clearButton: {
    borderColor: '#ef4444',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  snackbar: {
    backgroundColor: '#059669',
  },
})