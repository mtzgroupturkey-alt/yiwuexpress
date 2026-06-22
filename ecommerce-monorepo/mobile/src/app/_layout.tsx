import React from 'react'
import { Stack } from 'expo-router'
import { Providers } from '../components/Providers'

export default function RootLayout() {
  return (
    <Providers>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a3a5c' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="login"
          options={{ title: 'Business Login' }}
        />
        <Stack.Screen
          name="register"
          options={{ title: 'Register Business' }}
        />
        <Stack.Screen
          name="service-detail"
          options={{ title: 'SERVICE DETAILS' }}
        />
        <Stack.Screen
          name="quote/new"
          options={{ title: 'Request Quote' }}
        />
      </Stack>
    </Providers>
  )
}
