# Root URL Loading Issue Fix

## Problem

When accessing `http://dromkok.com` (root URL without locale prefix), the page shows "Loading..." indefinitely and displays MIME type errors in the console.

**Symptoms:**
- `http://dromkok.com/en/` → ✅ Works fine
- `http://dromkok.com/` → ❌ Shows "Loading..." white page
- Console errors: MIME type errors for CSS/JS files

## Root Cause

The middleware flow had incorrect order of operations:

### Incorrect Flow (Before Fix):
1. User visits `/`
2. `isBypassPath('/')` → returns `false`
3. `authMiddleware` runs and checks if `/` is public
4. `/` is in `publicRoutes` array
5. Returns `NextResponse.next()` → proceeds to render
6. **Problem**: No `app/page.tsx` exists at root!
7. Next.js tries to render but fails
8. Shows loading state indefinitely

### Why `intlMiddleware` Wasn't Running:
The middleware checked `isBypassPath()` first, and since `/` wasn't bypassed, it went directly to `authMiddleware` which allowed it through as a public route. The `intlMiddleware` that should redirect `/` → `/en/` never executed properly.

## Solution

### 1. Fixed Middleware Flow

Updated the middleware to:
1. Let `intlMiddleware` handle locale detection FIRST
2. Check if it returned a redirect (307/308 status)
3. If redirected, return immediately (don't process auth)
4. Only check auth for locale-prefixed protected routes

### New Flow (After Fix):
1. User visits `/`
2. `isBypassPath('/')` → returns `false`
3. **`intlMiddleware` runs FIRST** → detects no locale
4. `intlMiddleware` returns redirect: `/` → `/en/` (307)
5. Middleware checks response status: **307 detected**
6. **Returns redirect immediately** ✅
7. Browser redirects to `/en/`
8. Page loads correctly

### 2. Added Fallback Root Page

Created `app/page.tsx` as a safety fallback:
- Detects browser language
- Redirects to appropriate locale (`/en/`, `/ru/`, `/zh/`)
- Shows loading spinner while redirecting
- Should rarely be seen (middleware handles redirect)

## Files Modified

### 1. `middleware.ts`

**Key Changes:**
```typescript
// Let next-intl handle locale detection first
const response = intlMiddleware(request)

// If next-intl redirected, return that redirect immediately
if (response.status === 307 || response.status === 308) {
  return response
}

// Only check auth for locale-prefixed routes after intl processing
const firstSegment = pathname.split('/').filter(Boolean)[0]
const isLocale = (routing.locales as readonly string[]).includes(firstSegment)

if (isLocale) {
  // Check auth for protected routes within localized paths
  // ...
}
```

### 2. `app/page.tsx` (NEW)

**Purpose:**
- Fallback redirect handler
- Detects browser language
- Client-side redirect to correct locale
- Shows loading spinner

**Usage:**
```typescript
export default function RootPage() {
  const router = useRouter()
  
  useEffect(() => {
    const browserLang = navigator.language.split('-')[0]
    const supportedLocales = ['en', 'ru', 'zh']
    const locale = supportedLocales.includes(browserLang) ? browserLang : 'en'
    router.replace(`/${locale}`)
  }, [router])
  
  return <LoadingSpinner />
}
```

## Testing

### Test Root URL Redirect

**Local:**
```bash
cd ecommerce-monorepo/web
npm run dev
```

1. Visit `http://localhost:3001/` → Should redirect to `/en/` immediately
2. Browser console → No MIME type errors
3. Page loads homepage content
4. No "Loading..." stuck state

**Production:**
1. Visit `http://dromkok.com` → Should redirect to `http://dromkok.com/en/`
2. Browser console → No errors
3. Page loads correctly

### Test Locale Detection

**Browser Language Testing:**
- English browser → Redirects to `/en/`
- Russian browser → Redirects to `/ru/`
- Chinese browser → Redirects to `/zh/`
- Other language → Falls back to `/en/`

### Test Protected Routes

Should still work with locale prefix:
- `/en/dashboard` → Redirects to `/en/login?redirect=/en/dashboard` (if not authenticated)
- `/ru/dashboard` → Redirects to `/ru/login?redirect=/ru/dashboard`
- `/zh/admin` → Redirects to `/zh/login?redirect=/zh/admin`

### Test Public Routes

Should work in all locales:
- `/en/` → Homepage ✅
- `/ru/` → Homepage ✅
- `/zh/` → Homepage ✅
- `/en/products` → Products page ✅
- `/ru/about` → About page ✅
- `/zh/contact` → Contact page ✅

## Deployment

### Deploy Steps

1. **Test locally:**
   ```bash
   cd ecommerce-monorepo/web
   npm run dev
   ```
   - Test `http://localhost:3001/` → should redirect to `/en/`
   - Check browser console for errors
   - Verify all locales work

2. **Build and test:**
   ```bash
   npm run build
   npm run start
   ```
   - Test production build on port 3001
   - Verify redirect works

3. **Commit changes:**
   ```bash
   git add middleware.ts app/page.tsx ROOT_URL_LOADING_FIX.md
   git commit -m "Fix: Root URL redirect and locale middleware flow"
   git push origin main
   ```

4. **GitHub Actions will deploy**

5. **Test on production:**
   - `http://dromkok.com` → Should redirect to `/en/`
   - `http://dromkok.com/` → Should redirect to `/en/`
   - No loading spinner stuck
   - No console errors

## Technical Details

### Why Order Matters

**Incorrect Order (Before):**
```
Request: /
  ↓
isBypassPath? No
  ↓
authMiddleware → Public? Yes → NextResponse.next()
  ↓
Render app/page.tsx → NOT FOUND → FAIL
```

**Correct Order (After):**
```
Request: /
  ↓
isBypassPath? No
  ↓
intlMiddleware → Redirect 307: / → /en/
  ↓
Check status: 307 → RETURN REDIRECT
  ↓
Browser: GET /en/ → SUCCESS
```

### Middleware Priority

1. **Bypass paths** (APIs, static files, admin, dashboard)
2. **Locale detection** (next-intl middleware)
3. **Auth checking** (only for locale-prefixed protected routes)

### Locale Prefix Strategy

Using `localePrefix: 'always'` in `i18n/routing.ts`:
- Forces all user-facing pages to have locale prefix
- `/products` → redirects to `/en/products`
- `/ru/products` → valid
- `/` → redirects to `/en/`

### Status Code Meanings

- **307 Temporary Redirect**: Preserves request method (GET stays GET)
- **308 Permanent Redirect**: Preserves request method, cacheable
- Used by next-intl for locale redirects

## Troubleshooting

### Issue: Still seeing "Loading..." after deploy

**Check:**
1. Build output - ensure `app/page.tsx` is included
2. Middleware logs - check if intlMiddleware is running
3. Browser network tab - check if redirect (307) is happening

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Issue: Redirect loop

**Check:**
- Middleware isn't creating circular redirects
- `intlMiddleware` returns status 307/308 for root
- `isBypassPath` doesn't include `/`

**Solution:**
Check middleware logic - redirect should only happen once

### Issue: Wrong locale detected

**Check:**
- Browser language settings
- `navigator.language` value
- Fallback to 'en' is working

**Solution:**
Update locale detection logic in `app/page.tsx`

## Related Files

- `middleware.ts` - Main middleware logic
- `app/page.tsx` - Root page fallback
- `i18n/routing.ts` - Locale configuration
- `app/layout.tsx` - Root layout
- `app/[locale]/page.tsx` - Localized homepage

## Prevention

To prevent this issue in the future:

1. **Always test root URL** (`/`) when changing middleware
2. **Check redirect status codes** (307/308) in network tab
3. **Test all three locales** (`/en/`, `/ru/`, `/zh/`)
4. **Never skip intl middleware** for user-facing routes
5. **Keep bypass paths minimal** - only APIs, static files, admin

## Monitoring

After deployment, monitor:

1. **Root URL access**: Check that `/` redirects properly
2. **Error logs**: No 404s for root path
3. **Performance**: Redirect should be instant (<50ms)
4. **User complaints**: No reports of stuck loading

```bash
# Check production logs
tail -f /var/log/nginx/www.dromkok.com_access.log | grep "GET / "
```

Expected pattern:
```
GET / HTTP/1.1" 307 - (redirect to /en/)
GET /en/ HTTP/1.1" 200 - (success)
```

---

**Fix Date:** 2026-08-14  
**Status:** ✅ Complete  
**Impact:** Critical - Root URL now redirects properly  
**Testing:** Test all three locales before deployment
