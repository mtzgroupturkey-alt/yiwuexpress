# 🧪 TESTING GUIDE - Customer Login & Dashboard

## 🎯 Quick Test Steps

### 1. Start the Development Server

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

Server should start at: `http://localhost:3000`

---

## 🔐 Test Login Flow

### A. Navigate to Login Page
1. Open browser: `http://localhost:3000/login`
2. ✅ Verify: Header is visible
3. ✅ Verify: Breadcrumb shows "Home / Login"
4. ✅ Verify: Footer is visible
5. ✅ Verify: Login form is displayed

### B. Test Invalid Login
1. Enter invalid email: `test@test.com`
2. Enter invalid password: `wrongpassword`
3. Click "Sign In"
4. ✅ Verify: Error message is displayed
5. ✅ Verify: User stays on login page

### C. Test Valid Customer Login
1. Enter valid customer credentials
2. Click "Sign In"
3. ✅ Verify: Redirected to `/dashboard`
4. ✅ Verify: Welcome message shows user name
5. ✅ Verify: Header, Breadcrumb, Footer visible

### D. Test Role-Based Redirect
1. **Admin Login:**
   - Should redirect to `/admin`
   
2. **Supplier Login:**
   - Should redirect to `/dashboard/supplier`
   
3. **Customer Login:**
   - Should redirect to `/dashboard`

### E. Test Redirect Parameter
1. Navigate to: `http://localhost:3000/login?redirect=/dashboard/orders`
2. Login with customer credentials
3. ✅ Verify: Redirected to `/dashboard/orders` (not `/dashboard`)

---

## 🏠 Test Dashboard Pages

### 1. Dashboard Overview (`/dashboard`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard"
- [ ] Welcome message shows user name
- [ ] Stats cards display (Orders, Wishlist, Addresses)
- [ ] Quick action cards are clickable
- [ ] All cards navigate to correct pages
- [ ] "Back to Shop" button works
- [ ] Footer displays correctly

**Actions to Test:**
1. Click "My Orders" → Should go to `/dashboard/orders`
2. Click "Wishlist" → Should go to `/dashboard/wishlist`
3. Click "Profile" → Should go to `/dashboard/profile`
4. Click "Addresses" → Should go to `/dashboard/addresses`
5. Click "Shop Products" → Should go to `/products`
6. Click "Settings" → Should go to `/dashboard/settings`

---

### 2. My Orders (`/dashboard/orders`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard / Orders"
- [ ] Page title "My Orders" visible
- [ ] Back arrow works (returns to `/dashboard`)
- [ ] Search box is functional
- [ ] Footer displays correctly

**With No Orders:**
- [ ] Empty state displays
- [ ] Icon and message shown
- [ ] "Browse Products" button visible
- [ ] Button navigates to `/products`

**With Orders:**
- [ ] Orders list displays
- [ ] Order numbers shown
- [ ] Dates formatted correctly
- [ ] Status badges have colors
- [ ] Total price displays
- [ ] "View Details" link works

**Actions to Test:**
1. Enter order number in search
2. ✅ Verify: Matching orders filter
3. Click "View Details"
4. ✅ Verify: Navigate to order detail page

---

### 3. My Wishlist (`/dashboard/wishlist`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard / Wishlist"
- [ ] Page title shows count: "My Wishlist (X items)"
- [ ] Back arrow works
- [ ] Footer displays correctly

**With No Wishlist Items:**
- [ ] Empty state displays
- [ ] Heart icon shown
- [ ] "Browse Products" button works

**With Wishlist Items:**
- [ ] Products display in grid
- [ ] Product images load
- [ ] Product names display
- [ ] Prices show correctly
- [ ] "Add to Cart" button visible
- [ ] Delete button (🗑️) visible

**Actions to Test:**
1. Click product image → Navigate to product page
2. Click product name → Navigate to product page
3. Click "Add to Cart" → Add product to cart
4. Click delete button → Remove from wishlist
5. ✅ Verify: Item removed and count updated

---

### 4. My Profile (`/dashboard/profile`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard / Profile"
- [ ] Back arrow works
- [ ] Avatar placeholder displays
- [ ] User name shown
- [ ] Email shown (read-only)
- [ ] Role badge displays
- [ ] Form fields populated with user data
- [ ] Footer displays correctly

