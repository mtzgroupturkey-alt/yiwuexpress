'use client'

import React from 'react'
import Link from 'next/link'
import { WifiOff, RefreshCw, Home, Package } from 'lucide-react'

export default function OfflinePage() {
  const handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0b1120] text-gray-900 dark:text-white flex flex-col items-center justify-center p-4 text-center">
      <div className="w-full max-w-sm bg-white dark:bg-[#0f172a] rounded-3xl border border-gray-200/80 dark:border-slate-800 p-8 shadow-xl space-y-6">
        {/* Offline Icon */}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
          <WifiOff className="w-10 h-10" />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-xl font-black tracking-tight">
            You are currently offline
          </h1>
          <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">
            Please check your network connection or Wi-Fi. Previously loaded pages and cached data remain available.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          <button
            type="button"
            onClick={handleReload}
            className="w-full min-h-[48px] rounded-2xl bg-[#00407a] hover:bg-[#00305c] dark:bg-primary-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md active:scale-98 transition-transform touch-manipulation cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Reconnecting</span>
          </button>

          <Link
            href="/en"
            className="w-full min-h-[48px] rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors touch-manipulation"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home Page</span>
          </Link>
        </div>

        {/* Trust Note */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-800 flex items-center justify-center gap-2 text-[11px] text-gray-400">
          <Package className="w-3.5 h-3.5 text-[#00407a] dark:text-[#F5A602]" />
          <span>Global Trade Platform Offline Mode</span>
        </div>
      </div>
    </div>
  )
}
