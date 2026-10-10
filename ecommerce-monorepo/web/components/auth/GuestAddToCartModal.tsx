'use client'

import React, { useEffect } from 'react'
import { X, ShoppingBag, UserPlus, LogIn } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useGuestAuthModal } from '@/hooks/useGuestAuthModal'
import { LocaleLink } from '@/components/LocaleLink'

export function GuestAddToCartModal() {
  const { isOpen, closeModal } = useGuestAuthModal()
  const t = useTranslations('Auth.guestAddToCart')

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, closeModal])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-auth-modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={closeModal}
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-10 animate-in zoom-in-95 duration-200 p-6 sm:p-7 text-center">
        {/* Close Button */}
        <button
          type="button"
          onClick={closeModal}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shadow-inner">
          <ShoppingBag className="w-7 h-7" />
        </div>

        {/* Title */}
        <h3
          id="guest-auth-modal-title"
          className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mb-2 leading-snug"
        >
          {t('title')}
        </h3>

        {/* Subtitle / Message */}
        <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
          {t('message')}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <LocaleLink
            href="/register"
            onClick={closeModal}
            className="w-full flex-1 h-11 bg-[#F5A602] hover:bg-[#E09500] text-slate-950 font-black text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('register')}</span>
          </LocaleLink>

          <LocaleLink
            href="/login"
            onClick={closeModal}
            className="w-full flex-1 h-11 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-sm rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            <LogIn className="w-4 h-4 text-slate-600" />
            <span>{t('signIn')}</span>
          </LocaleLink>
        </div>
      </div>
    </div>
  )
}