**Form Fields:**
- [ ] Full Name (editable)
- [ ] Email (disabled/read-only)
- [ ] Phone Number (editable)
- [ ] Country (dropdown with 70+ countries)

**Actions to Test:**
1. Change full name
2. Change phone number
3. Select different country
4. Click "Save Changes"
5. ✅ Verify: Success message displays
6. ✅ Verify: Changes saved
7. Refresh page
8. ✅ Verify: Changes persisted

---

### 5. My Addresses (`/dashboard/addresses`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard / Addresses"
- [ ] Back arrow works
- [ ] "Add Address" button visible
- [ ] Footer displays correctly

**With No Addresses:**
- [ ] Empty state displays
- [ ] Map pin icon shown
- [ ] Message and call-to-action shown
- [ ] "Add Your First Address" button works

**With Addresses:**
- [ ] Addresses display in grid
- [ ] Default address has special styling
- [ ] Default badge shows on default address
- [ ] All address fields visible
- [ ] Edit, Set Default, Delete buttons visible

**Actions to Test - Add Address:**
1. Click "+ Add Address"
2. ✅ Verify: Form displays
3. Fill all required fields:
   - Full Name
   - Phone
   - Address Line 1
   - City
   - Postal Code
   - Country
4. Check "Set as default"
5. Click "Save Address"
6. ✅ Verify: Success message
7. ✅ Verify: Address added to list
8. ✅ Verify: Default badge visible

**Actions to Test - Edit Address:**
1. Click "Edit" on an address
2. ✅ Verify: Form opens with data
3. Modify some fields
4. Click "Update Address"
5. ✅ Verify: Changes saved
6. ✅ Verify: Updated data displays

**Actions to Test - Set Default:**
1. Click "Set Default" on non-default address
2. ✅ Verify: Default badge moves
3. ✅ Verify: Previous default no longer has badge

**Actions to Test - Delete:**
1. Click "Delete" on an address
2. ✅ Verify: Confirmation prompt
3. Confirm deletion
4. ✅ Verify: Address removed
5. ✅ Verify: Success message

---

### 6. Settings (`/dashboard/settings`)

**Checklist:**
- [ ] Header displays correctly
- [ ] Breadcrumb shows "Home / Dashboard / Settings"
- [ ] Back arrow works
- [ ] Two cards display: Change Password & Account Info
- [ ] Footer displays correctly

**Change Password Card:**
- [ ] Current Password field
- [ ] New Password field
- [ ] Confirm Password field
- [ ] Password requirements shown

**Account Info Card:**
- [ ] Account created date
- [ ] Role badge
- [ ] Email display

**Actions to Test - Change Password:**
1. Enter current password
2. Enter new password (min 8 chars)
3. Enter confirm password (matching)
4. Click "Update Password"
5. ✅ Verify: Success message
6. ✅ Verify: Password changed (can login with new password)

**Actions to Test - Password Validation:**
1. Enter mismatched passwords
2. ✅ Verify: Error message "Passwords do not match"
3. Enter short password (<8 chars)
4. ✅ Verify: Error message about minimum length

---

## 🔒 Test Authentication & Security

### A. Unauthenticated Access
1. Open browser in incognito/private mode
2. Navigate to: `http://localhost:3000/dashboard`
3. ✅ Verify: Redirected to `/login?redirect=/dashboard`
4. Navigate to: `http://localhost:3000/dashboard/orders`
5. ✅ Verify: Redirected to `/login?redirect=/dashboard/orders`

### B. Session Persistence
1. Login as customer
2. Navigate to dashboard pages
3. Close browser tab
4. Open new tab
5. Navigate to: `http://localhost:3000/dashboard`
6. ✅ Verify: Still authenticated (not redirected to login)

### C. Logout
1. Login as customer
2. Click user menu in header
3. Click "Logout"
4. ✅ Verify: Redirected to home or login
5. Try to access: `http://localhost:3000/dashboard`
6. ✅ Verify: Redirected to login

### D. Role Protection
1. Login as admin
2. ✅ Verify: Redirected to `/admin` (not dashboard)
3. Manually navigate to: `http://localhost:3000/dashboard`
4. ✅ Verify: Cannot access or redirected

---

## 📱 Test Responsive Design

### Desktop (>1024px)
- [ ] All pages display in full width
- [ ] Grid layouts show 3-4 columns
- [ ] Navigation expanded
- [ ] All features accessible

