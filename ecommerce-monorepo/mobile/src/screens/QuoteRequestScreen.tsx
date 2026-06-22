import React, { useState, useEffect } from 'react'
import {
  View,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import {
  Text,
  TextInput,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import apiClient from '../api/client'
import AsyncStorage from '@react-native-async-storage/async-storage'

export default function QuoteRequestScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  
  const { serviceId: paramServiceId } = useLocalSearchParams<{ serviceId?: string }>()

  const [token, setToken] = useState<string | null>(null)
  const [serviceId, setServiceId] = useState(paramServiceId || '')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [description, setDescription] = useState('')
  const [showError, setShowError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  useEffect(() => {
    AsyncStorage.getItem('token').then(t => setToken(t))
  }, [])

  // Fetch Services for Select Options
  const { data: servicesData, isLoading: servicesLoading } = useQuery({
    queryKey: ['services-select'],
    queryFn: () => apiClient.getServices(1, 100),
  })

  const services = servicesData?.services || []

  // Create Quote Mutation
  const createQuoteMutation = useMutation({
    mutationFn: (payload: any) =>
      apiClient.createQuote(
        payload.serviceId,
        payload.serviceType,
        payload.origin,
        payload.destination,
        payload.description,
        payload.weight ? parseFloat(payload.weight) : undefined,
        payload.dimensions,
        payload.specialRequirements
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      setShowSuccess(true)
      setTimeout(() => {
        router.push('/quotes')
      }, 1500)
    },
    onError: (err: any) => {
      setErrorMsg(err.response?.data?.error || 'Failed to submit quote request.')
      setShowError(true)
    },
  })

  const handleSubmit = () => {
    if (!token) {
      setErrorMsg('Please sign in to submit a quote request.')
      setShowError(true)
      return
    }

    if (!serviceId || !origin || !destination || !description) {
      setErrorMsg('Please fill in all required fields (*).')
      setShowError(true)
      return
    }

    const selectedService = services.find((s: any) => s.id === serviceId)
    const serviceType = selectedService?.type || 'SHIPPING'

    createQuoteMutation.mutate({
      serviceId,
      serviceType,
      origin,
      destination,
      description,
      weight,
      dimensions,
    })
  }

  if (servicesLoading) {
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
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text variant="headlineSmall" style={styles.title}>
            Get B2B Quote
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Describe your shipment metrics to receive commercial rates.
          </Text>

          <View style={styles.form}>
            {/* Service Selection */}
            <Text style={styles.label}>Select Service *</Text>
            <View style={styles.pickerContainer}>
              {services.map(s => (
                <Button
                  key={s.id}
                  mode={serviceId === s.id ? 'contained' : 'outlined'}
                  compact
                  onPress={() => setServiceId(s.id)}
                  style={styles.selectBtn}
                  buttonColor={serviceId === s.id ? '#1a3a5c' : undefined}
                  textColor={serviceId === s.id ? 'white' : '#1a3a5c'}
                >
                  {s.name}
                </Button>
              ))}
            </View>

            <TextInput
              label="Origin (City, Country) *"
              value={origin}
              onChangeText={setOrigin}
              mode="outlined"
              activeOutlineColor="#1a3a5c"
              style={styles.input}
            />

            <TextInput
              label="Destination (City, Country) *"
              value={destination}
              onChangeText={setDestination}
              mode="outlined"
              activeOutlineColor="#1a3a5c"
              style={styles.input}
            />

            <View style={styles.row}>
              <TextInput
                label="Weight (kg)"
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={[styles.input, { flex: 1, marginRight: 8 }]}
              />

              <TextInput
                label="Dimensions (L x W x H)"
                value={dimensions}
                onChangeText={setDimensions}
                placeholder="100x80x50 cm"
                mode="outlined"
                activeOutlineColor="#1a3a5c"
                style={[styles.input, { flex: 1 }]}
              />
            </View>

            <TextInput
              label="Cargo Description *"
              value={description}
              onChangeText={setDescription}
              placeholder="e.g. wholesale kitchen utensils samples"
              mode="outlined"
              activeOutlineColor="#1a3a5c"
              multiline
              numberOfLines={4}
              style={styles.input}
            />

            {!token && (
              <Button
                mode="contained"
                onPress={() => router.push('/login')}
                style={styles.loginBtn}
                buttonColor="#c9a84c"
              >
                Log In to Request Quote
              </Button>
            )}

            {token && (
              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={createQuoteMutation.isPending}
                disabled={createQuoteMutation.isPending}
                style={styles.submitBtn}
                buttonColor="#1a3a5c"
              >
                {createQuoteMutation.isPending ? 'Submitting...' : 'Submit Request'}
              </Button>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Snackbar
        visible={showError}
        onDismiss={() => setShowError(false)}
        duration={3000}
        style={styles.errorSnackbar}
      >
        {errorMsg}
      </Snackbar>

      <Snackbar
        visible={showSuccess}
        onDismiss={() => setShowSuccess(false)}
        duration={2000}
        style={styles.successSnackbar}
      >
        Quote request submitted successfully!
      </Snackbar>
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
    padding: 24,
  },
  title: {
    fontWeight: 'bold',
    color: '#1a3a5c',
    marginBottom: 4,
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: 24,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  selectBtn: {
    borderRadius: 8,
    marginBottom: 4,
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  loginBtn: {
    borderRadius: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  submitBtn: {
    borderRadius: 8,
    paddingVertical: 4,
    marginTop: 8,
  },
  errorSnackbar: {
    backgroundColor: '#ef4444',
  },
  successSnackbar: {
    backgroundColor: '#10b981',
  },
})
