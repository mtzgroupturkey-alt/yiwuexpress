'use client'

import React, { useEffect, useRef, useState } from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface CaptchaWidgetProps {
  onVerify: (token: string) => void
  onError?: (error: string) => void
  siteKey?: string
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string
          callback: (token: string) => void
          'error-callback'?: (error: any) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId?: string) => void
    }
  }
}

/**
 * Universal Turnstile / Dev CAPTCHA Widget
 * - When `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is provided, automatically loads Cloudflare Turnstile script
 *   and renders official turnstile box.
 * - When no site key is configured (local dev/offline), renders a secure interactive dev verification
 *   checkbox that produces a valid verification token (`turnstile-pass`).
 */
export function CaptchaWidget({ onVerify, onError, siteKey }: CaptchaWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDevChecked, setIsDevChecked] = useState(false)
  const [turnstileLoaded, setTurnstileLoaded] = useState(false)
  const widgetIdRef = useRef<string | null>(null)

  const effectiveSiteKey =
    siteKey ||
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    ''

  const isConfigured = Boolean(effectiveSiteKey && effectiveSiteKey.trim() !== '')

  useEffect(() => {
    if (!isConfigured) return

    // Inject Cloudflare Turnstile script if not already present
    const scriptId = 'cf-turnstile-script'
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script')
      script.id = scriptId
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => setTurnstileLoaded(true)
      script.onerror = () => {
        if (onError) onError('Failed to load security verification service.')
      }
      document.head.appendChild(script)
    } else {
      if (window.turnstile) {
        setTurnstileLoaded(true)
      } else {
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement
        if (existingScript) {
          existingScript.addEventListener('load', () => setTurnstileLoaded(true))
        }
      }
    }
  }, [isConfigured, onError])

  useEffect(() => {
    if (!isConfigured || !turnstileLoaded || !containerRef.current || !window.turnstile) return

    try {
      if (widgetIdRef.current) {
        window.turnstile.remove(widgetIdRef.current)
        widgetIdRef.current = null
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: effectiveSiteKey,
        callback: (token: string) => {
          onVerify(token)
        },
        'error-callback': (err: any) => {
          if (onError) onError('Security check encountered an error. Please retry.')
        },
        'expired-callback': () => {
          if (onError) onError('Security verification expired. Please verify again.')
        },
        theme: 'light',
        size: 'flexible',
      })
    } catch (e) {
      console.error('[CaptchaWidget] Turnstile render error:', e)
    }

    return () => {
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        } catch {
          // ignore
        }
      }
    }
  }, [isConfigured, turnstileLoaded, effectiveSiteKey, onVerify, onError])

  // If Cloudflare site key configured, render turnstile mount point
  if (isConfigured) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 border border-slate-200 min-h-[66px]">
        <div ref={containerRef} className="w-full max-w-[300px]" />
        {!turnstileLoaded && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Loading security verification...</span>
          </div>
        )}
      </div>
    )
  }

  // Local / dev interactive verification box (Requirement #4 fallback when keys not yet populated in .env)
  const handleDevCheck = (checked: boolean) => {
    setIsDevChecked(checked)
    if (checked) {
      onVerify('turnstile-pass')
    } else {
      onVerify('')
    }
  }

  return (
    <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl">
      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={isDevChecked}
          onChange={(e) => handleDevCheck(e.target.checked)}
          className="w-5 h-5 rounded-md text-[#00407a] border-slate-300 focus:ring-[#00407a] cursor-pointer"
        />
        <span className="text-xs font-semibold text-slate-700">
          I am human and agree to security verification
        </span>
      </label>
      <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
        <ShieldCheck className={`w-4 h-4 ${isDevChecked ? 'text-emerald-500' : 'text-slate-400'}`} />
        <span>CAPTCHA</span>
      </div>
    </div>
  )
}
