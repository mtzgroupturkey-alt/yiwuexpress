# Test Admin Users Creation

## Before Testing on Localhost

1. **Start your local development server** (if not already running):
   ```cmd
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run dev
   ```

2. **Open in browser**: http://localhost:3001/admin/users

## Test Case 1: Create ADMIN User (Basic)

This should work without any businessType:

1. Click **"Add User"** button
2. Fill in:
   - **Name**: Test Admin
   - **Email**: testadmin@dromkok.com
   - **Password**: admin123456
   - **Role**: Admin
   - Leave businessType empty
3. Click **"Create User"**
4. **Expected**: Success - user created, modal closes
5. **Previous Behavior**: 400 error if businessType had lowercase value

## Test Case 2: Create SUPPLIER User (With Business Type)

This requires companyName and businessType:

1. Click **"Add User"** button
2. Fill in:
   - **Name**: Test Supplier
   - **Email**: supplier@manufacturer.com
   - **Password**: supplier123456
   - **Company Name**: Test Manufacturing Co.
   - **Business Type**: MANUFACTURER
   - **Role**: Supplier
3. Click **"Create User"**
4. **Expected**: Success - supplier created with company profile
5. **Previous Behavior**: 400 error due to lowercase "manufacturer"

## Test Case 3: Create USER (Regular Customer)

1. Click **"Add User"** button
2. Fill in:
   - **Name**: Test Customer
   - **Email**: customer@example.com
   - **Password**: customer123456
   - **Role**: User
   - Leave businessType and company fields empty
3. Click **"Create User"**
4. **Expected**: Success - regular user created

## What Changed

### ✅ Fixed Values
- MANUFACTURER (was: manufacturer)
- WHOLESALER (was: wholesaler)
- DISTRIBUTOR (was: distributor)

### ❌ Removed Invalid Value
- RETAILER (was: retailer) - not in API enum

### ✅ Better Error Messages
If there's still a validation error, you'll now see:
```
Validation Error:
• email: Invalid email format
• password: Password must be at least 8 characters
```
Instead of just: "Creation failed"

## After Localhost Success

Run this command to sync to production:
```cmd
c:\wamp64\www\yiwuexpress\sync-admin-users-fix.bat
```

Then test on production:
```
https://www.dromkok.com/admin/users
```

## Debugging Tips

### If you still get 400 error:

1. **Check browser console** for exact error message
2. **Check server logs**:
   ```bash
   ssh djdn@39.175.57.2 "pm2 logs dromkok-web --lines 50 --nostream"
   ```
3. **Verify businessType value** in Network tab:
   - Open DevTools → Network tab
   - Create user
   - Click the POST request to `/api/admin/users`
   - Check Request Payload → businessType should be UPPERCASE or empty

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `email: Invalid email` | Wrong email format | Use valid email |
| `password: Password must be at least 8 characters` | Too short | Use 8+ chars |
| `name: String must contain at least 2 character(s)` | Name too short | Use 2+ chars |
| `Company name is required for supplier accounts` | SUPPLIER without company | Add company name |
| `businessType: Invalid enum value` | Wrong businessType | Use UPPERCASE values |

## Verify on Production

After syncing, verify these endpoints work:

1. **Create Admin**: ✅ No company/businessType needed
2. **Create User**: ✅ No company/businessType needed  
3. **Create Supplier**: ✅ Requires company name + valid businessType
4. **Edit User**: ✅ businessType dropdown shows correct values

## Success Criteria

- ✅ No 400 errors when creating users
- ✅ Users appear in the table after creation
- ✅ All three roles work (USER, ADMIN, SUPPLIER)
- ✅ businessType dropdown only shows valid values
- ✅ Validation errors show detailed messages
