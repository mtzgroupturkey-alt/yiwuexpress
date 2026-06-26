'use client'

import { useState } from 'react'

type ToastProps = {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}

export function toast({ title, description, variant = 'default' }: ToastProps) {
  // Simple console notification for now
  console.log(`[Toast ${variant}]:`, title, description)
  
  // In a real implementation, you'd use a toast library or custom implementation
  // For now, we'll use browser alerts for critical messages
  if (variant === 'error') {
    alert(`Error: ${title}\n${description || ''}`)
  }
}

export function useToast() {
  return { toast }
}
