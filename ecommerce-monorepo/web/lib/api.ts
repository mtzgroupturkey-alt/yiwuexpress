// API client helper functions
// Uses httpOnly cookies for authentication - no localStorage token

export const api = {
  async get(url: string) {
    const response = await fetch(url, {
      credentials: 'include', // Send httpOnly cookie
    })
    
    if (response.status === 401) {
      // Handle unauthorized - could trigger logout
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  async post(url: string, data: any) {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send httpOnly cookie
      body: JSON.stringify(data),
    })
    
    if (response.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  async put(url: string, data: any) {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Send httpOnly cookie
      body: JSON.stringify(data),
    })
    
    if (response.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },

  async delete(url: string) {
    const response = await fetch(url, {
      method: 'DELETE',
      credentials: 'include', // Send httpOnly cookie
    })
    
    if (response.status === 401) {
      // Handle unauthorized
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
      throw new Error('Unauthorized')
    }
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  },
}
