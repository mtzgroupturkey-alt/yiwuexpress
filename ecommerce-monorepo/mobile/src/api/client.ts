import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'

// ─── API URL Configuration ─────────────────────────────────────────────────
// Android emulator → 10.0.2.2 maps to host machine's localhost
// iOS simulator   → localhost works directly
// Real device     → must use the host machine's LAN IP
const LAN_IP = '192.168.1.185'

const getApiUrl = () => {
  if (Platform.OS === 'web') {
    // Running in a browser - always use localhost
    return 'http://localhost:3000/api'
  }
  if (__DEV__) {
    if (Platform.OS === 'android') return `http://10.0.2.2:3000/api`
    // iOS simulator or real device - use LAN IP
    return `http://${LAN_IP}:3000/api`
  }
  return 'https://your-production-api.com/api'
}

const API_URL = getApiUrl()

const client = axios.create({
  baseURL: API_URL,
  timeout: 10000,
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
    }
    return config
  },
  (error) => {
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