import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native'
import {
  Text,
  Divider,
  Snackbar,
  Portal,
  Dialog,
  Button,
} from 'react-native-paper'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Bell, MapPin, ChevronDown, Phone, MapPin as PinIcon, Briefcase, FileText, LogOut } from 'lucide-react-native'
import apiClient from '../api/client'
import AppHeader from '../components/AppHeader'

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

  // Fetch User Profile
  const {
    data: userProfileData,
    isLoading: userProfileLoading,
  } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiClient.getUserProfile(),
    retry: false,
    enabled: tokenChecked && !!token,
  })

  const user = userProfileData?.user

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      setLogoutDialogVisible(true)
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout from YIWU EXPRESS?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performLogout },
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

  if (userProfileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.pageTitle}>My Profile</Text>

          {/* Profile Card */}
          <View style={styles.profileCard}>
            <View style={styles.profileContent}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {(user?.name || 'User').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileName}>
                  {user?.name || 'User Account'}
                </Text>
                <Text style={styles.profileEmail}>
                  {user?.email || 'user@shophub.com'}
                </Text>
                <Text style={styles.companyName}>
                  {user?.companyName || 'Personal Buyer'}
                </Text>
              </View>
            </View>
          </View>

          {/* Details Card */}
          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Account Details</Text>
            
            <View style={styles.detailItem}>
              <Phone size={18} color={COLORS.textGray} style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Phone Number</Text>
                <Text style={styles.detailValue}>{user?.phone || 'Not specified'}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <PinIcon size={18} color={COLORS.textGray} style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Default Country</Text>
                <Text style={styles.detailValue}>{user?.country || 'Not specified'}</Text>
              </View>
            </View>
            <Divider style={styles.divider} />

            <View style={styles.detailItem}>
              <Briefcase size={18} color={COLORS.textGray} style={styles.detailIcon} />
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Business / Account Type</Text>
                <Text style={styles.detailValue}>{user?.businessType || 'Retail Buyer'}</Text>
              </View>
            </View>
            {user?.taxId && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.detailItem}>
                  <FileText size={18} color={COLORS.textGray} style={styles.detailIcon} />
                  <View style={styles.detailTextContainer}>
                    <Text style={styles.detailLabel}>Tax identification number</Text>
                    <Text style={styles.detailValue}>{user.taxId}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <LogOut size={16} color={COLORS.badgeRed} />
            <Text style={styles.logoutButtonText}>Log Out from Account</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>
            YIWU EXPRESS Mobile Application v1.0.0
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

      <Portal>
        <Dialog
          visible={logoutDialogVisible}
          onDismiss={() => setLogoutDialogVisible(false)}
          style={styles.dialog}
        >
          <Dialog.Title style={styles.dialogTitle}>Logout</Dialog.Title>
          <Dialog.Content>
            <Text style={styles.dialogBody}>
              Are you sure you want to logout from YIWU EXPRESS?
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLogoutDialogVisible(false)} textColor={COLORS.textGray}>
              Cancel
            </Button>
            <Button
              onPress={performLogout}
              textColor={COLORS.badgeRed}
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
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 12,
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
    marginBottom: 12,
  },
  profileCard: {
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
  profileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarLargeText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
  },
  detailsCard: {
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailIcon: {
    marginRight: 14,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: COLORS.textGray,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 8,
    backgroundColor: COLORS.border,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 24,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.badgeRed,
    backgroundColor: COLORS.white,
  },
  logoutButtonText: {
    color: COLORS.badgeRed,
    fontSize: 14,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    color: COLORS.textGray,
    fontSize: 12,
    marginBottom: 16,
  },
  snackbar: {
    backgroundColor: COLORS.badgeRed,
  },
  dialog: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
  },
  dialogTitle: {
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  dialogBody: {
    color: COLORS.textGray,
    fontSize: 14,
  },
})