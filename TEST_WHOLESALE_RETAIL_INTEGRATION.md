# 🧪 Testing Guide: Wholesale/Retail Integration

## Quick Test Commands

### Start Development Server
```bash
cd ecommerce-monorepo/web
npm run dev
```

Server will start at: `http://localhost:3001`

---

## 🎯 Test Plan

### Pre-Test Setup
1. Ensure database is running and migrated
2. Start development server (`npm run dev`)
3. Login as admin user
4. Have a test product with both price and wholesalePrice set

---

## Test Suite 1: Admin Settings

### Test 1.1: Access Settings Page
**Steps:**
1. Navigate to `http://localhost:3001/admin/settings/general`
2. Verify page loads without errors
3. Check that three mode cards are displayed:
   - Wholesale Only (B2B)
   - Retail Only (B2C)
   - Both (Hybrid)

**Expected Result:** ✅ Settings page displays correctly with all three options

### Test 1.2: Change to Wholesale Mode
**Steps:**
1. Click "Wholesale Only (B2B)" card
2. Click "Save Changes"
3. Wait for success message

**Expected Result:** ✅ "Settings saved successfully" message appears

### Test 1.3: Change to Retail Mode
**Steps:**
1. Click "Retail Only (B2C)" card
2. Click "Save Changes"
3. Wait for success message

**Expected Result:** ✅ "Settings saved successfully" message appears

### Test 1.4: Change to Both Mode
**Steps:**
1. Click "Both (Hybrid)" card
2. Click "Save Changes"
3. Wait for success message

**Expected Result:** ✅ "Settings saved successfully" message appears

---

## Test Suite 2: Product Page - Wholesale Mode

### Test 2.1: Price Display (Wholesale Mode)
**Setup:** Set mode to "Wholesale Only"
**Steps:**
1. Navigate to a product page (e.g., `/products/test-product`)
2. Check price section

**Expected Results:**
- ✅ Should display wholesale price (if available)
- ✅ Should show "Wholesale Price" badge
- ✅ Should show "Wholesale price - Business customers" text
- ✅ Wholesale pricing card should be visible

### Test 2.2: MOQ Enforcement (Wholesale Mode)
**Setup:** Product with minOrderQty = 10
**Steps:**
1. Check quantity selector
2. Try to decrease quantity below 10
3. Try to manually enter quantity < 10

**Expected Results:**
- ✅ Minimum quantity label shows "(Minimum: 10 units)"
- ✅ Minus button disabled at quantity = 10
- ✅ Cannot enter quantity < 10 in input

### Test 2.3: Add to Cart Validation (Wholesale Mode)
**Setup:** Product with minOrderQty = 10
**Steps:**
1. Set quantity to 10
2. Click "Add to Cart"
3. Check cart

**Expected Results:**
- ✅ Item added successfully
- ✅ Cart shows 10 units
- ✅ Success message appears

### Test 2.4: Cart API Validation (Wholesale Mode)
**Steps:**
1. Open browser console
2. Try to add item with quantity < MOQ via API:
```javascript
fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ productId: 'YOUR_PRODUCT_ID', quantity: 1 })
})
.then(r => r.json())
.then(console.log)
```

**Expected Result:**
- ✅ Returns error: "Minimum order quantity is X units for this product in wholesale mode"
- ✅ Status code: 400

---

## Test Suite 3: Product Page - Retail Mode

### Test 3.1: Price Display (Retail Mode)
**Setup:** Set mode to "Retail Only"
**Steps:**
1. Navigate to product page
2. Check price section

**Expected Results:**
- ✅ Should display retail price
- ✅ Should show "Retail price (excluding taxes)" text
- ✅ Wholesale pricing card should NOT be visible

### Test 3.2: Single Unit Purchase (Retail Mode)
**Setup:** Product with minOrderQty = 10
**Steps:**
1. Check quantity selector
2. Verify initial quantity is 1
3. Check for retail mode message

**Expected Results:**
- ✅ Quantity starts at 1
- ✅ Shows "✓ Retail mode: No minimum required" message
- ✅ Can decrease to 1 unit
- ✅ Minus button disabled at quantity = 1

### Test 3.3: Add Single Item to Cart (Retail Mode)
**Steps:**
1. Set quantity to 1
2. Click "Add to Cart"
3. Check cart

**Expected Results:**
- ✅ Item added successfully with quantity = 1
- ✅ No MOQ error
- ✅ Success message appears

---

## Test Suite 4: Product Page - Both Mode

### Test 4.1: Price Display (Both Mode)
**Setup:** Set mode to "Both (Hybrid)"
**Steps:**
1. Navigate to product page
2. Check price section

**Expected Results:**
- ✅ Should display retail price as primary
- ✅ Should show "Pricing Options:" section
- ✅ Should show both retail and wholesale prices in comparison
- ✅ Should show MOQ for wholesale price
- ✅ Wholesale pricing card visible with "Bulk Order Discount Available" text

### Test 4.2: Flexible Quantity (Both Mode)
**Setup:** Product with minOrderQty = 10
**Steps:**
1. Check quantity selector
2. Verify can select quantity = 1
3. Try adding 1 unit to cart
4. Try adding 10 units to cart

**Expected Results:**
- ✅ Quantity can start at 1
- ✅ Can add 1 unit successfully
- ✅ Can add 10 units successfully
- ✅ Both operations succeed

---

## Test Suite 5: Checkout Form

### Test 5.1: Checkout - Wholesale Mode
**Setup:** Set mode to "Wholesale Only"
**Steps:**
1. Add item to cart
2. Navigate to `/checkout`
3. Proceed to shipping address step

