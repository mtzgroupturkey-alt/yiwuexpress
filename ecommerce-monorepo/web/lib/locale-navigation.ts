/**
 * Utility functions for locale and currency persistence and navigation.
 */

export function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const maxAge = days * 24 * 60 * 60
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`
}

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'))
  return match ? decodeURIComponent(match[1]) : null
}

export function switchLocale(newLocale: string, currentLocale?: string, pathname?: string) {
  if (typeof window === 'undefined') return
  const path = pathname || window.location.pathname
  const search = window.location.search || ''

  // Persist choice in standard NEXT_LOCALE cookie (1 year)
  setCookie('NEXT_LOCALE', newLocale, 365)

  if (newLocale === currentLocale) {
    return
  }

  // Replace existing locale in pathname (e.g. /en/store -> /ru/store)
  const segments = path.split('/')
  let targetPath = `/${newLocale}`
  if (segments.length > 1 && ['en', 'ru', 'zh'].includes(segments[1])) {
    segments[1] = newLocale
    targetPath = segments.join('/') || `/${newLocale}`
  } else {
    targetPath = `/${newLocale}${path === '/' ? '' : path}`
  }

  targetPath += search
  window.location.href = targetPath
}
