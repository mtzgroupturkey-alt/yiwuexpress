import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import { API_CONFIG, getApiUrl } from '../config/api.config'

const API_URL = getApiUrl()

console.log('🔧 Mobile API Config: Using port', API_CONFIG.BACKEND_PORT)
console.log('📡 API URL:', API_URL)

const client = axios.create({
  baseURL: API_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
client.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      console.log('🔐 API Request with token to:', config.url)
      console.log('🔑 Token (first 20 chars):', token.substring(0, 20) + '...')
    } else {
      console.log('⚠️ API Request without token to:', config.url)
    }
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Add response interceptor to log errors and handle auth issues
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('🚫 401 Unauthorized - Token may be invalid or expired')
      console.error('Response:', error.response?.data)
      
      // Clear the invalid token
      await AsyncStorage.removeItem('token')
      console.log('🗑️ Cleared invalid token from storage')
    }
    return Promise.reject(error)
  }
)

export interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: string | null
  coverage: string | null
  type: string // shipping/customs/warehousing/sourcing
  thumbnail: string | null
  createdAt: string
  updatedAt: string
}

export interface Quote {
  id: string
  userId: string
  serviceId: string
  weight: number | null
  dimensions: string | null
  origin: string | null
  destination: string | null
  price: number
  validUntil: string
  status: string
  createdAt: string
  updatedAt: string
  service: Service
}

export interface Shipment {
  id: string
  trackingNumber: string
  userId: string
  serviceId: string
  origin: string
  destination: string
  status: string
  estimatedDelivery: string
  actualDelivery: string | null
  createdAt: string
  updatedAt: string
  service: Service
}

export interface TrackingEvent {
  status: string
  description: string
  location: string
  timestamp: string
  completed: boolean
}

export interface User {
  id: string
  email: string
  name: string | null
  companyName: string | null
  businessType: string | null
  role: string
}

export interface AuthResponse {
  user: User
  token: string
  message: string
}

export interface CompanyInfo {
  id: string
  userId: string
  name: string
  address: string
  phone: string
  email: string
  licenseNumber: string | null
  taxId: string | null
  createdAt: string
  updatedAt: string
}

class ApiClient {
  // Auth
  async register(
    email: string, 
    password: string, 
    name: string, 
    companyName: string,
    businessType: string,
    phone: string,
    taxId?: string
  ): Promise<AuthResponse> {
    const response = await client.post('/auth/register', { 
      email, 
      password, 
      name, 
      companyName, 
      businessType,
      phone,
      taxId 
    })
    return response.data
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await client.post('/auth/login', { email, password })
    return response.data
  }

  // Services
  async getServices(page = 1, limit = 10, type?: string, search?: string) {
    const params = new URLSearchParams()
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    if (type) params.append('type', type)
    if (search) params.append('search', search)
    
    const response = await client.get(`/services?${params}`)
    return response.data
  }

  async getService(id: string) {
    const response = await client.get(`/services/${id}`)
    return response.data
  }

  // Quotes
  async getQuotes(): Promise<{ quotes: Quote[] }> {
    const response = await client.get('/quotes')
    return response.data
  }

  async createQuote(
    serviceId: string,
    serviceType: string,
    origin: string,
    destination: string,
    description: string,
    weight?: number,
    dimensions?: string,
    specialRequirements?: string
  ) {
    const response = await client.post('/quotes', { 
      serviceId,
      serviceType,
      origin,
      destination,
      description,
      weight,
      dimensions,
      specialRequirements
    })
    return response.data
  }

  // Shipments
  async getShipments(): Promise<{ shipments: Shipment[] }> {
    const response = await client.get('/shipments')
    return response.data
  }

  async trackShipment(trackingNumber: string): Promise<{
    shipment: Shipment
    trackingEvents: TrackingEvent[]
    estimatedDelivery: string
    currentStatus: string
    nextUpdate: string
  }> {
    const response = await client.get(`/shipments/track/${trackingNumber}`)
    return response.data
  }

  // Company Info
  async getCompanyInfo(): Promise<{ company: CompanyInfo }> {
    const response = await client.get('/company')
    return response.data
  }

  async updateCompanyInfo(data: Partial<CompanyInfo>) {
    const response = await client.post('/company', data)
    return response.data
  }

  // User Profile
  async getUserProfile(): Promise<{ user: User }> {
    const response = await client.get('/auth/me')
    return response.data
  }

  async updateUserProfile(data: Partial<User>) {
    const response = await client.put('/auth/me', data)
    return response.data
  }

  // Shipping Calculator
  async calculateShipping(
    origin: string,
    destination: string,
    weight: number,
    dimensions: { length: number, width: number, height: number },
    serviceType: 'AIR' | 'SEA' | 'EXPRESS',
    insuranceRequired = false
  ) {
    const response = await client.post('/quotes/calculate', {
      origin,
      destination,
      weight,
      dimensions,
      serviceType,
      insuranceRequired
    })
    return response.data
  }

  // Settings
  async getSettings(): Promise<{ settings: { companyName: string; companyLogo: string } }> {
    const response = await client.get('/settings')
    return response.data
  }

  getBaseUrl(): string {
    return API_URL.replace('/api', '')
  }
}

export default new ApiClient()
