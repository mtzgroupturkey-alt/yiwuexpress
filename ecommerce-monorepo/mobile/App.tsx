import React, { useState, useEffect } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createStackNavigator } from '@react-navigation/stack'
import { Providers } from './src/components/Providers'
import HomeScreen from './src/screens/HomeScreen'
import ServiceDetailScreen from './src/screens/ServiceDetailScreen'
import QuoteRequestScreen from './src/screens/QuoteRequestScreen'
import ShipmentTrackingScreen from './src/screens/ShipmentTrackingScreen'
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'
import ProfileScreen from './src/screens/ProfileScreen'
import ServicesScreen from './src/screens/ServicesScreen'
import QuotesScreen from './src/screens/QuotesScreen'
import OnboardingScreen from './src/screens/OnboardingScreen'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Home, Package, Map, FileText, User } from 'lucide-react-native'
import { Text, ActivityIndicator, View } from 'react-native-paper'

const Tab = createBottomTabNavigator()
const Stack = createStackNavigator()

function HomeStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="HomeMain" 
        component={HomeScreen} 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="ServiceDetail" 
        component={ServiceDetailScreen}
        options={{ title: 'Service Details' }}
      />
      <Stack.Screen 
        name="QuoteRequest" 
        component={QuoteRequestScreen}
        options={{ title: 'Request Quote' }}
      />
      <Stack.Screen 
        name="ShipmentTracking" 
        component={ShipmentTrackingScreen}
        options={{ title: 'Track Shipment' }}
      />
    </Stack.Navigator>
  )
}

function ServicesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="ServicesMain" 
        component={ServicesScreen} 
        options={{ title: 'Our Services' }}
      />
      <Stack.Screen 
        name="ServiceDetail" 
        component={ServiceDetailScreen}
        options={{ title: 'Service Details' }}
      />
    </Stack.Navigator>
  )
}

function QuotesStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen 
        name="QuotesMain" 
        component={QuotesScreen} 
        options={{ title: 'My Quotes' }}
      />
      <Stack.Screen 
        name="QuoteRequest" 
        component={QuoteRequestScreen}
        options={{ title: 'Request Quote' }}
      />
    </Stack.Navigator>
  )
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          if (route.name === 'Home') {
            return <Home color={color} size={size} />
          } else if (route.name === 'Services') {
            return <Package color={color} size={size} />
          } else if (route.name === 'Track') {
            return <Map color={color} size={size} />
          } else if (route.name === 'Quotes') {
            return <FileText color={color} size={size} />
          } else if (route.name === 'Profile') {
            return <User color={color} size={size} />
          }
          return null
        },
        tabBarActiveTintColor: '#1a3a5c',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
        },
        headerStyle: {
          backgroundColor: '#1a3a5c',
        },
        headerTintColor: 'white',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Home'
        }}
      />
      <Tab.Screen 
        name="Services" 
        component={ServicesStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Services'
        }}
      />
      <Tab.Screen 
        name="Track" 
        component={ShipmentTrackingScreen}
        options={{ 
          title: 'Track Shipment',
          tabBarLabel: 'Track'
        }}
      />
      <Tab.Screen 
        name="Quotes" 
        component={QuotesStack}
        options={{ 
          headerShown: false,
          tabBarLabel: 'Quotes'
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen}
        options={{ 
          title: 'Business Profile',
          tabBarLabel: 'Profile'
        }}
      />
    </Tab.Navigator>
  )
}

export default function App() {
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null)

  useEffect(() => {
    const checkOnboarding = async () => {
      const value = await AsyncStorage.getItem('onboarding_complete')
      setIsFirstLaunch(value === null)
    }
    checkOnboarding()
  }, [])

  if (isFirstLaunch === null) {
    return (
      <Providers>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
          <ActivityIndicator size="large" color="#1a3a5c" />
        </View>
      </Providers>
    )
  }

  return (
    <Providers>
      <NavigationContainer>
        <Stack.Navigator>
          {isFirstLaunch && (
            <Stack.Screen 
              name="Onboarding" 
              component={OnboardingScreen}
              options={{ headerShown: false }}
            />
          )}
          <Stack.Screen 
            name="Main" 
            component={MainTabs} 
            options={{ headerShown: false }}
          />
          <Stack.Screen 
            name="Login" 
            component={LoginScreen}
            options={{ 
              title: 'Business Login',
              headerStyle: {
                backgroundColor: '#1a3a5c',
              },
              headerTintColor: 'white',
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{ 
              title: 'Register Business',
              headerStyle: {
                backgroundColor: '#1a3a5c',
              },
              headerTintColor: 'white',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </Providers>
  )
}