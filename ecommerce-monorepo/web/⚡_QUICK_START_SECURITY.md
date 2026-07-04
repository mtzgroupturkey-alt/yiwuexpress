# ⚡ QUICK START - Security Testing

**Use this guide to quickly test all security features**

---

## 🚀 INSTANT TEST COMMANDS

### 1. Test Authentication (httpOnly Cookies)
```bash
# Login and check for httpOnly cookie
curl -v -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwu.com","password":"admin123"}'

# Look for: Set-Cookie: auth_token=...; HttpOnly; SameSite=Lax
# Check response has NO "token" field in JSON

# Use cookie for authenticated request
curl -b cookies.txt http://localhost:3000/api/auth/me
```

**✅ Expected:** Cookie set, no token in response

---

### 2. Test IDOR Protection
```bash
# Create 2 test users first, then:

# Login as User A
curl -c user_a.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@test.com","password":"password123"}'

# Try to access User B's order (replace ORDER_ID)
curl -b user_a.txt http://localhost:3000/api/orders/USER_B_ORDER_ID
```

**✅ Expected:** 403 Forbidden

---

### 3. Test Rate Limiting
```bash
# Trigger login rate limit (5 attempts per 15 min)
for i in {1..6}; do
  echo "Attempt $i:"
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrongpassword"}'
  echo "\n"
done
```

**✅ Expected:** 6th attempt returns 429 Too Many Requests

---

### 4. Test Role-Based Access
```bash
# Test guest redirect
curl -v http://localhost:3000/admin
# Expected: 302 redirect to /login

# Login as regular user
curl -c user.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'

# Try to access admin API
curl -b user.txt http://localhost:3000/api/admin/users
```

**✅ Expected:** 403 Forbidden

---

### 5. Test Admin Protection
```bash
# Login as admin
curl -c admin.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwu.com","password":"admin123"}'

# Get admin user ID
curl -b admin.txt http://localhost:3000/api/auth/me

# Try to delete own account (replace ADMIN_ID)
curl -X DELETE -b admin.txt http://localhost:3000/api/admin/users/ADMIN_ID
```

**✅ Expected:** 403 "Cannot delete your own account"

---

### 6. Test Password Security
```bash
# Get any user data
curl -b admin.txt http://localhost:3000/api/admin/users
```

**✅ Expected:** NO "password" field in response

---

### 7. Test Account Enumeration Prevention
```bash
# Try duplicate email registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwu.com","password":"password123","name":"Test"}'

# Try login with non-existent email
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notexist@test.com","password":"anything"}'
```

**✅ Expected:** Generic errors, not "Email already exists" or "Email not found"

---

### 8. Test Cart IDOR Protection
```bash
# Login as User A
curl -c user_a.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@test.com","password":"password123"}'

# Add item to User A's cart
curl -b user_a.txt -X POST http://localhost:3000/api/cart \
  -H "Content-Type: application/json" \
  -d '{"productId":"PRODUCT_ID","quantity":1}'

# Login as User B
curl -c user_b.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"userb@test.com","password":"password123"}'

# Try to modify User A's cart item (replace ITEM_ID)
curl -b user_b.txt -X PUT http://localhost:3000/api/cart/USER_A_ITEM_ID \
  -H "Content-Type: application/json" \
  -d '{"quantity":100}'
```

**✅ Expected:** 403 Forbidden

---

### 9. Test Health Check
```bash
curl http://localhost:3000/api/health
```

**✅ Expected:** 200 OK with status "healthy"

---

### 10. Test Environment Validation
```bash
# Remove JWT_SECRET from .env temporarily
# Restart server
npm run dev
```

**✅ Expected:** Server fails to start with error about JWT_SECRET

---

## 📋 QUICK CHECKLIST

Run through this checklist to verify all security features:

### Authentication
- [ ] Login sets httpOnly cookie
- [ ] Login response has NO token field
- [ ] Logout clears cookie
- [ ] Cookie has HttpOnly flag
- [ ] Cookie has SameSite=Lax
- [ ] Cookie has Secure in production

