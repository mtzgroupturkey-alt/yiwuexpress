# 🚀 USER MENU & DASHBOARD - QUICK TEST GUIDE

## ⚡ START THE SERVER

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

Server should start at: **http://localhost:3005**

---

## 🧪 TESTING SEQUENCE

### ✅ STEP 1: Check UserMenu in Header (Logged Out)
1. Open http://localhost:3005
2. Look at top-right corner of header
3. ✅ Should see: **Login** and **Register** buttons

### ✅ STEP 2: Login
1. Click "Login" button
2. Enter credentials:
   - **Email**: (your test user email)
   - **Password**: (your test password)
3. Click "Login"
4. ✅ Should redirect to homepage

### ✅ STEP 3: Check UserMenu (Logged In)
1. Look at top-right corner of header
2. ✅ Should see: **User avatar with initials**
3. ✅ Should see: **User name** (on desktop)
4. ✅ Should see: **Dropdown arrow**

### ✅ STEP 4: Test Dropdown Menu
1. Click on user avatar
2. ✅ Dropdown should open
3. ✅ Should show:
   - User name
   - Email address
   - Role badge (Customer/Supplier/Admin)
   - Dashboard link
   - My Orders link
   - My Wishlist link (with count badge if items exist)
   - My Profile link
   - My Addresses link
   - Settings link
   - Logout button

### ✅ STEP 5: Test Dashboard
1. Click "Dashboard" in dropdown
2. ✅ Should navigate to `/dashboard`
3. ✅ Should see:
   - Stats cards (Orders, Wishlist, Addresses)
   - Quick action cards
   - Recent activity section

### ✅ STEP 6: Test My Orders
1. Click "My Orders" in UserMenu dropdown (or from dashboard)
2. ✅ Should navigate to `/dashboard/orders`
3. ✅ Should see:
   - Page header with "My Orders"
   - Search bar
   - Order list (or empty state)
   - Order status badges

### ✅ STEP 7: Test My Wishlist
1. Click "My Wishlist" in UserMenu dropdown
2. ✅ Should navigate to `/dashboard/wishlist`
3. ✅ Should see:
   - Page header with item count
   - Grid of wishlist items (or empty state)
   - Product images
   - "Add to Cart" and "Remove" buttons

### ✅ STEP 8: Test My Profile
1. Click "My Profile" in UserMenu dropdown
2. ✅ Should navigate to `/dashboard/profile`
3. ✅ Should see:
   - Profile form with current data
   - Name field (editable)
   - Email field (read-only)
   - Phone field (editable)
   - Country dropdown (editable)
   - "Save Changes" button
4. **TEST UPDATE**:
   - Change your name
   - Click "Save Changes"
   - ✅ Should show success toast
   - ✅ Should see updated name in UserMenu

### ✅ STEP 9: Test My Addresses
1. Click "My Addresses" in UserMenu dropdown
2. ✅ Should navigate to `/dashboard/addresses`
3. ✅ Should see:
   - "Add Address" button
   - Address list (or empty state)
4. **TEST ADD ADDRESS**:
   - Click "Add Address"
   - Fill in form:
     - Full Name: John Doe
     - Phone: +1234567890
     - Address: 123 Main St
     - City: New York
     - Postal Code: 10001
     - Country: United States
     - Check "Set as default"
   - Click "Save Address"
   - ✅ Should show success toast
   - ✅ Should see new address in list
5. **TEST EDIT ADDRESS**:
   - Click "Edit" on an address
   - Change city name
   - Click "Update Address"
   - ✅ Should show success toast
6. **TEST DELETE ADDRESS**:
   - Click "Delete" on an address
   - Confirm deletion
   - ✅ Should remove from list

### ✅ STEP 10: Test Settings
1. Click "Settings" in UserMenu dropdown
2. ✅ Should navigate to `/dashboard/settings`
3. ✅ Should see 4 tabs:
   - General
   - Security
   - Notifications
   - Preferences

#### Test General Tab
1. Already on "General" tab
2. ✅ Should see name, email, phone fields
3. Update name or phone
4. Click "Save Changes"
5. ✅ Should show success toast

#### Test Security Tab
1. Click "Security" tab
2. ✅ Should see password change form
3. **TEST PASSWORD CHANGE**:
   - Current Password: (your current password)
   - New Password: TestPassword123
   - Confirm New Password: TestPassword123
   - Click "Update Password"
   - ✅ Should show success toast
   - **NOTE**: Remember new password for next login!

#### Test Notifications Tab
1. Click "Notifications" tab
2. ✅ Should see notification checkboxes:
   - Order Updates
   - Promotions
   - Newsletter
   - Email Notifications
