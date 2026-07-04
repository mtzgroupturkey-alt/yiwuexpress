# 🐛 DEBUGGING AUTH ISSUE

## Problem
After login, user icon in navbar still doesn't show user menu.

## Steps to Debug

### 1. Check Browser Console
After logging in, open browser console (F12) and check:
- Are there any errors?
- Check Application → Cookies → localhost
- Is there an `auth_token` cookie?
- Is the `HttpOnly` flag checked?

### 2. Check Network Tab
After login:
1. Go to Network tab
2. Find the `/api/auth/login` request
3. Check Response:
   - Should have `{user: {...}}` 
   - Should NOT have `token` in response body
4. Check Response Headers:
   - Should have `Set-Cookie: auth_token=...`

### 3. Check Auth State
Open browser console and type:
```javascript
// Check if auth cookie exists
document.cookie

// Test auth endpoint
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Auth response:', d))
```

### 4. Check if UserMenu Component Loads
In browser console:
```javascript
// Check if user is authenticated (Zustand store)
localStorage.getItem('auth-storage')
```

## Expected Behavior

### After Successful Login:
1. `/api/auth/login` returns `{user: {...}}`
2. Cookie `auth_token` is set (HttpOnly)
3. `useAuth` hook updates `isAuthenticated = true`
4. `UserMenu` component shows user dropdown
5. Navbar shows user avatar instead of Login/Register

## Possible Issues

### Issue 1: Cookie Not Being Set
**Symptom:** No `auth_token` cookie in Application tab
**Fix:** Check `lib/auth.ts` setAuthCookie function

### Issue 2: Cookie Not Being Sent
**Symptom:** Cookie exists but `/api/auth/me` returns 401
**Fix:** Check `credentials: 'include'` in fetch calls

### Issue 3: Auth State Not Updating
**Symptom:** Cookie works but navbar doesn't update
**Fix:** Check `useAuth` hook and navbar integration

### Issue 4: Response Format Mismatch
**Symptom:** `/api/auth/me` returns data but `useAuth` doesn't parse it
**Fix:** Check response format matches `{data: user}` or `{user}`

## Quick Test Commands

Run these in browser console after login:

```javascript
// 1. Check cookie
console.log('Cookies:', document.cookie)

// 2. Test auth endpoint
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(d => console.log('Auth Check:', d))
  .catch(e => console.error('Auth Error:', e))

// 3. Check Zustand state
const authState = JSON.parse(localStorage.getItem('auth-storage') || '{}')
console.log('Auth State:', authState)

// 4. Test login flow
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    email: 'admin@yiwuexpress.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(d => console.log('Login Result:', d))
.then(() => fetch('/api/auth/me', { credentials: 'include' }))
.then(r => r.json())
.then(d => console.log('Auth After Login:', d))
```

## Action Plan

1. **TEST 1:** Login and check browser console for errors
2. **TEST 2:** Check if cookie is set (Application tab)
3. **TEST 3:** Run quick test commands above
4. **TEST 4:** Check Network tab for failed requests
5. **REPORT:** Share console output and any errors you see

## What To Look For

### ✅ Success Indicators:
- Cookie `auth_token` exists and is HttpOnly
- `/api/auth/me` returns `{data: {id, email, name, role, ...}}`
- No 401 errors in console
- `localStorage.getItem('auth-storage')` shows `isAuthenticated: true`
- UserMenu renders with user data

### ❌ Failure Indicators:
- No `auth_token` cookie
- `/api/auth/me` returns 401
- Console errors about authentication
- `isAuthenticated` is false in Zustand store
- UserMenu shows Login/Register buttons

---

**PLEASE RUN THE TESTS ABOVE AND SHARE:**
1. Any console errors
2. Contents of `auth_token` cookie (yes/no, don't share actual value)
3. Response from `/api/auth/me`
4. Contents of `auth-storage` in localStorage
