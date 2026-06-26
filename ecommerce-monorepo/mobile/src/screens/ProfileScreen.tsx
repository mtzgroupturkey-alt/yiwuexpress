import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native'
import {
  Text,
  Card,
  Button,
  Avatar,
  List,
  Divider,
  ActivityIndicator,
  Snackbar,
  Portal,
  Dialog,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient from '../api/client'

export default function ProfileScreen() {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [tokenChecked, setTokenChecked] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => {
      setToken(t)
      setTokenChecked(true)
    })
  }, [])

  const [snackbarVisible, setSnackbarVisible] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutDialogVisible, setLogoutDialogVisible] = useState(false)

  // Fetch Quotes — only when logged in
  const {
    data: quotesData,
    isLoading: quotesLoading,
    error: quotesError,
  } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => apiClient.getQuotes(),
    enabled: tokenChecked && !!token,
  })

  // Fetch User Profile — only when logged in
  const {
    data: userProfileData,
    isLoading: userProfileLoading,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getUserProfile(),
    retry: false,
    enabled: tokenChecked && !!token,
  })

  // Fetch Company Info — only when logged in
  const {
    data: companyData,
    isLoading: companyLoading,
  } = useQuery({
    queryKey: ['company-info'],
    queryFn: () => apiClient.getCompanyInfo(),
    retry: false,
    enabled: tokenChecked && !!token,
  })

  const quotes = quotesData?.quotes || []
  const user = userProfileData?.user
  const company = companyData?.company

  const handleLogout = async () => {
    // Use native dialog for web, Alert for mobile
    if (Platform.OS === 'web') {
      setLogoutDialogVisible(true)
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout from YIWU EXPRESS?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: performLogout,
          },
        ],
        { cancelable: true }
      )
    }
  }

  const performLogout = async () => {
    try {
      setIsLoggingOut(true)
      setLogoutDialogVisible(false)
      await AsyncStorage.removeItem('token')
      setToken(null)
      router.replace('/login')
    } catch (err) {
      setSnackbarMessage('Logout failed. Please try again.')
      setSnackbarVisible(true)
    } finally {
      setIsLoggingOut(false)
    }
  }

  const renderQuoteItem = (quote: any) => (
    <List.Item
      title={`${quote.service?.name || 'Logistics Service'}`}
      description={`${quote.origin} ➔ ${quote.destination} • ${quote.status}`}
      left={props => (
        <List.Icon {...props} icon="file-document-outline" color="#1a3a5c" />
      )}
      right={props => (
        <Text style={styles.quotePrice}>
          {quote.price ? `$${quote.price}` : 'Under Review'}
        </Text>
      )}
      onPress={() => router.push('/quotes')}
    />
  )

  if (quotesLoading || companyLoading || userProfileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Profile Header */}
          <Card style={styles.profileCard}>
            <Card.Content style={styles.profileContent}>
              <Avatar.Text
                size={64}
                label={(user?.name || user?.companyName || 'User').substring(0, 2).toUpperCase()}
                style={styles.avatar}
                labelStyle={styles.avatarLabel}
              />
              <View style={styles.profileInfo}>
                <Text variant="headlineSmall" style={styles.profileName}>
                  {user?.name || 'User Name'}
                </Text>
                <Text variant="bodyMedium" style={styles.profileEmail}>
                  {user?.email || 'user@example.com'}
                </Text>
                <Text variant="bodySmall" style={styles.companyName}>
                  {user?.companyName || 'Company Name'}
                </Text>
                {user?.businessType && (
                  <Text variant="bodySmall" style={styles.businessType}>
                    {user.businessType}
                  </Text>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* User Details */}
          {user && (
            <Card style={styles.detailsCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.sectionTitle}>
                  Personal Information
                </Text>
                <List.Item
                  title="Phone"
                  description={user.phone || 'N/A'}
                  left={props => <List.Icon {...props} icon="phone" />}
                />
                <Divider />
                <List.Item
                  title="Country"
                  description={user.country || 'N/A'}
                  left={props => <List.Icon {...props} icon="map-marker" />}
                />
                <Divider />
                <List.Item
                  title="Business Type"
                  description={user.businessType || 'N/A'}
                  left={props => <List.Icon {...props} icon="briefcase" />}
                />
                {user.taxId && (
                  <>
                    <Divider />
                    <List.Item
                      title="Tax ID"
                      description={user.taxId}
                      left={props => <List.Icon {...props} icon="file-document" />}
                    />
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Recent Quotes */}
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Quotations
          </Text>

          {quotesError ? (
            <Card style={styles.errorCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.errorText}>
                  Error loading quotes
                </Text>
              </Card.Content>
            </Card>
          ) : quotes.length === 0 ? (
            <Card style={styles.emptyCard}>
              <Card.Content>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No quotation requests submitted yet
                </Text>
                <Button
                  mode="contained"
                  onPress={() => router.push('/')}
                  style={styles.quoteButton}
                  buttonColor="#1a3a5c"
                >
                  Request Quote
                </Button>
              </Card.Content>
            </Card>
          ) : (
            <Card style={styles.quotesCard}>
              {quotes.slice(0, 3).map((quote, index) => (
                <React.Fragment key={quote.id}>
                  {renderQuoteItem(quote)}
                  {index < quotes.slice(0, 3).length - 1 && <Divider />}
                </React.Fragment>
              ))}
              {quotes.length > 3 && (
                <>
                  <Divider />
                  <List.Item
                    title="View All Quotes"
                    left={props => <List.Icon {...props} icon="arrow-right" />}
                    onPress={() => router.push('/quotes')}
                  />
                </>
              )}
            </Card>
          )}

          {/* Logout Button */}
          <Button
            mode="outlined"
            onPress={handleLogout}
            loading={isLoggingOut}
            disabled={isLoggingOut}
            style={styles.logoutButton}
            textColor="#ef4444"
          >
            {isLoggingOut ? 'Logging Out...' : 'Logout'}
          </Button>

          {/* App Info */}
          <Text variant="bodySmall" style={styles.versionText}>
            YIWU EXPRESS Logistics Portal v1.0.0
          </Text>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMessage}
      </Snackbar>

      {/* Logout Confirmation Dialog for Web */}
      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
        >
          <Dialog.Title>Logout</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to logout from YIWU EXPRESS?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)}>
              Cancel
            </Button>
            <Button
              onPress={performLogout}
              textColor="#ef4444"
              loading={isLoggingOut}
              disabled={isLoggingOut}
            >
              Logout
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  scrollContent: {
    paddingBottom: 24,
  },
  content: {
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#1a3a5c',
    marginRight: 16,
  },
  avatarLabel: {
    fontSize: 20,
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontWeight: 'bold',
    color: '#1a3a5c',
  },
  profileEmail: {
    color: '#6b7280',
  },
  companyName: {
    color: '#1a3a5c',
    fontWeight: '600',
    marginTop: 2,
  },
  businessType: {
    color: '#c9a84c',
    fontSize: 12,
    marginTop: 2,
  },
  taxId: {
    color: '#9ca3af',
    marginTop: 2,
  },
  detailsCard: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 12,
    color: '#1a3a5c',
  },
  quotesCard: {
    marginBottom: 24,
    backgroundColor: 'white',
  },
  quotePrice: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    alignSelf: 'center',
  },
  errorCard: {
    marginBottom: 16,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
  },
  emptyCard: {
    marginBottom: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: 16,
    color: '#6b7280',
  },
  quoteButton: {
    borderRadius: 8,
  },
  logoutButton: {
    marginVertical: 16,
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 8,
  },
  versionText: {
    textAlign: 'center',
    color: '#9ca3af',
  },
  snackbar: {
    backgroundColor: '#059669',
  },
})