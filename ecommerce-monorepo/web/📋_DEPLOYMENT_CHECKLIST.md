# 📋 DEPLOYMENT CHECKLIST - User System

## ✅ PRE-DEPLOYMENT

### Environment Setup
- [ ] `.env` file has `JWT_SECRET` set
- [ ] `DATABASE_URL` is configured correctly
- [ ] `JWT_EXPIRES_IN` is set (default: 7d)

### Dependencies
- [ ] All npm packages installed (`npm install`)
- [ ] Prisma CLI available (`npx prisma --version`)
- [ ] Zustand installed
- [ ] Bcrypt & JWT libraries installed

## 🗄️ DATABASE MIGRATION

### Run Migration
```bash
cd web
npx prisma migrate dev --name add-user-roles-supplier-profile
```

- [ ] Migration completed without errors
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database tables created successfully
- [ ] Check tables exist: User, SupplierProfile

### Verify Schema
```bash
npx prisma studio
```

- [ ] User table has new fields:
  - `role` (String, default: "USER")
  - `isActive` (Boolean)
  - `isVerified` (Boolean)
  - `lastLoginAt` (DateTime)
  - `supplierId` (String, nullable)
- [ ] SupplierProfile table exists with all fields
- [ ] Relationships work correctly

## 👤 CREATE TEST USERS

### Create Admin User
Using Prisma Studio or SQL:
- [ ] Email: `admin@yiwu.com`
- [ ] Password: Hashed with bcrypt
- [ ] Role: `ADMIN`
- [ ] isActive: `true`
- [ ] isVerified: `true`

### Test Admin Login
- [ ] Can login at `/login`
- [ ] Redirects to `/admin`
- [ ] User menu shows ADMIN badge (red)

## 🧪 TESTING FLOWS

### Customer Registration Flow
- [ ] Visit `/register`
- [ ] Fill form (name, email, password)
- [ ] Submit → Success
- [ ] Auto-login → Redirect to `/`
- [ ] User menu shows CUSTOMER badge (green)
- [ ] Can access `/dashboard`
- [ ] Can logout

### Supplier Creation Flow
- [ ] Login as admin
- [ ] Go to `/admin/users`
- [ ] Click "Add User"
- [ ] Select Role: SUPPLIER
- [ ] Fill supplier fields:
  - [ ] Company Name
  - [ ] Business Type
  - [ ] Tax ID (optional)
- [ ] Submit → Success
- [ ] Logout admin
- [ ] Login as supplier
- [ ] Redirects to `/dashboard/supplier`
- [ ] User menu shows SUPPLIER badge (blue)
- [ ] Company name displayed

### Admin Creation Flow
- [ ] Login as existing admin
- [ ] Go to `/admin/users`
- [ ] Click "Add User"
- [ ] Select Role: ADMIN
- [ ] Fill basic fields
- [ ] Submit → Success
- [ ] Logout
- [ ] Login as new admin
- [ ] Redirects to `/admin`
- [ ] Has full admin access

## 🔐 SECURITY CHECKS

### Password Security
- [ ] Passwords are hashed (not plain text in DB)
- [ ] Bcrypt salt rounds = 10
- [ ] Password minimum length enforced (6 chars)

### JWT Tokens
- [ ] Tokens are generated on login
- [ ] Token stored in localStorage
- [ ] Token includes user ID, email, role
- [ ] Token expires after 7 days
- [ ] Token validated on protected routes

### Session Management
- [ ] Logout clears localStorage
- [ ] Logout clears auth state
- [ ] Protected pages check auth
- [ ] Role-based access enforced

## 🎨 UI/UX CHECKS

### User Menu
- [ ] Shows user avatar/icon
- [ ] Displays user name
- [ ] Displays email
- [ ] Shows correct role badge:
  - Customer → Green "CUSTOMER"
  - Supplier → Blue "SUPPLIER"  
  - Admin → Red "ADMIN"
- [ ] Menu items appropriate for role
- [ ] Logout button works
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on ESC key

### Dashboards
- [ ] Customer Dashboard (`/dashboard`)
  - [ ] Shows stats cards
  - [ ] Has quick action links
  - [ ] Orders link present
  - [ ] Wishlist link present
- [ ] Supplier Dashboard (`/dashboard/supplier`)
  - [ ] Shows company name
  - [ ] Shows business type badge
  - [ ] Has stats overview
  - [ ] Has quick actions
- [ ] Admin Panel (`/admin`)
  - [ ] Can access user management
  - [ ] Can list users
  - [ ] Can create users

### Responsive Design
- [ ] Header works on mobile
- [ ] User menu works on mobile
- [ ] Dashboards are responsive
- [ ] Forms work on mobile
- [ ] No horizontal scroll

## 📱 BROWSER TESTING

### Desktop
- [ ] Chrome/Edge - Works
- [ ] Firefox - Works
- [ ] Safari - Works

