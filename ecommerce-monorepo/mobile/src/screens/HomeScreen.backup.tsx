import React, { useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Searchbar,
  Chip,
  ActivityIndicator,
  Badge,
  Avatar,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { 
  Bell, 
  MapPin, 
  Mic, 
  Camera, 
  TrendingUp, 
  Heart,
  Star,
  Grid3x3,
  List as ListIcon,
} from 'lucide-react-native'
import apiClient, { Service } from '../api/client'

const { width } = Dimensions.get('window')
const CARD_WIDTH = (width - 48) / 2 // 2 columns with padding

export default function HomeScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false)
  const [notificationCount] = useState(5)
  const [favorites, setFavorites] = useState<string[]>([])

  const categories = [
    { label: 'All', value: '', emoji: '📦' },
    { label: 'Shipping', value: 'shipping', emoji: '🚢' },
    { label: 'Customs', value: 'customs', emoji: '📋' },
    { label: 'Warehousing', value: 'warehousing', emoji: '🏭' },
    { label: 'Sourcing', value: 'sourcing', emoji: '🔍' },
  ]

  const recentSearches = ['Air Freight to USA', 'Sea Shipping', 'Customs Clearance']
  const trendingSearches = ['Express Delivery', 'Bulk Orders', 'Door to Door']

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

  const toggleFavorite = (serviceId: string) => {
    setFavorites(prev => 
      prev.includes(serviceId) 
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const renderServiceCard = ({ item }: { item: Service }) => {
    const isFavorite = favorites.includes(item?.id)
    
    if (viewMode === 'list') {
      return (
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item?.id } })}
          style={styles.listCard}
          activeOpacity={0.7}
        >
          <Card style={styles.listCardInner}>
            <Card.Content style={styles.listCardContent}>
              <View style={styles.listCardLeft}>
                <View style={styles.badgeRow}>
                  <Text variant="labelSmall" style={styles.typeBadge}>
                    {item?.type?.toUpperCase() || 'SERVICE'}
                  </Text>
                  <Text variant="labelSmall" style={styles.durationBadge}>
                    🕒 {item?.duration || 'N/A'}
                  </Text>
                </View>
                <Text variant="titleMedium" style={styles.listCardTitle} numberOfLines={1}>
                  {item?.name || 'Service Name'}
                </Text>
                <Text variant="bodySmall" style={styles.listCardDesc} numberOfLines={2}>
                  {item?.description || 'No description available'}
                </Text>
                <View style={styles.listPriceRow}>
                  <Text variant="titleMedium" style={styles.priceText}>
                    ${item?.price?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              </View>
              <View style={styles.listCardRight}>
                <TouchableOpacity
                  onPress={() => toggleFavorite(item?.id)}
                  style={styles.favoriteBtn}
                >
                  <Heart
                    size={18}
                    color={isFavorite ? '#ef4444' : '#9ca3af'}
                    fill={isFavorite ? '#ef4444' : 'transparent'}
                  />
                </TouchableOpacity>
                <Button
                  mode="contained"
                  compact
                  onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: item?.id } })}
                  buttonColor="#c9a84c"
                  textColor="white"
                  style={styles.listQuoteBtn}
                >
                  Quote
                </Button>
              </View>
            </Card.Content>
          </Card>
        </TouchableOpacity>
      )
    }

    // Grid view
    return (
      <TouchableOpacity
        onPress={() => router.push({ pathname: '/service-detail', params: { serviceId: item?.id } })}
        style={styles.gridCard}
        activeOpacity={0.7}
      >
        <Card style={styles.gridCardInner}>
          {/* Image placeholder with gradient */}
          <View style={styles.cardImageContainer}>
            <View style={styles.cardImagePlaceholder}>
              <Text style={styles.cardImageEmoji}>
                {item?.type === 'shipping' ? '🚢' : 
                 item?.type === 'customs' ? '📋' : 
                 item?.type === 'warehousing' ? '🏭' : 
                 item?.type === 'sourcing' ? '🔍' : '📦'}
              </Text>
            </View>
            {/* Favorite button */}
            <TouchableOpacity
              onPress={() => toggleFavorite(item?.id)}
              style={styles.gridFavoriteBtn}
            >
              <Heart
                size={14}
                color={isFavorite ? '#ef4444' : '#ffffff'}
                fill={isFavorite ? '#ef4444' : 'transparent'}
              />
            </TouchableOpacity>
            {/* Type badge */}
            <View style={styles.gridTypeBadge}>
              <Text style={styles.gridTypeBadgeText}>
                {item?.type?.toUpperCase() || 'SERVICE'}
              </Text>
            </View>
          </View>

          <Card.Content style={styles.gridCardContent}>
            {/* Rating placeholder */}
            <View style={styles.ratingRow}>
              <Star size={10} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>4.5</Text>
              <Text style={styles.reviewsText}>(128)</Text>
            </View>

            {/* Service name */}
            <Text style={styles.gridCardTitle} numberOfLines={2}>
              {item?.name || 'Service Name'}
            </Text>

            {/* Price and quote button */}
            <View style={styles.gridPriceRow}>
              <View>
                <Text style={styles.gridPriceText}>
                  ${item?.price?.toFixed(2) || '0.00'}
                </Text>
                <Text style={styles.durationSmall}>
                  🕒 {item?.duration || 'N/A'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push({ pathname: '/quote-request', params: { serviceId: item?.id } })}
                style={styles.gridQuoteBtn}
              >
                <Text style={styles.gridQuoteBtnText}>Quote</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>
      </TouchableOpacity>
    )
  }

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
      {/* Enhanced Header with Notifications and Avatar */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.brandRow}>
            {logoUrl ? (
              <Image
                source={{ uri: logoUrl.startsWith('/') ? `${apiClient.getBaseUrl()}${logoUrl}` : logoUrl }}
                style={styles.logoImage}
                resizeMode="contain"
              />
            ) : null}
            <Text variant="headlineMedium" style={logoUrl ? styles.brandTitleWithLogo : styles.brandTitle}>
              {companyName}
            </Text>
          </View>
          
          {/* Right side: Notifications + Avatar */}
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.notificationBtn}>
              <Bell size={20} color="#ffffff" />
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>{notificationCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <Avatar.Icon size={32} icon="account" style={styles.avatar} />
          </View>
        </View>

        {/* Location Selector */}
        <TouchableOpacity style={styles.locationRow}>
          <MapPin size={12} color="#e2e8f0" />
          <Text style={styles.locationText}>Ship from: Yiwu, China</Text>
        </TouchableOpacity>

        {/* Enhanced Search Bar */}
        <View style={styles.searchContainer}>
          <Searchbar
            placeholder="Search services, routes, tracking..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchBar}
            placeholderTextColor="#9ca3af"
            icon={() => null}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
          />
          <View style={styles.searchIcons}>
            <TouchableOpacity style={styles.searchIconBtn}>
              <Mic size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.searchIconBtn}>
              <Camera size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Suggestions */}
        {showSearchSuggestions && searchQuery === '' && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionSection}>
              <Text style={styles.suggestionTitle}>Recent Searches</Text>
              <View style={styles.suggestionChips}>
                {recentSearches.map((search, index) => (
                  <Chip
                    key={index}
                    onPress={() => setSearchQuery(search)}
                    style={styles.suggestionChip}
                    textStyle={styles.suggestionChipText}
                  >
                    {search}
                  </Chip>
                ))}
              </View>
            </View>
            <View style={styles.suggestionSection}>
              <View style={styles.trendingHeader}>
                <TrendingUp size={12} color="#6b7280" />
                <Text style={styles.suggestionTitle}>Trending</Text>
              </View>
              <View style={styles.suggestionChips}>
                {trendingSearches.map((search, index) => (
                  <Chip
                    key={index}
                    onPress={() => setSearchQuery(search)}
                    style={styles.trendingChip}
                    textStyle={styles.trendingChipText}
                  >
                    🔥 {search}
                  </Chip>
                ))}
              </View>
            </View>
          </View>
        )}
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

      {/* Categories Horizontal Chips with Emoji */}
      <View style={styles.chipsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.label}
              onPress={() => { setCategory(cat.value); setPage(1); }}
              style={[
                styles.categoryChip,
                category === cat.value && styles.categoryChipActive
              ]}
            >
              <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
              <Text style={[
                styles.categoryLabel,
                category === cat.value && styles.categoryLabelActive
              ]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Filter, Sort & View Toggle Bar */}
      <View style={styles.filterBar}>
        <Text style={styles.filterBarText}>Popular Services</Text>
        <View style={styles.viewToggle}>
          <TouchableOpacity
            onPress={() => setViewMode('grid')}
            style={[
              styles.viewToggleBtn,
              viewMode === 'grid' && styles.viewToggleBtnActive
            ]}
          >
            <Grid3x3 
              size={16} 
              color={viewMode === 'grid' ? '#ffffff' : '#6b7280'} 
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode('list')}
            style={[
              styles.viewToggleBtn,
              viewMode === 'list' && styles.viewToggleBtnActive
            ]}
          >
            <ListIcon 
              size={16} 
              color={viewMode === 'list' ? '#ffffff' : '#6b7280'} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Services Grid/List */}
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
          renderItem={renderServiceCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          numColumns={viewMode === 'grid' ? 2 : 1}
          key={viewMode} // Force re-render on view mode change
          columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
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
    backgroundColor: '#F5F7FA',
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    backgroundColor: '#1a3a5c',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#ffffff',
  },
  brandTitle: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 20,
  },
  brandTitleWithLogo: {
    fontWeight: 'bold',
    color: '#ffffff',
    fontSize: 20,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationBtn: {
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  avatar: {
    backgroundColor: '#c9a84c',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    color: '#e2e8f0',
    fontSize: 11,
  },
  searchContainer: {
    position: 'relative',
  },
  searchBar: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    elevation: 0,
  },
  searchIcons: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  searchIconBtn: {
    padding: 8,
    borderRadius: 20,
  },
  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionSection: {
    marginBottom: 12,
  },
  suggestionTitle: {
    fontSize: 11,
    color: '#6b7280',
    marginBottom: 8,
    fontWeight: '600',
  },
  trendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionChip: {
    backgroundColor: '#f3f4f6',
    height: 28,
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#374151',
  },
  trendingChip: {
    backgroundColor: '#FEF3C7',
    height: 28,
  },
  trendingChipText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    borderRadius: 12,
  },
  chipsContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  categoryChipActive: {
    backgroundColor: '#1a3a5c',
  },
  categoryEmoji: {
    fontSize: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  categoryLabelActive: {
    color: '#ffffff',
  },
  filterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterBarText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: 2,
    gap: 2,
  },
  viewToggleBtn: {
    padding: 6,
    borderRadius: 6,
  },
  viewToggleBtnActive: {
    backgroundColor: '#1a3a5c',
  },
  listContent: {
    padding: 16,
  },
  gridRow: {
    gap: 12,
  },
  
  // Grid Card Styles
  gridCard: {
    flex: 1,
    marginBottom: 12,
  },
  gridCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardImageContainer: {
    position: 'relative',
    aspectRatio: 3/4,
    backgroundColor: '#f3f4f6',
  },
  cardImagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  },
  cardImageEmoji: {
    fontSize: 48,
  },
  gridFavoriteBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  gridTypeBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: '#1a3a5c',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  gridTypeBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  gridCardContent: {
    padding: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
  reviewsText: {
    fontSize: 10,
    color: '#9ca3af',
  },
  gridCardTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
    lineHeight: 16,
    marginBottom: 8,
    height: 32,
  },
  gridPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  gridPriceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a3a5c',
  },
  durationSmall: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  gridQuoteBtn: {
    backgroundColor: '#1a3a5c',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  gridQuoteBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },

  // List Card Styles
  listCard: {
    marginBottom: 12,
  },
  listCardInner: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  listCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  listCardLeft: {
    flex: 1,
    paddingRight: 12,
  },
  listCardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  favoriteBtn: {
    padding: 8,
  },
  listQuoteBtn: {
    borderRadius: 12,
  },
  listCardTitle: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
    fontSize: 15,
  },
  listCardDesc: {
    color: '#6b7280',
    marginBottom: 8,
    fontSize: 12,
  },
  listPriceRow: {
    marginTop: 4,
  },

  // Old styles kept for compatibility
  cardWrapper: {
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
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