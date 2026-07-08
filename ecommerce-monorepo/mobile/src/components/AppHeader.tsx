import React from 'react'
import { View, Text, StyleSheet, Image } from 'react-native'
import { Bell } from 'lucide-react-native'
import { useQuery } from '@tanstack/react-query'
import apiClient from '../api/client'
import { TouchableWithMinSize } from './ui/TouchableWithMinSize'

const COLORS = {
  primary: '#1A3C5E',
  textDark: '#111827',
  textGray: '#6b7280',
  white: '#FFFFFF',
  border: '#e5e7eb',
  badgeRed: '#dc2626',
  accent: '#F59E0B',
}

interface CompanySettings {
  companyName: string
  companyLogo: string | null
  companyAddress: string
  companyPhone: string
  companyEmail: string
  currency: string
  timezone: string
}

export default function AppHeader() {
  // Fetch company settings from database
  const { data: settingsData } = useQuery({
    queryKey: ['company-settings'],
    queryFn: async () => {
      try {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/settings/public`)
        const data = await response.json()
        return data.settings as CompanySettings
      } catch {
        return null
      }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  })

  const companyName = settingsData?.companyName || 'YIWU EXPRESS'
  const companyLogoPath = settingsData?.companyLogo || null

  // Only render non-SVG image logos (SVGs have CORS issues on web)
  const isSvg = companyLogoPath?.toLowerCase().endsWith('.svg') ?? false
  const logoUri =
    !isSvg && companyLogoPath
      ? companyLogoPath.startsWith('http')
        ? companyLogoPath
        : `${apiClient.getBaseUrl()}${companyLogoPath}`
      : null

  // First letter of company name for the logo circle
  const logoInitial = companyName.charAt(0).toUpperCase()

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {/* ── Left: Logo + Company Name ── */}
        <View style={styles.logoSection}>
          {logoUri ? (
            <Image
              source={{ uri: logoUri }}
              style={styles.logoImage}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>{logoInitial}</Text>
            </View>
          )}
          <Text style={styles.companyName} numberOfLines={1}>
            {companyName}
          </Text>
        </View>

        {/* ── Right: Bell + Avatar ── */}
        <View style={styles.actions}>
          <TouchableWithMinSize style={styles.bellBtn} accessibilityLabel="Notifications, 3 unread" accessibilityHint="Double tap to view notifications">
            <Bell size={22} color={COLORS.textDark} />
            <View style={styles.bellBadge}>
              <Text style={styles.bellBadgeText}>3</Text>
            </View>
          </TouchableWithMinSize>

          <View style={styles.avatar}>
            <Text style={styles.avatarInitial}>U</Text>
          </View>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  logoImage: {
    width: 34,
    height: 34,
    borderRadius: 6,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoInitial: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
    flexShrink: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bellBtn: {
    position: 'relative',
  },
  bellBadge: {
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
  bellBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
})
