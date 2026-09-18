import { create } from 'zustand'

export type StoreMode = 'WHOLESALE' | 'RETAIL' | 'BOTH'
export type SessionCartMode = 'retail' | 'wholesale'

export interface StoreSessionState {
  storeMode: StoreMode
  sessionMode: SessionCartMode
  loading: boolean
  error: string | null

  // Computed state getters
  isWholesale: boolean
  isRetail: boolean
  isBoth: boolean
  isWholesaleSession: boolean
  isRetailSession: boolean

  // Actions
  setStoreMode: (mode: StoreMode) => void
  setSessionMode: (mode: SessionCartMode) => void
  enableWholesaleSession: () => void
  enableRetailSession: () => void
  toggleSessionMode: () => void
  initializeStoreMode: (mode: StoreMode) => void
}

export const useStoreSessionStore = create<StoreSessionState>((set) => ({
  storeMode: 'WHOLESALE',
  sessionMode: 'retail',
  loading: false,
  error: null,

  isWholesale: true,
  isRetail: false,
  isBoth: false,
  isWholesaleSession: false,
  isRetailSession: true,

  setStoreMode: (storeMode) =>
    set((state) => {
      let sessionMode = state.sessionMode
      if (storeMode === 'WHOLESALE') {
        sessionMode = 'wholesale'
      } else if (storeMode === 'RETAIL') {
        sessionMode = 'retail'
      }
      return {
        storeMode,
        sessionMode,
        isWholesale: storeMode === 'WHOLESALE' || storeMode === 'BOTH',
        isRetail: storeMode === 'RETAIL' || storeMode === 'BOTH',
        isBoth: storeMode === 'BOTH',
        isWholesaleSession: sessionMode === 'wholesale',
        isRetailSession: sessionMode === 'retail',
      }
    }),

  setSessionMode: (sessionMode) =>
    set((state) => {
      if (state.storeMode === 'WHOLESALE') {
        return {
          sessionMode: 'wholesale',
          isWholesaleSession: true,
          isRetailSession: false,
        }
      }
      if (state.storeMode === 'RETAIL') {
        return {
          sessionMode: 'retail',
          isWholesaleSession: false,
          isRetailSession: true,
        }
      }
      return {
        sessionMode,
        isWholesaleSession: sessionMode === 'wholesale',
        isRetailSession: sessionMode === 'retail',
      }
    }),

  enableWholesaleSession: () =>
    set((state) => {
      if (state.storeMode === 'RETAIL') return state
      return {
        sessionMode: 'wholesale',
        isWholesaleSession: true,
        isRetailSession: false,
      }
    }),

  enableRetailSession: () =>
    set((state) => {
      if (state.storeMode === 'WHOLESALE') return state
      return {
        sessionMode: 'retail',
        isWholesaleSession: false,
        isRetailSession: true,
      }
    }),

  toggleSessionMode: () =>
    set((state) => {
      if (state.storeMode === 'WHOLESALE' || state.storeMode === 'RETAIL') {
        return state
      }
      const next = state.sessionMode === 'wholesale' ? 'retail' : 'wholesale'
      return {
        sessionMode: next,
        isWholesaleSession: next === 'wholesale',
        isRetailSession: next === 'retail',
      }
    }),

  initializeStoreMode: (storeMode) =>
    set((state) => {
      let sessionMode = state.sessionMode
      if (storeMode === 'WHOLESALE') {
        sessionMode = 'wholesale'
      } else if (storeMode === 'RETAIL') {
        sessionMode = 'retail'
      }
      return {
        storeMode,
        sessionMode,
        isWholesale: storeMode === 'WHOLESALE' || storeMode === 'BOTH',
        isRetail: storeMode === 'RETAIL' || storeMode === 'BOTH',
        isBoth: storeMode === 'BOTH',
        isWholesaleSession: sessionMode === 'wholesale',
        isRetailSession: sessionMode === 'retail',
        loading: false,
      }
    }),
}))
