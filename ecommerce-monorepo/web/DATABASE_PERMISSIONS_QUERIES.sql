-- =====================================================
-- DATABASE QUERIES FOR PERMISSIONS SYSTEM
-- Database: SQLite (for use in SQLite Browser or CLI)
-- =====================================================

-- =====================================================
-- 1. CHECK CURRENT DATABASE STRUCTURE
-- =====================================================

-- Check if permissions tables exist
SELECT name FROM sqlite_master WHERE type='table' AND name IN ('PermissionRole', 'RolePermission', 'UserPermission');

-- Check User table structure (should have roleId column)
PRAGMA table_info(User);

-- =====================================================
-- 2. VIEW EXISTING DATA
-- =====================================================

-- View all permission roles
SELECT * FROM PermissionRole ORDER BY createdAt;

-- View all role permissions (with role names)
SELECT 
    pr.name as role_name,
    rp.resource,
    rp.canView,
    rp.canCreate,
    rp.canEdit,
    rp.canDelete
FROM RolePermission rp
JOIN PermissionRole pr ON rp.roleId = pr.id
ORDER BY pr.name, rp.resource;

-- Count users per role
SELECT 
    pr.name as role_name,
    COUNT(u.id) as user_count
FROM PermissionRole pr
LEFT JOIN User u ON u.roleId = pr.id
GROUP BY pr.id, pr.name
ORDER BY user_count DESC;

-- View users with their permission roles
SELECT 
    u.id,
    u.email,
    u.name,
    u.role as user_role,
    pr.name as permission_role,
    pr.description as permission_description
FROM User u
LEFT JOIN PermissionRole pr ON u.roleId = pr.id
ORDER BY u.createdAt DESC;

-- View users with custom permissions
SELECT 
    u.email,
    u.name,
    up.resource,
    up.canView,
    up.canCreate,
    up.canEdit,
    up.canDelete
FROM UserPermission up
JOIN User u ON up.userId = u.id
ORDER BY u.email, up.resource;

-- =====================================================
-- 3. ASSIGN PERMISSION ROLES TO USERS
-- =====================================================

-- Get role IDs (run this first to get the ID you need)
SELECT id, name, description FROM PermissionRole;

-- Assign Administrator role to a user (replace with actual IDs)
-- UPDATE User SET roleId = '<ADMINISTRATOR_ROLE_ID>' WHERE email = 'admin@example.com';

-- Assign Manager role to a user
-- UPDATE User SET roleId = '<MANAGER_ROLE_ID>' WHERE email = 'manager@example.com';

-- Remove permission role from a user (set to NULL)
-- UPDATE User SET roleId = NULL WHERE email = 'user@example.com';

-- Assign Administrator role to all ADMIN users
-- UPDATE User 
-- SET roleId = (SELECT id FROM PermissionRole WHERE name = 'Administrator')
-- WHERE role = 'ADMIN' AND roleId IS NULL;

-- =====================================================
-- 4. CREATE NEW PERMISSION ROLE
-- =====================================================

-- Create a new custom role (e.g., "Customer Service")
-- Note: Replace <ID> with actual generated CUID
/*
INSERT INTO PermissionRole (id, name, description, isSystem, createdAt, updatedAt)
VALUES (
    '<GENERATE_CUID_HERE>',
    'Customer Service',
    'Handle customer quotes and basic support',
    0,
    datetime('now'),
    datetime('now')
);
*/

-- Add permissions for the new role (run after creating role)
-- Note: Replace <ROLE_ID> with the actual role ID from above
/*
INSERT INTO RolePermission (id, roleId, resource, canView, canCreate, canEdit, canDelete, createdAt, updatedAt)
VALUES
    ('<CUID_1>', '<ROLE_ID>', 'dashboard', 1, 0, 0, 0, datetime('now'), datetime('now')),
    ('<CUID_2>', '<ROLE_ID>', 'quotes', 1, 1, 1, 0, datetime('now'), datetime('now')),
    ('<CUID_3>', '<ROLE_ID>', 'quotes_view', 1, 1, 1, 0, datetime('now'), datetime('now')),
    ('<CUID_4>', '<ROLE_ID>', 'shipments', 1, 0, 1, 0, datetime('now'), datetime('now'));
*/

-- =====================================================
-- 5. UPDATE EXISTING PERMISSIONS
-- =====================================================

-- Update permission for a specific role and resource
-- Example: Give "Staff" role delete permission on quotes
/*
UPDATE RolePermission 
SET canDelete = 1, updatedAt = datetime('now')
WHERE roleId = (SELECT id FROM PermissionRole WHERE name = 'Staff')
  AND resource = 'quotes';
*/

-- Update role description
/*
UPDATE PermissionRole 
SET description = 'New description here', updatedAt = datetime('now')
WHERE name = 'Staff';
*/

