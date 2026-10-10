'use client'

import { create } from 'zustand'

interface GuestAuthModalState {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
}

export const useGuestAuthModal = create<GuestAuthModalState>((set) => ({
  isOpen: false,
  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
}))
