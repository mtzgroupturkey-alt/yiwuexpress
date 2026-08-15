'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'

// Paths intentionally kept at the app root (NOT localized). Navigation to these
// must never receive a locale prefix.
const ROOT_PREFIXES = ['/login', '/dashboard', '/admin', '/auth', '/api']

export function useLocaleNav() {
  const locale = useLocale()
  const router = useRouter()

  return function navigate(path: string, options?: { replace?: boolean }) {
    const isRoot = ROOT_PREFIXES.some(
      (p) => path === p || path.startsWith(p + '/')
    )
    if (isRoot) {
      if (options?.replace) return router.replace(path)
      return router.push(path)
    }

    const prefixed = path.startsWith('/') ? `/${locale}${path}` : path
    if (options?.replace) return router.replace(prefixed)
    return router.push(prefixed)
  }
}
