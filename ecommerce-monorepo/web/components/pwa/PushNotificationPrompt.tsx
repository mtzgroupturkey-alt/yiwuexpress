'use client'

import React, { useState, useEffect } from 'react'
import { useNotificationStatus } from '@/hooks/useNotificationStatus'
import { Bell, X, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'

export function PushNotificationPrompt() {
  const { 
    shouldPrompt, 
    permission, 
    dismissPrompt, 
    requestPermission, 
    platform 
  } = useNotificationStatus()
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dismissCount, setDismissCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const count = parseInt(localStorage.getItem('notif_prompt_dismiss_count') || '0', 10)
      setDismissCount(count)
    }
  }, [shouldPrompt])

  if (!shouldPrompt) return null

  const handleEnable = async () => {
    if (permission === 'denied') {
      // It's denied, they need to go to settings. We can't request natively.
      return
    }

    setIsSubmitting(true)
    try {
      const perm = await requestPermission()
      if (perm === 'granted') {
        // Here we could register SW and subscribe
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          const reg = await navigator.serviceWorker.ready
          // Example: const sub = await reg.pushManager.subscribe({ ... })
          // await fetch('/api/push/subscribe', { method: 'POST', body: JSON.stringify(sub) })
        }
        toast({ title: 'Notifications enabled!', description: 'You will now receive updates.' })
      } else {
        // If denied during the request
        dismissPrompt() // hide and snooze
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Render Denied Guidance
  if (permission === 'denied') {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-safe animate-in slide-in-from-bottom-full duration-300">
        <div className="max-w-md mx-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-50 p-2.5 rounded-full">
                <ShieldAlert className="w-6 h-6 text-red-500" />
              </div>
              <button onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Notifications are blocked</h3>
            
            <div className="text-sm text-gray-600 space-y-3 mb-6">
              {platform === 'ios' ? (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open iOS Settings</li>
                  <li>Scroll to find this app</li>
                  <li>Tap "Notifications"</li>
                  <li>Turn on "Allow Notifications"</li>
                  <li>Return to the app</li>
                </ol>
              ) : platform === 'android' ? (
                <ol className="list-decimal pl-4 space-y-1">
                  <li>Open your browser settings</li>
                  <li>Find "Site settings" → "Notifications"</li>
                  <li>Allow notifications for this site</li>
                  <li>Return to the app</li>
                </ol>
              ) : (
                <p>Click the lock icon in the address bar and allow notifications for this site.</p>
              )}
            </div>

            <div className="flex gap-3">
              <Button onClick={dismissPrompt} className="w-full" variant="outline">
                Got it
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render First-time Bottom Sheet
  if (dismissCount === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6 pb-safe animate-in slide-in-from-bottom-full duration-300">
        <div className="max-w-md mx-auto bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-5">
            <div className="flex justify-between items-start mb-4">
              <div className="bg-indigo-50 p-2.5 rounded-full">
                <Bell className="w-6 h-6 text-indigo-600" />
              </div>
              <button onClick={dismissPrompt} className="text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full p-1.5 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">Enable Notifications</h3>
            <p className="text-sm text-gray-600 mb-4">
              Get instant updates about:
            </p>
            <ul className="text-sm text-gray-600 mb-6 space-y-2">
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Your order status</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Quote responses</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> Flash deals and discounts</li>
              <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-400" /> New arrivals</li>
            </ul>
            
            <p className="text-xs text-gray-500 mb-6 italic">
              We'll never spam you. You can turn this off anytime in settings.
            </p>

            <div className="flex gap-3 flex-col sm:flex-row">
              <Button onClick={handleEnable} disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-700">
                {isSubmitting ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button onClick={dismissPrompt} variant="outline" className="w-full sm:w-auto">
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render Recurring Toast (dismissCount > 0)
  return (
    <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5 text-indigo-400" />
          <div className="text-sm font-medium">Turn on notifications for order updates</div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={handleEnable} 
            disabled={isSubmitting}
            className="text-sm font-bold text-indigo-300 hover:text-indigo-200"
          >
            Turn on
          </button>
          <button onClick={dismissPrompt} className="text-slate-400 hover:text-white p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
