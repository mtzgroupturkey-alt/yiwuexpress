import React, { useState, useEffect } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  Divider,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import apiClient from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function QuotesScreen() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setToken(t)
      setTokenChecked(true)
    })
  }, [])

  const {
    data: quotesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => apiClient.getQuotes(),
    enabled: tokenChecked && !!token,
  })

  const quotes = quotesData?.quotes || []

  const renderQuoteItem = ({ item }: { item: any }) => {
    let statusColor = '#9ca3af'
    if (item.status === 'APPROVED') statusColor = '#10b981'
    if (item.status === 'PENDING') statusColor = '#f59e0b'
    if (item.status === 'REJECTED') statusColor = '#ef4444'

    return (
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.serviceName}>
              {item.service?.name || 'Logistics Service'}
            </Text>
            <Text
              variant="labelSmall"
              style={[styles.statusBadge, { color: statusColor, borderColor: statusColor }]}
            >
              {item.status}
            </Text>
          </View>

          <Divider style={styles.divider} />

          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Origin:</Text>
            <Text variant="bodyMedium" style={styles.value}>{item.origin}</Text>
          </View>
          <View style={styles.row}>
            <Text variant="bodyMedium" style={styles.label}>Destination:</Text>
            <Text variant="bodyMedium" style={styles.value}>{item.destination}</Text>
          </View>
          {item.weight && (
            <View style={styles.row}>
              <Text variant="bodyMedium" style={styles.label}>Weight:</Text>
              <Text variant="bodyMedium" style={styles.value}>{item.weight} kg</Text>
            </View>
          )}

          <Divider style={styles.divider} />

          <View style={styles.priceRow}>
            <Text variant="bodySmall" style={styles.priceLabel}>Price Estimate:</Text>
            <Text variant="titleLarge" style={styles.priceValue}>
              {item.price ? `$${item.price.toFixed(2)}` : 'Under Review'}
            </Text>
          </View>
        </Card.Content>
      </Card>
    )
  }

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.unauthorized}>
          <Text variant="titleMedium" style={styles.unauthorizedText}>
            Authorization Required
          </Text>
          <Text variant="bodyMedium" style={styles.unauthorizedSubtitle}>
            Please sign in to view your quotes history.
          </Text>
          <Button
            mode="contained"
            onPress={() => router.push('/login')}
            buttonColor="#1a3a5c"
            style={styles.authBtn}
          >
            Sign In
          </Button>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load quotations.</Text>
          <Button mode="contained" onPress={() => refetch()}>
            Retry
          </Button>
        </View>
      ) : (
        <FlatList
          data={quotes}
          renderItem={renderQuoteItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No quote requests found.</Text>
              <Button
                mode="contained"
                onPress={() => router.push('/quote-request')}
                buttonColor="#1a3a5c"
                style={styles.newQuoteBtn}
              >
                Request First Quote
              </Button>
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
  unauthorized: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  unauthorizedText: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 8,
  },
  unauthorizedSubtitle: {
    color: '#6b7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  authBtn: {
    borderRadius: 8,
    width: '60%',
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
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceName: {
    fontWeight: 'bold',
    color: '#1a3a5c',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
  },
  divider: {
    marginVertical: 12,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    color: '#6b7280',
    width: 100,
  },
  value: {
    color: '#111827',
    fontWeight: '500',
    flex: 1,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceLabel: {
    color: '#6b7280',
  },
  priceValue: {
    fontWeight: 'black',
    color: '#1a3a5c',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    color: '#9ca3af',
    marginBottom: 16,
  },
  newQuoteBtn: {
    borderRadius: 8,
  },
})
