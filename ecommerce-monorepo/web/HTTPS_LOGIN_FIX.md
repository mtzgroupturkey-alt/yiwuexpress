# HTTPS Login Issue - Cookie Not Working

## Problem
Login works but immediately redirects back to login page in an infinite loop:
- User enters credentials → "Loading..." → Back to login page
- URL shows: `http://dromkok.com/auth/login?redirect=%2Fadmin`

## Root Cause
The authentication cookie has `secure: true` flag, which means it ONLY works over HTTPS.

**The issue:**
1. User accesses `http://dromkok.com/auth/login` (HTTP, not HTTPS)
2. Login API sets cookie with `secure: true`
3. Browser REJECTS the cookie because connection is HTTP
4. Redirect to `/admin` fails (no cookie)
5. Middleware redirects back to login
6. **Infinite loop!**

## Solution

### Option 1: Always Use HTTPS (Recommended)

**Make sure users ALWAYS access via HTTPS:**

Access the site as: `https://dromkok.com` (NOT `http://`)

Nginx should already redirect HTTP → HTTPS, but verify it's working:

```bash
# Test HTTP redirect
curl -I http://dromkok.com

# Should show:
# HTTP/1.1 301 Moved Permanently
# Location: https://dromkok.com/
```

### Option 2: Force HTTPS Redirect in Nginx

Add this to your nginx config to ensure ALL requests use HTTPS:

```nginx
# In the HTTP server block (port 80)
server {
    listen 80;
    listen [::]:80;
    server_name www.dromkok.com dromkok.com;

    # Force HTTPS redirect
    return 301 https://$server_name$request_uri;
}
```

### Option 3: Temporarily Disable Secure Cookie (Testing Only)

**⚠️ NOT RECOMMENDED FOR PRODUCTION**

If you need to test over HTTP, temporarily change:

```typescript
// In lib/auth.ts
secure: false, // TEMPORARY - allows HTTP testing
```

**IMPORTANT:** Change it back to `true` for production!

## Verify SSL is Working

1. Check nginx SSL configuration:
```bash
sudo nginx -t
sudo systemctl status nginx
```

2. Test HTTPS access:
```bash
curl -I https://dromkok.com
# Should show: HTTP/2 200
```

3. Check SSL certificate:
```bash
openssl s_client -connect dromkok.com:443 -servername dromkok.com
```

## Correct Login Flow

**✅ Correct (HTTPS):**
```
https://dromkok.com/auth/login
  ↓
User logs in
  ↓
Cookie set with secure: true ✅
  ↓
Browser stores cookie (HTTPS connection)
  ↓
Redirect to https://dromkok.com/admin
  ↓
Cookie sent with request ✅
  ↓
Admin panel loads ✅
```

**❌ Incorrect (HTTP):**
```
http://dromkok.com/auth/login
  ↓
User logs in
  ↓
Cookie set with secure: true
  ↓
Browser REJECTS cookie (HTTP connection) ❌
  ↓
Redirect to http://dromkok.com/admin
  ↓
No cookie sent ❌
  ↓
Middleware redirects to login ❌
  ↓
LOOP!
```

## Quick Fix Steps

### Step 1: Access via HTTPS

Instead of:
```
http://dromkok.com
```

Use:
```
https://dromkok.com
```

### Step 2: Clear Browser Cookies

1. Open DevTools (F12)
2. Go to Application → Cookies
3. Delete `auth_token` cookie
4. Refresh page

### Step 3: Login Again

1. Go to `https://dromkok.com/admin` (HTTPS!)
2. Login with credentials
3. Should redirect to admin panel ✅

## Debugging

### Check if Cookie is Set

1. Open DevTools (F12)
2. Go to Application → Cookies
3. Look for `auth_token` cookie
4. Check properties:
   - ✅ HttpOnly: true
   - ✅ Secure: true
   - ✅ SameSite: Lax
   - ✅ Path: /
   - ✅ Expires: (future date)

### Check Network Request

1. Open DevTools → Network tab
2. Login
3. Look for `/api/auth/login` request
4. Check Response Headers:
   - Should have `Set-Cookie: auth_token=...`
5. Check if cookie has `Secure` flag

### Common Issues

**Issue: Cookie not appearing**
- Accessing via HTTP instead of HTTPS
- Browser blocking third-party cookies
- Nginx not forwarding headers properly

**Issue: Cookie not sent with requests**
- `secure: true` but using HTTP
- `sameSite: strict` blocking cross-origin
- Cookie domain mismatch

**Issue: Still redirecting to login**
- Cookie not being read by middleware
- Token expired or invalid
- Database connection issue

## Production Checklist

Before deploying:

- [ ] Nginx redirects HTTP → HTTPS
- [ ] SSL certificate is valid
- [ ] `NODE_ENV=production` is set
- [ ] `secure: true` in cookie settings
- [ ] Test login at `https://dromkok.com/admin`
- [ ] Verify cookie is set and sent
- [ ] Admin panel loads after login

## Testing Commands

```bash
# Test HTTP redirect
curl -I http://dromkok.com

# Test HTTPS works
curl -I https://dromkok.com

# Test login endpoint
curl -X POST https://dromkok.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  -c cookies.txt -v

# Check if cookie was set
cat cookies.txt
```

---

**Status:** Issue identified - HTTP vs HTTPS  
**Solution:** Always use HTTPS for production  
**Deploy:** No code changes needed if HTTPS is properly configured  
**Quick Fix:** Access via `https://dromkok.com` instead of `http://`
