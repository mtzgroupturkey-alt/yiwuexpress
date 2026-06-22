// API Configuration
// All API-related configuration in one place for easy management

export const API_CONFIG = {
  // Backend API Port (must match web/.env.local PORT)
  BACKEND_PORT: 3001,
  
  // Expo Metro Port (web platform)
  EXPO_PORT: 8081,
  
  // Timeout for API requests (milliseconds)
  TIMEOUT: 10000,
} as const

// Generate API URL based on platform
export function getApiUrl(): string {
  const port = API_CONFIG.BACKEND_PORT
  
  // For web platform
  if (typeof window !== 'undefined') {
    return `http://localhost:${port}/api`
  }
  
  // For React Native (this won't execute in web context)
  return `http://localhost:${port}/api`
}

// Base URL without /api suffix
export function getBaseUrl(): string {
  return getApiUrl().replace('/api', '')
}
