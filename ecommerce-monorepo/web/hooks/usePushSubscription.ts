'use client'

import { useState, useEffect, useCallback } from 'react'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

function getDeviceInfo() {
  if (typeof window === 'undefined') {
    return { deviceType: 'desktop', os: 'unknown', browser: 'unknown' }
  }

  const ua = navigator.userAgent
  let deviceType = 'desktop'
  if (/mobile/i.test(ua)) deviceType = 'mobile'
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet'

  let os = 'unknown'
  if (/win/i.test(ua)) os = 'windows'
  else if (/mac/i.test(ua)) os = 'macos'
  else if (/android/i.test(ua)) os = 'android'
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'ios'
  else if (/linux/i.test(ua)) os = 'linux'

  let browser = 'unknown'
  if (/chrome|crios/i.test(ua) && !/edge|opr/i.test(ua)) browser = 'chrome'
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'safari'
  else if (/firefox|fxios/i.test(ua)) browser = 'firefox'
  else if (/edg/i.test(ua)) browser = 'edge'

  return { deviceType, os, browser }
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
      setIsSupported(true)
      setPermission(Notification.permission)

      navigator.serviceWorker.ready
        .then((reg) => reg.pushManager.getSubscription())
        .then((sub) => {
          if (sub) {
            setIsSubscribed(true)
            setSubscription(sub)
          } else {
            setIsSubscribed(false)
          }
          setIsLoading(false)
        })
        .catch(() => {
          setIsLoading(false)
        })
    } else {
      setIsSupported(false)
      setIsLoading(false)
    }
  }, [])

  const subscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isSupported) {
      return { success: false, error: 'Push notifications not supported on this browser' }
    }

    try {
      setIsLoading(true)

      // 1. Request permission
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setIsLoading(false)
        return { success: false, error: 'Notification permission denied' }
      }

      // 2. Fetch public key
      const keyRes = await fetch('/api/push/public-key')
      const { publicKey } = await keyRes.json()

      if (!publicKey) {
        setIsLoading(false)
        return { success: false, error: 'VAPID public key not configured' }
      }

      // 3. Register SW if needed
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
      }
      await navigator.serviceWorker.ready

      // 4. Subscribe with PushManager
      const convertedKey = urlBase64ToUint8Array(publicKey)
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey,
      })

      // 5. Send subscription to server
      const p256dh = sub.getKey('p256dh')
      const auth = sub.getKey('auth')

      if (!p256dh || !auth) {
        throw new Error('Failed to extract subscription encryption keys')
      }

      const p256dhBase64 = btoa(
        String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dh)))
      )
      const authBase64 = btoa(
        String.fromCharCode.apply(null, Array.from(new Uint8Array(auth)))
      )

      const deviceInfo = getDeviceInfo()

      const saveRes = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: {
            p256dh: p256dhBase64,
            auth: authBase64,
          },
          deviceType: deviceInfo.deviceType,
          os: deviceInfo.os,
          browser: deviceInfo.browser,
          language: navigator.language || 'en',
        }),
      })

      if (!saveRes.ok) {
        const errData = await saveRes.json()
        throw new Error(errData.error || 'Failed to save subscription')
      }

      setIsSubscribed(true)
      setSubscription(sub)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      setIsLoading(false)
      console.error('[usePushSubscription] Error subscribing:', err)
      return { success: false, error: err.message || 'Subscription failed' }
    }
  }, [isSupported])

  const unsubscribe = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true)
      if (subscription) {
        const endpoint = subscription.endpoint
        await subscription.unsubscribe()
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      setIsSubscribed(false)
      setSubscription(null)
      setIsLoading(false)
      return { success: true }
    } catch (err: any) {
      setIsLoading(false)
      console.error('[usePushSubscription] Error unsubscribing:', err)
      return { success: false, error: err.message }
    }
  }, [subscription])

  return {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscription,
    subscribe,
    unsubscribe,
  }
}
