import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Tabs } from 'expo-router'
import {
  Home,
  FolderOpen,
  ShoppingCart,
  Package,
  User,
  Scan,
} from 'lucide-react-native'
import { useRouter } from 'expo-router'

import AsyncStorage from '@react-native-async-storage/async-storage'
import apiClient from '../../api/client'

import { useQuery } from '@tanstack/react-query'

// ─── Floating Action Button (Track via Scan) ────────────────────────────────
function FloatingTrackButton() {
  const router = useRouter()

  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/track')}
      activeOpacity={0.8}
      accessibilityLabel="Scan / Track Shipment"
    >
      <Scan size={24} color="#ffffff" />
    </TouchableOpacity>
  )
}

// ─── Cart Badge Icon ─────────────────────────────────────────────────────────
function CartIconWithBadge({ color, size, count }: { color: string; size: number; count: number }) {
  return (
    <View>
      <ShoppingCart color={color} size={size} />
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
        </View>
      )}
    </View>
  )
}

// ─── Tab Layout ──────────────────────────────────────────────────────────────
export default function TabLayout() {
  // Fetch cart count using react-query for auto-sync across screens
  const { data: cartData } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) return null

        // Fetch user profile to get userId
        const userRes = await fetch(`${apiClient.getBaseUrl()}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        const userData = await userRes.json()
        const userId = userData?.user?.id
        if (!userId) return null

        // Fetch cart items
        const res = await fetch(`${apiClient.getBaseUrl()}/api/cart?userId=${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        return data.data
      } catch {
        return null
      }
    },
    refetchInterval: 5000, // Poll every 5 seconds as fallback
  })

  const cartCount = cartData?.cart?.items?.length || 0

  return (
    <>
      <Tabs
        screenOptions={{
          // ── Active / Inactive Colors (Figma: #1A3C5E / #9ca3af) ──────────
          tabBarActiveTintColor: '#1A3C5E',
          tabBarInactiveTintColor: '#9ca3af',

          // ── Tab Bar Style (Figma: white bg, gray border-top) ──────────────
          tabBarStyle: {
            backgroundColor: '#ffffff',
            borderTopColor: '#e5e7eb',
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 64,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 8,
          },

          // ── Label Style ───────────────────────────────────────────────────
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '600',
          },

          // ── Header Style ──────────────────────────────────────────────────
          headerStyle: { 
            backgroundColor: '#ffffff',
          },
          headerShadowVisible: true,
          headerTintColor: '#1A3C5E',
          headerTitleStyle: { fontWeight: '700' },
        }}
      >
        {/* ── Tab 1: Home ──────────────────────────────────────────────── */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
          }}
        />

        {/* ── Tab 2: Categories (maps to /products route) ───────────────── */}
        <Tabs.Screen
          name="products"
          options={{
            title: 'Categories',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <FolderOpen color={color} size={size} />
            ),
          }}
        />

        {/* ── Tab 3: Cart (maps to /services route, with red badge) ─────── */}
        <Tabs.Screen
          name="services"
          options={{
            title: 'Cart',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <CartIconWithBadge color={color} size={size} count={cartCount} />
            ),
          }}
        />

        {/* ── Tab 4: Orders ─────────────────────────────────────────────── */}
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <Package color={color} size={size} />
            ),
          }}
        />

        {/* ── Tab 5: Profile ────────────────────────────────────────────── */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            headerShown: false,
            tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
          }}
        />

        {/* ── Hidden Routes (still need to be declared) ─────────────────── */}
        <Tabs.Screen
          name="track"
          options={{
            href: null, // Hidden — accessible via FAB
          }}
        />
        <Tabs.Screen
          name="quotes"
          options={{
            href: null, // Hidden — accessible via services or profile
          }}
        />
      </Tabs>

      {/* ── Floating Action Button (Barcode Scanner / Track) ─────────────── */}
      <FloatingTrackButton />
    </>
  )
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB: Figma uses amber #F59E0B
  fab: {
    position: 'absolute',
    bottom: 80,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // Cart badge
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: '#dc2626',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 12,
  },
})