### Mobile
- [ ] Chrome Mobile - Works
- [ ] Safari iOS - Works
- [ ] Samsung Internet - Works

## 🔄 API ENDPOINT TESTING

### Public Endpoints
```bash
# Test Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@test.com","password":"test123"}'
```
- [ ] Returns token and user
- [ ] User created in database

```bash
# Test Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```
- [ ] Returns token and user
- [ ] Role included in response

### Protected Endpoints
```bash
# Test Get Current User
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```
- [ ] Returns user details
- [ ] Includes supplier profile if applicable

### Admin Endpoints
```bash
# Test List Users
curl http://localhost:3000/api/admin/users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
- [ ] Returns paginated users
- [ ] Includes counts
- [ ] Search/filter works

```bash
# Test Create User
curl -X POST http://localhost:3000/api/admin/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{"name":"New User","email":"new@test.com","password":"pass123","role":"USER"}'
```
- [ ] User created successfully
- [ ] Returns user object

## 🚨 ERROR HANDLING

### Test Error Cases
- [ ] Wrong password → Shows error
- [ ] Non-existent email → Shows error
- [ ] Duplicate email registration → Shows error
- [ ] Missing required fields → Shows error
- [ ] Invalid token → Returns 401
- [ ] Expired token → Returns 401
- [ ] Inactive account → Cannot login
- [ ] Wrong role accessing admin → Redirects

## 📊 PERFORMANCE CHECKS

### Page Load Times
- [ ] Login page < 2s
- [ ] Register page < 2s
- [ ] Dashboard < 3s
- [ ] Admin users list < 3s

### API Response Times
- [ ] Login API < 500ms
- [ ] Register API < 500ms
- [ ] Get user API < 200ms
- [ ] List users API < 1s

## 🔍 CONSOLE CHECKS

### Browser Console
- [ ] No errors on page load
- [ ] No errors on login
- [ ] No errors on registration
- [ ] No errors on logout
- [ ] No React warnings

### Server Console
- [ ] No database errors
- [ ] No JWT errors
- [ ] No Prisma errors
- [ ] Successful auth logs visible

## 📝 DOCUMENTATION REVIEW

### Check Files Exist
- [ ] 🎯_USER_SYSTEM_IMPLEMENTATION_COMPLETE.md
- [ ] 🚀_NEXT_STEPS_USER_SYSTEM.md
- [ ] ⚡_QUICK_COMMANDS.md
- [ ] 🎯_SYSTEM_ARCHITECTURE.md
- [ ] ✅_IMPLEMENTATION_SUMMARY.md
- [ ] 📋_DEPLOYMENT_CHECKLIST.md (this file)

### Documentation is Clear
- [ ] Setup instructions are clear
- [ ] Commands are correct for platform
- [ ] Examples are accurate
- [ ] Diagrams are helpful

## 🚀 PRODUCTION READINESS

### Before Going Live
- [ ] Change JWT_SECRET to secure random string
- [ ] Set secure cookie flags
- [ ] Enable HTTPS only
- [ ] Set up rate limiting
- [ ] Configure CORS properly
- [ ] Enable error logging
- [ ] Set up monitoring
- [ ] Create admin user
- [ ] Test all flows in production
- [ ] Have rollback plan ready

### Post-Deployment
- [ ] Monitor error logs
- [ ] Check user registrations working
- [ ] Verify logins working
- [ ] Test all three roles
- [ ] Monitor performance
- [ ] Check for security issues

## ✅ FINAL CHECKLIST

### Core Functionality
- [ ] ✅ Users can register (customers)
- [ ] ✅ Users can login (all roles)
- [ ] ✅ Role-based redirects work
- [ ] ✅ User menu shows correct info
- [ ] ✅ Dashboards are accessible
- [ ] ✅ Admin can create users
- [ ] ✅ Suppliers have profiles
- [ ] ✅ Logout works correctly

### Quality Checks
- [ ] ✅ No console errors
- [ ] ✅ No security vulnerabilities
- [ ] ✅ Responsive design works
- [ ] ✅ Forms validate properly
- [ ] ✅ Error messages are clear
- [ ] ✅ Loading states are shown

### Documentation
- [ ] ✅ Setup guide available
- [ ] ✅ API docs available
- [ ] ✅ Architecture docs available
- [ ] ✅ Quick reference available

## 🎊 DEPLOYMENT SIGN-OFF

### Ready for Production When:
- [ ] All tests pass
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring in place
- [ ] Rollback plan ready

### Deployment Approved By:
- [ ] Developer: ________________
- [ ] Tech Lead: ________________
- [ ] QA: ________________
- [ ] Product Manager: ________________

### Deployment Date: ________________
### Deployment Time: ________________

---

**Checklist Status:** Ready for Execution
**Last Updated:** 2026-07-03
