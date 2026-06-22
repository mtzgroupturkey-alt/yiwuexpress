# Users Page - Permission Roles Integration

## Overview
Added permission role selector to the Users Management page (`/admin/users`) to allow assigning permission roles that control access to admin panel features.

## Changes Made

### 1. User Interface Changes (`/app/admin/users/page.tsx`)

#### New Features:
- **Permission Role Column**: Added new "Permissions" column in users table showing assigned permission role
- **Role Selector in Add Modal**: Added dropdown to select permission role when creating new users
- **Role Selector in Edit Modal**: Added dropdown to change permission role when editing users
- **Fetch Permission Roles**: Added function to load available permission roles from API

#### Data Structure Updates:
```typescript
interface User {
  // ... existing fields
  roleId: string | null
  permissionRole: {
    id: string
    name: string
    description: string | null
  } | null
}

interface PermissionRole {
  id: string
  name: string
  description: string | null
  isSystem: boolean
}
```

#### Form State Updates:
- Added `permissionRoleId` field to both `addFormData` and `editFormData`
- Added `permissionRoles` state to store available roles
- Added `fetchPermissionRoles()` function called on component mount

#### User Creation Flow:
1. Create user via `/api/admin/users` (basic user info)
2. If permission role selected, update via `/api/admin/permissions/users/[userId]` (assign role)

#### User Update Flow:
1. If permission role changed, update via `/api/admin/permissions/users/[userId]` first
2. Then update basic user info via `/api/admin/users/[userId]`

### 2. API Changes (`/app/api/admin/users/route.ts`)

#### GET Endpoint:
- Added `roleId` and `permissionRole` (with nested select) to user query
- Returns permission role name and description for each user

#### POST Endpoint:
- Added `roleId` to response for newly created user
- Changed response to `{ user }` object wrapper (consistent with other endpoints)

### 3. User Interface Elements

#### Table Column:
```tsx
<th>Permissions</th>
<td>
  {user.permissionRole ? (
    <span className="badge-purple">
      {user.permissionRole.name}
    </span>
  ) : (
    <span>No permissions</span>
  )}
</td>
```

#### Add/Edit Modal Selector:
```tsx
<div>
  <label>
    Permission Role
    <span className="hint">(Controls access to admin panel features)</span>
  </label>
  <select value={formData.permissionRoleId}>
    <option value="">No Permission Role</option>
    {permissionRoles.map(role => (
      <option key={role.id} value={role.id}>
        {role.name} {role.description && `- ${role.description}`}
      </option>
    ))}
  </select>
</div>
```

## Integration with Permissions System

### Relationship:
- Each user can have ONE permission role (via `User.roleId` → `PermissionRole.id`)
- Permission roles define default access levels for admin panel resources
- Users can also have custom permissions that override role permissions

### Available Permission Roles (Default):
1. **Administrator** - Full access to all features
2. **Manager** - Can manage most features, limited system settings access
3. **Staff** - Basic access to quotes, shipments, limited edit permissions
4. **Viewer** - Read-only access to main features

### Admin Panel Resources Controlled:
- Dashboard
- Users Management
- Services
- Quotes Management (with submenus: View Quotes, Approve/Reject)
- Shipments (with submenu: Tracking Management)
- System Settings (with submenus: Company Info, General Settings, Email Config)
- Permissions
- Backup & Export

## Usage Workflow

### Assigning Permission Role to User:
1. Navigate to `/admin/users`
2. Click "Add User" or "Edit" on existing user
3. Fill in user details
4. Select a permission role from dropdown (optional)
5. Save

### Viewing User Permissions:
1. Navigate to `/admin/users`
2. Check "Permissions" column to see assigned role
3. Purple badge shows role name
4. "No permissions" shown if no role assigned

### Managing Permission Roles:
1. Navigate to `/admin/settings/permissions`
2. Use "Permission Roles" tab to create/edit roles
3. Define which resources each role can view/create/edit/delete
4. Assign roles to users via Users page or "User Permissions" tab

## Files Modified

1. `web/app/admin/users/page.tsx` - UI changes for role selector
2. `web/app/api/admin/users/route.ts` - API changes to include permission role data
3. No database changes needed (schema already supports roleId field)

## Testing Checklist

- [x] Users list shows permission roles correctly
- [x] Can create new user with permission role
- [x] Can edit user and change permission role
- [x] Can assign "No Permission Role" to remove role
- [x] Permission roles dropdown loads correctly
- [x] API returns user with permission role data
- [x] No TypeScript errors
- [x] No diagnostic issues

## Notes

- The "Role" field (USER/ADMIN) is separate from Permission Roles
- USER/ADMIN determines basic system access, Permission Roles control granular features
- Users with role="ADMIN" have full access regardless of Permission Role
- Permission roles only affect users accessing the admin panel
