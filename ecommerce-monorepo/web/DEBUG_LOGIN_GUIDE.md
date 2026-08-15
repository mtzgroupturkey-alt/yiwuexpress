# Debug Login - Step by Step Guide

## Deploy First

```bash
ssh root@YOUR_SERVER
cd /root/ecommerce-monorepo/web
git pull origin production
npm run build
pm2 restart ecommerce-monorepo
```

## How to Debug

### Step 1: Open Browser Console

1. Press **F12** (or right-click → Inspect)
2. Go to **Console** tab
3. Clear console (click trash icon)

### Step 2: Try to Login

1. Visit: `https://dromkok.com/admin` (USE HTTPS!)
2. Enter credentials
3. Click "Sign In"
4. **Watch the console output**

### Step 3: Check Console Logs

You should see logs like this:

```
[LOGIN] Starting login process...
[LOGIN] Current URL: https://dromkok.com/auth/login?redirect=%2Fadmin
[LOGIN] Protocol: https:
[LOGIN] Calling login API...
[useAuth] Starting login...
[useAuth] Sending POST to /api/auth/login
[useAuth] Response status: 200
[useAuth] Response OK: true
[useAuth] User data received: {id: "...", email: "...", role: "ADMIN"}
[useAuth] Token is in httpOnly cookie
[useAuth] State updated, login complete
[LOGIN] Login successful!
[LOGIN] Using redirect parameter: /admin
[LOGIN] Final redirect URL: /admin
[LOGIN] Performing redirect...
```

### Step 4: Check Server Logs

SSH into server and watch PM2 logs:

```bash
pm2 logs ecommerce-monorepo --lines 100
```

You should see:

```
[API /auth/login] Request received
[API /auth/login] Email: admin@example.com
[API /auth/login] User found: {id: "...", role: "ADMIN"}
[API /auth/login] Password valid: true
[API /auth/login] Token generated
[API /auth/login] Setting cookie...
[API /auth/login] Cookie set successfully
[API /auth/login] Login successful
```

### Step 5: Check Cookies in Browser

1. In DevTools, go to **Application** tab
2. Expand **Cookies** in left sidebar
3. Click on `https://dromkok.com`
4. Look for `auth_token` cookie

Should have:
- **Name:** `auth_token`
- **Value:** (long JWT string)
- **Domain:** `dromkok.com`
- **Path:** `/`
- **Expires:** (future date)
- **HttpOnly:** ✓ (checked)
- **Secure:** ✓ (checked)
- **SameSite:** `Lax`

### Step 6: Check Network Tab

1. Go to **Network** tab in DevTools
2. Clear network log
3. Try login again
4. Look for `/api/auth/login` request
5. Click on it
6. Check **Response Headers**:
   - Should have `set-cookie: auth_token=...`

## Common Issues & Solutions

### Issue 1: "WARNING: Using HTTP in production"

**Console shows:**
```
[LOGIN] WARNING: Using HTTP in production, forcing HTTPS redirect
```

**Solution:**
- Always use `https://dromkok.com` (not `http://`)
- The code will auto-redirect to HTTPS
- Clear browser cache and try again

### Issue 2: Cookie Not Set

**Console shows response but no cookie in Application tab**

**Possible causes:**
1. **Using HTTP instead of HTTPS**
   - Check URL bar, should show lock icon 🔒
   - Use `https://dromkok.com`

2. **Browser blocking cookies**
   - Check browser settings
   - Disable ad blockers temporarily
   - Try incognito mode

3. **Domain mismatch**
   - Check cookie domain matches site domain
   - Should be `dromkok.com`

### Issue 3: Invalid Credentials

**Console shows:**
```
[useAuth] Login failed: {error: "Invalid credentials"}
```

**Solution:**
- Check email/password are correct
- Check user exists in database
- Check user.isActive is true

### Issue 4: Network Error

**Console shows:**
```
[useAuth] Login error: Failed to fetch
```

**Possible causes:**
1. **Server not running**
   ```bash
   pm2 status
   pm2 restart ecommerce-monorepo
   ```

2. **Database connection issue**
   ```bash
   pm2 logs ecommerce-monorepo
   # Look for database errors
   ```

3. **Nginx not proxying correctly**
   ```bash
   sudo nginx -t
   sudo systemctl status nginx
   ```

### Issue 5: Redirect Loop

**Keeps redirecting to login page**

**Check:**
1. **Cookie is set** (Application → Cookies)
2. **Cookie has Secure flag** (should match HTTPS usage)
3. **Middleware is reading cookie**

**Server logs should show:**
```bash
pm2 logs ecommerce-monorepo | grep -i cookie
pm2 logs ecommerce-monorepo | grep -i middleware
```

## Debugging Checklist

Run through this list:

- [ ] Deployed latest code to production
- [ ] Restarted PM2
- [ ] Using HTTPS (https://dromkok.com)
- [ ] Browser console shows all debug logs
- [ ] Server logs show API receiving request
- [ ] User exists in database with correct credentials
- [ ] User.isActive is true
- [ ] Cookie is set in browser (Application tab)
- [ ] Cookie has HttpOnly and Secure flags
- [ ] No CORS errors in console
- [ ] No network errors (500, 404, etc.)

## Share These If Still Not Working

If it still doesn't work, share:

1. **Browser console output** (copy all [LOGIN] and [useAuth] logs)
2. **Server logs** (from pm2 logs)
3. **Cookie details** (screenshot of Application → Cookies)
4. **Network tab** (screenshot of /api/auth/login request)
5. **URL you're accessing** (HTTP or HTTPS?)

## Quick Test Command

Test if API works directly:

```bash
curl -X POST https://dromkok.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwuexpress.com","password":"your_password"}' \
  -v -c cookies.txt

# Check if cookie was set
cat cookies.txt
```

Should show `auth_token` cookie in cookies.txt

---

**Next Steps:**
1. Deploy the code
2. Try login with console open
3. Share the console output if it fails
