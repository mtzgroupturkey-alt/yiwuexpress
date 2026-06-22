import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  ActivityIndicator,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import apiClient, { Service } from '../api/client'

export default function ServicesScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)

  const categories = [
    { label: 'All', value: '' },
    { label: 'Shipping', value: 'shipping' },
    { label: 'Customs', value: 'customs' },
    { label: 'Warehousing', value: 'warehousing' },
    { label: 'Sourcing', value: 'sourcing' },
  ]

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['services-tab', page, category, searchQuery],
    queryFn: () => apiClient.getServices(page, 20, category, searchQuery),
  })

  const services = data?.services || []

  const renderServiceItem = ({ item }: { item: Service }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item?.id } })}
      style={styles.cardWrapper}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.badgeRow}>
            <Text variant="labelSmall" style={styles.typeBadge}>
              {item?.type?.toUpperCase() || 'SERVICE'}
            </Text>
            <Text variant="labelSmall" style={styles.durationBadge}>
              🕒 {item?.duration || 'N/A'}
            </Text>
          </View>
          <Text variant="titleMedium" style={styles.cardTitle}>
            {item?.name || 'Service Name'}
          </Text>
          <Text variant="bodyMedium" style={styles.cardDesc} numberOfLines={3}>
            {item?.description || 'No description available'}
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.coverageText}>
              📍 Coverage: {item?.coverage || 'Global'}
            </Text>
          </View>
          <View style={styles.priceRow}>
            <Text variant="titleLarge" style={styles.priceText}>
              ${item?.price?.toFixed(2) || '0.00'}
            </Text>
            <Button
              mode="contained"
              onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: item?.id } })}
              buttonColor="#1a3a5c"
              style={styles.btn}
            >
              Get Quote
            </Button>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Searchbar
          placeholder="Search services..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
        />
      </View>

      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <Chip
              key={cat.label}
              selected={category === cat.value}
              onPress={() => { setCategory(cat.value); setPage(1); }}
              style={styles.chip}
              selectedColor="#1a3a5c"
            >
              {cat.label}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load services</Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={services}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No services found matching search query</Text>
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
    backgroundColor: '#white',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  searchBar: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  chip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    color: '#1a3a5c',
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  durationBadge: {
    color: '#6b7280',
  },
  cardTitle: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  cardDesc: {
    color: '#4b5563',
    marginBottom: 8,
  },
  infoRow: {
    marginBottom: 12,
  },
  coverageText: {
    color: '#6b7280',
    fontStyle: 'italic',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  priceText: {
    fontWeight: 'bold',
    color: '#1a3a5c',
  },
  btn: {
    borderRadius: 8,
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
    marginBottom: 12,
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
