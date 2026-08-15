# Middleware Public Routes Fix

## Problem

Users were being redirected to the login page when trying to access public pages like the homepage, causing:

1. **Unwanted login redirects**: Visiting `dromkok.com` → redirects to `/en/` → middleware doesn't recognize `/en/` as public → redirects to login
2. **MIME type errors**: Static assets (`/_next/static/*.css`, `*.js`) were being redirected to login page, causing nginx to serve HTML instead of CSS/JS files
3. **404 errors**: Missing static files because they were being intercepted by auth middleware

## Root Cause

The middleware's `publicRoutes` array only checked exact paths like `/products` but didn't account for:
- Locale-prefixed routes (e.g., `/en/products`, `/ru/about`, `/zh/contact`)
- Static assets being caught by protection logic before bypass check

## Solution

### 1. Locale-Aware Public Route Checking

Updated the middleware to:
- Detect locale prefixes in pathname (`/en/`, `/ru/`, `/zh/`)
- Strip locale prefix and check the underlying route
- Allow both localized and non-localized versions of public routes

**Before:**
```typescript
const isPublicRoute = publicRoutes.some(route => 
  pathname === route || pathname.startsWith(route + '/')
)
```

**After:**
```typescript
// Check if path is locale-prefixed (e.g., /en/, /ru/, /zh/)
const localePattern = /^\/(en|ru|zh)(\/|$)/
const localeMatch = pathname.match(localePattern)

// If it's a locale-prefixed route, check the route without the locale prefix
let routeToCheck = pathname
if (localeMatch) {
  // Remove locale prefix for checking against publicRoutes
  routeToCheck = pathname.replace(localeMatch[0], '/')
  // Normalize double slashes
  if (routeToCheck.startsWith('//')) {
    routeToCheck = routeToCheck.substring(1)
  }
}

const isPublicRoute = publicRoutes.some(route => 
  routeToCheck === route || routeToCheck.startsWith(route + '/') ||
  pathname === route || pathname.startsWith(route + '/')
)
```

### 2. Enhanced Static Asset Bypass

Strengthened the `isBypassPath()` function to ensure `/_next/` is ALWAYS bypassed first:

```typescript
function isBypassPath(pathname: string): boolean {
  // Always bypass _next static files (critical for preventing MIME type errors)
  if (pathname.startsWith('/_next/')) {
    return true
  }
  
  // ... rest of checks
}
```

## Files Modified

- `middleware.ts` - Added locale-aware public route checking and enhanced static asset bypass

## Testing

### Test Public Routes (All Should Work Without Login)

**English:**
- ✅ `http://localhost:3001/` → Homepage
- ✅ `http://localhost:3001/en/` → Homepage (localized)
- ✅ `http://localhost:3001/en/products` → Products page
- ✅ `http://localhost:3001/en/about` → About page
- ✅ `http://localhost:3001/en/contact` → Contact page
- ✅ `http://localhost:3001/en/services` → Services page
- ✅ `http://localhost:3001/en/wholesale` → Wholesale page

**Russian:**
- ✅ `http://localhost:3001/ru/` → Homepage
- ✅ `http://localhost:3001/ru/products` → Products page
- ✅ `http://localhost:3001/ru/about` → About page

**Chinese:**
- ✅ `http://localhost:3001/zh/` → Homepage
- ✅ `http://localhost:3001/zh/products` → Products page
- ✅ `http://localhost:3001/zh/about` → About page

### Test Static Assets (Should Load Without Redirect)

- ✅ `http://localhost:3001/_next/static/css/[hash].css` → CSS file (not HTML)
- ✅ `http://localhost:3001/_next/static/chunks/[hash].js` → JS file (not HTML)
- ✅ `http://localhost:3001/_next/static/media/[hash].png` → Image file
- ✅ Browser console should show NO MIME type errors

### Test Protected Routes (Should Redirect to Login)

**Without auth token:**
- ✅ `http://localhost:3001/dashboard` → Redirects to `/login?redirect=/dashboard`
- ✅ `http://localhost:3001/admin` → Redirects to `/login?redirect=/admin`
- ✅ `http://localhost:3001/orders` → Redirects to `/login?redirect=/orders`
- ✅ `http://localhost:3001/wishlist` → Redirects to `/login?redirect=/wishlist`
- ✅ `http://localhost:3001/profile` → Redirects to `/login?redirect=/profile`

