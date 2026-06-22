# Permissions Management System

## Overview
A comprehensive role-based access control (RBAC) system for the YIWU EXPRESS admin panel.

## Features

### 1. Permission Roles
- **Create custom roles** with predefined permission sets
- **System roles** (cannot be deleted): Administrator, Manager, Staff
- **Custom roles**: Create as many as needed for your organization
- **Default permissions**: Set view/create/edit/delete for each resource

### 2. User Assignment
- **Assign roles** to users for automatic permission inheritance
- **Custom permissions**: Override role permissions for specific users
- **Flexible management**: Choose between role-based or custom per-user permissions

### 3. Protected Resources
The system controls access to these admin panel sections:
- Dashboard
- Users Management
- Services
- Quotes
- Shipments
- System Settings
- Permissions
- Backup & Export

### 4. Permission Types
For each resource, you can control:
- **View**: Read access to the section
- **Create**: Ability to add new records
- **Edit**: Modify existing records
- **Delete**: Remove records

## Database Schema

### New Models

#### PermissionRole
- Defines named permission sets (e.g., "Manager", "Staff")
- Can be system-defined or custom
- Contains default permissions for all resources

#### RolePermission
- Links roles to specific resource permissions
- Defines view/create/edit/delete flags per resource

#### UserPermission
- Overrides role permissions for individual users
- Allows fine-grained control when needed

### Updated Models

#### User
- Added `roleId` field to link to PermissionRole
- Relations to customPermissions for overrides

## API Endpoints

### Roles Management
- `GET /api/admin/permissions/roles` - List all roles
- `POST /api/admin/permissions/roles` - Create new role
- `GET /api/admin/permissions/roles/[roleId]` - Get single role
- `PUT /api/admin/permissions/roles/[roleId]` - Update role
- `DELETE /api/admin/permissions/roles/[roleId]` - Delete role

### User Permissions
- `GET /api/admin/permissions/users` - List users with permissions
- `PUT /api/admin/permissions/users/[userId]` - Update user permissions

## Usage

### Access the Permissions Page
Navigate to: `http://localhost:3001/admin/settings/permissions`

### Create a New Role
1. Click "New Role" button
2. Enter role name and description
3. Check permissions for each resource (View/Create/Edit/Delete)
4. Click "Save Role"

### Assign Role to User
1. Switch to "User Permissions" tab
2. Click "Edit Permissions" for a user
3. Select "Assign Permission Role"
4. Choose a role from dropdown
5. Click "Save Permissions"

### Set Custom User Permissions
1. Switch to "User Permissions" tab
2. Click "Edit Permissions" for a user
3. Select "Set Custom Permissions"
4. Check desired permissions for each resource
5. Click "Save Permissions"

## Default Roles

### Administrator
- **Full access** to all sections
- Can manage permissions and users
- System role (cannot be deleted)

### Manager
- Manage users, services, quotes, shipments
- View settings and create backups
- Cannot access permissions management
- System role (cannot be deleted)

### Staff
- Handle quotes and shipments
- View-only access to users and services
- No access to settings, permissions, or backups
- System role (cannot be deleted)

### Viewer
- Read-only access to most sections
- Cannot access settings, permissions, or backups
- Custom role (can be deleted if not assigned)

## Security Notes

1. **Admin-only access**: Only users with role='ADMIN' can manage permissions
2. **System role protection**: Default roles cannot be deleted
3. **Assignment validation**: Cannot delete roles assigned to users
4. **Token-based auth**: All API endpoints require valid JWT token

## Implementation Checklist

✅ Database schema with permission models  
✅ API routes for roles and user permissions  
✅ UI for managing roles  
✅ UI for assigning permissions to users  
✅ Default system roles seeded  
✅ Comprehensive permission matrix  
✅ Protected against unauthorized access  

## Next Steps

To enforce these permissions throughout the admin panel:

1. Create a permission checking middleware
2. Add permission checks to each admin page
3. Hide/disable UI elements based on permissions
4. Validate permissions on API routes
5. Display access denied messages when needed

Example middleware usage:
```typescript
// Check if user has permission
function hasPermission(user, resource, action) {
  // Check custom permissions first
  const custom = user.customPermissions.find(p => p.resource === resource)
  if (custom) return custom[`can${action}`]
  
  // Fall back to role permissions
  const rolePerm = user.permissionRole?.permissions.find(p => p.resource === resource)
  return rolePerm?.[`can${action}`] || false
}
```
