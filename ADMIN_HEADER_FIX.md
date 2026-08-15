# Admin Header User Info Fix

## Problem
When logging in with different users, the admin panel header always shows:
- Name: "Admin"
- Email: "admin@yiwuexpress.com"

Instead of showing the actual logged-in user's name and email.

## Root Cause

### Issue 1: Hardcoded Values in Layout
The admin layout (`app/admin/layout.tsx`) had **hardcoded** user info:

```typescript
<p className="text-xs font-semibold text-gray-700">Admin</p>
<p className="text-xs text-gray-400">admin@yiwuexpress.com</p>
```

### Issue 2: AdminAuthContext Missing User Data
The `AdminAuthContext` only provided `isAdmin` and `loading` states, but **no user data**:

```typescript
interface AdminAuthContextType {
  isAdmin: boolean
  loading: boolean
  // ❌ Missing: user data
}
```

### Issue 3: API Returns Limited User Info
The `/api/admin/auth` endpoint only returned minimal user data from JWT token:

```typescript
return NextResponse.json({ 
  valid: true,
  user: {
    id: payload.userId,
    email: payload.email,
    role: payload.role
    // ❌ Missing: name, profilePhoto
  }
})
```

## Solution

### Fix 1: Update AdminAuthContext
**File**: `app/admin/contexts/AdminAuthContext.tsx`

Added `User` interface and updated context to provide user data:

```typescript
interface User {
  id: string
  name: string
  email: string
  role: string
  profilePhoto?: string | null
}

interface AdminAuthContextType {
  isAdmin: boolean
  loading: boolean
  user: User | null  // ✅ Added
}
```

Updated provider to fetch and store user data:

```typescript
const [user, setUser] = useState<User | null>(null)

const data = await response.json()
setUser(data.user || null)
```

### Fix 2: Update Admin Layout
**File**: `app/admin/layout.tsx`

1. Get user from context:
```typescript
const { isAdmin, loading, user } = useAdminAuth()
```

2. Display dynamic user info in header:
```typescript
{user?.profilePhoto ? (
  <img 
    src={user.profilePhoto} 
    alt={user.name}
    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
  />
) : (
  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold">
    {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
  </div>
)}
<div className="hidden sm:block">
  <p className="text-xs font-semibold text-gray-700">{user?.name || 'Admin'}</p>
  <p className="text-xs text-gray-400">{user?.email || 'admin@yiwuexpress.com'}</p>
</div>
```

### Fix 3: Update Admin Auth API
**File**: `app/api/admin/auth/route.ts`

Fetch full user data from database instead of relying only on JWT:

```typescript
import { prisma } from '@/lib/db'

// Fetch full user data from database
const user = await prisma.user.findUnique({
  where: { id: payload.userId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    profilePhoto: true,
  }
})

return NextResponse.json({ 
  valid: true,
  user: {
    id: user.id,
    name: user.name,         // ✅ Added
    email: user.email,
    role: user.role,
    profilePhoto: user.profilePhoto,  // ✅ Added
  }
})
```

## Files Changed

1. ✅ `app/admin/contexts/AdminAuthContext.tsx` - Added User interface and user state
2. ✅ `app/admin/layout.tsx` - Display dynamic user info in header
3. ✅ `app/api/admin/auth/route.ts` - Fetch full user profile from database

## Testing Steps

### On Localhost
1. Start dev server: `npm run dev`
2. Create multiple admin users with different names/emails
3. Login with each user
4. Verify header shows correct name and email
5. Test with profile photo upload

### On Production
1. Run sync script: `sync-all-admin-fixes.bat`
2. Login with different users
3. Verify header updates correctly
4. Test profile photo display

## Features

- ✅ Shows actual logged-in user's name
- ✅ Shows actual logged-in user's email
- ✅ Displays profile photo if available
- ✅ Shows first letter of name as avatar fallback
- ✅ Updates when switching users
- ✅ Graceful fallback to "Admin" if user data not loaded

## Browser Cache Note

If you don't see changes immediately:
1. Hard refresh: **Ctrl + Shift + R** (Windows) or **Cmd + Shift + R** (Mac)
2. Or clear browser cache for dromkok.com
3. Or try incognito/private browsing mode

## Combined With

This fix is combined with the **Admin Users Creation Fix** in the script `sync-all-admin-fixes.bat`, which also includes:
- businessType enum validation fix
- Empty optional fields removal
- Better error messages
