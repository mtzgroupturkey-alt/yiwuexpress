import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Platform,
  Dimensions,
} from 'react-native'
import {
  Text,
  Divider,
  ActivityIndicator,
} from 'react-native-paper'
import { Bell, MapPin, ChevronDown } from 'lucide-react-native'
import apiClient from '../api/client'

const { width } = Dimensions.get('window')
const CONTAINER_WIDTH = Math.min(428, width)

const COLORS = {
  primary: '#1A3C5E',
  accent: '#F59E0B',
  background: '#F5F7FA',
  white: '#FFFFFF',
  textDark: '#111827',
  textGray: '#6b7280',
  border: '#e5e7eb',
  badgeRed: '#dc2626',
}

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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.topBar}>
          <Text style={styles.logo}>YIWU EXPRESS 🚚</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn}>
              <Bell size={20} color={COLORS.textDark} />
              <View style={styles.notificationBadge}>
                <Text style={styles.badgeText}>5</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.locationRow}>
          <MapPin size={12} color={COLORS.textGray} />
          <Text style={styles.locationText}>Deliver to: San Francisco, USA</Text>
          <ChevronDown size={12} color={COLORS.textGray} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>Track Shipment</Text>
          <Text style={styles.pageSubtitle}>
            Enter your cargo tracking number for real-time milestones.
          </Text>

          <View style={styles.searchCard}>
            <View style={styles.searchRow}>
              <TextInput
                value={trackingNumber}
                onChangeText={setTrackingNumber}
                placeholder="e.g. YWE87349823CN"
                placeholderTextColor="#9ca3af"
                style={styles.searchInput}
              />
              <TouchableOpacity
                onPress={handleTrack}
                disabled={loading}
                style={[styles.trackBtn, loading && styles.trackBtnDisabled]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.trackBtnText}>Track</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.sampleLink} onPress={fillSample}>
              <Text style={styles.sampleText}>Use Sample Code (YWE87349823CN)</Text>
            </TouchableOpacity>
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          {result ? (
            <View style={styles.resultContainer}>
              {/* Summary Details */}
              <View style={styles.resultCard}>
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Tracking Code</Text>
                  <Text style={styles.metaVal}>{result.shipment?.trackingNumber}</Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Status</Text>
                  <Text style={[styles.metaVal, { color: COLORS.accent, fontWeight: 'bold' }]}>
                    {result.currentStatus}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Route</Text>
                  <Text style={styles.metaVal}>
                    {result.shipment?.origin} ➔ {result.shipment?.destination}
                  </Text>
                </View>

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Carrier</Text>
                  <Text style={styles.metaVal}>
                    {result.shipment?.carrier || 'YIWU EXPRESS'}
                  </Text>
                </View>

                {result.estimatedDelivery ? (
                  <View style={styles.metaRow}>
                    <Text style={styles.metaLabel}>Est. Delivery</Text>
                    <Text style={styles.metaVal}>
                      {new Date(result.estimatedDelivery).toLocaleDateString()}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Timeline */}
              <Text style={styles.timelineTitle}>Shipment Milestones</Text>

              <View style={styles.timelineCard}>
                {result.trackingEvents?.map((event: TrackingEvent, index: number) => (
                  <View key={event.status} style={styles.timelineEvent}>
                    <View style={styles.timelineIndicators}>
                      <View
                        style={[
                          styles.dot,
                          { backgroundColor: event.completed ? COLORS.primary : '#d1d5db' },
                        ]}
                      />
                      {index < result.trackingEvents.length - 1 ? (
                        <View style={styles.line} />
                      ) : null}
                    </View>
                    <View style={styles.timelineDetails}>
                      <Text style={styles.eventStatus}>
                        {event.status}
                      </Text>
                      <Text style={styles.eventDesc}>
                        {event.description}
                      </Text>
                      <Text style={styles.eventLoc}>
                        📍 {event.location} • {event.timestamp ? new Date(event.timestamp).toLocaleDateString() : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  content: {
    width: CONTAINER_WIDTH,
  },
  header: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 8,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.badgeRed,
    borderRadius: 8,
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: COLORS.textGray,
    fontSize: 14,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: COLORS.textGray,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    color: COLORS.textDark,
  },
  trackBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackBtnDisabled: {
    opacity: 0.7,
  },
  trackBtnText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sampleLink: {
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  sampleText: {
    color: COLORS.accent,
    fontSize: 12,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.badgeRed,
    textAlign: 'center',
    marginVertical: 12,
    fontWeight: 'bold',
    marginHorizontal: 16,
  },
  resultContainer: {
    marginTop: 8,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textGray,
  },
  metaVal: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  divider: {
    marginVertical: 10,
    backgroundColor: COLORS.border,
  },
  timelineTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  timelineCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
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
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  eventDesc: {
    fontSize: 13,
    color: COLORS.textGray,
    marginVertical: 4,
    lineHeight: 18,
  },
  eventLoc: {
    fontSize: 11,
    color: COLORS.textGray,
  },
})
