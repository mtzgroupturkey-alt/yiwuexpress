/**
 * Returns the correct dashboard URL for a user based on their role
 * and userType.
 *
 * Retail dashboard is at /dashboard (no locale prefix).
 * Wholesale dashboard is at /[locale]/business/dashboard.
 * Admin dashboard is at /admin.
 */
export function getDashboardForUser(
  user: { role: string; userType: string },
  locale: string = 'en'
): string {
  if (user.role === 'ADMIN') {
    return '/admin'
  }
  if (user.userType === 'WHOLESALE' || user.userType === 'BOTH') {
    return `/${locale}/business/dashboard`
  }
  // RETAIL (default)
  return '/dashboard'
}
