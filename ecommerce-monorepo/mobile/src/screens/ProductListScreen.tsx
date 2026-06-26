import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  Searchbar,
  Chip,
  ActivityIndicator,
  Button,
  Badge,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ScrollView } from 'react-native'
import { ShoppingCart } from 'lucide-react-native'

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  stock: number
  image: string | null
  category: string | null
}

export default function ProductListScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [page, setPage] = useState(1)
  const [cartCount, setCartCount] = useState(0) // Cart item count

  const categories = [
    { label: 'All', value: '' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Home', value: 'home' },
    { label: 'Toys', value: 'toys' },
  ]

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['products', page, category, searchQuery],
    queryFn: async () => {
      // Mock products data - replace with actual API call
      const mockProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Wireless Headphones',
          description: 'High-quality sound with noise cancellation',
          price: 199.99,
          stock: 50,
          image: null,
          category: 'electronics',
        },
        {
          id: '2',
          name: 'Organic Cotton T-Shirt',
          description: 'Comfortable and sustainable clothing',
          price: 29.99,
          stock: 100,
          image: null,
          category: 'clothing',
        },
        {
          id: '3',
          name: 'Smart LED Desk Lamp',
          description: 'Adjustable brightness and color temperature',
          price: 79.99,
          stock: 25,
          image: null,
          category: 'home',
        },
        {
          id: '4',
          name: 'Educational Building Blocks',
          description: 'Safe and fun toys for kids',
          price: 49.99,
          stock: 75,
          image: null,
          category: 'toys',
        },
      ]

      return {
        products: mockProducts.filter(
          (product) =>
            (category === '' || product.category === category) &&
            (searchQuery === '' ||
              product.name.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      }
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const products = productsData?.products || []

  const renderProductItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/product-detail', params: { productId: item.id } })}
      style={styles.cardWrapper}
    >
      <Card style={styles.card}>
        <View style={styles.imageContainer}>
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.productImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.productImage, styles.placeholderImage]}>
              <Text style={styles.placeholderText}>📦</Text>
              <Text style={styles.placeholderLabel}>No Image</Text>
            </View>
          )}
          {item.stock <= 10 && item.stock > 0 && (
            <Chip style={styles.lowStockChip} textStyle={styles.lowStockText}>
              Low Stock
            </Chip>
          )}
          {item.stock === 0 && (
            <Chip style={styles.outOfStockChip} textStyle={styles.outOfStockText}>
              Out of Stock
            </Chip>
          )}
        </View>
        <Card.Content>
          <Text variant="titleMedium" style={styles.productName} numberOfLines={2}>
            {item.name}
          </Text>
          {item.description && (
            <Text variant="bodySmall" style={styles.productDesc} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={styles.footer}>
            <Text variant="titleLarge" style={styles.price}>
              ${item.price.toFixed(2)}
            </Text>
            <Text
              style={[
                styles.stock,
                item.stock > 0 ? styles.inStock : styles.outOfStock,
              ]}
            >
              {item.stock > 0 ? `${item.stock} in stock` : 'Out of stock'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={styles.title}>
            Products
          </Text>
          <TouchableOpacity 
            style={styles.cartButton}
            onPress={() => router.push('/cart')}
          >
            <ShoppingCart color="#1f2937" size={28} />
            {cartCount > 0 && (
              <Badge style={styles.cartBadge}>{cartCount}</Badge>
            )}
          </TouchableOpacity>
        </View>
        <Searchbar
          placeholder="Search products..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          placeholderTextColor="#9ca3af"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsContainer}>
          {categories.map((cat) => (
            <Chip
              key={cat.label}
              selected={category === cat.value}
              onPress={() => {
                setCategory(cat.value)
                setPage(1)
              }}
              style={styles.chip}
              selectedColor="#0ea5e9"
            >
              {cat.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Failed to load products
          </Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProductItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                {searchQuery ? 'No products found' : 'No products available'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cartButton: {
    position: 'relative',
    padding: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: 12,
    minWidth: 20,
    height: 20,
  },
  searchBar: {
    backgroundColor: '#f9fafb',
    marginBottom: 12,
  },
  chipsContainer: {
    marginBottom: 8,
  },
  chip: {
    marginRight: 8,
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
  },
  errorText: {
    color: '#ef4444',
    marginBottom: 16,
  },
  listContent: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  cardWrapper: {
    width: '48%',
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: 150,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 4,
  },
  placeholderLabel: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500',
  },
  lowStockChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fef3c7',
  },
  lowStockText: {
    color: '#92400e',
    fontSize: 10,
  },
  outOfStockChip: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fee2e2',
  },
  outOfStockText: {
    color: '#991b1b',
    fontSize: 10,
  },
  productName: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 8,
    marginBottom: 4,
    minHeight: 40,
  },
  productDesc: {
    color: '#6b7280',
    marginBottom: 8,
  },
  footer: {
    marginTop: 8,
  },
  price: {
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  stock: {
    fontSize: 12,
  },
  inStock: {
    color: '#059669',
  },
  outOfStock: {
    color: '#ef4444',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#9ca3af',
  },
})