-- Add new resource permission to all existing roles
-- Example: Add 'reports' resource to all roles (view only)
/*
INSERT INTO RolePermission (id, roleId, resource, canView, canCreate, canEdit, canDelete, createdAt, updatedAt)
SELECT 
    '<GENERATE_CUID_FOR_EACH>',
    id as roleId,
    'reports' as resource,
    1 as canView,
    0 as canCreate,
    0 as canEdit,
    0 as canDelete,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM PermissionRole;
*/

-- =====================================================
-- 6. DELETE OPERATIONS
-- =====================================================

-- Delete a non-system role (will cascade delete associated permissions)
-- DELETE FROM PermissionRole WHERE name = 'Customer Service' AND isSystem = 0;

-- Delete specific permission from a role
-- DELETE FROM RolePermission 
-- WHERE roleId = (SELECT id FROM PermissionRole WHERE name = 'Staff')
--   AND resource = 'backup';

-- Clear all custom permissions for a user
-- DELETE FROM UserPermission WHERE userId = '<USER_ID>';

-- =====================================================
-- 7. BACKUP QUERIES
-- =====================================================

-- Export all permission roles to verify backup
SELECT 
    'PermissionRole' as table_name,
    id,
    name,
    description,
    isSystem,
    createdAt,
    updatedAt
FROM PermissionRole
UNION ALL
SELECT 
    'RolePermission' as table_name,
    rp.id,
    pr.name || ' - ' || rp.resource as name,
    printf('V:%d C:%d E:%d D:%d', rp.canView, rp.canCreate, rp.canEdit, rp.canDelete) as description,
    NULL as isSystem,
    rp.createdAt,
    rp.updatedAt
FROM RolePermission rp
JOIN PermissionRole pr ON rp.roleId = pr.id
ORDER BY table_name, createdAt;

-- =====================================================
-- 8. USEFUL STATISTICS QUERIES
-- =====================================================

-- Count permissions per role
SELECT 
    pr.name,
    COUNT(rp.id) as total_permissions,
    SUM(rp.canView) as view_perms,
    SUM(rp.canCreate) as create_perms,
    SUM(rp.canEdit) as edit_perms,
    SUM(rp.canDelete) as delete_perms
FROM PermissionRole pr
LEFT JOIN RolePermission rp ON pr.id = rp.roleId
GROUP BY pr.id, pr.name;

-- Find users without permission roles
SELECT 
    id,
    email,
    name,
    role,
    createdAt
FROM User 
WHERE roleId IS NULL
ORDER BY createdAt DESC;

-- Find resources without permissions in a role
SELECT DISTINCT resource 
FROM RolePermission 
WHERE roleId = (SELECT id FROM PermissionRole WHERE name = 'Manager')
  AND canView = 0 
  AND canCreate = 0 
  AND canEdit = 0 
  AND canDelete = 0;

-- =====================================================
-- 9. RESET PERMISSIONS (DANGER - USE WITH CAUTION)
-- =====================================================

-- Remove all permission role assignments from users
-- WARNING: This doesn't delete roles, just unassigns them
-- UPDATE User SET roleId = NULL;

-- Delete all custom user permissions
-- DELETE FROM UserPermission;

-- Delete all non-system roles and their permissions
-- DELETE FROM PermissionRole WHERE isSystem = 0;

-- =====================================================
-- 10. COMMONLY USED QUERIES
-- =====================================================

-- Check if a user has a specific permission
SELECT 
    u.email,
    u.name,
    pr.name as role,
    rp.resource,
    rp.canView,
    rp.canCreate,
    rp.canEdit,
    rp.canDelete
FROM User u
LEFT JOIN PermissionRole pr ON u.roleId = pr.id
LEFT JOIN RolePermission rp ON pr.id = rp.roleId
WHERE u.email = 'user@example.com'
  AND rp.resource = 'quotes';

-- Get all permissions for a specific user
SELECT 
    'Role Permission' as source,
    rp.resource,
    rp.canView,
    rp.canCreate,
    rp.canEdit,
    rp.canDelete
FROM User u
JOIN PermissionRole pr ON u.roleId = pr.id
JOIN RolePermission rp ON pr.id = rp.roleId
WHERE u.email = 'user@example.com'
UNION ALL
SELECT 
    'Custom Permission' as source,
    up.resource,
    up.canView,
    up.canCreate,
    up.canEdit,
    up.canDelete
FROM User u
JOIN UserPermission up ON u.id = up.userId
WHERE u.email = 'user@example.com'
ORDER BY resource;

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. This is a SQLite database (not PostgreSQL)
-- 2. SQLite uses different syntax than PostgreSQL
-- 3. Database file is typically at: web/prisma/dev.db
-- 4. To run these queries:
--    - Use SQLite Browser (DB Browser for SQLite)
--    - Or use Prisma Studio: npm run prisma:studio
--    - Or use command line: sqlite3 prisma/dev.db
-- 5. For safety, always test queries on a backup first
-- 6. CUID generation: Use online tools or Prisma to generate
-- 7. Dates in SQLite: Use datetime('now') for current timestamp
-- =====================================================
