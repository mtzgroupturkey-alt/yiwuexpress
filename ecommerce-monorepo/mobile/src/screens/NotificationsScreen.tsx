import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native'
import {
  Text,
  Card,
  Chip,
  ActivityIndicator,
  SegmentedButtons,
  IconButton,
  Menu,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'

interface Notification {
  id: string
  type: 'order' | 'shipment' | 'promotion' | 'system'
  title: string
  message: string
  createdAt: string
  read: boolean
  actionUrl?: string
}

const notificationIcons: Record<Notification['type'], string> = {
  order: '📦',
  shipment: '🚚',
  promotion: '🎁',
  system: '⚙️',
}

const notificationColors: Record<Notification['type'], string> = {
  order: '#3b82f6',
  shipment: '#8b5cf6',
  promotion: '#f59e0b',
  system: '#6b7280',
}

export default function NotificationsScreen() {
  const router = useRouter()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [refreshing, setRefreshing] = useState(false)
  const [menuVisible, setMenuVisible] = useState(false)

  const {
    data: notificationsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      // Mock notifications data - replace with actual API call
      const mockNotifications: Notification[] = [
        {
          id: '1',
          type: 'order',
          title: 'Order Confirmed',
          message: 'Your order #ORD-2026-001 has been confirmed and is being processed.',
          createdAt: '2026-06-24T10:00:00Z',
          read: false,
          actionUrl: '/order-detail?orderId=1',
        },
        {
          id: '2',
          type: 'shipment',
          title: 'Package Shipped',
          message: 'Your package has been shipped. Tracking: YW123456789CN',
          createdAt: '2026-06-23T14:30:00Z',
          read: false,
          actionUrl: '/track?trackingNumber=YW123456789CN',
        },
        {
          id: '3',
          type: 'promotion',
          title: '20% Off Summer Sale',
          message: 'Limited time offer! Get 20% off on all summer products.',
          createdAt: '2026-06-22T09:00:00Z',
          read: true,
        },
        {
          id: '4',
          type: 'order',
          title: 'Order Delivered',
          message: 'Your order #ORD-2026-002 has been delivered successfully.',
          createdAt: '2026-06-21T16:45:00Z',
          read: true,
          actionUrl: '/order-detail?orderId=2',
        },
        {
          id: '5',
          type: 'system',
          title: 'Account Security Update',
          message: 'We have updated our security policies. Please review.',
          createdAt: '2026-06-20T08:00:00Z',
          read: true,
        },
      ]

      return {
        notifications: mockNotifications.filter(
          (notif) => filter === 'all' || !notif.read
        ),
      }
    },
  })

  const onRefresh = async () => {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const handleNotificationPress = (notification: Notification) => {
    // Mark as read
    // Implement mark as read API call
    
    if (notification.actionUrl) {
      // Navigate to the action URL
      const [path, query] = notification.actionUrl.split('?')
      const params: any = {}
      if (query) {
        query.split('&').forEach((param) => {
          const [key, value] = param.split('=')
          params[key] = value
        })
      }
      router.push({ pathname: path, params })
    }
  }

  const handleMarkAllRead = () => {
    // Implement mark all as read API call
    setMenuVisible(false)
    refetch()
  }

  const handleClearAll = () => {
    // Implement clear all notifications API call
    setMenuVisible(false)
    refetch()
  }

  const notifications = notificationsData?.notifications || []
  const unreadCount = notifications.filter((n) => !n.read).length

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'Just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      style={styles.cardWrapper}
    >
      <Card style={[styles.card, !item.read && styles.unreadCard]}>
        <Card.Content>
          <View style={styles.notificationHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: notificationColors[item.type] + '20' },
                ]}
              >
                <Text style={styles.icon}>{notificationIcons[item.type]}</Text>
              </View>
              <View style={styles.headerText}>
                <Text variant="titleSmall" style={styles.notificationTitle}>
                  {item.title}
                </Text>
                <Text variant="bodySmall" style={styles.timeAgo}>
                  {getTimeAgo(item.createdAt)}
                </Text>
              </View>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text variant="bodyMedium" style={styles.notificationMessage}>
            {item.message}
          </Text>
          {item.type === 'promotion' && (
            <Chip
              style={styles.promotionChip}
              textStyle={styles.promotionChipText}
            >
              Special Offer
            </Chip>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={styles.title}>
            Notifications
          </Text>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item onPress={handleMarkAllRead} title="Mark all as read" />
            <Menu.Item onPress={handleClearAll} title="Clear all" />
          </Menu>
        </View>

        {unreadCount > 0 && (
          <Text variant="bodyMedium" style={styles.unreadCount}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        )}

        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as typeof filter)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'unread', label: 'Unread' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text variant="titleMedium" style={styles.emptyText}>
                {filter === 'unread'
                  ? 'No unread notifications'
                  : 'No notifications yet'}
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtext}>
                {filter === 'unread'
                  ? 'You are all caught up!'
                  : 'Notifications will appear here'}
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
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  unreadCount: {
    color: '#0ea5e9',
    fontWeight: '600',
    marginBottom: 12,
  },
  segmentedButtons: {
    marginBottom: 8,
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
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#0ea5e9',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 2,
  },
  timeAgo: {
    color: '#9ca3af',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0ea5e9',
    marginTop: 6,
  },
  notificationMessage: {
    color: '#4b5563',
    lineHeight: 20,
  },
  promotionChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#fef3c7',
  },
  promotionChipText: {
    color: '#92400e',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.3,
  },
  emptyText: {
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    color: '#9ca3af',
  },
})