**Expected Results:**
- ✅ Company Name field visible and marked as required (*)
- ✅ "Business Information" section visible
- ✅ Business License field visible
- ✅ Tax ID field visible
- ✅ Tax exemption checkbox visible
- ✅ All fields have blue background styling

### Test 5.2: Checkout - Retail Mode
**Setup:** Set mode to "Retail Only"
**Steps:**
1. Add item to cart
2. Navigate to `/checkout`
3. Check shipping address form

**Expected Results:**
- ✅ Company Name field shows "(Optional)"
- ✅ "Business Information" section NOT visible
- ✅ No business license field
- ✅ No tax ID field
- ✅ No tax exemption checkbox
- ✅ Simple customer form only

### Test 5.3: Checkout - Both Mode
**Setup:** Set mode to "Both (Hybrid)"
**Steps:**
1. Add item to cart
2. Navigate to `/checkout`
3. Check form fields

**Expected Results:**
- ✅ Company Name field visible (optional, not required)
- ✅ "Business Information" section visible
- ✅ Business fields shown but optional
- ✅ No tax exemption checkbox (only in Wholesale mode)

---

## Test Suite 6: Context Provider

### Test 6.1: Store Mode Available Globally
**Steps:**
1. Open browser console on any page
2. Check React DevTools
3. Verify StoreModeProvider is wrapping the app

**Expected Result:** ✅ StoreModeProvider visible in component tree

### Test 6.2: Mode Change Propagation
**Steps:**
1. Change mode in admin settings
2. Navigate to product page (without refresh)
3. Check if pricing updates

**Expected Result:** 
- ✅ Pricing updates reflect new mode
- ⚠️ May require page refresh (expected behavior)

---

## Test Suite 7: API Validation

### Test 7.1: Cart API - Wholesale MOQ Enforcement
**Setup:** Mode = Wholesale, Product MOQ = 10
**API Call:**
```javascript
// This should FAIL
fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ productId: 'PRODUCT_ID', quantity: 5 })
})
```

**Expected Result:**
- ✅ Status: 400
- ✅ Error message includes MOQ requirement
- ✅ Item NOT added to cart

### Test 7.2: Cart API - Retail Single Unit
**Setup:** Mode = Retail, Product MOQ = 10
**API Call:**
```javascript
// This should SUCCEED
fetch('/api/cart', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({ productId: 'PRODUCT_ID', quantity: 1 })
})
```

**Expected Result:**
- ✅ Status: 201
- ✅ Success message
- ✅ Item added to cart with quantity = 1

---

## 🐛 Common Issues & Solutions

### Issue 1: "useStoreMode must be used within a StoreModeProvider"
**Cause:** StoreModeProvider not properly wrapping the app
**Solution:** 
- Check `ecommerce-monorepo/web/app/layout.tsx`
- Verify StoreModeProvider wraps Providers

### Issue 2: Prices not updating after mode change
**Cause:** Page not re-fetching store mode
**Solution:** 
- Refresh the page
- Or call `refreshStoreMode()` from the hook

### Issue 3: MOQ still enforced in retail mode
**Cause:** Using wrong helper function
**Solution:** 
- Ensure using `getEffectiveMinOrderQty()` helper
- Check that storeMode is properly passed

### Issue 4: Business fields not showing/hiding
**Cause:** Store mode not properly detected
**Solution:**
- Check `useStoreMode()` hook is called
- Verify `isWholesale` boolean is used correctly

---

## 📊 Test Result Template

```markdown
## Test Results - [Date]

### Test Suite 1: Admin Settings
- [ ] Test 1.1: Access Settings Page - PASS/FAIL
- [ ] Test 1.2: Change to Wholesale Mode - PASS/FAIL
- [ ] Test 1.3: Change to Retail Mode - PASS/FAIL
- [ ] Test 1.4: Change to Both Mode - PASS/FAIL

### Test Suite 2: Product Page - Wholesale Mode
- [ ] Test 2.1: Price Display - PASS/FAIL
- [ ] Test 2.2: MOQ Enforcement - PASS/FAIL
- [ ] Test 2.3: Add to Cart Validation - PASS/FAIL
- [ ] Test 2.4: Cart API Validation - PASS/FAIL

### Test Suite 3: Product Page - Retail Mode
- [ ] Test 3.1: Price Display - PASS/FAIL
- [ ] Test 3.2: Single Unit Purchase - PASS/FAIL
- [ ] Test 3.3: Add Single Item to Cart - PASS/FAIL

### Test Suite 4: Product Page - Both Mode
- [ ] Test 4.1: Price Display - PASS/FAIL
- [ ] Test 4.2: Flexible Quantity - PASS/FAIL

### Test Suite 5: Checkout Form
- [ ] Test 5.1: Checkout - Wholesale Mode - PASS/FAIL
- [ ] Test 5.2: Checkout - Retail Mode - PASS/FAIL
- [ ] Test 5.3: Checkout - Both Mode - PASS/FAIL

### Test Suite 6: Context Provider
- [ ] Test 6.1: Store Mode Available Globally - PASS/FAIL
- [ ] Test 6.2: Mode Change Propagation - PASS/FAIL

### Test Suite 7: API Validation
- [ ] Test 7.1: Cart API - Wholesale MOQ Enforcement - PASS/FAIL
- [ ] Test 7.2: Cart API - Retail Single Unit - PASS/FAIL

**Overall Status:** PASS/FAIL  
**Notes:** [Any observations or issues]
```

---

## 🎯 Success Criteria

All tests must PASS for integration to be considered complete:
- ✅ All 15 test cases pass
- ✅ No TypeScript errors
- ✅ No console errors
- ✅ Store mode changes apply correctly
- ✅ MOQ enforcement works as expected
- ✅ Checkout form adapts properly
- ✅ API validation prevents invalid operations

---

**Happy Testing! 🚀**