### Tablet (640-1024px)
- [ ] Grid layouts show 2 columns
- [ ] Navigation may collapse
- [ ] Touch-friendly buttons

### Mobile (<640px)
- [ ] Grid layouts show 1 column
- [ ] Hamburger menu for navigation
- [ ] Stack elements vertically
- [ ] Large touch targets

**Test Each Page:**
1. Open browser dev tools (F12)
2. Toggle device toolbar
3. Test at different sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)
4. ✅ Verify: Layouts adjust correctly

---

## 🎨 Test UI/UX Elements

### Loading States
- [ ] Login button shows spinner when loading
- [ ] Dashboard shows loader while checking auth
- [ ] Pages show loader while fetching data
- [ ] Buttons show "Saving..." during save

### Empty States
- [ ] Orders page empty state
- [ ] Wishlist page empty state
- [ ] Addresses page empty state
- [ ] All have icons and messages
- [ ] All have call-to-action buttons

### Success Feedback
- [ ] Profile save shows success
- [ ] Address save shows success
- [ ] Password change shows success
- [ ] Toast notifications appear and disappear

### Error Handling
- [ ] Login errors show clearly
- [ ] Form validation errors display
- [ ] Network errors handled gracefully
- [ ] User sees helpful error messages

---

## 🐛 Common Issues to Check

### Issue 1: Infinite Redirect Loop
**Symptom:** Page keeps redirecting between login and dashboard
**Check:**
- [ ] useAuth hook checkAuth() not called multiple times
- [ ] Layout useEffect dependencies correct
- [ ] No circular authentication checks

### Issue 2: User Data Not Persisting
**Symptom:** User info lost after refresh
**Check:**
- [ ] Zustand persist middleware configured
- [ ] Browser localStorage enabled
- [ ] No console errors about storage

### Issue 3: Breadcrumb Not Updating
**Symptom:** Breadcrumb shows wrong path
**Check:**
- [ ] Breadcrumb component receives correct props
- [ ] window.location.pathname reads correctly
- [ ] Path segments parsed properly

### Issue 4: 401 Unauthorized Errors
**Symptom:** API calls fail with 401
**Check:**
- [ ] Cookies enabled in browser
- [ ] credentials: 'include' in all API calls
- [ ] Backend sending httpOnly cookie correctly

### Issue 5: Styles Not Loading
**Symptom:** Pages look unstyled
**Check:**
- [ ] Tailwind CSS configured
- [ ] Global CSS imported
- [ ] No CSS class typos

---

## ✅ Final Verification Checklist

### Functionality
- [ ] All login flows work
- [ ] All dashboard pages load
- [ ] All forms submit successfully
- [ ] All navigation links work
- [ ] Authentication guards working
- [ ] Role-based routing working

### UI/UX
- [ ] Header on all pages
- [ ] Breadcrumb on all pages
- [ ] Footer on all pages
- [ ] Loading states display
- [ ] Empty states display
- [ ] Success messages display
- [ ] Error messages display

### Responsive
- [ ] Works on mobile
- [ ] Works on tablet
- [ ] Works on desktop
- [ ] Touch targets adequate
- [ ] Text readable on all sizes

### Security
- [ ] Cannot access dashboard when logged out
- [ ] Roles redirect correctly
- [ ] Passwords hidden (type="password")
- [ ] No tokens in localStorage
- [ ] Logout clears session

### Performance
- [ ] Pages load quickly
- [ ] No console errors
- [ ] No excessive re-renders
- [ ] Images load properly
- [ ] Forms respond instantly

---

## 🚀 Ready for Production?

**ALL ITEMS ABOVE MUST PASS** ✅

If all tests pass, the system is ready for production deployment!

---

## 📞 Troubleshooting

### Problem: Page won't load
1. Check console for errors
2. Verify API is running
3. Check network tab for failed requests
4. Clear browser cache

### Problem: Authentication not working
1. Check browser cookies enabled
2. Verify API credentials endpoint
3. Check httpOnly cookie in network tab
4. Try incognito mode

### Problem: Styles broken
1. Run `npm run dev` again
2. Clear `.next` cache folder
3. Check tailwind.config.js
4. Verify CSS imports

---

**Generated:** July 3, 2026
**Status:** Ready for Testing
