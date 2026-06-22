import React from 'react'
import { Tabs } from 'expo-router'
import { Home, Package, Map, FileText, User } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#c9a84c',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#1a3a5c',
          borderTopColor: '#2d5080',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 6,
          height: 62,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: '#1a3a5c' },
        headerTintColor: '#ffffff',
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Map color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="quotes"
        options={{
          title: 'Quotes',
          tabBarIcon: ({ color, size }) => <FileText color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
