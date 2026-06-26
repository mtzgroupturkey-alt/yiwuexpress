import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  Searchbar,
  SegmentedButtons,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

interface Order {
  id: string
  orderNumber: string
  createdAt: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  total: number
  itemCount: number
  shippingAddress: string
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

export default function OrderListScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all')
  const [refreshing, setRefreshing] = useState(false)

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['orders', statusFilter, searchQuery],
    queryFn: async () => {
      // Mock orders data - replace with actual API call
      const mockOrders: Order[] = [
        {
          id: '1',
          orderNumber: 'ORD-2026-001',
          createdAt: '2026-06-20T10:30:00Z',
          status: 'delivered',
          total: 299.99,
          itemCount: 3,
          shippingAddress: '123 Main St, New York, NY 10001',
        },
        {
          id: '2',
          orderNumber: 'ORD-2026-002',
          createdAt: '2026-06-22T14:15:00Z',
          status: 'shipped',
          total: 149.50,
          itemCount: 2,
          shippingAddress: '456 Oak Ave, Los Angeles, CA 90001',
        },
        {
          id: '3',
          orderNumber: 'ORD-2026-003',
          createdAt: '2026-06-24T09:00:00Z',
          status: 'processing',
          total: 599.00,
          itemCount: 5,
          shippingAddress: '789 Pine Rd, Chicago, IL 60601',
        },
      ]

      return {
        orders: mockOrders.filter(
          (order) =>
            (statusFilter === 'all' || order.status === statusFilter) &&
            (searchQuery === '' ||
              order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()))
        ),
      }
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const orders = ordersData?.orders || []

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity
      onPress={() => router.push({ pathname: '/order-detail', params: { orderId: item.id } })}
      style={styles.cardWrapper}
    >
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <Text variant="titleMedium" style={styles.orderNumber}>
                {item.orderNumber}
              </Text>
              <Text variant="bodySmall" style={styles.orderDate}>
                {new Date(item.createdAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <Chip
              style={[styles.statusChip, { backgroundColor: statusColors[item.status] + '20' }]}
              textStyle={[styles.statusText, { color: statusColors[item.status] }]}
            >
              {statusLabels[item.status]}
            </Chip>
          </View>

          <View style={styles.divider} />

          <View style={styles.orderDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Items:</Text>
              <Text style={styles.detailValue}>{item.itemCount}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Total:</Text>
              <Text style={[styles.detailValue, styles.totalValue]}>
                ${item.total.toFixed(2)}
              </Text>
            </View>
          </View>

          <View style={styles.addressContainer}>
            <Text style={styles.addressLabel}>Shipping to:</Text>
            <Text style={styles.addressText} numberOfLines={2}>
              {item.shippingAddress}
            </Text>
          </View>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          My Orders
        </Text>
        
        <Searchbar
          placeholder="Search orders..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          placeholderTextColor="#9ca3af"
        />

        <SegmentedButtons
          value={statusFilter}
          onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'processing', label: 'Active' },
            { value: 'delivered', label: 'Delivered' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text variant="titleMedium" style={styles.errorText}>
            Failed to load orders
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text variant="titleMedium" style={styles.emptyText}>
                {searchQuery ? 'No orders found' : 'You have no orders yet'}
              </Text>
              {!searchQuery && (
                <Text variant="bodyMedium" style={styles.emptySubtext}>
                  Start shopping to see your orders here
                </Text>
              )}
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginBottom: 12,
  },
  orderDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  detailValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  totalValue: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  addressContainer: {
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  addressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#1f2937',
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
