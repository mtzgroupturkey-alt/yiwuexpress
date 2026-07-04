# Upload Authentication Updated - COMPLETED ✅

## Issue Fixed
The upload API was using `cookies()` from Next.js which only works in Server Components, not in API routes. Updated to use the proper `getTokenFromRequest` helper function.

## Changes Made

### Updated `/api/admin/upload` Route
**File**: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\upload\route.ts`

**Before**:
```typescript
import { cookies } from 'next/headers'

const cookieStore = cookies()
const token = cookieStore.get('token')?.value
```

**After**:
```typescript
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

const token = getTokenFromRequest(request)
```

### What `getTokenFromRequest` Does

This helper function checks for authentication tokens in multiple places:

1. **First**: Checks httpOnly cookie (`token` cookie)
2. **Second**: Falls back to Authorization header (`Bearer token`)

This makes the API compatible with both cookie-based auth (new) and token-based auth (legacy).

## How to Test

### Step 1: Login as Admin
Go to the login page and use admin credentials:
```
URL: http://localhost:3005/auth/login

Email: admin@yiwuexpress.com
Password: admin123
```

**Important**: Make sure you're logging in as ADMIN role, not as a customer.

### Step 2: Navigate to Admin Panel
After logging in, you should be redirected to:
```
http://localhost:3005/admin
```

### Step 3: Try Uploading an Image
Go to any admin section that allows image upload:

**Option A - Breadcrumbs**:
```
http://localhost:3005/admin/settings/breadcrumbs
```
- Click "Upload Image" on any breadcrumb
- Select an image
- Should upload successfully

**Option B - Products**:
```
http://localhost:3005/admin/products/new
```
- Scroll to "Product Images" section
- Click "Upload from Computer"
- Select one or more images
- Should upload successfully

**Option C - Company Logo**:
```
http://localhost:3005/admin/settings/company
```
- Find "Company Logo" section
- Click "Choose File"
- Select a logo image
- Click "Save Settings"
- Should upload successfully

### Step 4: Verify Upload Works
- Check browser console - should see no 401 or 403 errors
- Image should appear in preview
- Check `/public/uploads/` folder - uploaded files should be there

## Troubleshooting

### Still Getting 401 Error?

**Cause**: Not logged in or session expired

**Solution**:
1. Make sure you're logged in: `http://localhost:3005/auth/login`
2. Use admin credentials (see demo credentials on login page)
3. Check browser cookies - should have a `token` cookie
4. Try logging out and logging back in

### Getting 403 Error?

**Cause**: Logged in but not as admin

**Solution**:
1. You need ADMIN role, not USER or SUPPLIER
2. Log out and login with admin@yiwuexpress.com
3. Check the admin auth endpoint: `http://localhost:3005/api/admin/auth`
4. Should return `{"valid":true,"user":{...}}`

### Session Not Persisting?

**Cause**: Cookie settings or browser restrictions

**Solution**:
1. Check if cookies are enabled in your browser
2. Make sure you're on `localhost:3005` (not just `localhost`)
3. Clear browser cookies and try again
4. Check DevTools → Application → Cookies → `localhost:3005`
5. Should see a `token` cookie

### Upload Works But Image Not Showing?

**Cause**: File path or permissions issue

**Solution**:
1. Check if `/public/uploads/` folder exists
2. Check folder permissions (should be writable)
3. Verify the returned URL path is correct
4. Try accessing the image directly: `http://localhost:3005/uploads/general/filename.jpg`

## Technical Details

### Authentication Flow

```
User Login (admin@yiwuexpress.com)
    ↓
POST /api/auth/login
    ↓
Set httpOnly cookie: token=xyz123
    ↓
Navigate to /admin
    ↓
AdminAuthContext checks: GET /api/admin/auth
    ↓
Upload image: POST /api/admin/upload (cookie sent automatically)
    ↓
getTokenFromRequest(request) → extracts token from cookie
    ↓
verifyToken(token) → validates and decodes
    ↓
Check role === 'ADMIN' → allows upload
    ↓
File saved to /public/uploads/
```

### Cookie Details

**Cookie Name**: `token`  
**Type**: httpOnly (JavaScript cannot access it)  
**Sent**: Automatically with `credentials: 'include'`  
**Contains**: JWT with { userId, email, role, iat, exp }  
**Lifetime**: Based on JWT expiration (typically 7-30 days)

### `getTokenFromRequest` Implementation

```typescript
export function getTokenFromRequest(req: NextRequest | Request): string | null {
  // Try cookie first (httpOnly - secure)
  if ('cookies' in req) {
    const cookieToken = req.cookies.get('token')?.value
    if (cookieToken) return cookieToken
  }

  // Fallback to Authorization header (for API clients, testing)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7)
  }

  return null
}
```

This approach:
✅ Works with cookie-based auth (browsers)  
✅ Works with Bearer tokens (API clients, Postman)  
✅ Consistent across all admin endpoints  
✅ Secure (prefers httpOnly cookies)

## Files Modified

✅ `app/api/admin/upload/route.ts` - Now uses `getTokenFromRequest`

## Related Files (Reference)

- `lib/auth.ts` - Contains `getTokenFromRequest` helper
- `app/api/admin/auth/route.ts` - Admin auth check (uses same method)
- `components/admin/ImageUpload.tsx` - Upload component (sends cookie)
- `components/admin/ProductImageUpload.tsx` - Product upload (sends cookie)

## Demo Credentials

### Admin Account
```
Email: admin@yiwuexpress.com
Password: admin123
```

### Customer Account (won't work for uploads)
```
Email: user@example.com
Password: password123
```

Only ADMIN role can upload images to admin panel.

---
**Date**: July 3, 2026  
**Status**: COMPLETED ✅  
**Result**: Upload authentication now works correctly with `getTokenFromRequest` helper

## Summary

✅ Fixed API to use proper token extraction method  
✅ Compatible with both cookie and Bearer token auth  
✅ Consistent with other admin endpoints  
✅ Works after logging in as admin  
✅ Proper error messages (401 if not logged in, 403 if not admin)

**To use**: Login as admin, then upload images. It will work! 🎉
