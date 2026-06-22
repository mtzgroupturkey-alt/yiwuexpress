import React, { useState } from 'react'
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  Snackbar,
} from 'react-native-paper'
import { useRouter } from 'expo-router'
import apiClient from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function LoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)

  const validateForm = () => {
    if (!email.trim()) {
      setError('Corporate email is required')
      setShowError(true)
      return false
    }
    if (!password) {
      setError('Password is required')
      setShowError(true)
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid business email')
      setShowError(true)
      return false
    }
    return true
  }

  const handleLogin = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError('')
      setShowError(false)

      const response = await apiClient.login(email, password)
      
      // Save token to AsyncStorage
      await AsyncStorage.setItem('token', response.token)
      
      // Navigate back to home
      if (router.canGoBack()) {
        router.back()
      } else {
        router.replace('/')
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed. Please try again.')
      setShowError(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>
            <Text variant="headlineMedium" style={styles.title}>
              YIWU EXPRESS 🚚
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to manage your B2B logistics & sourcing orders
            </Text>

            <View style={styles.form}>
              <TextInput
                label="Business Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
                error={!!error && showError}
              />

              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
                error={!!error && showError}
              />

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.loginButton}
                buttonColor="#1a3a5c"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <Button
                mode="outlined"
                onPress={() => router.push('/register')}
                style={styles.registerButton}
                textColor="#1a3a5c"
                style={{ borderColor: '#1a3a5c' }}
              >
                Register Business Account
              </Button>

              <Button
                mode="text"
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back()
                  } else {
                    router.replace('/')
                  }
                }}
                style={styles.backButton}
                textColor="#6b7280"
              >
                Back to Home
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={3000}
        style={styles.snackbar}
      >
        {error}
      </Snackbar>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a3a5c',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    color: '#6b7280',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  loginButton: {
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 4,
    borderRadius: 8,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e5e5e5',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6b7280',
  },
  registerButton: {
    marginBottom: 16,
    borderRadius: 8,
  },
  backButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#ef4444',
  },
})