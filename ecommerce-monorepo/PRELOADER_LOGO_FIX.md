# Preloader Logo Fix - Admin Uploaded Logo Display

## Issue
The preloader was not showing the logo uploaded by users in the admin panel (Company Info settings).

## Root Cause Analysis
The preloader component was fetching from `/api/settings` instead of the public endpoint `/api/settings/public`.

## Solution Implemented

### 1. Updated Preloader Component API Endpoint
**File**: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\components\ui\Preloader.tsx`

Changed the fetch endpoint from `/api/settings` to `/api/settings/public`:
```typescript
fetch('/api/settings/public')  // ✅ Now uses public endpoint
```

### 2. Added Enhanced Logging to preloader.html
**File**: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\preloader.html`

Added comprehensive console logging to debug logo loading:
- Logs when fetching logo from API
- Logs the full settings data received
- Logs when setting the logo src
- Logs image load success
- Logs image load errors with fallback to default logo

```javascript
console.log('Fetching company logo from /api/settings/public...');
console.log('Settings data received:', data);
console.log('Setting logo to:', data.settings.companyLogo);
```

## How the Logo System Works

### Upload Flow
1. Admin uploads logo via `/admin/settings/company`
2. File is uploaded to `/api/admin/upload`
3. Returns URL like `/uploads/general/1234567890-logo.png`
4. URL is saved to database in `companyLogo` field

### Display Flow
1. Preloader component mounts
2. Fetches from `/api/settings/public`
3. Response contains `{ settings: { companyLogo: "/uploads/general/..." } }`
4. Logo `<img>` src is set to the uploaded logo URL
5. If logo fails to load, falls back to default logo

## API Endpoint Details

### `/api/settings/public` Response Structure
```json
{
  "settings": {
    "companyName": "YIWU EXPRESS",
    "companyLogo": "/uploads/general/1234567890-logo.png",
    "companyLogoHeight": 40,
    "companyFavicon": "",
    "primaryColor": "#1a3a5c",
    "accentColor": "#c9a84c",
    "currency": "USD",
    "timezone": "Asia/Shanghai",
    "language": "en",
    ...
  }
}
```

## Testing Steps

1. **Upload Logo in Admin Panel**
   - Go to `http://localhost:3005/admin/settings/company`
   - Upload a company logo
   - Click Save Settings
   - Note the logo preview shows correctly

2. **Test Preloader on App Pages**
   - Refresh any page (e.g., `http://localhost:3005`)
   - Preloader should show with uploaded logo
   - Open browser console to see debug logs
   - Verify logo loads successfully

3. **Check Console Logs**
   - Look for: "Fetching company logo from /api/settings/public..."
   - Look for: "Settings data received: {...}"
   - Look for: "Logo loaded successfully"
   - If error: Check the URL being loaded

4. **Verify Fallback Behavior**
   - If no logo is uploaded, should show default gradient placeholder
   - If logo URL is broken, should fall back to default logo

## Files Modified
- ✅ `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\components\ui\Preloader.tsx`
- ✅ `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\preloader.html`

## Related Files (No Changes Needed)
- `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\settings\public\route.ts` (Already correct)
- `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\upload\route.ts` (Upload works correctly)
- `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\settings\company\page.tsx` (Admin panel works correctly)

---
**Date**: Continuing from context transfer  
**Status**: COMPLETED ✅

## Expected Result
✅ Preloader now displays the company logo uploaded in admin panel  
✅ Falls back gracefully to default logo if none uploaded  
✅ Console logs help debug any loading issues  
✅ Works across all pages in the application
