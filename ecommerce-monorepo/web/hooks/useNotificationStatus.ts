'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { getNotificationSupport, Platform } from '@/lib/notificationSupport'

const DISMISS_AT_KEY = 'notif_prompt_dismissed_at'
const DISMISS_COUNT_KEY = 'notif_prompt_dismiss_count'

export function useNotificationStatus() {
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [shouldPrompt, setShouldPrompt] = useState(false)
  const [platform, setPlatform] = useState<Platform>('unknown')
  
  const supportRef = useRef(getNotificationSupport())

  const checkStatus = useCallback(async () => {
    if (typeof window === 'undefined') return

    const support = supportRef.current
    setPlatform(support.platform)
    setIsSupported(support.supported)

    const standalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true
    setIsInstalled(standalone)

    let currentPermission: NotificationPermission = 'default'
    if ('Notification' in window) {
      currentPermission = Notification.permission
      setPermission(currentPermission)
    }

    let currentlySubscribed = false
    if ('serviceWorker' in navigator && 'PushManager' in window && support.supported) {
      try {
        const reg = await navigator.serviceWorker.getRegistration()
        if (reg && reg.pushManager) {
          const sub = await reg.pushManager.getSubscription()
          currentlySubscribed = !!sub
          setIsSubscribed(currentlySubscribed)
        }
      } catch (err) {
        console.error('Error checking push subscription', err)
      }
    }

    // Snooze Logic
    const dismissedAt = localStorage.getItem(DISMISS_AT_KEY)
    let snoozed = false
    if (dismissedAt) {
      const dismissCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10)
      let snoozeDays = 7
      if (dismissCount === 2) snoozeDays = 14
      else if (dismissCount === 3) snoozeDays = 30
      else if (dismissCount >= 4) snoozeDays = 90
      
      const snoozeUntil = new Date(dismissedAt).getTime() + (snoozeDays * 24 * 60 * 60 * 1000)
      if (Date.now() < snoozeUntil) {
        snoozed = true
      }
    }

    // Clear snooze if granted
    if (currentPermission === 'granted') {
      localStorage.removeItem(DISMISS_AT_KEY)
      localStorage.removeItem(DISMISS_COUNT_KEY)
      snoozed = false
    }

    // Detection logic
    // 1. App is running in standalone mode (display-mode: standalone)
    // 2. Notification.permission is 'default' or 'denied'
    // 3. No active PushSubscription exists in the DB (local check here)
    // 4. User has not dismissed the prompt within the last snooze period
    // 5. User is on a supported platform

    const promptNeeded = 
      standalone && 
      (currentPermission === 'default' || currentPermission === 'denied') && 
      !currentlySubscribed && 
      !snoozed && 
      support.supported

    setShouldPrompt(promptNeeded)

  }, [])

  useEffect(() => {
    checkStatus()

    // Listen to permission changes (via polling when app is in foreground)
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkStatus()
      }
    }, 5000)

    // Visibility change listener
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkStatus()
      }
    }
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkStatus])

  const dismissPrompt = useCallback(() => {
    const currentCount = parseInt(localStorage.getItem(DISMISS_COUNT_KEY) || '0', 10)
    localStorage.setItem(DISMISS_COUNT_KEY, (currentCount + 1).toString())
    localStorage.setItem(DISMISS_AT_KEY, new Date().toISOString())
    setShouldPrompt(false)
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) return 'default'
    const perm = await Notification.requestPermission()
    setPermission(perm)
    await checkStatus()
    return perm
  }, [checkStatus])

  return {
    permission,
    isSubscribed,
    isInstalled,
    isSupported,
    shouldPrompt,
    platform,
    dismissPrompt,
    requestPermission,
    checkStatus
  }
}
