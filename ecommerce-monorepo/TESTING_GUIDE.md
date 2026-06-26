# 🧪 PHASE 1 TESTING GUIDE

## Prerequisites

Before testing, ensure you've completed:
1. ✅ Run database migration
2. ✅ Regenerate Prisma Client
3. ✅ Restart Next.js server

```bash
cd web
npx prisma migrate dev --name add_phase1_enhanced_models
npx prisma generate
npm run dev
```

---

## 🔐 Test 1: Password Reset Flow

### A. Request Password Reset

**Page:** http://localhost:3001/forgot-password

**Steps:**
1. Navigate to forgot password page
2. Enter email: `admin@yiwuexpress.com`
3. Click "Send Reset Link"
4. Check console for reset URL
5. Verify success message displayed

**Expected Result:**
- ✅ Success message shown
- ✅ Console shows reset URL with token
- ✅ EmailLog created in database

**API Test:**
```bash
curl -X POST http://localhost:3001/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@yiwuexpress.com"}'
```

### B. Reset Password

**Page:** http://localhost:3001/reset-password?token=TOKEN_FROM_CONSOLE

**Steps:**
1. Copy token from console
2. Navigate to reset-password page with token
3. Enter new password (minimum 8 characters)
4. Confirm password
5. Click "Reset Password"
6. Wait for redirect to login

**Expected Result:**
- ✅ Password strength indicator works
- ✅ Password validation enforced
- ✅ Success message shown
- ✅ Redirected to login page
- ✅ Can login with new password
- ✅ ActivityLog created in database

**API Test:**
```bash
curl -X POST http://localhost:3001/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token":"YOUR_TOKEN_HERE",
    "password":"NewPass123!",
    "confirmPassword":"NewPass123!"
  }'
```

---

## 🏢 Test 2: Wholesale Inquiry

**Page:** http://localhost:3001/wholesale

**Steps:**
1. Navigate to wholesale page
2. Fill in company information:
   - Company Name: "Test Wholesale Co"
   - Business Type: "Wholesaler"
   - Country: "United States"
   - Email: "wholesale@test.com"
3. Fill in product requirements:
   - Product Interests: "Electronics and gadgets"
   - Target Quantity: 500
   - Target Price: 25.00
4. Select shipping terms:
   - Payment Terms: "T/T"
   - Shipping Terms: "FOB"
   - Preferred Shipping: "Sea"
5. Add notes (optional)
6. Click "Submit Wholesale Inquiry"

**Expected Result:**
- ✅ Form validation works
- ✅ Success page displayed
- ✅ Wholesale inquiry created in database
- ✅ Console shows inquiry details

**API Test:**
```bash
curl -X POST http://localhost:3001/api/wholesale \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "companyName": "Test Wholesale Co",
    "businessType": "wholesaler",
    "country": "United States",
    "products": [{
      "productName": "Electronics",
      "quantity": 500,
      "targetPrice": 25
    }],
    "paymentTerms": "T/T",
    "shippingTerms": "FOB",
    "preferredShipping": "sea"
  }'
```

---

## 🔄 Test 3: Return Request

**Prerequisites:** Have a delivered order

**Steps:**
1. Login as customer
2. Navigate to order details page
3. Click "Request Return" button
4. Select items to return
5. Choose return reason
6. Add description
7. Submit return request

**Expected Result:**
- ✅ Return request created
- ✅ Order status updated to "RETURN_REQUESTED"
- ✅ Return number generated
- ✅ ActivityLog created

**API Test:**
```bash
curl -X POST http://localhost:3001/api/orders/ORDER_ID/return \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "reason": "damaged",
    "description": "Product arrived damaged",
    "items": [{
      "productId": "PRODUCT_ID",
      "productName": "Test Product",
      "quantity": 1
    }]
  }'
```

---

## 📧 Test 4: Contact Form

**Page:** http://localhost:3001/contact

**Steps:**
1. Navigate to contact page
2. Fill in form:
   - Name: "John Doe"
   - Email: "john@example.com"
   - Subject: "Product Inquiry"
   - Message: "I need information about..."
3. Submit form
4. Check console for submission

**Expected Result:**
- ✅ Form validation works
- ✅ Success message displayed
- ✅ Console shows contact details
- ✅ Rate limiting works (max 3 per minute)

