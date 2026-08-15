# Login Redirect Fix - Admin Panel Access

## Problem
After logging in at `http://dromkok.com/auth/login?redirect=%2Fadmin`, the page stays on the login page instead of redirecting to the admin panel.

## Root Cause
The login was using `router.push()` which doesn't properly handle redirects in production, especially for protected routes like `/admin`.

## Solution
Changed redirect mechanism from `router.push()` to `window.location.href` for reliable navigation after successful login.

## Changes Made

### 1. `/app/auth/login/page.tsx`
- Changed from `router.push('/admin')` to `window.location.href = '/admin'`
- Properly handles `redirect` query parameter
- Uses full page reload to ensure authentication state is fresh

### 2. `/app/login/page.tsx`  
- Same fix applied for consistency
- Handles redirect parameter properly
- Ensures clean navigation to admin panel

## Deploy to Production

```bash
# SSH into production server
ssh root@YOUR_SERVER

# Update code
cd /root/ecommerce-monorepo/web
git pull origin production

# Build
npm run build

# Restart
pm2 restart ecommerce-monorepo
```

## Test After Deployment

1. Visit: `http://dromkok.com/admin`
2. Should redirect to: `http://dromkok.com/auth/login?redirect=%2Fadmin`
3. Login with admin credentials
4. **Should successfully redirect to admin panel** ✅
5. Admin dashboard should load without errors

## Technical Details

### Why `window.location.href` instead of `router.push()`?

**`router.push()` problems:**
- Client-side navigation
- May not refresh authentication state
- Can cause hydration mismatches
- Sometimes cached by browser

**`window.location.href` benefits:**
- Full page reload
- Fresh authentication check
- Clears any cached state
- More reliable for auth flows

### Redirect Flow

```
User visits /admin (not authenticated)
  ↓
Middleware redirects to /auth/login?redirect=%2Fadmin
  ↓
User enters credentials → Submit
  ↓
API validates and sets httpOnly cookie
  ↓
window.location.href = redirect parameter (/admin)
  ↓
Full page reload with fresh cookie
  ↓
Middleware checks cookie → authenticated ✅
  ↓
Admin panel loads successfully
```

## Files Modified

- `app/auth/login/page.tsx` - Fixed admin redirect
- `app/login/page.tsx` - Fixed redirect handling

## Verification Checklist

After deployment, verify:

- [ ] Can access `/admin` URL
- [ ] Gets redirected to login page
- [ ] After login, successfully reaches admin dashboard
- [ ] No "Internal Server Error"
- [ ] Admin panel displays properly
- [ ] Can navigate within admin panel
- [ ] Logout and login again works

## Rollback Plan

If issues occur:

```bash
cd /root/ecommerce-monorepo/web
git reset --hard HEAD~1
npm run build
pm2 restart ecommerce-monorepo
```

---

**Status:** ✅ Fixed and pushed to GitHub  
**Deploy:** Run the commands above on production server  
**Impact:** Critical - Fixes admin login flow
