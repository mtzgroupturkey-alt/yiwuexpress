import {routing} from './routing';
import en from '../messages/en.json';
import ru from '../messages/ru.json';
import zh from '../messages/zh.json';

type Messages = typeof en;

declare global {
  interface IntlMessages extends Messages {}
}

export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

/**
 * Prefix an internal path with a locale. Safe to call from server components.
 * External/mailto/tel/hash and root-kept paths are returned untouched.
 */
const ROOT_PREFIXES = ['/login', '/dashboard', '/admin', '/auth', '/api']

export function localePath(path: string, locale: string): string {
  if (
    !path ||
    path.startsWith('http') ||
    path.startsWith('mailto:') ||
    path.startsWith('tel:') ||
    path.startsWith('#') ||
    path.startsWith('data:')
  ) {
    return path
  }
  if (/^\/(en|ru|zh)(\/|$)/.test(path)) {
    return path
  }
  if (ROOT_PREFIXES.some((p) => path === p || path.startsWith(p + '/'))) {
    return path
  }
  if (path === '/') {
    return `/${locale}`
  }
  return `/${locale}${path}`
}
