# Admin Users Creation - Bug Fix

## Problem
When trying to create admin users from `https://www.dromkok.com/admin/users`, getting:
```
POST https://www.dromkok.com/api/admin/users 400 (Bad Request)
Error: Invalid enum value. Expected 'MANUFACTURER' | 'WHOLESALER' | 'DISTRIBUTOR', received ''
```

## Root Causes

### Issue 1: Lowercase businessType Values
The frontend form had **lowercase** businessType values that don't match the API's **UPPERCASE** enum validation:

**Before (Wrong):**
```typescript
<option value="retailer">Retailer</option>      // ❌ Not in API enum at all!
<option value="wholesaler">Wholesaler</option>  // ❌ Lowercase
<option value="distributor">Distributor</option> // ❌ Lowercase
<option value="manufacturer">Manufacturer</option> // ❌ Lowercase
```

**After (Correct):**
```typescript
<option value="MANUFACTURER">Manufacturer</option> // ✅ Uppercase
<option value="WHOLESALER">Wholesaler</option>    // ✅ Uppercase
<option value="DISTRIBUTOR">Distributor</option>  // ✅ Uppercase
```

### Issue 2: Empty String Sent for Optional Enum
When businessType dropdown is left as "Select type" (empty string), the form sends `businessType: ''` to the API, but Zod enum validation rejects empty strings.

**Before (Wrong):**
```typescript
const createData: any = { ...addFormData }
// businessType: '' is sent to API ❌
```

**After (Correct):**
```typescript
const createData: any = { ...addFormData }
if (!createData.businessType) delete createData.businessType  // ✅ Remove empty fields
if (!createData.companyName) delete createData.companyName
if (!createData.taxId) delete createData.taxId
if (!createData.phone) delete createData.phone
if (!createData.country) delete createData.country
```

## API Validation (Zod Schema)
```typescript
businessType: z.enum(['MANUFACTURER', 'WHOLESALER', 'DISTRIBUTOR']).optional()
```

## Changes Made

### File: `web/app/admin/users/page.tsx`

1. **Fixed Add User Modal** (line ~850-862)
   - Changed businessType dropdown values to UPPERCASE
   - Removed invalid "retailer" option
   - Reordered alphabetically: DISTRIBUTOR, MANUFACTURER, WHOLESALER

2. **Fixed Edit User Modal** (line ~1047-1059)
   - Same changes as Add modal

3. **Fixed handleCreateUser()** (line ~357-368)
   - Remove empty businessType before sending to API
   - Remove empty companyName, taxId, phone, country
   - Prevents Zod enum validation error on empty strings

4. **Fixed handleUpdateUser()** (line ~334-341)
   - Same empty field removal as handleCreateUser

5. **Improved Error Handling** (line ~407-411)
   - Now shows detailed Zod validation errors
   - Displays field path and error message for each validation failure

## Testing Steps

### On Localhost (http://localhost:3001)
1. Navigate to `/admin/users`
2. Click "Add User" button
3. Fill in form:
   - Name: Test Admin
   - Email: testadmin@example.com
   - Password: password123
   - Role: Admin
   - (Optional) Business Type: MANUFACTURER
4. Click "Create User"
5. Should succeed without 400 error

### On Production (https://www.dromkok.com)
1. After syncing changes to server
2. Rebuild Next.js: `npm run build`
3. Restart PM2: `pm2 restart dromkok-web`
4. Test same steps as localhost

## Sync Command

Upload the fixed file to production server:

```cmd
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\users\page.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/users/
```

Then on the server:
```bash
cd /www/wwwroot/www.dromkok.com/web
npm run build
pm2 restart dromkok-web --update-env
```

## Additional Notes

### Related Files (Not Fixed Yet)
These files also have the same issue but are not related to admin user creation:

1. `web/app/auth/register/page.tsx` - User registration form
2. `web/app/wholesale/page.tsx` - Wholesale inquiry form

These should be fixed separately if they cause validation errors.

### Valid businessType Values
According to API schema:
- ✅ MANUFACTURER
- ✅ WHOLESALER
- ✅ DISTRIBUTOR
- ❌ RETAILER (not in API enum)

### Role vs Business Type
- **role**: USER, SUPPLIER, ADMIN (user's account type)
- **businessType**: MANUFACTURER, WHOLESALER, DISTRIBUTOR (only for SUPPLIER role)

When creating SUPPLIER accounts, companyName is required.
