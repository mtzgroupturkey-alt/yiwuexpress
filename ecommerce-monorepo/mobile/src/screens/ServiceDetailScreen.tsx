import React from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  ActivityIndicator,
  List,
  Divider,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import apiClient from '../api/client'

export default function ServiceDetailScreen() {
  const router = useRouter()
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: () => apiClient.getService(serviceId),
  })

  const service = data?.service

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !service) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load service details.</Text>
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
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.badgeRow}>
              <Text variant="labelMedium" style={styles.typeBadge}>
                {service?.type?.toUpperCase() || 'SERVICE'}
              </Text>
            </View>
            
            <Text variant="headlineSmall" style={styles.title}>
              {service?.name || 'Service Name'}
            </Text>
            
            <Text variant="bodyLarge" style={styles.desc}>
              {service?.description || 'No description available'}
            </Text>

            <Divider style={styles.divider} />

            <Text variant="titleMedium" style={styles.sectionTitle}>
              Service Attributes
            </Text>

            <List.Item
              title="Estimated Duration"
              description={service?.duration || 'N/A'}
              left={props => <List.Icon {...props} icon="clock-outline" color="#1a3a5c" />}
            />
            <Divider />
            <List.Item
              title="Regional Coverage"
              description={service?.coverage || 'Global'}
              left={props => <List.Icon {...props} icon="map-marker-outline" color="#1a3a5c" />}
            />
            <Divider />
            <List.Item
              title="Commercial Pricing"
              description={`$${service?.price?.toFixed(2) || '0.00'} Base Rate`}
              left={props => <List.Icon {...props} icon="currency-usd" color="#1a3a5c" />}
            />
          </Card.Content>
        </Card>

        <View style={styles.btnContainer}>
          <Button
            mode="contained"
            onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: service?.id || serviceId } })}
            style={styles.actionBtn}
            buttonColor="#1a3a5c"
          >
            Request Quotation
          </Button>
          <Button
            mode="outlined"
            onPress={() => {
              if (router.canGoBack()) {
                router.back()
              } else {
                router.replace('/')
              }
            }}
            style={styles.backBtn}
            textColor="#6b7280"
          >
            Back to Listings
          </Button>
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
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    paddingVertical: 8,
  },
  badgeRow: {
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    color: '#1a3a5c',
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 12,
  },
  desc: {
    color: '#4b5563',
    lineHeight: 24,
    marginBottom: 16,
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 8,
  },
  btnContainer: {
    marginTop: 24,
    gap: 12,
  },
  actionBtn: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  backBtn: {
    borderRadius: 8,
    borderColor: '#d1d5db',
  },
})
