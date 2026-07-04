# 🧪 USER MENU FIX - QUICK TEST GUIDE

## 🚀 Quick Test (2 Minutes)

### 1. Start Server
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

### 2. Test Login Flow
```
1. Open http://localhost:3005
2. Click "Login" button in header
3. Enter your credentials
4. Click "Login"
```

### 3. Check User Avatar
```
✅ You should see:
   - User avatar with initials (e.g., "JD")
   - User name next to avatar (on desktop)
   - Small dropdown arrow

❌ You should NOT see:
   - "Login" and "Register" buttons
   - Loading spinner for more than 1 second
```

### 4. Test Dropdown
```
1. Click on the user avatar
2. ✅ Dropdown menu should open
3. ✅ Should show:
   - Your name
   - Your email
   - Role badge (Customer/Supplier/Admin)
   - Dashboard link
   - My Orders link
   - My Wishlist link
   - My Profile link
   - My Addresses link
   - Settings link
   - Logout button
```

### 5. Test Navigation
```
1. Click "Dashboard" in dropdown
2. ✅ Should navigate to /dashboard
3. ✅ User avatar should still be visible
4. Click avatar again
5. ✅ Dropdown should open again
```

### 6. Test Refresh
```
1. Press F5 to refresh the page
2. ✅ Should see loading spinner briefly (< 1 second)
3. ✅ User avatar should reappear
4. ✅ You should stay logged in
5. Click avatar
6. ✅ Dropdown should open
```

### 7. Test Logout
```
1. Click user avatar
2. Click "Logout" at bottom of dropdown
3. ✅ Should redirect to homepage
4. ✅ Should see "Login" and "Register" buttons
5. ✅ User avatar should be gone
```

---

## ✅ SUCCESS CHECKLIST

All of these should work:

- [ ] User avatar appears after login
- [ ] Clicking avatar opens dropdown
- [ ] Dropdown shows user info
- [ ] All menu links work
- [ ] Logout works
- [ ] Refresh keeps you logged in
- [ ] No redirect to /login when clicking avatar

---

## 🐛 IF IT DOESN'T WORK

### Quick Fixes to Try:

#### Fix 1: Clear Everything
```javascript
// Open browser console (F12)
// Run these commands:
localStorage.clear()
sessionStorage.clear()
location.reload()
```

#### Fix 2: Check Console
```
1. Open DevTools (F12)
2. Go to Console tab
3. Look for errors
4. Look for: "🔍 UserMenu Debug:" logs
```

#### Fix 3: Check Cookie
```
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Cookies" on left
4. Look for "token" or "auth-token"
5. If missing, login again
```

#### Fix 4: Check API
```
1. Open DevTools (F12)
2. Go to Network tab
3. Refresh page
4. Look for "/api/auth/me" request
5. Should return 200 with user data
```

---

## 🔍 DEBUGGING COMMANDS

### Check Auth State
```javascript
// In browser console:
JSON.parse(localStorage.getItem('auth-storage'))
// Should show: { user: {...}, isAuthenticated: true }
```

### Check Cookie
```javascript
// In browser console:
document.cookie
// Should include: "token=..."
```

### Test API Directly
```javascript
// In browser console:
fetch('/api/auth/me', { credentials: 'include' })
  .then(r => r.json())
  .then(console.log)
// Should return: { data: { id, email, name, role } }
```

---

## 📊 EXPECTED BEHAVIOR

### After Login:
```
1. Login successful
2. Redirect to homepage (or previous page)
3. Header shows user avatar (NOT login buttons)
4. Avatar clickable
5. Dropdown opens on click
```

### After Refresh:
```
1. Page loads
2. Brief loading spinner (< 1 second)
3. User avatar appears
4. Still logged in
5. Dropdown still works
```

### After Logout:
```
1. Logout clicked
2. Redirect to homepage
3. Header shows login/register buttons
4. User avatar gone
5. Can login again
```

---

## ✅ PASS/FAIL

**PASS** if:
- ✅ Avatar shows after login
- ✅ Dropdown opens on avatar click
- ✅ All links in dropdown work
- ✅ Logout works
- ✅ Auth persists on refresh

**FAIL** if:
- ❌ Clicking avatar redirects to /login
- ❌ Avatar doesn't show after login
- ❌ Dropdown doesn't open
- ❌ Auth lost on refresh
- ❌ Infinite loading spinner

---

## 🎯 WHAT WAS FIXED

### Before:
```
Click Avatar → Redirect to /login ❌
```

### After:
```
Click Avatar → Dropdown Opens ✅
```

### Why It Works Now:
1. ✅ Component checks auth with server on mount
2. ✅ Shows loading state while checking
3. ✅ Properly handles hydration
4. ✅ Prevents auth state from being stale

---

## 📞 STILL HAVING ISSUES?

Read the full debugging guide:
- `🔧_USER_MENU_FIX_APPLIED.md`

Common issues and solutions are documented there.

---

**🎉 Fix Applied - Test Now!**