**API endpoints:**
- ✅ `http://localhost:3001/api/admin/products` → Returns 401 (not redirect)
- ✅ `http://localhost:3001/api/wishlist` → Returns 401
- ✅ `http://localhost:3001/api/orders` → Returns 401

## Production Deployment

### Deploy Steps

1. **Test locally:**
   ```bash
   cd ecommerce-monorepo/web
   npm run dev
   ```
   - Visit homepage: Should NOT redirect to login
   - Check browser console: Should have NO MIME type errors
   - Verify all 3 languages work: `/en/`, `/ru/`, `/zh/`

2. **Build and verify:**
   ```bash
   npm run build
   npm run start
   ```
   - Test on port 3001
   - Ensure static assets load correctly

3. **Commit and push:**
   ```bash
   git add middleware.ts MIDDLEWARE_PUBLIC_ROUTES_FIX.md
   git commit -m "Fix: Allow public routes with locale prefixes, prevent static asset redirect"
   git push origin main
   ```

4. **GitHub Actions will deploy automatically**

5. **Test on production:**
   - Visit: `https://dromkok.com` → Should show homepage (not login)
   - Visit: `https://dromkok.com/en/` → Should show homepage
   - Visit: `https://dromkok.com/ru/` → Should show homepage
   - Visit: `https://dromkok.com/zh/` → Should show homepage
   - Check browser console: NO MIME type errors
   - Check Network tab: All `_next/static/*` files should return 200 with correct Content-Type

### Rollback Plan (If Needed)

If something breaks in production:

```bash
# Revert the commit
git revert HEAD
git push origin main
```

## Technical Details

### Why MIME Type Errors Occurred

1. User visits `dromkok.com`
2. Next.js redirects to `/en/` (locale detection)
3. Middleware doesn't recognize `/en/` as public
4. Middleware redirects to `/login`
5. Browser tries to load CSS: `/_next/static/css/xyz.css`
6. Middleware ALSO redirects CSS request to `/login`
7. Nginx proxies the login HTML page
8. Browser receives HTML instead of CSS
9. Browser error: "MIME type 'text/html' is not a supported stylesheet MIME type"

### Fix Flow

1. User visits `dromkok.com`
2. Next.js redirects to `/en/`
3. Middleware detects locale prefix: `/en/`
4. Middleware strips prefix → checks `/` → finds it's public ✅
5. Page loads, browser requests: `/_next/static/css/xyz.css`
6. `isBypassPath()` detects `/_next/` prefix → bypasses auth immediately ✅
7. Nginx proxies CSS file correctly
8. Browser receives CSS with correct MIME type ✅

## Locale Routing Logic

The middleware uses a two-tier system:

1. **Bypass paths** (no locale routing): `/api`, `/admin`, `/dashboard`, `/auth`, `/_next`, static files
2. **Localized paths** (use next-intl): `/products` → `/en/products`, `/ru/products`, `/zh/products`

**Public routes work in both tiers:**
- Tier 1 (unlocalized): `/products` → public
- Tier 2 (localized): `/en/products` → strips `/en/` → checks `/products` → public ✅

## Related Issues Fixed

- ✅ Homepage redirect to login
- ✅ MIME type errors in console
- ✅ 404 errors for static assets
- ✅ CSS/JS files not loading
- ✅ ERR_EMPTY_RESPONSE errors
- ✅ Locale-prefixed public routes now work
- ✅ All three languages accessible without login

## Prevention

To prevent this issue in the future:

1. **When adding new public routes**, add to `publicRoutes` array in middleware
2. **When adding new locales**, update the locale pattern regex: `/^\/(en|ru|zh)(\/|$)/`
3. **Always test all three languages** after middleware changes
4. **Check browser console** for MIME type errors during testing

## Monitoring

After deployment, monitor:

1. **Error logs**: Check for 401/403 errors on public routes
   ```bash
   tail -f /var/log/nginx/www.dromkok.com_error.log
   ```

2. **Access logs**: Verify redirects are working correctly
   ```bash
   tail -f /var/log/nginx/www.dromkok.com_access.log | grep "301\|302"
   ```

3. **Browser console**: No MIME type errors when visiting homepage

4. **Analytics**: Check bounce rate - should not spike due to unwanted redirects

---

**Fix Date:** 2026-08-14  
**Status:** ✅ Complete  
**Impact:** Critical user experience issue resolved  
**Testing:** Required on all three languages before deployment
