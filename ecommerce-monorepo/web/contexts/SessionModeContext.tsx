'use client'

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react'

/**
 * Active session cart mode.
 *
 * This is the *visitor's* current intent and is distinct from the global
 * admin-configured `StoreMode` (`WHOLESALE` | `RETAIL` | `BOTH`). When the
 * store runs in `BOTH` mode the buyer starts in `retail` and may morph the
 * header anchor to `wholesale` via the manual toggle or by interacting with a
 * wholesale pricing tier on a product page.
 *
 * The two modes are mutually exclusive in the header viewport — only one
 * semantic cart anchor is ever mounted at a time.
 */
export type SessionCartMode = 'retail' | 'wholesale'

interface SessionModeContextType {
  sessionMode: SessionCartMode
  isWholesaleSession: boolean
  isRetailSession: boolean
  /** Morph the active session to wholesale (B2B). */
  enableWholesaleSession: () => void
  /** Morph the active session back to retail (B2C). */
  enableRetailSession: () => void
  /** Toggle between the two modes. */
  toggleSessionMode: () => void
}

const SessionModeContext = createContext<SessionModeContextType | undefined>(undefined)

export function SessionModeProvider({ children }: { children: ReactNode }) {
  // Default fallback: B2C Retail mode unless the URL already requested wholesale.
  const [sessionMode, setSessionMode] = useState<SessionCartMode>('retail')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    if (params.get('mode') === 'wholesale') {
      setSessionMode('wholesale')
    }
  }, [])

  const enableWholesaleSession = useCallback(() => setSessionMode('wholesale'), [])
  const enableRetailSession = useCallback(() => setSessionMode('retail'), [])
  const toggleSessionMode = useCallback(
    () => setSessionMode((prev) => (prev === 'wholesale' ? 'retail' : 'wholesale')),
    []
  )

  const value: SessionModeContextType = {
    sessionMode,
    isWholesaleSession: sessionMode === 'wholesale',
    isRetailSession: sessionMode === 'retail',
    enableWholesaleSession,
    enableRetailSession,
    toggleSessionMode,
  }

  return (
    <SessionModeContext.Provider value={value}>
      {children}
    </SessionModeContext.Provider>
  )
}

export function useSessionMode() {
  const context = useContext(SessionModeContext)
  if (context === undefined) {
    throw new Error('useSessionMode must be used within a SessionModeProvider')
  }
  return context
}
