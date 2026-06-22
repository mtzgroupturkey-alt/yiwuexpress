import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Keyboard,
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  Divider,
} from 'react-native-paper'
import apiClient from '../api/client'

interface TrackingEvent {
  status: string
  description: string
  location: string
  timestamp: string
  completed: boolean
}

export default function ShipmentTrackingScreen() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any | null>(null)

  const handleTrack = async () => {
    Keyboard.dismiss()
    if (!trackingNumber.trim()) return

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await apiClient.trackShipment(trackingNumber.trim())
      setResult(data)
    } catch (err: any) {
      setError(err.response?.data?.error || 'No shipment found with this tracking number.')
    } finally {
      setLoading(false)
    }
  }

  const fillSample = () => {
    setTrackingNumber('YWE87349823CN')
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text variant="headlineSmall" style={styles.title}>
          Track Shipment
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Enter your cargo tracking number for real-time milestones.
        </Text>

        <Card style={styles.searchCard}>
          <Card.Content>
            <View style={styles.searchRow}>
              <TextInput
                label="Tracking Number"
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholder="e.g. YWE87349823CN"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.searchInput}
              />
              <Button
                mode="contained"
                onPress={handleTrack}
                loading={loading}
                disabled={loading}
                style={styles.trackBtn}
                buttonColor="#1a3a5c"
              >
                Track
              </Button>
            </View>

            <TouchableOpacity style={styles.sampleLink} onPress={fillSample}>
              <Text style={styles.sampleText}>Use Sample Code (YWE87349823CN)</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        {result ? (
          <View style={styles.resultContainer}>
            {/* Summary Details */}
            <Card style={styles.resultCard}>
              <Card.Content>
                <View style={styles.metaRow}>
                  <Text variant="titleMedium" style={styles.metaLabel}>
                    Tracking Code:
                  </Text>
                  <Text variant="titleMedium" style={styles.metaVal}>
                    {result.shipment?.trackingNumber}
                  </Text>
                </View>

                <Divider style={styles.div} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status:</Text>
                  <Text style={[styles.metaVal, { color: '#1a3a5c', fontWeight: 'bold' }]}>
                    {result.currentStatus}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Route:</Text>
                  <Text style={styles.metaVal}>
                    {result.shipment?.origin} ➔ {result.shipment?.destination}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Carrier:</Text>
                  <Text style={styles.metaVal}>
                    {result.shipment?.carrier || 'YIWU EXPRESS'}
                  </Text>
                </View>

                {result.estimatedDelivery ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Est. Delivery:</Text>
                    <Text style={styles.metaVal}>
                      {new Date(result.estimatedDelivery).toLocaleDateString()}
                    </Text>
                  </View>
                ) : null}
              </Card.Content>
            </Card>

            {/* Timeline */}
            <Text variant="titleMedium" style={styles.timelineTitle}>
              Shipment Milestones
            </Text>

            <Card style={styles.timelineCard}>
              <Card.Content>
                {result.trackingEvents?.map((event: TrackingEvent, index: number) => (
                  <View key={event.status} style={styles.timelineEvent}>
                    <View style={styles.timelineIndicators}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: event.completed ? '#1a3a5c' : '#d1d5db' },
                        ]}
                      />
                      {index < result.trackingEvents.length - 1 ? (
                        <View style={styles.line} />
                      ) : null}
                    </View>
                    <View style={styles.timelineDetails}>
                      <Text variant="bodyLarge" style={styles.eventStatus}>
                        {event.status}
                      </Text>
                      <Text variant="bodyMedium" style={styles.eventDesc}>
                        {event.description}
                      </Text>
                      <Text variant="bodySmall" style={styles.eventLoc}>
                        📍 {event.location} • {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </Card.Content>
            </Card>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

import { TouchableOpacity } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 20,
  },
  searchCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    elevation: 2,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'white',
  },
  trackBtn: {
    borderRadius: 8,
    paddingVertical: 6,
  },
  sampleLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  sampleText: {
    color: '#c9a84c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 20,
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metaLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  metaVal: {
    color: '#111827',
    fontWeight: '600',
  },
  div: {
    marginVertical: 12,
  },
  timelineTitle: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    elevation: 2,
  },
  timelineEvent: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineIndicators: {
    alignItems: 'center',
    marginRight: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginTop: 4,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 4,
  },
  timelineDetails: {
    flex: 1,
  },
  eventStatus: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  eventDesc: {
    color: '#4b5563',
    marginVertical: 4,
  },
  eventLoc: {
    color: '#9ca3af',
  },
})
