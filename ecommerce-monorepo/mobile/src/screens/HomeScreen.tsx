import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
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

export default function HomeScreen() {
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
    queryKey: ['services', page, category, searchQuery],
    queryFn: () => apiClient.getServices(page, 10, category, searchQuery),
  })

  const { data: settingsData } = useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.getSettings(),
  })

  const services = data?.services || []
  const logoUrl = settingsData?.settings?.companyLogo
  const companyName = settingsData?.settings?.companyName || 'YIWU EXPRESS'

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
          <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>
            {item?.name || 'Service Name'}
          </Text>
          <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={2}>
            {item?.description || 'No description available'}
          </Text>
          <View style={styles.priceRow}>
            <Text variant="titleMedium" style={styles.priceText}>
              ${item?.price?.toFixed(2) || '0.00'}
            </Text>
            <Button
              mode="contained-tonal"
              compact
              onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: item?.id } })}
              buttonColor="#c9a84c"
              textColor="white"
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
      {/* Brand Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl.startsWith('/') ? `${apiClient.getBaseUrl()}${logoUrl}` : logoUrl }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : null}
          <Text variant="headlineMedium" style={logoUrl ? styles.brandTitleWithLogo : styles.brandTitle}>
            {companyName} {logoUrl ? '' : '🚚'}
          </Text>
        </View>
        <Text variant="bodySmall" style={styles.brandSubtitle}>
          Global Trade & Logistics from Yiwu, China
        </Text>
        <Searchbar
          placeholder="Search logistics services..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          placeholderTextColor="#9ca3af"
        />
      </View>

      {/* Quick Action Navigation Grid */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          onPress={() => router.push('/track')}
          style={styles.actionBtn}
          buttonColor="#1a3a5c"
        >
          Track Package
        </Button>
        <Button
          mode="contained"
          onPress={() => router.push('/quotes')}
          style={styles.actionBtn}
          buttonColor="#c9a84c"
        >
          My Quotes
        </Button>
      </View>

      {/* Categories Horizontal Chips */}
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

      {/* Services Grid */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Failed to load services
          </Text>
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
          numColumns={1}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                No logistics services found
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
    backgroundColor: '#f9fafb',
  },
  header: {
    padding: 16,
    backgroundColor: '#1a3a5c',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoImage: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  brandTitleWithLogo: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 22,
  },
  brandSubtitle: {
    color: '#e2e8f0',
    marginBottom: 16,
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  chip: {
    marginRight: 8,
  },
  listContent: {
    padding: 16,
  },
  cardWrapper: {
    marginBottom: 12,
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
    marginBottom: 4,
  },
  cardDesc: {
    color: '#4b5563',
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 8,
  },
  priceText: {
    fontWeight: 'bold',
    color: '#1a3a5c',
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