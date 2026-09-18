'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useStoreSessionStore, SessionCartMode } from '@/stores/storeSessionStore'
import { useStoreMode } from '@/contexts/StoreModeContext'

export type { SessionCartMode }

export interface SessionModeContextType {
  sessionMode: SessionCartMode
  isWholesaleSession: boolean
  isRetailSession: boolean
  enableWholesaleSession: () => void
  enableRetailSession: () => void
  toggleSessionMode: () => void
}

const COOKIE_NAME = 'store_session_mode'
const MAX_AGE_30_DAYS = 30 * 24 * 60 * 60 // 30 days in seconds

export function setSessionModeCookie(mode: SessionCartMode) {
  if (typeof document === 'undefined') return
  document.cookie = `${COOKIE_NAME}=${mode}; path=/; max-age=${MAX_AGE_30_DAYS}; SameSite=Lax`
}

export function getSessionModeCookie(): SessionCartMode | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + COOKIE_NAME + '=([^;]*)'))
  if (match && (match[2] === 'wholesale' || match[2] === 'retail')) {
    return match[2] as SessionCartMode
  }
  return null
}

const SessionModeContext = createContext<SessionModeContextType | undefined>(undefined)

export function SessionModeProvider({
  initialMode,
  children,
}: {
  initialMode?: SessionCartMode
  children: ReactNode
}) {
  const { storeMode } = useStoreMode()

  const determineInitialMode = (): SessionCartMode => {
    if (initialMode) return initialMode
    if (process.env.NODE_ENV !== 'test') {
      const cookieVal = getSessionModeCookie()
      if (cookieVal) return cookieVal
    }
    return 'retail'
  }

  const [sessionMode, setSessionMode] = useState<SessionCartMode>(determineInitialMode)

  useEffect(() => {
    if (initialMode) {
      setSessionMode(initialMode)
      useStoreSessionStore.getState().setSessionMode(initialMode)
      setSessionModeCookie(initialMode)
    }
  }, [initialMode])

  useEffect(() => {
    if (storeMode === 'WHOLESALE' && sessionMode !== 'wholesale') {
      setSessionMode('wholesale')
      useStoreSessionStore.getState().enableWholesaleSession()
      setSessionModeCookie('wholesale')
      return
    }
    if (storeMode === 'RETAIL' && sessionMode !== 'retail') {
      setSessionMode('retail')
      useStoreSessionStore.getState().enableRetailSession()
      setSessionModeCookie('retail')
      return
    }
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('mode') === 'wholesale' && storeMode !== 'RETAIL') {
        setSessionMode('wholesale')
        useStoreSessionStore.getState().enableWholesaleSession()
        setSessionModeCookie('wholesale')
      }
    }
  }, [storeMode])

  const enableWholesaleSession = useCallback(() => {
    if (storeMode === 'RETAIL') return
    setSessionMode('wholesale')
    useStoreSessionStore.getState().enableWholesaleSession()
    setSessionModeCookie('wholesale')
  }, [storeMode])

  const enableRetailSession = useCallback(() => {
    if (storeMode === 'WHOLESALE') return
    setSessionMode('retail')
    useStoreSessionStore.getState().enableRetailSession()
    setSessionModeCookie('retail')
  }, [storeMode])

  const toggleSessionMode = useCallback(() => {
    if (storeMode === 'WHOLESALE' || storeMode === 'RETAIL') {
      return
    }
    setSessionMode((prev) => {
      const next = prev === 'wholesale' ? 'retail' : 'wholesale'
      useStoreSessionStore.getState().setSessionMode(next)
      setSessionModeCookie(next)
      return next
    })
  }, [storeMode])

  const value: SessionModeContextType = {
    sessionMode,
    isWholesaleSession: sessionMode === 'wholesale',
    isRetailSession: sessionMode === 'retail',
    enableWholesaleSession,
    enableRetailSession,
    toggleSessionMode,
  }

  return <SessionModeContext.Provider value={value}>{children}</SessionModeContext.Provider>
}

export function useSessionMode(): SessionModeContextType {
  const context = useContext(SessionModeContext)
  if (context) {
    return context
  }

  // Fallback to Zustand store if used outside Provider
  const store = useStoreSessionStore.getState()
  return {
    sessionMode: store.sessionMode,
    isWholesaleSession: store.isWholesaleSession,
    isRetailSession: store.isRetailSession,
    enableWholesaleSession: store.enableWholesaleSession,
    enableRetailSession: store.enableRetailSession,
    toggleSessionMode: store.toggleSessionMode,
  }
}
