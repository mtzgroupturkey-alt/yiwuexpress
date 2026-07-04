# 🔧 FIX: Add to Cart Login Redirect Issue

## Issue
When users click "Add to Cart" button, they are redirected to login page. After logging in, they should be redirected back to the product page, but this wasn't working properly.

## Root Cause
The authentication system uses httpOnly cookies (not localStorage tokens). The ProductGrid component was checking for localStorage token which doesn't exist in the cookie-based auth system.

## Solution Applied

### 1. Updated ProductGrid.tsx
**File:** `web/components/products/ProductGrid.tsx`

**Changes:**
- ✅ Removed localStorage token check
- ✅ Added `credentials: 'include'` to send cookies
- ✅ Removed manual userId extraction
- ✅ Improved error handling with proper redirect
- ✅ Better user feedback on failure

**Before:**
```typescript
const token = localStorage.getItem('token')
if (!token) {
  window.location.href = '/login?redirect=/products'
  return
}
const userId = JSON.parse(atob(token.split('.')[1])).userId
```

**After:**
```typescript
const response = await fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include', // Include cookies for auth
  body: JSON.stringify({ productId, quantity: 1 })
})

if (response.status === 401) {
  const currentPath = window.location.pathname
  window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`
  return
}
```

## How It Works Now

### User Flow:
1. **User clicks "Add to Cart"**
2. **Frontend sends request** with `credentials: 'include'` (includes httpOnly cookie)
3. **Backend checks authentication** from cookie (not localStorage)
4. **If not authenticated (401)**:
   - Frontend captures current page URL
   - Redirects to `/login?redirect=/current-page`
5. **User logs in**
   - Login API sets httpOnly cookie
   - useAuth hook updates authentication state
   - User redirected back to original page
6. **User clicks "Add to Cart" again**
   - Now authenticated (cookie present)
   - Item added to cart successfully

## Files Modified

1. ✅ `web/components/products/ProductGrid.tsx` - Fixed add to cart logic

## Already Correct

- ✅ `web/app/products/[slug]/page.tsx` - Already using cookies correctly
- ✅ `web/hooks/useAuth.ts` - Cookie-based authentication
- ✅ `web/app/api/cart/route.ts` - Requires cookie authentication
- ✅ `web/lib/auth.ts` - Handles cookie extraction

## Testing

### Test Add to Cart When Not Logged In:
1. Open browser in incognito/private mode
2. Go to http://localhost:3005/products
3. Click "Add to Cart" on any product
4. Should redirect to `/login?redirect=/products`
5. Log in with valid credentials
6. Should redirect back to `/products`
7. Click "Add to Cart" again
8. Should add to cart successfully ✅

### Test Add to Cart When Logged In:
1. Log in to the website
2. Browse products
3. Click "Add to Cart"
4. Should add to cart immediately ✅
5. Cart count should update ✅

## Additional Improvements Made

1. **Better Error Messages**
   - Shows specific error from API
   - Uses alert() for user feedback (can be replaced with toast)

2. **Preserves Current Page**
   - Redirect parameter includes actual current page
   - User returns to exact location after login

3. **Consistent Pattern**
   - All cart operations now use cookies
   - No mixing of localStorage and cookies

## Future Enhancements (Optional)

1. **Add Toast Notifications**
   ```typescript
   // Install: npm install react-hot-toast
   import toast from 'react-hot-toast'
   
   // Success
   toast.success('Product added to cart!')
   
   // Error
   toast.error(data.error || 'Failed to add to cart')
   ```

2. **Show Login Modal Instead of Redirect**
   - More seamless user experience
   - User doesn't lose current context

3. **Guest Cart Support**
   - Allow adding to cart without login
   - Merge cart after login

## Status
✅ **FIXED** - Add to cart now works correctly with cookie-based authentication

