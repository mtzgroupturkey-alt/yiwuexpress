import React, { useState, useEffect } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
} from 'react-native'
import {
  Text,
  Searchbar,
  Card,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

interface SearchResult {
  id: string
  type: 'product' | 'service'
  name: string
  description: string | null
  price: number
  image: string | null
  category: string | null
}

export default function SearchScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [searchType, setSearchType] = useState<'all' | 'product' | 'service'>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([
    'wireless headphones',
    'shipping to USA',
    'cotton t-shirts',
  ])

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const {
    data: searchData,
    isLoading,
  } = useQuery({
    queryKey: ['search', debouncedQuery, searchType],
    queryFn: async () => {
      if (!debouncedQuery) return { results: [] }
      
      // Mock search results - replace with actual API call
      const mockResults: SearchResult[] = [
        {
          id: 'p1',
          type: 'product',
          name: 'Premium Wireless Headphones',
          description: 'High-quality sound with noise cancellation',
          price: 199.99,
          image: null,
          category: 'Electronics',
        },
        {
          id: 's1',
          type: 'service',
          name: 'Air Freight Shipping',
          description: 'Fast delivery to worldwide destinations',
          price: 299.99,
          image: null,
          category: 'Shipping',
        },
        {
          id: 'p2',
          type: 'product',
          name: 'Organic Cotton T-Shirt',
          description: 'Comfortable and sustainable clothing',
          price: 29.99,
          image: null,
          category: 'Clothing',
        },
      ]

      return {
        results: mockResults.filter(
          (item) =>
            (searchType === 'all' || item.type === searchType) &&
            item.name.toLowerCase().includes(debouncedQuery.toLowerCase())
        ),
      }
    },
    enabled: debouncedQuery.length > 0,
  })

  const handleSearchSubmit = () => {
    if (searchQuery && !recentSearches.includes(searchQuery)) {
      setRecentSearches([searchQuery, ...recentSearches.slice(0, 4)])
    }
  }

  const handleRecentSearchPress = (query: string) => {
    setSearchQuery(query)
    setDebouncedQuery(query)
  }

  const handleResultPress = (item: SearchResult) => {
    if (item.type === 'product') {
      router.push({ pathname: '/product-detail', params: { productId: item.id } })
    } else {
      router.push({ pathname: '/service-detail', params: { serviceId: item.id } })
    }
  }

  const results = searchData?.results || []

  const renderResultItem = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity onPress={() => handleResultPress(item)} style={styles.cardWrapper}>
      <Card style={styles.card}>
        <View style={styles.cardContent}>
          <Image
            source={
              item.image
                ? { uri: item.image }
                : require('../../assets/placeholder.jpg')
            }
            style={styles.resultImage}
            resizeMode="cover"
          />
          <View style={styles.resultInfo}>
            <View style={styles.resultHeader}>
              <Chip
                style={[
                  styles.typeChip,
                  item.type === 'product'
                    ? styles.productChip
                    : styles.serviceChip,
                ]}
                textStyle={styles.typeChipText}
              >
                {item.type.toUpperCase()}
              </Chip>
              {item.category && (
                <Text style={styles.category}>{item.category}</Text>
              )}
            </View>
            <Text variant="titleMedium" style={styles.resultName} numberOfLines={2}>
              {item.name}
            </Text>
            {item.description && (
              <Text variant="bodySmall" style={styles.resultDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text variant="titleMedium" style={styles.resultPrice}>
              ${item.price.toFixed(2)}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Search
        </Text>
        <Searchbar
          placeholder="Search products and services..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          onSubmitEditing={handleSearchSubmit}
          style={styles.searchBar}
          placeholderTextColor="#9ca3af"
          autoFocus
        />

        <SegmentedButtons
          value={searchType}
          onValueChange={(value) => setSearchType(value as typeof searchType)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'product', label: 'Products' },
            { value: 'service', label: 'Services' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {!debouncedQuery ? (
        <View style={styles.recentContainer}>
          <Text variant="titleMedium" style={styles.recentTitle}>
            Recent Searches
          </Text>
          {recentSearches.map((query, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => handleRecentSearchPress(query)}
              style={styles.recentItem}
            >
              <Text style={styles.recentText}>🔍 {query}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderResultItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                No results found for "{debouncedQuery}"
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                Try different keywords or check spelling
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
  title: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1f2937',
  },
  searchBar: {
    backgroundColor: '#f9fafb',
    marginBottom: 16,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  recentContainer: {
    padding: 16,
  },
  recentTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 16,
  },
  recentItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
  },
  recentText: {
    fontSize: 16,
    color: '#4b5563',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
  },
  cardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  resultImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    marginRight: 12,
  },
  resultInfo: {
    flex: 1,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeChip: {
    marginRight: 8,
  },
  productChip: {
    backgroundColor: '#dbeafe',
  },
  serviceChip: {
    backgroundColor: '#fef3c7',
  },
  typeChipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  category: {
    fontSize: 12,
    color: '#6b7280',
  },
  resultName: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  resultDesc: {
    color: '#6b7280',
    marginBottom: 8,
  },
  resultPrice: {
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
  },
})
