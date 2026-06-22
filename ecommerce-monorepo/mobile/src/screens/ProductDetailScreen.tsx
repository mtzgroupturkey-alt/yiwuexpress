import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'

interface ProductDetailRouteParams {
  productId: string
}

export default function ProductDetailScreen() {
  const router = useRouter()
  const { productId } = useLocalSearchParams<{ productId: string }>()
  const [quantity, setQuantity] = useState(1)
  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')

  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => apiClient.getProduct(productId),
  })

  const product = productData?.product

  const handleAddToCart = async () => {
    try {
      await apiClient.addToCart(productId, quantity)
      setSnackbarMessage('Product added to cart successfully!')
      setSnackbarVisible(true)
    } catch (err) {
      setSnackbarMessage('Failed to add product to cart. Please try again.')
      setSnackbarVisible(true)
    }
  }

  const handleBuyNow = async () => {
    await handleAddToCart()
    router.push('/cart')
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

  if (error || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Product not found or error loading product details
          </Text>
          <Button mode="contained" onPress={() => {
            if (router.canGoBack()) {
              router.back()
            } else {
              router.replace('/')
            }
          }}>
            Go Back
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image
            source={
              product.image
                ? { uri: product.image }
                : require('../../assets/placeholder.jpg')
            }
            style={styles.productImage}
            resizeMode="cover"
          />
        </View>

        <View style={styles.content}>
          {/* Product Info */}
          <View style={styles.header}>
            <Text variant="headlineMedium" style={styles.productName}>
              {product.name}
            </Text>
            {product.category && (
              <Chip style={styles.categoryChip} textStyle={styles.chipText}>
                {product.category}
              </Chip>
            )}
          </View>

          {/* Price */}
          <View style={styles.priceContainer}>
            <Text variant="displaySmall" style={styles.price}>
              ${product.price.toFixed(2)}
            </Text>
            <View style={styles.stockContainer}>
              <Text
                style={[
                  styles.stockText,
                  product.stock > 0 ? styles.inStock : styles.outOfStock,
                ]}
              >
                {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.descriptionTitle}>
                Description
              </Text>
              <Text variant="bodyMedium" style={styles.descriptionText}>
                {product.description || 'No description available for this product.'}
              </Text>
            </Card.Content>
          </Card>

          {/* Quantity Selector */}
          <Card style={styles.quantityCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.quantityTitle}>
                Quantity
              </Text>
              <View style={styles.quantityControls}>
                <Button
                  mode="outlined"
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  -
                </Button>
                <Text variant="titleLarge" style={styles.quantityText}>
                  {quantity}
                </Text>
                <Button
                  mode="outlined"
                  onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                >
                  +
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Button
              mode="contained"
              onPress={handleAddToCart}
              disabled={product.stock <= 0}
              style={[styles.button, styles.addToCartButton]}
              contentStyle={styles.buttonContent}
            >
              Add to Cart
            </Button>
            <Button
              mode="contained"
              onPress={handleBuyNow}
              disabled={product.stock <= 0}
              style={[styles.button, styles.buyNowButton]}
              contentStyle={styles.buttonContent}
            >
              Buy Now
            </Button>
          </View>

          {/* Product Details */}
          <Card style={styles.detailsCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.detailsTitle}>
                Product Details
              </Text>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Category:</Text>
                <Text style={styles.detailValue}>
                  {product.category || 'Not specified'}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Availability:</Text>
                <Text
                  style={[
                    styles.detailValue,
                    product.stock > 0 ? styles.inStock : styles.outOfStock,
                  ]}
                >
                  {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                </Text>
              </View>
              <View style={styles.detailsRow}>
                <Text style={styles.detailLabel}>Added:</Text>
                <Text style={styles.detailValue}>
                  {new Date(product.createdAt).toLocaleDateString()}
                </Text>
              </View>
            </Card.Content>
          </Card>
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
  imageContainer: {
    backgroundColor: 'white',
  },
  productImage: {
    width: '100%',
    height: 300,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  productName: {
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1f2937',
  },
  categoryChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f9ff',
  },
  chipText: {
    color: '#0284c7',
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  price: {
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  stockContainer: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  stockText: {
    fontSize: 14,
    fontWeight: '500',
  },
  inStock: {
    color: '#059669',
  },
  outOfStock: {
    color: '#ef4444',
  },
  descriptionCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  descriptionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  descriptionText: {
    color: '#4b5563',
    lineHeight: 24,
  },
  quantityCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  quantityTitle: {
    marginBottom: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityText: {
    marginHorizontal: 16,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  button: {
    flex: 1,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  addToCartButton: {
    backgroundColor: '#0ea5e9',
  },
  buyNowButton: {
    backgroundColor: '#059669',
  },
  detailsCard: {
    backgroundColor: 'white',
  },
  detailsTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  detailValue: {
    color: '#1f2937',
  },
  snackbar: {
    backgroundColor: '#059669',
  },
})