'use client'

import React, { useState, useEffect } from 'react'
import { Bell, BellOff, X, Check, Loader2 } from 'lucide-react'
import { usePushSubscription } from '@/hooks/usePushSubscription'
import { useSettings } from '@/components/SettingsProvider'

export function PushNotificationPrompt() {
  const { isSupported, permission, isSubscribed, isLoading, subscribe } = usePushSubscription()
  const { settings } = useSettings()
  const companyName = settings?.companyName || 'Global Trade'
  const [dismissed, setDismissed] = useState(true)
  const [subscribing, setSubscribing] = useState(false)
  const [justSubscribed, setJustSubscribed] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('gt_push_prompt_dismissed')
      if (!isDismissed && isSupported && !isSubscribed && permission === 'default') {
        setDismissed(false)
      }
    }
  }, [isSupported, isSubscribed, permission])

  if (!isSupported || isSubscribed || dismissed || permission === 'denied') {
    return null
  }

  const handleSubscribe = async () => {
    setSubscribing(true)
    const result = await subscribe()
    setSubscribing(false)
    if (result.success) {
      setJustSubscribed(true)
      setTimeout(() => setDismissed(true), 2500)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('gt_push_prompt_dismissed', 'true')
    }
  }

  return (
    <aside
      aria-label="Push notifications"
      className="fixed bottom-4 right-4 z-40 max-w-sm w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#00407a] dark:text-blue-400 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-bold text-gray-900 dark:text-white">
            Stay updated with {companyName}
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5 leading-relaxed">
            Get instant alerts on order tracking, price drops, and quote responses.
          </p>

          <div className="flex items-center gap-2 mt-3">
            {justSubscribed ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="w-4 h-4" /> Enabled!
              </span>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleSubscribe}
                  disabled={subscribing}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00407a] hover:bg-[#00305c] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-60 shadow-xs cursor-pointer"
                >
                  {subscribing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Enabling...</span>
                    </>
                  ) : (
                    <span>Turn On</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Later
                </button>
              </>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Close notification prompt"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 p-1 -mr-1 -mt-1 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  )
}