3. Toggle some checkboxes
4. Click "Save Preferences"
5. ✅ Should show success toast

#### Test Preferences Tab
1. Click "Preferences" tab
2. ✅ Should see:
   - Language dropdown
   - Currency dropdown
   - Account info (creation date, role)
3. Change language or currency
4. Click "Save Preferences"
5. ✅ Should show success toast

### ✅ STEP 11: Test Logout
1. Click user avatar to open dropdown
2. Click "Logout" button
3. ✅ Should redirect to homepage
4. ✅ Should see "Login" and "Register" buttons again
5. ✅ UserMenu dropdown should be gone

---

## 🔍 VISUAL CHECKLIST

### Header Integration ✅
- [ ] UserMenu visible in header (logged in)
- [ ] Login/Register buttons visible (logged out)
- [ ] Avatar shows user initials
- [ ] Dropdown animation smooth
- [ ] Dropdown closes on outside click
- [ ] Dropdown closes on route change

### Dashboard Pages ✅
- [ ] Dashboard overview loads correctly
- [ ] Stats cards display properly
- [ ] Quick action cards work
- [ ] All navigation links work

### Orders Page ✅
- [ ] Order list displays
- [ ] Search works
- [ ] Status badges colored correctly
- [ ] Empty state shows if no orders

### Wishlist Page ✅
- [ ] Wishlist items display in grid
- [ ] Product images load
- [ ] "Add to Cart" button works
- [ ] "Remove" button works
- [ ] Empty state shows if no items

### Profile Page ✅
- [ ] Form pre-fills with user data
- [ ] Email field is disabled
- [ ] Country dropdown works
- [ ] Save updates database
- [ ] Success message appears

### Addresses Page ✅
- [ ] Address list displays
- [ ] Add form works
- [ ] Edit form works
- [ ] Delete works with confirmation
- [ ] Default badge shows
- [ ] "Set Default" button works

### Settings Page ✅
- [ ] All 4 tabs accessible
- [ ] General tab saves
- [ ] Password change works
- [ ] Notifications save
- [ ] Preferences save

---

## 🐛 COMMON ISSUES & FIXES

### Issue: "Unauthorized" Error
**Fix**: 
- Make sure you're logged in
- Check if JWT token is valid
- Clear cookies and login again

### Issue: Pages Not Loading
**Fix**:
- Check console for errors
- Verify API routes exist
- Check database connection

### Issue: Address Not Saving
**Fix**:
- Check if Address model exists in Prisma schema
- Run `npx prisma generate`
- Check API route `/api/addresses/route.ts` exists

### Issue: Password Change Fails
**Fix**:
- Verify current password is correct
- Check new password meets requirements (min 8 chars)
- Check API route `/api/auth/password/route.ts` exists

### Issue: Wishlist Count Not Updating
**Fix**:
- Check if `useWishlist` hook is imported correctly
- Verify `/api/wishlist` route works
- Check React Query cache invalidation

---

## 🎯 SUCCESS CRITERIA

You should be able to:
- ✅ See UserMenu in header after login
- ✅ Open dropdown and see all menu items
- ✅ Navigate to all dashboard pages
- ✅ View your orders
- ✅ Manage your wishlist
- ✅ Update your profile
- ✅ Add/edit/delete addresses
- ✅ Change your password
- ✅ Update preferences
- ✅ Logout successfully

---

## 📊 API ENDPOINT TESTING

You can also test API endpoints directly using curl or Postman:

```bash
# Get Orders
curl http://localhost:3005/api/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Wishlist
curl http://localhost:3005/api/wishlist \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Get Addresses
curl http://localhost:3005/api/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update Profile
curl -X PUT http://localhost:3005/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name","phone":"+1234567890","country":"US"}'

# Change Password
curl -X PUT http://localhost:3005/api/auth/password \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"currentPassword":"old","newPassword":"newpass123"}'

# Create Address
curl -X POST http://localhost:3005/api/addresses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fullName":"John Doe",
    "phone":"+1234567890",
    "addressLine":"123 Main St",
    "city":"New York",
    "state":"NY",
    "postalCode":"10001",
    "country":"US",
    "isDefault":true
  }'
```

---

## ✅ FINAL CHECK

After completing all tests:
- [ ] All pages load without errors
- [ ] All forms work correctly
- [ ] All buttons perform actions
- [ ] All API calls succeed
- [ ] No console errors
- [ ] Responsive on mobile
- [ ] Smooth animations
- [ ] Toast notifications appear

---

**🎉 If all checks pass, the User Menu & Dashboard implementation is complete and ready for production!**
