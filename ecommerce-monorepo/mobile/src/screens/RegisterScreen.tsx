import React, { useState } from 'react'
import {
  View,
  StyleSheet,
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

export default function RegisterScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [businessType, setBusinessType] = useState('retailer')
  const [phone, setPhone] = useState('')
  const [taxId, setTaxId] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showError, setShowError] = useState(false)

  const validateForm = () => {
    if (!email.trim() || !name.trim() || !companyName.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields.')
      setShowError(true)
      return false
    }
    if (!email.includes('@')) {
      setError('Please enter a valid business email.')
      setShowError(true)
      return false
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      setShowError(true)
      return false
    }
    return true
  }

  const handleRegister = async () => {
    if (!validateForm()) return

    try {
      setLoading(true)
      setError('')
      setShowError(false)

      const response = await apiClient.register(
        email.trim(),
        password,
        name.trim(),
        companyName.trim(),
        businessType,
        phone.trim(),
        taxId.trim() || undefined
      )

      // Store token and reset navigation
      await AsyncStorage.setItem('token', response.token)
      router.replace('/')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.')
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
            <Text variant="headlineSmall" style={styles.title}>
              Register Business
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Create a free business account for global shipping rates
            </Text>

            <View style={styles.form}>
              <TextInput
                label="Business Email *"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <TextInput
                label="Contact Name *"
                value={name}
                onChangeText={setName}
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <TextInput
                label="Company Name *"
                value={companyName}
                onChangeText={setCompanyName}
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <TextInput
                label="Corporate Phone *"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <TextInput
                label="Tax ID / Registration Code"
                value={taxId}
                onChangeText={setTaxId}
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <TextInput
                label="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={styles.input}
              />

              <Button
                mode="contained"
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                style={styles.registerButton}
                buttonColor="#1a3a5c"
              >
                {loading ? 'Registering...' : 'Register Corporate Account'}
              </Button>

              <Button
                mode="text"
                onPress={() => router.push('/login')}
                style={styles.loginButton}
                textColor="#1a3a5c"
              >
                Already have an account? Sign In
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
    marginBottom: 4,
    color: '#1a3a5c',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
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
    marginBottom: 12,
    backgroundColor: 'white',
  },
  registerButton: {
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  loginButton: {
    marginTop: 8,
  },
  snackbar: {
    backgroundColor: '#ef4444',
  },
})