### IDOR Protection
- [ ] User A cannot view User B's orders
- [ ] User A cannot modify User B's cart
- [ ] User A cannot delete User B's cart items
- [ ] Admin CAN view all users' data

### Rate Limiting
- [ ] 6th failed login returns 429
- [ ] Response includes Retry-After header
- [ ] Can login after waiting 15 minutes
- [ ] Admin API rate limited (30/min)

### Authorization
- [ ] Guest → /admin redirects to /login
- [ ] USER → /admin redirects to /dashboard
- [ ] SUPPLIER → /admin redirects to /dashboard/supplier
- [ ] ADMIN → /admin shows admin panel
- [ ] Regular user → admin API returns 403

### Admin Protection
- [ ] Admin cannot delete own account
- [ ] Cannot delete last admin
- [ ] User with orders → soft delete
- [ ] User without orders → hard delete

### Data Security
- [ ] No password in any response
- [ ] Registration → always creates USER role
- [ ] Duplicate email → generic error
- [ ] Wrong password → generic error

### Deployment
- [ ] Health check working
- [ ] Environment validation working
- [ ] App fails if JWT_SECRET missing

---

## 🐛 TROUBLESHOOTING

### "401 Unauthorized"
```bash
# Check if cookie is being sent
curl -v -b cookies.txt http://localhost:3000/api/orders
# Look for: Cookie: auth_token=...

# If no cookie, re-login
curl -c cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@test.com","password":"password123"}'
```

### "429 Too Many Requests"
```bash
# Wait 15 minutes (login) or 1 hour (registration)
# Or restart server to clear in-memory rate limits
```

### "403 Forbidden"
```bash
# Check user role
curl -b cookies.txt http://localhost:3000/api/auth/me

# Expected roles:
# USER → /dashboard, /orders, /cart
# SUPPLIER → /dashboard/supplier
# ADMIN → /admin, /api/admin/*
```

### No httpOnly Cookie
```bash
# Check middleware is running
# Check cookie name is "auth_token"
# Check Set-Cookie header in login response
curl -v -X POST http://localhost:3000/api/auth/login ...
```

---

## 💡 TESTING TIPS

### Create Test Users
```bash
# Create regular user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"usera@test.com","password":"password123","name":"User A"}'

# Create another user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"userb@test.com","password":"password123","name":"User B"}'

# Admin already exists (from seed):
# Email: admin@yiwu.com
# Password: admin123
```

### Test with Different Browsers
- Chrome → Check Application tab → Cookies
- Firefox → Check Storage tab → Cookies
- Look for: auth_token with HttpOnly flag

### Use Postman/Insomnia
1. Import requests
2. Enable cookie jar
3. Login first
4. Cookies auto-sent on subsequent requests

---

## 🚀 QUICK DEPLOYMENT TEST

After deploying to staging:

```bash
# Replace localhost with your staging URL
STAGING_URL="https://staging.yourdomain.com"

# 1. Health check
curl $STAGING_URL/api/health

# 2. Login test
curl -c cookies.txt -X POST $STAGING_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwu.com","password":"admin123"}'

# 3. Check secure flag
# Look for: Set-Cookie: auth_token=...; Secure; HttpOnly

# 4. Test protected route
curl -b cookies.txt $STAGING_URL/api/admin/users
```

---

## 📚 NEED MORE DETAIL?

- **Full Testing Guide:** See `✅_TASK_2_COMPLETE_SUMMARY.md`
- **Security Details:** See `🔒_SECURITY_HARDENING_COMPLETE.md`
- **Implementation:** See `📋_CONTEXT_TRANSFER_SECURITY.md`
- **Navigation:** See `📖_SECURITY_INDEX.md`

---

**⚡ This is your quick reference for testing security features!**

**Status:** Ready to test  
**Time Required:** ~15 minutes for full checklist  
**Prerequisites:** Server running on localhost:3000