**API Test:**
```bash
curl -X POST http://localhost:3001/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "subject": "Product Inquiry",
    "message": "I need information about bulk orders"
  }'
```

---

## 🗄️ Test 5: Database Verification

### Check New Tables

```sql
-- Connect to PostgreSQL
psql -U postgres -d ecommerce

-- List all tables
\dt

-- Check specific new tables
SELECT * FROM product_variants LIMIT 5;
SELECT * FROM tiered_prices LIMIT 5;
SELECT * FROM returns LIMIT 5;
SELECT * FROM email_logs LIMIT 5;
SELECT * FROM activity_logs LIMIT 10;
```

### Check User Model Updates

```sql
-- Verify resetToken fields exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'User' 
AND column_name IN ('resetToken', 'resetTokenExpiry');
```

### Check Relations

```sql
-- Check CartItem variant relation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'cart_items' 
AND column_name = 'variantId';

-- Check OrderItem variant relation
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items' 
AND column_name = 'variantId';
```

---

## 🎨 Test 6: UI Components (After Installation)

After running `install-ui-components.bat`, verify:

```bash
# Check if components are installed
dir web\components\ui
```

Expected components:
- ✅ button.tsx
- ✅ card.tsx
- ✅ input.tsx
- ✅ label.tsx
- ✅ select.tsx
- ✅ badge.tsx
- ✅ form.tsx (NEW)
- ✅ table.tsx (NEW)
- ✅ dialog.tsx (NEW)
- ✅ tabs.tsx (NEW)
- ✅ alert.tsx (NEW)
- ✅ toast.tsx (NEW)
- ✅ skeleton.tsx (NEW)
- ✅ pagination.tsx (NEW)
- ✅ checkbox.tsx (NEW)
- ✅ radio-group.tsx (NEW)
- ✅ textarea.tsx (NEW)

---

## 🐛 Common Issues & Fixes

### Issue 1: Migration Fails

**Error:** `Migration failed to apply cleanly to the shadow database`

**Solution:**
```bash
npx prisma migrate reset
npx prisma migrate dev --name add_phase1_enhanced_models
```

### Issue 2: Prisma Client Not Updated

**Error:** `Property 'return' does not exist on type 'PrismaClient'`

**Solution:**
```bash
npx prisma generate
# Restart your editor/IDE
```

### Issue 3: 404 on New Pages

**Error:** Pages not found after creation

**Solution:**
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

### Issue 4: Reset Token Not Working

**Error:** "Invalid or expired reset token"

**Solution:**
- Check token hasn't expired (1 hour limit)
- Verify token copied correctly from console
- Check `resetToken` and `resetTokenExpiry` in User table

---

## ✅ Testing Checklist

### Database & Migration
- [ ] Migration ran successfully
- [ ] All 5 new tables exist
- [ ] User table has resetToken fields
- [ ] CartItem has variantId field
- [ ] OrderItem has variantId field

### API Endpoints
- [ ] POST /api/auth/forgot-password works
- [ ] POST /api/auth/reset-password works
- [ ] POST /api/orders/[id]/return works
- [ ] POST /api/contact works
- [ ] POST /api/wholesale works (existing)

### Web Pages
- [ ] /forgot-password page loads
- [ ] /reset-password page loads with token
- [ ] /wholesale page loads
- [ ] All forms validate correctly
- [ ] Success/error messages display

### User Flows
- [ ] Can request password reset
- [ ] Can reset password with valid token
- [ ] Can submit wholesale inquiry
- [ ] Can submit contact form
- [ ] Can request order return

### Database Logs
- [ ] EmailLog entries created
- [ ] ActivityLog entries created
- [ ] Return records created
- [ ] WholesaleInquiry records created

---

## 📊 Success Criteria

All tests pass when:
- ✅ All 5 database tables created successfully
- ✅ Password reset flow works end-to-end
- ✅ Wholesale inquiry submission works
- ✅ Contact form submission works
- ✅ Return request works for delivered orders
- ✅ All pages render without errors
- ✅ Form validations work correctly
- ✅ Database logs are created properly

---

**Test Date:** _______________  
**Tested By:** _______________  
**Status:** ⬜ Pass  ⬜ Fail  ⬜ Partial  
**Notes:** _______________
