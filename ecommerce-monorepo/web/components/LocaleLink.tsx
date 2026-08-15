'use client'

import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ForwardedRef, forwardRef, ReactNode } from 'react'

type LocaleLinkProps = {
  href: string
  children: ReactNode
  className?: string
  onClick?: () => void
  [key: string]: any
}

// Paths intentionally kept at the app root (NOT localized).
const ROOT_PREFIXES = ['/login', '/dashboard', '/admin', '/auth', '/api']

/**
 * Locale-aware drop-in replacement for next/link.
 * Prefixes internal, absolute paths (starting with "/") with the active locale.
 * External (http), mailto:, tel:, hash, and root-kept paths are returned untouched.
 */
export const LocaleLink = forwardRef<HTMLAnchorElement, LocaleLinkProps>(
  function LocaleLink({ href, children, ...rest }, ref) {
  const locale = useLocale()

  const localizedHref = (() => {
    if (
      !href ||
      href.startsWith('http') ||
      href.startsWith('mailto:') ||
      href.startsWith('tel:') ||
      href.startsWith('#') ||
      href.startsWith('data:')
    ) {
      return href
    }
    // already locale-prefixed
    if (/^\/(en|ru|zh)(\/|$)/.test(href)) {
      return href
    }
    // root-kept paths must never be prefixed
    if (ROOT_PREFIXES.some((p) => href === p || href.startsWith(p + '/'))) {
      return href
    }
    if (href === '/') {
      return `/${locale}`
    }
    return `/${locale}${href}`
  })()

  const isExternal =
    !href ||
    href.startsWith('http') ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('#') ||
    href.startsWith('data:')

  if (isExternal) {
    return (
      <a href={href} ref={ref as ForwardedRef<HTMLAnchorElement>} {...rest}>
        {children}
      </a>
    )
  }

  return (
    <Link href={localizedHref} ref={ref} {...rest}>
      {children}
    </Link>
  )
})
