'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useStoreSessionStore, SessionCartMode } from '@/stores/storeSessionStore'

export type { SessionCartMode }

export interface SessionModeContextType {
  sessionMode: SessionCartMode
  isWholesaleSession: boolean
  isRetailSession: boolean
  enableWholesaleSession: () => void
  enableRetailSession: () => void
  toggleSessionMode: () => void
}

const SessionModeContext = createContext<SessionModeContextType | undefined>(undefined)

export function SessionModeProvider({ children }: { children: ReactNode }) {
  const [sessionMode, setSessionMode] = useState<SessionCartMode>('retail')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'wholesale') {
      setSessionMode('wholesale')
      useStoreSessionStore.getState().enableWholesaleSession()
    }
  }, [])

  const enableWholesaleSession = useCallback(() => {
    setSessionMode('wholesale')
    useStoreSessionStore.getState().enableWholesaleSession()
  }, [])

  const enableRetailSession = useCallback(() => {
    setSessionMode('retail')
    useStoreSessionStore.getState().enableRetailSession()
  }, [])

  const toggleSessionMode = useCallback(() => {
    setSessionMode((prev) => {
      const next = prev === 'wholesale' ? 'retail' : 'wholesale'
      useStoreSessionStore.getState().setSessionMode(next)
      return next
    })
  }, [])

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
